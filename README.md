# Claude kickstarter

Clone → `npm run init` → start building. A React project template with **one project structure on two stacks** (Next.js App Router or Vite + React Router) and a Claude Code setup that keeps its own docs up to date.

```bash
git clone <this-repo> my-app
cd my-app
npm run init
```

Init asks for a project name, a one-line description and the stack. It then:
1. assembles the project from `base/` plus the chosen stack,
2. fills in the name and description,
3. removes the template scaffolding and resets git to a fresh `main` (no commit),
4. creates `.env.local`, installs dependencies and installs Playwright's Chromium.

Non-interactive: `npm run init -- --stack vite --name "Acme Portal" --description "Customer portal" -y`. Other flags: `--no-install`, `--no-browsers`, `--keep-git`, `--dry-run` (list the files without changing anything), `--force`.

## What you get

| | |
|-|-|
| **Stack** | React 19, TypeScript strict, Ant Design 6, SCSS (CSS Modules + design tokens auto-injected), React Compiler, ESLint 9, Vitest, Playwright |
| **Same structure on both stacks** | Only `src/app/` (routing) and `src/platform/` (router + env adapters) differ; features import `@/platform/router`, never `next/*` or `react-router`. ESLint enforces it. |
| **Data layer** | page → hook (`useAsyncData`) → `<Module>Service` → `api` client → fetch, with typed `ServiceResult<T>` and one error vocabulary. `API_URL=/mock` serves `public/mock/*.json`, so it runs with no backend. |
| **Sample module** | `features/home`: the full data path, a unit test, an e2e spec, its doc and its rule |
| **Scripts (identical on both stacks)** | `dev` `build` `preview` `lint` `typecheck` `test` `test:watch` `test:coverage` `test:e2e` `test:e2e:merge` `test:e2e:deploy` `docs:check` `check` |

### The Claude Code setup

- **`CLAUDE.md`**: about 100 lines of always-loaded rules. Detail lives in `docs/`.
- **Self-documenting docs.** Each `.claude/rules/<area>.md` has `paths:` globs and an `@docs/<area>.md` import, so Claude Code loads the right doc whenever it touches matching code.
- **Enforced, not just requested.** The `docs-check` hook (`.claude/hooks/docs-check.mjs`, registered in `.claude/settings.json`) reads those same globs. On **Stop**, if this session changed code but not its doc, it blocks once and lists the docs to update; Claude must update them or reply "No doc impact: …".
  - A **SessionStart** baseline means your own uncommitted work never triggers it.
  - New `src/` areas with no rule are flagged too.
  - `npm run docs:check [--base origin/main] [--strict]` runs the same check in a terminal or CI.
- **Skills**:
  - `create-component`, `edit-component`, `add-service`, `lint-audit`: generalised from earlier projects.
  - `add-module` (new): scaffolds the feature, its route, its doc, its rule and the index rows.
  - `sync-docs` (new): a full docs-vs-code drift audit.
  - `skill-creator`.
- **Settings**:
  - An allowlist for the npm scripts and read-only git.
  - Asks before commit, push, reset or checkout.
  - Denies reading `.env*` secrets.
  - A `dev` launch config on port 3000.

## Maintaining the kickstarter

```
base/              shared files (≈90%) — the generated project's tree
stacks/next/       overlay: files at the same path replace base files
stacks/vite/       overlay
  package.partial.json   deep-merged into base/package.json
  CLAUDE.stack.md        injected into CLAUDE.md as the stack section
  package-lock.json      committed per stack so installs are reproducible
scripts/lib/assemble.mjs   base + overlay → project (used by init and verify)
scripts/verify-stacks.mjs  proves both stacks build, pass checks and stay structurally identical
init.mjs
```

- `npm run verify` assembles each stack into a temp dir. For each one it runs `npm ci`, then `npm run check`, then the hook's test suite. It also checks:
  - overlays only touch `src/app/`, `src/platform/`, `docs/platform.md` and root config files;
  - both overlays define the same files, apart from the declared `STACK_ONLY_FILES`;
  - both stacks expose the same npm scripts.
- `npm run verify:e2e` also runs the Playwright merge suite. It needs Chromium (`npx playwright install chromium`).
- After changing dependencies in `base/package.json` or a `package.partial.json`, run `npm run refresh-locks`.
- Placeholders (`{{PROJECT_TITLE}}`, `{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION}}`, `{{STACK}}`, `{{STACK_SECTION}}`) only work in `*.tmpl` files. The suffix is dropped at init, and init fails if any placeholder is left unfilled.

See `CLAUDE.md` in this repo for the maintainer rules.
