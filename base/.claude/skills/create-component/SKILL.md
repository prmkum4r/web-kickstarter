---
name: create-component
description: Creates a new React component, page, form, modal or list in this codebase following its design system, AntD wrappers and data conventions. Use whenever asked to add, build or scaffold any new UI. Trigger on "create a component", "add a page", "build a X screen", "make a form for", "add a modal", or any task that results in a new .tsx file under src/components/ or src/features/.
---

# Create a component

The conventions below keep a component written today matching one written six months from now: tokens so the theme stays single-sourced, one seam per AntD primitive, a strict `page → hook → service` data path so no component owns a request, and one shared component for the four states every data view has.

Follow the reasoning, not just the letter.

## Step 0: Pre-flight reads (before writing a line)

```
1. read src/styles/_tokens.scss                → note every --token you may use
2. ls src/components/custom/ src/components/common/   → wrappers, then shared components
3. read one neighbour of what you're building:
     a page / data view → src/features/home/HomePage.tsx
     a small card       → src/features/home/components/SummaryCard/SummaryCard.tsx
     anything shared    → the closest component in src/components/common/
4. read the doc for the area (it auto-loads when you open its files): docs/components.md, docs/modules/<module>.md
```

**Trust the `ls`, not memory.** The shared set grows. If something already exists for what you need, use it.

You may only use CSS variables that exist in `_tokens.scss`. A hallucinated `var(--x)` silently renders as nothing.

## Step 1: Pick the folder

| What | Where |
|------|-------|
| Used by one feature | `src/features/<module>/components/<Name>/` |
| A feature's routed page | `src/features/<module>/<Module>Page.tsx` (+ export it from the feature's `index.ts`) |
| Shared app component | `src/components/common/<Name>/` |
| Themed AntD wrapper | `src/components/custom/<Name>/` |
| App chrome | `src/components/layout/<Name>/` |

`PascalCase`, one folder per component, `.tsx` + `.module.scss` together. Start feature-local; move to `src/components/common/` only when a second feature needs it. A brand-new product area is the **add-module** skill, not this one.

## Step 2: Write `<Name>.module.scss`

```scss
.root {
  display: flex;
  gap: var(--spacing-3);

  @include up('md') {
    gap: var(--spacing-4);
  }
}

.title {
  font-weight: var(--font-weight-semibold);
}

.isActive {
  color: var(--color-primary);
}
```

**Rules and why:**
- CSS Modules, camelCase class names, root class `.root`. Hashing scopes styles, so no BEM prefixes are needed.
- Colours → `var(--color-*)`. A raw hex duplicates a token and won't follow a theme change.
- Spacing/size → `var(--spacing-*)` / `var(--radius-*)` / `rem`. `px` only for 1–2px hairlines.
- `up()`, `below()`, `truncate`, `focus-ring`, `touch-target`, `content-width`, `visually-hidden` and `$z-*` are **auto-injected**. Never `@use` them.
- AntD overrides: theme tokens in `src/styles/theme.ts` first. If SCSS is unavoidable, scope it: `.root :global(.ant-card-body) { … }`.

## Step 3: Write `<Name>.tsx`

```tsx
'use client'

import { Card } from 'antd'
import type { FC } from 'react'
import Button from '@/components/custom/Button/Button'
import { PATHS } from '@/config/routes'
import { Link } from '@/platform/router'
import styles from './<Name>.module.scss'

interface <Name>Props {
  title: string
}

const <Name>: FC<<Name>Props> = ({ title }) => {
  return <Card className={styles.root}>…</Card>
}

export default <Name>
```

**Rules and why:**
- `'use client'` on line 1: required by the Next stack, harmless in Vite; keeps every component portable.
- `const Name: FC<Props>` with a **default export**, `<Name>Props` above it. Uniformity makes files scannable.
- **Never import from `next/*` or `react-router`.** Navigation is `Link` / `useNavigate` / `usePathname` / `useParams` / `useSearchParams` from `@/platform/router`; paths come from `PATHS`. ESLint blocks the framework imports.
- **Never import a wrapped primitive from antd:** `Button`, `Input`, `Select`, `Form`, `Modal` come from `@/components/custom/`, toasts from `useToast()`. `ls src/components/custom/` first: the set grows. Other AntD components (`Card`, `Table`, `Result`, `Tag`, …) are imported from `antd` directly.
- Inside a feature, import siblings relatively (`./hooks/useX`); another feature only through `@/features/<name>`.
- Async user actions use `useTransition`, never a bare `async onClick`: it gives a real pending state and prevents double submits.
- Handlers are `handleX`. Local `useState` for modal/drawer visibility is correct; don't introduce a store.
- No `style={{ }}` unless the value is genuinely dynamic.
- Add `data-testid` (kebab-case) to containers e2e will need, and record it in `docs/testing-contract.md`.

## Step 3b: If it renders fetched data

Never fetch in a component. The path is **page → hook → service** (see **add-service**). Wrap output in `PageState`:

```tsx
const { data, error, loading, reload } = useThings()
const items = data ?? []

<PageState
  loading={loading}
  error={error}
  isEmpty={items.length === 0}
  emptyTitle="No projects yet"
  emptyDescription="Create one to get started."
  emptyAction={<Button type="primary" onClick={handleCreate}>New project</Button>}
  onRetry={reload}
>
  {/* success */}
</PageState>
```

**The trap:** `useAsyncData` keys on the fetcher's identity. The domain hook must `useCallback` the fetcher with primitive deps, or the screen re-fetches forever.

## Step 3c: If it's a form

```tsx
const [form] = Form.useForm<Values>()
const [isPending, startSave] = useTransition()
const { showSuccess, showServiceError } = useToast()

const handleFinish = (values: Values) => {
  startSave(async () => {
    const result = await ThingService.create(values)
    if (!result.success) {
      showServiceError(result.error)
      return
    }
    showSuccess('Saved')
  })
}

<Form<Values> form={form} disabled={isPending} onFinish={handleFinish}>
  <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter a name' }]}>
    <Input />
  </Form.Item>
  <Button type="primary" htmlType="submit" loading={isPending}>Save</Button>
</Form>
```

- `Form` already defaults to vertical layout without the required-mark.
- Submit button sits outside any `Form.Item`.
- **Mirror server validation in the form.** Validation and conflict messages from the API reach users verbatim; client rules catch them first with better copy.

## Step 4: Verify before reporting done

```
[ ] <Name>.tsx + <Name>.module.scss, same casing, own folder, right location (Step 1)
[ ] 'use client' first line; const Name: FC<Props> + default export
[ ] No next/* or react-router imports; navigation via @/platform/router; paths via PATHS
[ ] No antd Button/Input/Select/Form/Modal/message imports
[ ] Every var(--token) exists in _tokens.scss; no hex; no px spacing; no @use of core
[ ] No style={{ }} without a dynamic reason
[ ] Async actions in useTransition; feedback via useToast()
[ ] No fetch/api call in the component; data view wrapped in PageState
[ ] useAsyncData fetcher memoised with primitive deps
[ ] New page exported from the feature's index.ts and routed (docs/platform.md)
[ ] New data-testid recorded in docs/testing-contract.md
[ ] The module's doc updated (new component, prop, route, test id)
[ ] Works at 375px and desktop width
```

Then the shared gate:

```bash
npm run check
```

## Related skills

- It reads or writes data → **add-service**
- A whole new product area or route → **add-module**
- Changing an existing component → **edit-component**
- Reviewing a file → **lint-audit**
