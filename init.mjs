#!/usr/bin/env node
// Turns this kickstarter clone into a fresh project, in place.
//
//   npm run init                                   # interactive
//   npm run init -- --stack vite --name "Acme Portal" --description "Customer portal" -y
//
// Flags: --name --description --stack next|vite  -y/--yes  --no-install --no-browsers
//        --keep-git (keep the kickstarter's history)  --dry-run  --force (ignore local changes)
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'
import { assemble, STACKS, toSlug, toTitle } from './scripts/lib/assemble.mjs'

const root = import.meta.dirname
const STAGING = '.kickstarter-out'
// Everything that belongs to the kickstarter itself; removed before the project is moved into place.
const TEMPLATE_ONLY = ['base', 'stacks', 'scripts', 'init.mjs', 'CLAUDE.md', 'README.md', 'package.json', 'package-lock.json', '.gitignore', 'node_modules']

const fail = (message) => {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 20 || (major === 20 && minor < 19)) fail(`Node 20.19+ is required (you have ${process.versions.node}).`)

const { values: args } = parseArgs({
  options: {
    name: { type: 'string' },
    description: { type: 'string' },
    stack: { type: 'string' },
    yes: { type: 'boolean', short: 'y', default: false },
    'no-install': { type: 'boolean', default: false },
    'no-browsers': { type: 'boolean', default: false },
    'keep-git': { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
  },
})

if (!existsSync(join(root, 'stacks')) || !existsSync(join(root, 'base'))) {
  fail('This project is already initialized (base/ and stacks/ are gone). Nothing to do.')
}

const run = (command, commandArgs, options = {}) => execFileSync(command, commandArgs, { cwd: root, stdio: 'inherit', ...options })
const hasGit = existsSync(join(root, '.git'))

// The history reset would silently drop uncommitted edits to the template.
if (hasGit && !args['keep-git'] && !args['dry-run'] && !args.force) {
  const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim()
  if (dirty) fail(`The kickstarter has uncommitted changes that the git reset would lose:\n${dirty}\n\nCommit them, or re-run with --force (or --keep-git).`)
}

// --- answers --------------------------------------------------------------------------------------
const interactive = stdin.isTTY && !args.yes
const prompt = interactive ? createInterface({ input: stdin, output: stdout }) : null

const ask = async (question, fallback) => {
  if (!prompt) return fallback
  const answer = (await prompt.question(`${question}${fallback ? ` (${fallback})` : ''}: `)).trim()
  return answer || fallback
}

const askStack = async () => {
  if (args.stack) return args.stack
  if (!prompt) fail('--stack is required when not running interactively (next | vite).')
  const keys = Object.keys(STACKS)
  console.log('\nStack:')
  keys.forEach((key, index) => console.log(`  ${index + 1}) ${key.padEnd(5)} ${STACKS[key].label}`))
  const answer = (await prompt.question(`Choose 1-${keys.length} (1): `)).trim() || '1'
  return keys[Number(answer) - 1] ?? answer
}

console.log('\nClaude kickstarter — new project setup\n')
const rawName = args.name ?? (await ask('Project name', toTitle(toSlug(basename(root))) || 'My App'))
const name = toSlug(rawName)
if (!/^[a-z0-9][a-z0-9._-]*$/.test(name) || name.length > 214) fail(`"${rawName}" can't be turned into a valid npm package name.`)
const title = /[A-Z\s]/.test(rawName) ? rawName.trim() : toTitle(name)
const description = args.description ?? (await ask('One-line description', ''))
const stack = await askStack()
if (!STACKS[stack]) fail(`Unknown stack "${stack}". Use one of: ${Object.keys(STACKS).join(', ')}.`)
if (prompt && !args['dry-run']) {
  const gitNote = args['keep-git'] ? '' : ' and reset git history'
  const confirm = (await prompt.question(`\nThis replaces the template files in ${root}${gitNote}. Continue? (y/N) `)).trim()
  if (!/^y(es)?$/i.test(confirm)) fail('Cancelled. Nothing was changed.')
}
prompt?.close()

// --- dry run --------------------------------------------------------------------------------------
if (args['dry-run']) {
  const out = mkdtempSync(join(tmpdir(), 'kickstarter-dry-'))
  const files = assemble({ root, stack, title, name, description, outDir: out })
  rmSync(out, { recursive: true, force: true })
  console.log(`\nDry run — ${STACKS[stack].label}, package "${name}", title "${title}". Would create ${files.length} files:\n`)
  console.log(files.sort().map((file) => `  ${file}`).join('\n'))
  process.exit(0)
}

// --- assemble into staging, then swap (nothing destructive happens before this succeeds) ----------
const staging = join(root, STAGING)
console.log(`\n→ Assembling ${STACKS[stack].label}…`)
const files = assemble({ root, stack, title, name, description, outDir: staging })

const kept = new Set([...TEMPLATE_ONLY, STAGING, '.git'])
const collisions = readdirSync(staging).filter((entry) => existsSync(join(root, entry)) && !kept.has(entry))
if (collisions.length) {
  rmSync(staging, { recursive: true, force: true })
  fail(`These paths already exist and would be overwritten: ${collisions.join(', ')}. Move them aside and re-run.`)
}

for (const entry of TEMPLATE_ONLY) rmSync(join(root, entry), { recursive: true, force: true })
for (const entry of readdirSync(staging)) renameSync(join(staging, entry), join(root, entry))
rmSync(staging, { recursive: true, force: true })
console.log(`✓ ${files.length} files in place`)

// --- git ------------------------------------------------------------------------------------------
if (!args['keep-git']) {
  rmSync(join(root, '.git'), { recursive: true, force: true })
  try {
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root })
    console.log('✓ Fresh git repository on main (nothing committed yet)')
  } catch {
    console.log('! git not available; skipped git init')
  }
}

if (!existsSync(join(root, '.env.local'))) {
  copyFileSync(join(root, '.env.example'), join(root, '.env.local'))
  console.log('✓ .env.local created from .env.example')
}

// --- install --------------------------------------------------------------------------------------
if (!args['no-install']) {
  console.log('\n→ Installing dependencies (npm ci)…')
  run('npm', ['ci', '--no-audit', '--no-fund'])
  if (!args['no-browsers']) {
    console.log('\n→ Installing Playwright Chromium…')
    try {
      run('npx', ['playwright', 'install', 'chromium'])
    } catch {
      console.log('! Playwright browser install failed; run `npx playwright install chromium` later.')
    }
  }
}

console.log(`
✓ ${title} is ready (${STACKS[stack].label}).

  npm run dev          start on http://localhost:3000
  npm run check        lint → typecheck → test → build
  claude               open Claude Code; CLAUDE.md, rules, skills and the docs-check hook are set up

Next: edit CLAUDE.md's description if needed, set real values in .env.local, and make your first commit.
`)
