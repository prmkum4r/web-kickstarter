# Home — /

The landing page. It is also the reference implementation of the data path (page → hook → service → API), so copy it when building a new module.

## Flow

```
PATHS.HOME → HomePage → useHomeSummary() → HomeService.getSummary() → GET {API_URL}/home.json
```

With the default `API_URL=/mock`, the request is served from `public/mock/home.json`.

## Files

| File | Role |
|------|------|
| `src/features/home/index.ts` | Public API: `HomePage` |
| `src/features/home/HomePage.tsx` | Title + subtitle from the API, stats grid inside `PageState` (empty state when `stats` is empty, retry on error) |
| `src/features/home/components/SummaryCard/` | One stat: AntD `Statistic` + optional hint |
| `src/features/home/hooks/useHomeSummary.ts` | `useAsyncData` over `HomeService.getSummary`, fetcher memoised with `useCallback` |
| `src/features/home/services/home.service.ts` | `HomeService.getSummary()`; fallback copy "We couldn't load your dashboard." |
| `src/features/home/services/home.service.test.ts` | Request path + failure copy |
| `src/features/home/types.ts` | `HomeSummary`, `HomeStat` |
| `public/mock/home.json` | Mock response |

## Data contracts

| Method | Endpoint | Response |
|--------|----------|----------|
| `getSummary` | `GET /home.json` | `{ title: string, subtitle: string, stats: { id, label, value: number, hint? }[] }` |

## Decisions and why

- The title falls back to "Home" while loading, so the `<h1>` exists before data arrives (e2e and screen readers rely on it).
- The grid is one column on mobile and three from `md`.

## Test hooks

`<h1>`, `data-testid="summary-card"` (one per stat). See [testing-contract.md](../testing-contract.md).

## Not implemented / deviations

- Mock data only. When a real backend exists, point `API_URL` at it and change the endpoint in `home.service.ts`.
