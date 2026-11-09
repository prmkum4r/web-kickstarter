#!/usr/bin/env node
// Assembles every stack into a temp dir and proves it works and stays structurally identical.
//
//   node scripts/verify-stacks.mjs                  # all stacks: npm ci + npm run check + hook tests
//   node scripts/verify-stacks.mjs --stack vite     # one stack
//   node scripts/verify-stacks.mjs --refresh-locks  # npm install instead of ci, copy lockfiles back
//   node scripts/verify-stacks.mjs --e2e            # also run the merge-gate Playwright suite
//   node scripts/verify-stacks.mjs --keep           # keep the temp dirs for inspection
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { assemble, listFiles, OVERLAY_ZONES, STACK_ONLY_FILES, STACKS } from './lib/assemble.mjs'

const root = resolve(import.meta.dirname, '..')
const { values: args } = parseArgs({
  options: {
    stack: { type: 'string' },
    'refresh-locks': { type: 'boolean', default: false },
    e2e: { type: 'boolean', default: false },
    keep: { type: 'boolean', default: false },
  },
})

const stacks = args.stack ? [args.stack] : Object.keys(STACKS)
const failures = []

const step = (label, fn) => {
  process.stdout.write(`  • ${label} … `)
  try {
    fn()
    console.log('ok')
    return true
  } catch (error) {
    console.log('FAILED')
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim() || error.message
    failures.push(`${label}:\n${output.split('\n').slice(-40).join('\n')}`)
    return false
  }
}

const run = (cwd, command, commandArgs) =>
  execFileSync(command, commandArgs, { cwd, stdio: 'pipe', encoding: 'utf8', env: { ...process.env, CI: '1' } })

// --- structure parity: overlays may only differ in declared files and allowed zones --------------
console.log('\nStructure parity')
const META = new Set(['package.partial.json', 'CLAUDE.stack.md', 'package-lock.json'])
const overlay = Object.fromEntries(
  Object.keys(STACKS).map((stack) => [stack, listFiles(join(root, 'stacks', stack)).filter((f) => !META.has(f))]),
)
step('overlays only touch src/app, src/platform, docs/platform.md and root config', () => {
  const outside = Object.entries(overlay).flatMap(([stack, files]) =>
    files.filter((f) => !OVERLAY_ZONES.some((zone) => zone.test(f))).map((f) => `${stack}/${f}`),
  )
  if (outside.length) throw new Error(`move to base/ (shared): ${outside.join(', ')}`)
})
step('overlays define the same files apart from STACK_ONLY_FILES', () => {
  const [a, b] = Object.keys(STACKS)
  const shared = (stack) => new Set(overlay[stack].filter((f) => !STACK_ONLY_FILES[stack].includes(f)))
  const sa = shared(a)
  const sb = shared(b)
  const diff = [...[...sa].filter((f) => !sb.has(f)).map((f) => `only in ${a}: ${f}`), ...[...sb].filter((f) => !sa.has(f)).map((f) => `only in ${b}: ${f}`)]
  if (diff.length) throw new Error(diff.join('\n'))
})
step('every stack exposes the same npm scripts', () => {
  const keys = Object.keys(STACKS).map((stack) => {
    const base = JSON.parse(readFileSync(join(root, 'base/package.json'), 'utf8')).scripts
    const partial = JSON.parse(readFileSync(join(root, 'stacks', stack, 'package.partial.json'), 'utf8')).scripts
    return Object.keys({ ...base, ...partial }).sort().join(',')
  })
  if (new Set(keys).size > 1) throw new Error(keys.join('\n vs \n'))
})

// --- per stack: assemble → install → check ------------------------------------------------------
for (const stack of stacks) {
  console.log(`\nStack: ${stack}`)
  const out = mkdtempSync(join(tmpdir(), `kickstarter-${stack}-`))
  const lockFile = join(root, 'stacks', stack, 'package-lock.json')

  const assembled = step('assemble', () =>
    assemble({ root, stack, title: 'Verify App', name: `verify-${stack}`, description: 'Verification build.', outDir: out }),
  )
  if (!assembled) continue

  const installed = args['refresh-locks']
    ? step('npm install (refreshing lockfile)', () => {
        run(out, 'npm', ['install', '--no-audit', '--no-fund'])
        copyFileSync(join(out, 'package-lock.json'), lockFile)
      })
    : step('npm ci', () => run(out, 'npm', ['ci', '--no-audit', '--no-fund']))
  if (!installed) {
    if (!args['refresh-locks']) failures.push(`${stack}: if dependencies changed, run with --refresh-locks`)
    continue
  }

  copyFileSync(join(out, '.env.example'), join(out, '.env.local'))
  step('npm run check (lint → typecheck → test → build)', () => run(out, 'npm', ['run', 'check']))
  step('docs-check hook tests', () => run(out, 'node', ['--test', '.claude/hooks/docs-check.test.mjs']))
  if (args.e2e) {
    step('playwright install chromium', () => run(out, 'npx', ['playwright', 'install', 'chromium']))
    step('npm run test:e2e:merge', () => run(out, 'npm', ['run', 'test:e2e:merge']))
  }

  if (args.keep) console.log(`  kept: ${out}`)
  else rmSync(out, { recursive: true, force: true })
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n\n${failures.join('\n\n')}`)
  process.exit(1)
}
console.log('\nAll stacks verified.')
