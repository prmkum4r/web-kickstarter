# Shared components — custom wrappers, common, layout

## Conventions (all components)

- One folder per component: `<Name>/<Name>.tsx` + `<Name>.module.scss` (same casing). No bare `.tsx` at a directory root.
- `'use client'` on line 1 of every component. Next requires it for anything with hooks, context or handlers; Vite ignores it. Keeping it everywhere keeps components portable between stacks.
- `const Name: FC<NameProps> = (…) => …` with a **default export**. Generic components (`Select`, `Form`) use a plain generic function instead of `FC`.
- Props interface `<Name>Props` declared above the component. Types shared with other files go in the feature's `types.ts` or `src/types/`.
- Handlers are named `handleX`. Async user actions run inside `useTransition`; feedback goes through `useToast()`.
- Navigation uses `Link` / `useNavigate` from `@/platform/router` and paths from `PATHS`, never literals.

## `custom/` — AntD wrappers

Importing the raw primitive when a wrapper exists is blocked by ESLint. If a wrapper lacks something, extend it compatibly instead of bypassing it.

| Wrapper | Instead of | Defaults it owns |
|---------|------------|------------------|
| `custom/Button/Button` | `Button` from antd | none yet: one seam for future product defaults |
| `custom/Input/Input` (+ `.Password`, `.TextArea`, `.Search`) | `Input` | — |
| `custom/Select/Select` | `Select` | generic over the value type |
| `custom/Form/Form` (+ `.Item`, `.List`, `.useForm`, `.useWatch`, …) | `Form` | `layout="vertical"`, `requiredMark={false}` |
| `custom/Modal/Modal` | `Modal` | `destroyOnHidden`, `centered` |
| `useToast()` (`src/hooks`) | `message` from antd | goes through `App.useApp()` so toasts get the theme |

Anything else (`Card`, `Result`, `Empty`, `Skeleton`, `Table`, `Tag`, `Tooltip`, …) is imported from `antd` directly. Add a wrapper only when a primitive gets a product default **and** is used in several places; then add it to `WRAPPED_ANTD` in `eslint.shared.mjs`, this table, and the skills that list wrappers.

## `common/`

| Component | Use |
|-----------|-----|
| `PageState` | Wrap every data view. Props: `loading`, `error`, `isEmpty`, `emptyTitle`, `emptyDescription`, `emptyAction` (CTA slot), `onRetry`, `skeletonRows`. Decides loading / error / empty / success once so every screen behaves the same. |
| `NotFound` | Unknown routes (both stacks route to it). |
| `MissingConfig` | Rendered by `AppProviders` when required env vars are missing. |

## `layout/`

| Component | Use |
|-----------|-----|
| `AppLayout` | Sticky header with the app name (links home) + centred content (`content-width`). Wraps every page in both stacks. Test id `app-header`. |

Changing a shared component changes every screen that uses it: say so in your summary.
