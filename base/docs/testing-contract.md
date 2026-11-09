# Testing contract — selectors you must not break

The Playwright suite (`e2e/`) finds UI by **`data-testid`, ARIA role + accessible name, and labels**. CSS Modules hash class names, so classes are never selectors. Renaming any hook below without updating its consumer breaks e2e **silently**: nothing fails until the suite runs.

**Rule:** change a hook → update its consumer in the **same change** → run `npm run test:e2e:merge`. Keep this table current.

## Selector conventions

- Prefer **role + name** (`getByRole('button', { name: 'Save' })`) for interactive elements: it doubles as an accessibility check.
- Use **`data-testid`** for containers and repeated items that have no natural role. Names are kebab-case and describe the thing, not its looks: `summary-card`, not `blue-box`.
- Never select by AntD internal classes (`.ant-*`) unless no alternative exists; if you must, note it here.

## Hooks

| Hook | Where | Consumers |
|------|-------|-----------|
| `data-testid="app-header"` | `components/layout/AppLayout` | `e2e/home/home.spec.ts` (also the "signed-in shell rendered" check for `auth.setup.ts` once auth exists) |
| `data-testid="summary-card"` | `features/home/components/SummaryCard` | `e2e/home/home.spec.ts` |
| `<h1>` on the home page | `features/home/HomePage` | `e2e/home/home.spec.ts` |
| `data-testid="not-found"`, button "Back to home" | `components/common/NotFound` | `e2e/not-found.public.spec.ts` |
| `data-testid="page-state-loading" / "page-state-error" / "page-state-empty"` | `components/common/PageState` | — (available for specs) |
| `data-testid="missing-config"` | `components/common/MissingConfig` | — |

## Suite structure

| Piece | Convention |
|-------|------------|
| `e2e/auth.setup.ts` | `setup` project: signs in once, saves `playwright/.auth/user.json`. Currently an anonymous stub until the app has auth. |
| `*.public.spec.ts` | `chromium-public` project, no session |
| other `*.spec.ts` | `chromium` project, reuses the saved session |
| `@deploy` in a test title | Creates real data or needs a deployed backend → excluded from `test:e2e:merge`, run by `test:e2e:deploy` after deploy |
| `E2E_BASE_URL` | Required. When it's localhost, Playwright builds and serves the app itself (`npm run build && npm run preview`). |

Specs never use fixed waits: wait on an element or network state.
