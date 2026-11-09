# Platform layer — routing & env (Next.js)

`src/app/` and `src/platform/` are the **only** stack-specific code. Everything else imports the neutral API from `@/platform/router` and `@/config/env`; ESLint blocks `next/*` anywhere else (see [architecture.md](architecture.md#boundaries)).

## Files

| File | Role |
|------|------|
| `src/app/layout.tsx` | Root layout: `AntdRegistry` → `AppProviders` → `AppLayout` → page. Imports `globals.scss`. Sets `metadata`. |
| `src/app/page.tsx` | `/` → renders `HomePage` from `@/features/home`. |
| `src/app/not-found.tsx` | Unknown routes → `components/common/NotFound`. |
| `src/platform/router.tsx` | `Link`, `useNavigate`, `usePathname`, `useParams`, `useSearchParams` over `next/link` + `next/navigation`. Typed by `PlatformRouter` in `src/types/platform.ts`. |
| `src/platform/env.ts` | Literal `process.env.NEXT_PUBLIC_*` reads → `platformEnv`. |
| `src/config/routes.ts` | `PATHS` — every route path, shared by both stacks. |

## Add a route

1. Add the path to `PATHS` in `src/config/routes.ts` (and a `build…Path` helper if it has params).
2. Create the route file that renders the feature page, nothing else:
   ```tsx
   // src/app/projects/page.tsx
   import { ProjectsPage } from '@/features/projects'

   export default function Page() {
     return <ProjectsPage />
   }
   ```
   Dynamic segments use folders: `PATHS.PROJECT_DETAIL = '/projects/:id'` → `src/app/projects/[id]/page.tsx`. The page reads the param with `useParams<{ id: string }>()` from `@/platform/router`, not from route props, so the feature stays stack-neutral.
3. Route-specific `layout.tsx`, `loading.tsx` or `error.tsx` files are fine, but keep them thin: UI belongs in `src/features/` or `src/components/`.

## Rules and why

- **No logic in `src/app/`.** Route files import a page and render it, which keeps the Vite stack and this one interchangeable.
- **`useSearchParams` needs `<Suspense>`.** Without a boundary, `next build` fails or the page opts out of static rendering. Wrap the component that reads search params in `<Suspense fallback={...}>` at the route file.
- **Env reads are literal.** `process.env.NEXT_PUBLIC_API_URL` is replaced at build time; `process.env[key]` is `undefined` in the browser. Adding a variable → `PlatformEnv` in `src/types/platform.ts`, this file, `.env.example`, `src/config/env.ts`.
- **Server components:** route files are server components by default and may stay so. Anything under `src/components/` or `src/features/` is a client component.
- **Metadata** (`title`, `description`, `icons`) lives in `layout.tsx` / route files via `export const metadata`.
