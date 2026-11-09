<!-- Copy to docs/modules/<module>.md (the add-module skill does this). Delete sections that don't apply; keep it about what must stay true, not a changelog. -->
# <Module> — <route(s)>

One or two sentences: what this module is for, from the user's point of view.

## Flow

```
<PATHS.X> → <Module>Page → use<Thing>() → <Module>Service.<method>() → <METHOD> <endpoint>
```

## Files

| File | Role |
|------|------|
| `src/features/<module>/index.ts` | Public API (what other code may import) |
| `src/features/<module>/<Module>Page.tsx` | Page: states via `PageState`, actions via `useTransition` |
| `src/features/<module>/hooks/use<Thing>.ts` | Read hook over `useAsyncData` |
| `src/features/<module>/services/<module>.service.ts` | `<Module>Service`: every method returns `ServiceResult<T>` |
| `src/features/<module>/types.ts` | Domain types |

## Data contracts

| Method | Endpoint | Request | Response | Notes |
|--------|----------|---------|----------|-------|
| `getX` | `GET /x` | — | `X[]` | |

## Decisions and why

- Non-obvious choices a future change could accidentally undo, each with its reason.

## Test hooks

`data-testid`s and roles this module exposes to e2e. Mirror them in [testing-contract.md](../testing-contract.md).

## Not implemented / deviations

- Known gaps, placeholders, or deliberate differences from the design.
