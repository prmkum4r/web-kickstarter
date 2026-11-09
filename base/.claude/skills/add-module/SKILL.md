---
name: add-module
description: Scaffolds a new feature module end to end — the src/features/<module> folder, its route, its doc in docs/modules/, its path-scoped rule in .claude/rules/, and the index rows in docs/README.md and CLAUDE.md — so the new area is documented and tracked by the docs-check hook from the start. Use when asked to add a new page, section, product area, feature or route, or when the docs-check hook reports src/ files that no rule covers. Trigger on "add a module", "new feature", "new page for", "add a section", "create the X area".
---

# Add a module

A module is one product area: its page(s), components, hooks, services, types, tests, **and its doc**. Creating the doc and rule together with the code is what keeps self-documentation working: the rule makes Claude load the doc whenever the module is touched, and the docs-check hook uses the same rule to flag a stale doc.

## Step 0: Pre-flight reads

```
1. ls src/features/                      → existing modules; is this really new, or part of one?
2. read src/features/home/               → the reference module (all files)
3. read docs/modules/_template.md        → the doc skeleton
4. read .claude/rules/home.md            → the rule shape
5. read docs/platform.md                 → how to register a route in THIS stack
6. read src/config/routes.ts             → PATHS
```

Decide the **module name** (kebab-case folder, e.g. `billing`, `team-settings`) and its **route(s)**. If it's really a sub-area of an existing module, extend that module and its rule's `paths:` instead.

## Step 1: Scaffold the feature folder

```
src/features/<module>/
  index.ts                         export { default as <Module>Page } from './<Module>Page'
  <Module>Page.tsx                 'use client'; PageState around the data view
  <Module>Page.module.scss         .root { … }
  types.ts
  hooks/use<Thing>.ts              only if it reads data
  services/<module>.service.ts     only if it talks to the API
  services/<module>.service.test.ts
  components/                      feature-local components, created as needed
```

Follow **create-component** for the page and **add-service** for data. Don't create empty folders or placeholder files.

## Step 2: Register the route

1. Add the path to `PATHS` in `src/config/routes.ts` (+ a `build…Path` helper for params).
2. Add the route file / route entry exactly as `docs/platform.md` describes for this stack. The route renders `<Module>Page` imported from `@/features/<module>`, nothing else.
3. If the module needs navigation from the shell, add the link in `src/components/layout/AppLayout` using `Link` + `PATHS`.

## Step 3: Write the doc

Copy `docs/modules/_template.md` to `docs/modules/<module>.md` and fill it with what is **true now**: the flow line, the files table, data contracts, decisions, test hooks. Delete sections that don't apply. No placeholders left behind.

## Step 4: Add the rule

`.claude/rules/<module>.md`:

```markdown
---
paths:
  - "src/features/<module>/**"
  - "public/mock/<module>*.json"
---
<!-- Path-scoped rule: Claude Code loads it when a session reads/edits a matching file, and the docs-check hook uses the same globs to flag stale docs. Edit the doc below, not this file. -->
# <Module> module

@../../docs/modules/<module>.md
```

Globs must **not overlap** another rule (a file matched twice needs both docs updated). Don't add the route file here: `src/app/**` belongs to the platform rule.

## Step 5: Index it

- `docs/README.md` → a row in the **Index** table: `| [modules/<module>.md](modules/<module>.md) | <when to read it> |`
- `CLAUDE.md` → a row in the **Docs** table: `| docs/modules/<module>.md | src/features/<module>/** | <covers> |`
- `docs/testing-contract.md` → rows for any `data-testid`s the module exposes.
- `docs/platform.md` only if routing itself changed (not for a normal new route).

## Step 6: e2e (if the module has a user flow)

`e2e/<module>/<module>.spec.ts` (signed-in) or `*.public.spec.ts`. Tag a test `@deploy` if it creates real data. Select by role/name or `data-testid` (see `docs/testing-contract.md`).

## Step 7: Verify

```
[ ] src/features/<module>/ follows the home module's shape; index.ts is the public API
[ ] PATHS entry + route registered per docs/platform.md; page renders at its URL
[ ] docs/modules/<module>.md describes the real code (no template placeholders)
[ ] .claude/rules/<module>.md globs cover the module and overlap no other rule
[ ] Rows added to docs/README.md and CLAUDE.md (and testing-contract.md if test ids)
[ ] npm run docs:check passes
```

```bash
npm run check && npm run docs:check
```

Then open the route in the browser (launch config `dev`) at 375px and desktop width.

## Related skills

- Building the page and components → **create-component**
- The module's API calls → **add-service**
- Checking every doc still matches the code → **sync-docs**
