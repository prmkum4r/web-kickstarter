---
name: lint-audit
description: Audits existing source files for design-system, architecture and code-standard violations, read-only. Use whenever asked to review, audit, check standards, find violations, or sanity-check a file or folder under src/. Trigger on "check this file", "audit the component", "does this follow our conventions", "find violations", "review for issues", "is this correct".
---

# Lint audit

A read-only review against the project's actual conventions. ESLint already enforces the boundaries (framework imports, env access, AntD wrappers, feature internals); this catches what a linter can't see: a hard-coded colour, a request in a component, a fetcher that re-fetches forever, a doc that no longer matches.

**Report, don't fix.** Offer at the end.

## Step 0: Pre-flight reads

```
1. read src/styles/_tokens.scss                          → the real token list
2. ls src/components/custom/ src/components/common/      → wrappers, then shared components
3. read CLAUDE.md "Hard rules" and the area's doc         → the rules you audit against
4. npm run lint                                           → don't re-report what ESLint already reports; cite it once
```

Every claim must be checkable. Don't invent rules the project docs and skills don't state.

## Step 1: Read the target files in full

Including the `.module.scss` beside each `.tsx`. A component and its stylesheet are one unit.

## Step 2: Run the checklist

### Structure
- [ ] Folder-per-component: `<Name>/<Name>.tsx` + `<Name>.module.scss`, matching casing
- [ ] Right location: feature-local unless 2+ features use it (docs/architecture.md § Folder map)
- [ ] `'use client'` first line; `const Name: FC<Props>` + default export; `<Name>Props` above it
- [ ] Feature exposes only what others need through `index.ts`

### Styling
- [ ] No hex/rgb duplicating a token; every `var(--token)` exists in `_tokens.scss`
- [ ] No `px` for padding, margin or font-size (1–2px hairlines are fine)
- [ ] CSS Modules with camelCase classes; no global classes outside `globals.scss`
- [ ] No `@use` of core partials (auto-injected); AntD overrides via `theme.ts` or scoped `:global(.ant-…)`
- [ ] No `style={{ }}` without a genuinely dynamic value; no `!important`

### React
- [ ] Async actions in `useTransition`; feedback via `useToast()`; no `console.log` as error handling
- [ ] Shared components reused where they exist (`PageState`, …)
- [ ] Local `useState` for modal visibility is **correct**: flag an introduced store, not this
- [ ] Navigation via `@/platform/router` + `PATHS`; no path literals

### Data
- [ ] No `fetch` / `api` call in a component: page → hook → service
- [ ] Service methods return `ServiceResult<T>` with user-facing `fallbackMessage`
- [ ] `useAsyncData` fetcher wrapped in `useCallback` with **primitive** deps
- [ ] Path params encoded; API quirks mapped in the service, not in components

### States and copy
- [ ] Data views handle loading / error / empty / success via `PageState`
- [ ] Empty states have real copy (and a CTA where one makes sense)
- [ ] Forms mirror server validation

### Accessibility and mobile
- [ ] Semantic elements; no clickable `<div>`; icon-only buttons have `aria-label`
- [ ] Form fields have labels; decorative icons are `aria-hidden`
- [ ] No horizontal overflow at 375px; touch targets ≥ `--touch-target-min`

### Docs and tests
- [ ] The module doc describes this code (components, flow, contracts, test hooks)
- [ ] `data-testid`s used by e2e are listed in `docs/testing-contract.md`
- [ ] Services and pure logic have unit tests next to them

## Step 3: Report

Group by severity, cite `file:line`, and say **why** each one matters. A violation without a consequence reads as pedantry.

```
## src/features/projects/ProjectsPage.tsx

### Will cause a bug
- L42 inline arrow passed to useAsyncData. Identity is the cache key, so this re-fetches every render.
- L58 `api.get('/projects')` called in the component. Bypasses the service, so its errors reach the UI un-normalised and the call can't be reused.

### Inconsistent with the design system
- ProjectsPage.module.scss L12 `#4f46e5` duplicates `var(--color-primary)`; it won't follow a theme change.

### Docs drift
- docs/modules/projects.md lists `ProjectCard` props `title, owner`; the component now takes `project`.

### Worth noting
- L70 renders `project.status` raw, so users see `archived` in lowercase.
```

If a file is clean, say so plainly rather than manufacturing findings.

## Step 4: Offer to fix

End with a short offer naming what you'd change. Applying fixes is **edit-component**, and its rule about not rewriting untouched code still holds.

## Related skills

- Applying fixes → **edit-component**
- Docs drift across the whole repo → **sync-docs**
- Data-layer conventions in depth → **add-service**
