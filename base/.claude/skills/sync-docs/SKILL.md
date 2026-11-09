---
name: sync-docs
description: Audits docs/ and CLAUDE.md against the actual code and fixes drift — wrong file paths, renamed components, stale props, outdated data contracts, missing modules, dead index rows, uncovered src/ folders. Use when asked to sync, refresh, audit or verify the docs, after a large refactor or merge, before onboarding someone, or when docs "feel out of date". Trigger on "sync the docs", "are the docs up to date", "update the documentation", "audit docs", "docs drift".
---

# Sync docs

The docs-check hook catches drift **as it happens**, one change at a time. This skill is the periodic full sweep: it catches what slipped through (changes made outside Claude, "No doc impact" calls that were wrong, merges) and keeps the doc system itself healthy.

**Code is the source of truth.** When a doc and the code disagree, the doc is wrong, unless the code is clearly a bug, in which case report it instead of documenting it.

## Step 0: Map the system

```
1. ls .claude/rules/ and read each rule      → paths: globs + the doc each imports
2. read docs/README.md                       → the index
3. read CLAUDE.md "Docs" table + "Hard rules"
4. npm run docs:check -- --strict            → files currently changed without their doc, and uncovered src/ files
```

## Step 1: Structural checks (fast, mechanical)

```
[ ] Every rule's @import points to a doc that exists
[ ] Every doc in docs/ (except README.md, _template.md, always-loaded ones) has exactly one rule
[ ] Every rule's globs match at least one existing file (a glob matching nothing is dead)
[ ] No two rules match the same file
[ ] Every src/ file is matched by some rule (list folders that aren't)
[ ] docs/README.md index and CLAUDE.md Docs table list the same docs, and only existing ones
[ ] Every file path mentioned in a doc exists (grep each `src/…` path)
```

To list a rule's matches without dependencies: `git ls-files 'src/features/home/**'` (git pathspecs accept the same `**` globs).

## Step 2: Content checks, per doc

For each doc, read it next to the files its rule matches:

- **Files tables:** every file listed exists, and every significant file in the module is listed.
- **Names and props:** components, hooks, service methods and props named in the doc match the code.
- **Data contracts:** endpoints, request and response shapes match the service and types.
- **Flows:** the route → page → hook → service line matches the code.
- **Test hooks:** `data-testid`s and roles listed exist in the code, and match `docs/testing-contract.md` and the e2e specs.
- **Decisions:** still true? Delete ones the code no longer reflects.
- **CLAUDE.md hard rules:** still enforced by the code and ESLint config.

## Step 3: Report

Group by severity, cite `doc:line` and the code it contradicts:

```
### Wrong (would mislead the next change)
- docs/modules/projects.md:18 says ProjectService.list(page); code is list({ page, status }) (services/projects.service.ts:9)

### Missing
- src/features/billing/ has no rule or doc

### Stale / dead
- docs/README.md lists global-search.md, which doesn't exist
```

If everything matches, say so.

## Step 4: Fix (after reporting)

- Fix the docs in place. Keep them about contracts and "why", not history.
- Uncovered module → run **add-module** Steps 3–5 for it (doc, rule, index rows), or widen an existing rule.
- Never put content in a rule file; edit the doc it imports.
- If code looks wrong rather than the doc, don't "fix" the doc to match a bug. List it for the owner.

Then:

```bash
npm run docs:check -- --strict
```

## Related skills

- A new module needs a doc + rule → **add-module**
- Code-level review of a file → **lint-audit**
