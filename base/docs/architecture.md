# Architecture — layers, data flow, boundaries

## Layers

```
src/app/         routing layer          (stack-specific: Next.js App Router | React Router)
   │ renders
src/features/*/  feature pages          page → hook → service
   │ use
src/components/  shared UI              custom/ (AntD wrappers) · common/ · layout/
src/hooks/       shared hooks           useAsyncData, useToast
src/lib/api/     HTTP client + errors   the only place fetch() is called
src/config/      env, routes, constants
src/platform/    framework adapters     (stack-specific: router + env readers)
src/providers/   app-wide providers     AntD ConfigProvider + App, env gate
src/styles/      tokens, SCSS core, AntD theme
src/types/       cross-feature types    (feature-local types live in the feature)
```

Only `src/app/` and `src/platform/` differ between the Next.js and Vite stacks; everything else is identical (see [platform.md](platform.md)).

## Folder map

| Path | Holds | Notes |
|------|-------|-------|
| `src/features/<module>/` | Everything one product area needs | `index.ts` (public API) · `<Module>Page.tsx` · `components/` · `hooks/` · `services/` · `types.ts` · tests next to the code |
| `src/components/custom/<Name>/` | Thin AntD wrappers | The only place wrapped primitives are imported from `antd` |
| `src/components/common/<Name>/` | Shared app components | `PageState`, `NotFound`, `MissingConfig` |
| `src/components/layout/<Name>/` | App chrome | `AppLayout` |
| `src/hooks/` | Hooks used by 2+ features | Feature-only hooks stay in the feature |
| `src/lib/api/` | `client.ts`, `errors.ts` | `ServiceResult`, `AppError`, `api.get/post/…` |
| `src/types/` | Types shared across features | `platform.ts` defines the platform contract |
| `src/utils/` | Pure helpers used by 2+ features | Create when needed |

A component, hook or type used by **one** feature lives in that feature. Move it to `src/` only when a second feature needs it.

## Data flow

```
<Module>Page ──► use<Thing>() ──► <Module>Service.method() ──► api.get() ──► fetch
   PageState       useAsyncData        ServiceResult<T>           AppError on failure
```

- **Services** (`features/<m>/services/<m>.service.ts`) export one `<Module>Service` object. Every method returns `Promise<ServiceResult<T>>` and passes a user-facing `fallbackMessage`. A raw HTTP error never leaves the service layer.
- **Hooks** wrap reads in `useAsyncData`. The fetcher's identity is the cache key: always `useCallback` with **primitive** deps, or the screen re-fetches on every render.
- **Pages** render reads inside `PageState` (loading / error / empty / success) and perform writes in `useTransition`, reporting with `useToast()`.
- **No global store.** Server data lives in hooks; UI state is local `useState`. Add a store only when a concrete cross-tree need appears, and record the decision here.
- After a write, call the read hook's `reload()`; there is no cache invalidation layer.

## Error vocabulary

`src/lib/api/errors.ts` maps every failure onto one `AppErrorCode`: `auth | validation | forbidden | not_found | conflict | network | unexpected`.

| Source | Code | Message shown |
|--------|------|---------------|
| 400, 422 | `validation` | Server `message`/`error` field if present, else default copy |
| 409 | `conflict` | Server message if present, else default copy |
| 401 / 403 / 404 | `auth` / `forbidden` / `not_found` | Default copy (server text is for engineers) |
| other status | `unexpected` | The call's `fallbackMessage` |
| `TypeError`, abort, timeout | `network` | Default copy |

Because validation/conflict messages reach users verbatim, mirror server-side validation in forms and ask the backend for user-readable messages.

## Configuration

- `src/platform/env.ts` reads raw values with the stack's prefix (`NEXT_PUBLIC_` / `VITE_`); `src/config/env.ts` validates and exposes `env`. Nothing else touches env globals (ESLint-enforced).
- Required variables are checked once at startup; if any is missing, `AppProviders` renders `MissingConfig` instead of the app.
- `API_URL=/mock` serves `public/mock/*.json` until a backend exists, so the app, unit tests and e2e run with no server.
- Every env value is public (inlined into the bundle). Secrets never go in `.env*` for this app.

## Boundaries

Enforced by `eslint.shared.mjs`:

| Rule | Why |
|------|-----|
| `next/*`, `react-router*` only in `src/app/**` and `src/platform/**` | Keeps features and components stack-neutral |
| `process.env` / `import.meta.env` only in `src/platform/env.ts` | One validated config surface |
| `@/features/<x>/<internal>` imports are banned; use `@/features/<x>` | Each feature's `index.ts` is its public API; internals can move freely |
| `antd` `Button`, `Input`, `Select`, `Form`, `Modal`, `message` only in `src/components/custom/**` | One seam per primitive for product defaults; toasts must go through the themed `App` context |

Not lint-enforced, still required: no `fetch` outside `src/lib/api/`; no path literals outside `src/config/routes.ts`.
