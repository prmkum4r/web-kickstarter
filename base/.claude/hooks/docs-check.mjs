#!/usr/bin/env node
/**
 * docs-check — keeps docs/ in step with the code.
 *
 * The code → doc mapping is the `paths:` globs + `@doc` import of each .claude/rules/*.md file
 * (the same files Claude Code uses to auto-load docs). When a file matching a rule changed but
 * the rule's doc did not, the doc is reported as stale.
 *
 *   --baseline   SessionStart hook: snapshot files already dirty, so only this session's edits count.
 *   --hook       Stop hook: block once per change with a reason Claude must act on.
 *   (no flag)    CLI: check the working tree. `--base <ref>` checks <ref>...HEAD instead.
 *                Exit 1 when a doc is stale; `--strict` also fails on src/ files no rule covers.
 *
 * Zero dependencies. In hook modes any internal error exits 0 so a bug here never blocks a session.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join, posix, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

const RULES_DIR = '.claude/rules'
const STATE_DIR = '.claude/.docs-check'
const MAX_STATE_FILES = 20

// Changes here never require a doc update (they can still *be* the doc update).
const NEVER_TRIGGERS = [
  /^docs\//,
  /^\.claude\//,
  /^e2e\//,
  /(^|\/)package-lock\.json$/,
  /\.test\.tsx?$/,
  /(^|\/)(CLAUDE|README)\.md$/,
]

// ---------------------------------------------------------------------------------------- globs

const globBody = (glob) => {
  let out = ''
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i]
    if (char === '*') {
      if (glob[i + 1] === '*') {
        const atSegmentStart = i === 0 || glob[i - 1] === '/'
        if (atSegmentStart && glob[i + 2] === '/') {
          out += '(?:.*/)?'
          i += 2
        } else {
          out += '.*'
          i += 1
        }
      } else {
        out += '[^/]*'
      }
    } else if (char === '?') {
      out += '[^/]'
    } else if (char === '{' && glob.indexOf('}', i) > i) {
      const close = glob.indexOf('}', i)
      out += `(?:${glob.slice(i + 1, close).split(',').map(globBody).join('|')})`
      i = close
    } else {
      // Brackets stay literal so Next.js folders like [id] and (group) match as written.
      out += char.replace(/[.+^$()|[\]\\{}]/g, '\\$&')
    }
  }
  return out
}

export const globToRegExp = (glob) => new RegExp(`^${globBody(glob.replace(/^\.\//, ''))}$`)

// ---------------------------------------------------------------------------------------- rules

const unquote = (value) => value.trim().replace(/^(['"])(.*)\1$/, '$2')

export const parseRule = (text) => {
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const paths = []
  if (frontmatter) {
    const lines = frontmatter[1].split(/\r?\n/)
    lines.forEach((line, index) => {
      const match = line.match(/^paths:\s*(.*)$/)
      if (!match) return
      const inline = match[1].trim()
      if (inline.startsWith('[')) {
        paths.push(...(inline.slice(1, -1).match(/"[^"]*"|'[^']*'|[^,\s][^,]*/g) ?? []).map(unquote))
      } else if (inline) {
        paths.push(unquote(inline))
      } else {
        for (let next = index + 1; next < lines.length && /^\s*-\s+/.test(lines[next]); next++) {
          paths.push(unquote(lines[next].replace(/^\s*-\s+/, '')))
        }
      }
    })
  }
  const body = frontmatter ? text.slice(frontmatter[0].length) : text
  const imports = [...body.matchAll(/^@(\S+\.md)\s*$/gm)].map((match) => match[1])
  return { paths: paths.filter(Boolean), imports }
}

const listMarkdown = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const full = join(dir, name)
        if (statSync(full).isDirectory()) return listMarkdown(full)
        return name.endsWith('.md') ? [full] : []
      })
    : []

export const loadRules = (projectDir) =>
  listMarkdown(join(projectDir, RULES_DIR)).flatMap((file) => {
    const { paths, imports } = parseRule(readFileSync(file, 'utf8'))
    if (!paths.length) return []
    const ruleDir = posix.dirname(relative(projectDir, file).split('\\').join('/'))
    return [
      {
        file: posix.join(ruleDir, posix.basename(file)),
        patterns: paths.map(globToRegExp),
        docs: imports.map((doc) => posix.normalize(posix.join(ruleDir, doc))),
      },
    ]
  })

// ------------------------------------------------------------------------------------------ git

const git = (cwd, args, input) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 })

/** Paths from `git status --porcelain=v1 -z`. Renames and copies yield both sides. */
export const parsePorcelain = (output) => {
  const tokens = output.split('\0')
  const paths = []
  for (let i = 0; i < tokens.length; i++) {
    const entry = tokens[i]
    if (entry.length < 4) continue
    const status = entry.slice(0, 2)
    paths.push(entry.slice(3))
    if (status.includes('R') || status.includes('C')) paths.push(tokens[++i])
  }
  return paths.filter(Boolean)
}

/** Paths from `git diff --name-status -z`. */
export const parseNameStatus = (output) => {
  const tokens = output.split('\0').filter(Boolean)
  const paths = []
  for (let i = 0; i < tokens.length; i++) {
    const status = tokens[i]
    paths.push(tokens[++i])
    if (/^[RC]/.test(status)) paths.push(tokens[++i])
  }
  return paths.filter(Boolean)
}

const gitContext = (projectDir) => {
  try {
    const prefix = git(projectDir, ['rev-parse', '--show-prefix']).trim()
    return { prefix }
  } catch {
    return null
  }
}

// Porcelain paths are relative to the repo root; keep the ones inside this project, project-relative.
const toProjectPaths = (paths, prefix) =>
  [...new Set(paths)].filter((path) => path.startsWith(prefix)).map((path) => path.slice(prefix.length))

const dirtyFiles = (projectDir, prefix) =>
  toProjectPaths(parsePorcelain(git(projectDir, ['status', '--porcelain=v1', '-z', '--untracked-files=all'])), prefix)

const hashFiles = (projectDir, paths) => {
  const hashes = {}
  const existing = paths.filter((path) => existsSync(join(projectDir, path)) && statSync(join(projectDir, path)).isFile())
  for (const path of paths) hashes[path] = 'deleted'
  if (existing.length) {
    const out = git(projectDir, ['hash-object', '--stdin-paths'], `${existing.join('\n')}\n`).trim().split('\n')
    existing.forEach((path, index) => {
      hashes[path] = out[index]
    })
  }
  return hashes
}

// ------------------------------------------------------------------------------------- evaluate

/** @returns {{ stale: Map<string, string[]>, unmatched: string[] }} doc → files that changed without it */
export const evaluate = (rules, changed) => {
  const changedSet = new Set(changed)
  const stale = new Map()
  const unmatched = []
  for (const file of changed) {
    if (NEVER_TRIGGERS.some((pattern) => pattern.test(file))) continue
    const matching = rules.filter((rule) => rule.patterns.some((pattern) => pattern.test(file)))
    if (!matching.length) {
      if (file.startsWith('src/')) unmatched.push(file)
      continue
    }
    for (const doc of matching.flatMap((rule) => rule.docs)) {
      if (changedSet.has(doc)) continue
      stale.set(doc, [...(stale.get(doc) ?? []), file])
    }
  }
  return { stale, unmatched }
}

const formatList = (files, limit = 8) =>
  files.length > limit ? `${files.slice(0, limit).join(', ')} (+${files.length - limit} more)` : files.join(', ')

export const formatReason = ({ stale, unmatched }, { hook = true } = {}) => {
  const lines = []
  if (stale.size) {
    lines.push('Docs may be out of date — these files changed but the doc that describes them did not:', '')
    for (const [doc, files] of stale) lines.push(`  ${doc}  ←  ${formatList(files)}`)
    lines.push('')
  }
  if (unmatched.length) {
    lines.push(
      'These src/ files are not covered by any .claude/rules/*.md `paths:` glob, so no doc tracks them:',
      `  ${formatList(unmatched)}`,
      'Create a module with the add-module skill, or extend the right rule’s `paths:` (and its doc).',
      '',
    )
  }
  if (hook) {
    lines.push(
      'Update each doc so it matches the code (the code is the source of truth), or, if the change has no',
      'doc impact (pure refactor, typo, test-only), reply "No doc impact: <reason>". You will not be asked',
      'again about these exact changes.',
    )
  } else {
    lines.push('Update each doc so it matches the code (the code is the source of truth), then re-run this check.')
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------------------- state

const readStdinJson = () => {
  try {
    const raw = readFileSync(0, 'utf8')
    return raw.trim() ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const safeId = (id) => String(id ?? '').replace(/[^a-zA-Z0-9_-]/g, '')

const statePath = (projectDir, sessionId) => join(projectDir, STATE_DIR, `${safeId(sessionId)}.json`)

const readState = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return { baseline: {}, reported: {} }
  }
}

const writeState = (file, state) => {
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, JSON.stringify(state))
}

const pruneStates = (projectDir) => {
  const dir = join(projectDir, STATE_DIR)
  if (!existsSync(dir)) return
  const files = readdirSync(dir)
    .map((name) => ({ full: join(dir, name), mtime: statSync(join(dir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  for (const { full } of files.slice(MAX_STATE_FILES)) unlinkSync(full)
}

// ----------------------------------------------------------------------------------------- modes

const runBaseline = (projectDir) => {
  const input = readStdinJson()
  if (!safeId(input.session_id)) return
  const context = gitContext(projectDir)
  if (!context) return
  const file = statePath(projectDir, input.session_id)
  if (existsSync(file)) return // resume / compact: keep the original baseline
  const dirty = dirtyFiles(projectDir, context.prefix)
  writeState(file, { baseline: hashFiles(projectDir, dirty), reported: {} })
  pruneStates(projectDir)
}

const runHook = (projectDir) => {
  const input = readStdinJson()
  if (input.stop_hook_active) return
  const context = gitContext(projectDir)
  if (!context) return

  const file = safeId(input.session_id) ? statePath(projectDir, input.session_id) : null
  const state = file ? readState(file) : { baseline: {}, reported: {} }
  const current = hashFiles(projectDir, dirtyFiles(projectDir, context.prefix))
  const changed = Object.keys(current).filter((path) => state.baseline[path] !== current[path])

  const result = evaluate(loadRules(projectDir), changed)
  const isNew = (path) => state.reported[path] !== current[path]
  const stale = new Map(
    [...result.stale].map(([doc, files]) => [doc, files.filter(isNew)]).filter(([, files]) => files.length),
  )
  const unmatched = result.unmatched.filter(isNew)
  if (!stale.size && !unmatched.length) return

  if (file) {
    for (const path of [...[...stale.values()].flat(), ...unmatched]) state.reported[path] = current[path]
    writeState(file, state)
  }
  process.stdout.write(JSON.stringify({ decision: 'block', reason: formatReason({ stale, unmatched }) }))
}

const runCli = (projectDir, args) => {
  const context = gitContext(projectDir)
  if (!context) {
    console.log('docs-check: not a git repository — nothing to check.')
    return 0
  }
  const baseIndex = args.indexOf('--base')
  const changed =
    baseIndex === -1
      ? dirtyFiles(projectDir, context.prefix)
      : toProjectPaths(
          parseNameStatus(git(projectDir, ['diff', '--name-status', '-z', `${args[baseIndex + 1]}...HEAD`])),
          context.prefix,
        )
  const { stale, unmatched } = evaluate(loadRules(projectDir), changed)
  const strict = args.includes('--strict')
  if (!stale.size && !unmatched.length) {
    console.log(`docs-check: ok (${changed.length} changed file${changed.length === 1 ? '' : 's'}).`)
    return 0
  }
  console.log(formatReason({ stale, unmatched }, { hook: false }))
  return stale.size || (strict && unmatched.length) ? 1 : 0
}

const main = () => {
  const args = process.argv.slice(2)
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
  const hookMode = args.includes('--hook') || args.includes('--baseline')
  try {
    if (args.includes('--baseline')) runBaseline(projectDir)
    else if (args.includes('--hook')) runHook(projectDir)
    else process.exitCode = runCli(projectDir, args)
  } catch (error) {
    console.error(`docs-check: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = hookMode ? 0 : 2
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
