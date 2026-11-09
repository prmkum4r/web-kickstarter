---
name: edit-component
description: Edits, fixes or refactors an existing component, page, hook or stylesheet in this codebase. Use whenever asked to modify, update, debug, rename, restyle or lint-fix a file that already exists under src/. Trigger on "fix this component", "update the styles", "change the prop", "refactor", "lint error", "this screen is broken", or any task that touches an existing file rather than creating a new one.
---

# Edit a component

Editing carries a risk creating doesn't: you inherit whatever the file already does. The job is to leave the file **more** consistent than you found it, without turning a small fix into a rewrite.

## Step 0: Pre-flight reads (required)

```
1. read the target file(s) in full, including the .module.scss beside the .tsx
2. read the area's doc (auto-loaded when you open the file): docs/modules/<module>.md, docs/components.md, …
3. read src/styles/_tokens.scss        → the tokens you may use
4. ls src/components/custom/ src/components/common/   → wrappers, then shared components
```

If the change touches data, also read the hook and service behind it. If it touches a shared component, `grep` for its usages first: every one of them changes too.

## Step 1: Make the change

Follow the same rules as **create-component**. The ones most often broken during an edit:

- **Tokens, not literals.** If you need a reusable value with no token, add it to `_tokens.scss` (and `theme.ts` if AntD needs it) rather than hard-coding it.
- **Wrappers, not raw antd.** Swapping a `custom/` wrapper back for the raw antd import is a regression, even if it typechecks. ESLint will flag it.
- **Stack-neutral.** No `next/*` / `react-router` imports outside `src/app` and `src/platform`; use `@/platform/router`.
- **`rem`, not `px`**, except 1–2px hairlines.
- **Local `useState` for modals is correct.** Don't "improve" it into a store.
- **`useTransition` for async actions, `useToast()` for feedback**, never `console.log` as error handling.

### Changes that ripple

These edits look local but aren't:

| Edit | Also update |
|------|-------------|
| Rename/remove a `data-testid`, label, role or button text | the e2e specs using it + `docs/testing-contract.md` |
| Change a shared component's props or look | every usage (`grep`), and say so in your summary |
| Add a route or change a path | `PATHS` in `src/config/routes.ts`, the stack's route file (`docs/platform.md`), any `build…Path` helper |
| Change a response type | the feature's `types.ts`, the service, the mock in `public/mock/`, the module doc's data contract |
| Add an env variable | `src/types/platform.ts`, `src/platform/env.ts`, `src/config/env.ts`, `.env.example`, `docs/platform.md` |
| Change a token's meaning | `_tokens.scss` and `theme.ts` together |

### Touching a data hook

`useAsyncData` keys its cache on the **fetcher's identity**. Replacing a `useCallback` fetcher with an inline arrow makes the screen re-fetch forever, and it looks like a slow network rather than a bug. Deps must be primitives.

## Step 2: Violation scan on the lines you touched

```
[ ] No hex/rgb duplicating a token; no px spacing; no style={{ }} without a dynamic reason
[ ] No antd Button/Input/Select/Form/Modal/message import
[ ] No next/* or react-router import outside src/app, src/platform
[ ] No fetch/api call in a component; no path literal
[ ] useAsyncData fetchers still memoised with primitive deps
[ ] Still works at 375px
```

## Step 3: Pre-existing violations

If a line you were already editing breaks a rule, fix it: it's cheap and stops rot.

If the violation is **elsewhere in the file**, don't silently rewrite it. Say what you found and offer to fix it separately.

## Step 4: Update the doc

If the change alters anything the module doc describes (components, props, flow, data contract, test hooks, decisions), update it now. The docs-check hook will ask otherwise. A pure refactor with no behavioural change → say "No doc impact: <reason>".

## Step 5: Verify

```bash
npm run check
```

For a visible change, also look at it: start the `dev` launch config and check the screen at **375px** and desktop width.

Report honestly which of these you actually ran.

## Related skills

- Creating something new instead → **create-component**
- The change needs a new request → **add-service**
- Reviewing a file you're not changing → **lint-audit**
