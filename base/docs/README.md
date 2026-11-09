# Docs — agent memory

These files are the long-term memory for anyone (human or AI agent) working in this repo. `CLAUDE.md` holds the always-loaded rules; these docs hold the **module-level detail** needed to change a module correctly the first time: intent, contracts, and the reasons behind non-obvious decisions. The code shows *what*; docs record *why* and *what must stay true*.

## How these docs are loaded

| How | Docs | Mechanism |
|-----|------|-----------|
| **Always** | `agent-workflow.md`, `testing-contract.md` | `@`-imported by the root `CLAUDE.md` |
| **By path** | `architecture.md`, `design-system.md`, `components.md`, `platform.md`, `modules/*.md` | Each has a rule in `.claude/rules/` with `paths:` globs and an `@` import. Claude Code loads the doc when a session reads or edits a matching file. |
| **On demand** | this file, `modules/_template.md` | Read when needed |

The same `paths:` globs drive the **docs-check hook** (`.claude/hooks/docs-check.mjs`): when a session changes a file matched by a rule but not the rule's doc, the Stop hook blocks once and asks for the doc to be updated, or for an explicit "No doc impact: …". `npm run docs:check` runs the same check from the terminal. The rule files are therefore the **single source of truth** for which doc covers which code.

## Index

| Doc | Read it when… |
|-----|---------------|
| [agent-workflow.md](agent-workflow.md) | Starting any task: how work is done here (read first, scope, verification, git, reporting) |
| [testing-contract.md](testing-contract.md) | Renaming or removing a `data-testid`, label or role the e2e suite relies on |
| [architecture.md](architecture.md) | Touching `lib/`, `hooks/`, `providers/`, `config/`, `types/`: layers, data flow, error vocabulary, boundaries |
| [design-system.md](design-system.md) | Touching any style: tokens, SCSS injection, CSS Modules, AntD theme |
| [components.md](components.md) | Building or editing shared UI: `custom/` wrappers, `common/`, layout |
| [platform.md](platform.md) | Routes, `src/app/`, `src/platform/`, env variables (the only stack-specific code) |
| [modules/home.md](modules/home.md) | The home page (`/`) |
| [modules/_template.md](modules/_template.md) | Writing the doc for a new module (the add-module skill uses it) |

## Keeping docs accurate (mandatory)

- **Any change to a module updates its doc in the same change.** New component, changed prop, new route, new endpoint, new test id → edit the doc.
- **A doc that disagrees with the code is a bug.** Trust the code, then fix the doc.
- **Edit docs here, never the rule files.** Rule files only hold `paths:` + the `@` import.
  - New file in an existing area → it's usually already covered; if not, widen that rule's `paths:`.
  - New module → use the **add-module** skill: it creates the folder, the doc from `modules/_template.md`, the rule, and the rows in this index and `CLAUDE.md`.
  - New doc for an existing area → add a rule file + a row here + a row in `CLAUDE.md`.
- **Keep rule globs from overlapping.** A file matched by two rules requires both docs to change.
- **Write for the next change, not the last one.** Prefer contracts, invariants, and "why" over a changelog. Delete what's no longer true.
- No per-folder `CLAUDE.md` files: they'd duplicate this system without the hook.
