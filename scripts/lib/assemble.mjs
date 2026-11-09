// Builds a ready-to-use project from base/ + one stack overlay. Pure: writes only into outDir.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

export const STACKS = {
  next: { label: 'Next.js 16 (App Router)' },
  vite: { label: 'Vite 8 + React Router 8 (SPA)' },
}

// Overlay files that only exist in one stack. Anything else an overlay adds must exist in both stacks.
export const STACK_ONLY_FILES = {
  next: ['next.config.ts', 'src/app/layout.tsx', 'src/app/page.tsx', 'src/app/not-found.tsx'],
  vite: ['vite.config.ts', 'index.html.tmpl', 'vercel.json', 'src/app/main.tsx', 'src/app/router.tsx'],
}

// Overlays may only touch these places; everything else is shared so the structure stays identical.
export const OVERLAY_ZONES = [/^[^/]+$/, /^src\/app\//, /^src\/platform\//, /^docs\/platform\.md$/]

// Consumed by assemble itself, never copied into the project.
const OVERLAY_META = new Set(['package.partial.json', 'CLAUDE.stack.md', 'package-lock.json'])

const PLACEHOLDER = /\{\{([A-Z_]+)\}\}/g
const SKIP = new Set(['node_modules', '.next', 'dist', '.DS_Store'])

export const listFiles = (dir, root = dir) =>
  readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return []
    const full = join(dir, name)
    return statSync(full).isDirectory() ? listFiles(full, root) : [relative(root, full)]
  })

export const toSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')

export const toTitle = (slug) =>
  slug
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

export const deepMerge = (base, overlay) => {
  const out = { ...base }
  for (const [key, value] of Object.entries(overlay)) {
    out[key] = isPlainObject(value) && isPlainObject(base[key]) ? deepMerge(base[key], value) : value
  }
  return out
}

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)

/**
 * @param {{ root: string, stack: 'next'|'vite', title: string, name: string, description: string, outDir: string }} options
 * @returns {string[]} files written, relative to outDir
 */
export const assemble = ({ root, stack, title, name, description, outDir }) => {
  if (!STACKS[stack]) throw new Error(`Unknown stack "${stack}". Use one of: ${Object.keys(STACKS).join(', ')}`)
  const baseDir = join(root, 'base')
  const stackDir = join(root, 'stacks', stack)

  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  cpSync(baseDir, outDir, { recursive: true, filter: (src) => !SKIP.has(src.split(/[\\/]/).pop()) })
  for (const file of listFiles(stackDir)) {
    if (OVERLAY_META.has(file)) continue
    cpSync(join(stackDir, file), join(outDir, file))
  }

  const pkg = deepMerge(readJson(join(baseDir, 'package.json')), readJson(join(stackDir, 'package.partial.json')))
  writeJson(join(outDir, 'package.json'), { name, version: '0.1.0', description, ...pkg, name, description })

  const lockFile = join(stackDir, 'package-lock.json')
  if (existsSync(lockFile)) {
    const lock = readJson(lockFile)
    lock.name = name
    if (lock.packages?.['']) lock.packages[''].name = name
    writeJson(join(outDir, 'package-lock.json'), lock)
  }

  const values = {
    PROJECT_NAME: name,
    PROJECT_TITLE: title,
    PROJECT_DESCRIPTION: description || `${title} web app.`,
    STACK: STACKS[stack].label,
    STACK_SECTION: readFileSync(join(stackDir, 'CLAUDE.stack.md'), 'utf8').trim(),
  }
  for (const file of listFiles(outDir).filter((f) => f.endsWith('.tmpl'))) {
    const full = join(outDir, file)
    const rendered = readFileSync(full, 'utf8').replace(PLACEHOLDER, (match, key) => values[key] ?? match)
    writeFileSync(full, rendered)
    renameSync(full, full.slice(0, -'.tmpl'.length))
  }

  const files = listFiles(outDir)
  const leftovers = files.filter((file) => {
    if (/\.(png|jpe?g|gif|ico|woff2?|pdf)$/i.test(file)) return false
    return new RegExp(PLACEHOLDER.source).test(readFileSync(join(outDir, file), 'utf8'))
  })
  if (leftovers.length) throw new Error(`Unfilled placeholders in: ${leftovers.join(', ')}`)
  return files
}
