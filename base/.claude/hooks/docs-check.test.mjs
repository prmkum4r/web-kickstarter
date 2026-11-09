// node --test .claude/hooks/docs-check.test.mjs
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'
import { evaluate, globToRegExp, parseNameStatus, parsePorcelain, parseRule } from './docs-check.mjs'

const SCRIPT = join(import.meta.dirname, 'docs-check.mjs')

describe('globToRegExp', () => {
  const cases = [
    ['src/features/home/**', 'src/features/home/HomePage.tsx', true],
    ['src/features/home/**', 'src/features/home/hooks/useX.ts', true],
    ['src/features/home/**', 'src/features/homework/x.ts', false],
    ['src/**/*.scss', 'src/a.scss', true],
    ['src/**/*.scss', 'src/a/b/c.scss', true],
    ['src/*.ts', 'src/a/b.ts', false],
    ['src/app/(public)/page.tsx', 'src/app/(public)/page.tsx', true],
    ['src/app/(public)/page.tsx', 'src/app/public/page.tsx', false],
    ['src/app/jobs/[id]/**', 'src/app/jobs/[id]/page.tsx', true],
    ['src/config/{routes,env}.ts', 'src/config/env.ts', true],
    ['src/config/{routes,env}.ts', 'src/config/constants.ts', false],
    ['src/?.ts', 'src/a.ts', true],
    ['./src/x.ts', 'src/x.ts', true],
  ]
  for (const [glob, path, expected] of cases) {
    it(`${glob} ${expected ? 'matches' : 'does not match'} ${path}`, () => {
      assert.equal(globToRegExp(glob).test(path), expected)
    })
  }
})

describe('parseRule', () => {
  it('reads list-form paths and the doc import', () => {
    const rule = parseRule('---\npaths:\n  - "src/a/**"\n  - src/b.ts\n---\n<!-- note -->\n# Title\n\n@../../docs/a.md\n')
    assert.deepEqual(rule, { paths: ['src/a/**', 'src/b.ts'], imports: ['../../docs/a.md'] })
  })

  it('reads inline-array paths, including brace globs', () => {
    const rule = parseRule('---\npaths: ["src/a/**", "src/{b,c}.ts"]\n---\n@../../docs/a.md\n')
    assert.deepEqual(rule.paths, ['src/a/**', 'src/{b,c}.ts'])
  })

  it('returns no paths for always-loaded rules', () => {
    assert.deepEqual(parseRule('# Always on\n@../../docs/x.md\n').paths, [])
  })
})

describe('git output parsing', () => {
  it('yields both sides of a porcelain rename', () => {
    assert.deepEqual(parsePorcelain('R  src/new.ts\0src/old.ts\0 M src/a.ts\0?? src/b.ts\0'), [
      'src/new.ts',
      'src/old.ts',
      'src/a.ts',
      'src/b.ts',
    ])
  })

  it('yields both sides of a name-status rename', () => {
    assert.deepEqual(parseNameStatus('M\0src/a.ts\0R100\0src/old.ts\0src/new.ts\0D\0src/gone.ts\0'), [
      'src/a.ts',
      'src/old.ts',
      'src/new.ts',
      'src/gone.ts',
    ])
  })
})

describe('evaluate', () => {
  const rules = [{ file: 'r', patterns: [globToRegExp('src/features/home/**')], docs: ['docs/modules/home.md'] }]

  it('flags a changed file whose doc did not change', () => {
    const { stale, unmatched } = evaluate(rules, ['src/features/home/HomePage.tsx'])
    assert.deepEqual([...stale], [['docs/modules/home.md', ['src/features/home/HomePage.tsx']]])
    assert.deepEqual(unmatched, [])
  })

  it('passes when the doc changed too', () => {
    const { stale } = evaluate(rules, ['src/features/home/HomePage.tsx', 'docs/modules/home.md'])
    assert.equal(stale.size, 0)
  })

  it('ignores tests, docs and config-only paths', () => {
    const { stale, unmatched } = evaluate(rules, ['src/features/home/x.test.ts', 'docs/other.md', '.claude/rules/x.md'])
    assert.equal(stale.size, 0)
    assert.deepEqual(unmatched, [])
  })

  it('reports src files no rule covers', () => {
    assert.deepEqual(evaluate(rules, ['src/features/billing/x.ts', 'package.json']).unmatched, ['src/features/billing/x.ts'])
  })
})

describe('hook end to end', () => {
  const dir = mkdtempSync(join(tmpdir(), 'docs-check-'))
  after(() => rmSync(dir, { recursive: true, force: true }))

  const sh = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' })
  const write = (path, content) => {
    mkdirSync(join(dir, path, '..'), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  const hook = (mode, input) =>
    execFileSync('node', [SCRIPT, mode], {
      cwd: dir,
      input: JSON.stringify(input),
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    })

  sh('init', '-q')
  sh('config', 'user.email', 't@example.com')
  sh('config', 'user.name', 'Test')
  write('.claude/rules/home.md', '---\npaths:\n  - "src/features/home/**"\n---\n@../../docs/modules/home.md\n')
  write('docs/modules/home.md', '# Home\n')
  write('src/features/home/HomePage.tsx', 'export {}\n')
  write('src/features/home/Owner.tsx', 'export {}\n')
  sh('add', '.')
  sh('commit', '-qm', 'init')

  it('ignores edits that were already dirty when the session started', () => {
    write('src/features/home/Owner.tsx', 'export const ownerWork = 1\n')
    hook('--baseline', { session_id: 's1', source: 'startup' })
    assert.equal(hook('--hook', { session_id: 's1', stop_hook_active: false }), '')
  })

  it('blocks once when this session changes a file without its doc', () => {
    write('src/features/home/HomePage.tsx', 'export const changed = 1\n')
    const output = hook('--hook', { session_id: 's1', stop_hook_active: false })
    const parsed = JSON.parse(output)
    assert.equal(parsed.decision, 'block')
    assert.match(parsed.reason, /docs\/modules\/home\.md\s+←\s+src\/features\/home\/HomePage\.tsx/)
    assert.doesNotMatch(parsed.reason, /Owner\.tsx/)
  })

  it('does not block again for the same change', () => {
    assert.equal(hook('--hook', { session_id: 's1', stop_hook_active: false }), '')
  })

  it('never blocks while a Stop hook is already active', () => {
    write('src/features/home/HomePage.tsx', 'export const changedAgain = 2\n')
    assert.equal(hook('--hook', { session_id: 's1', stop_hook_active: true }), '')
  })

  it('passes once the doc is updated', () => {
    write('docs/modules/home.md', '# Home\n\nUpdated.\n')
    assert.equal(hook('--hook', { session_id: 's1', stop_hook_active: false }), '')
  })

  it('reports new src files that no rule covers', () => {
    write('src/features/billing/Billing.tsx', 'export {}\n')
    const parsed = JSON.parse(hook('--hook', { session_id: 's1', stop_hook_active: false }))
    assert.match(parsed.reason, /src\/features\/billing\/Billing\.tsx/)
    assert.match(parsed.reason, /add-module/)
  })

  it('exits 1 in CLI mode when a doc is stale', () => {
    sh('add', '.')
    sh('commit', '-qm', 'second')
    write('src/features/home/HomePage.tsx', 'export const cli = 3\n')
    let status = 0
    try {
      execFileSync('node', [SCRIPT], { cwd: dir, stdio: 'pipe', env: { ...process.env, CLAUDE_PROJECT_DIR: dir } })
    } catch (error) {
      status = error.status
    }
    assert.equal(status, 1)
  })
})
