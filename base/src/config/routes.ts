// Every route path. Components never contain a path literal: use PATHS or a build…Path helper.
export const PATHS = {
  HOME: '/',
} as const

export type AppPath = (typeof PATHS)[keyof typeof PATHS]

// For dynamic routes, pair the pattern with a builder, e.g.
//   ITEM_DETAIL: '/items/:id'
//   export const buildItemPath = (id: string) => `/items/${encodeURIComponent(id)}`
// Next.js folders use [id]; the pattern here stays in :id form (see docs/platform.md).
