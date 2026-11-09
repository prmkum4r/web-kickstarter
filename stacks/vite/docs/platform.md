# Platform layer — routing & env (Vite + React Router)

`src/app/` and `src/platform/` are the **only** stack-specific code. Everything else imports the neutral API from `@/platform/router` and `@/config/env`; ESLint blocks `react-router` anywhere else (see [architecture.md](architecture.md#boundaries)).

## Files

| File | Role |
|------|------|
| `index.html` | Shell document; loads `/src/app/main.tsx`. Title and description are set here. |
| `src/app/main.tsx` | Entry: `AppProviders` → `RouterProvider`. Imports `globals.scss`. |
| `src/app/router.tsx` | Route table: a layout route renders `AppLayout` + `<Outlet />`; children map `PATHS` to lazy feature pages; `*` → `NotFound`. |
| `src/platform/router.tsx` | `Link`, `useNavigate`, `usePathname`, `useParams`, `useSearchParams` over `react-router`. Typed by `PlatformRouter` in `src/types/platform.ts`. |
| `src/platform/env.ts` | Literal `import.meta.env.VITE_*` reads → `platformEnv`. |
| `src/config/routes.ts` | `PATHS` — every route path, shared by both stacks. |
| `vercel.json` | SPA fallback: every path serves `index.html`. |

## Add a route

1. Add the path to `PATHS` in `src/config/routes.ts` (and a `build…Path` helper if it has params).
2. Add a child to the layout route in `src/app/router.tsx`, lazy-loading the page from the feature's public index:
   ```tsx
   {
     path: PATHS.PROJECTS,
     lazy: async () => ({ Component: (await import('@/features/projects')).ProjectsPage }),
   },
   ```
   Keep the `*` route last. Dynamic segments use the `:id` form already in `PATHS`; the page reads them with `useParams<{ id: string }>()` from `@/platform/router`.

## Rules and why

- **No logic in `src/app/`.** The route table maps paths to pages and nothing else, which keeps the Next stack and this one interchangeable.
- **Lazy pages.** Each feature becomes its own chunk, so the first load ships only the route being viewed.
- **`useSearchParams` is read-only** (to match Next). Change the query string with `useNavigate()`.
- **Env reads are literal.** Vite replaces `import.meta.env.VITE_API_URL` at build time. Adding a variable → `PlatformEnv` in `src/types/platform.ts`, this file, `.env.example`, `src/config/env.ts`.
- **SPA hosting.** Any host other than Vercel needs the same "serve `index.html` for unknown paths" fallback as `vercel.json`.
