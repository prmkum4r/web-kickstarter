---
name: add-service
description: Adds or changes data access in this codebase — a service method, a domain hook, an API endpoint integration or a mutation. Use whenever asked to fetch, load, list, create, update or delete anything, wire a screen to an API, or integrate a new endpoint. Trigger on "load the X", "save the Y", "add a service for", "call the API", "integrate this endpoint", "wire this up", or any task that touches features/*/services/, features/*/hooks/, src/hooks/ or src/lib/api/.
---

# Add a service

The data layer is deliberately thin and strictly layered:

```
<Module>Page → use<Thing>() (useAsyncData) → <Module>Service.method() → api.get/post/… → fetch
```

A component never calls `api` or `fetch`. That one rule lets an endpoint change in one place, keeps error handling uniform, and keeps HTTP details out of JSX.

## Step 0: Pre-flight reads

```
1. read src/lib/api/errors.ts      → ServiceResult, AppError, ok/fail, how statuses map to codes
2. read src/lib/api/client.ts      → api.get/post/put/patch/delete, RequestOptions
3. read src/features/home/services/home.service.ts + .test.ts   → the reference service + test
4. read src/features/home/hooks/useHomeSummary.ts               → how a hook wraps a service
5. read the module doc (docs/modules/<module>.md)               → existing data contracts
```

If the backend has an API spec (OpenAPI/Swagger), read the endpoint's request/response schema there rather than guessing field names.

## Step 1: Types before requests

Domain types live in `src/features/<module>/types.ts` (or `src/types/` if 2+ features share them), never inside the service file. Type what the API **actually returns**: if a field is a fixed set of strings, make it a union.

```ts
export type ProjectStatus = 'draft' | 'active' | 'archived'

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  createdAt: string
}
```

If the API shape is awkward (snake_case, nested envelopes), map it **in the service** so the rest of the app sees clean domain types.

## Step 2: Write the service method

File: `src/features/<module>/services/<module>.service.ts`, exporting one `<Module>Service` object.

```ts
import { api } from '@/lib/api/client'
import { ok, type ServiceResult } from '@/lib/api/errors'
import type { Project } from '../types'

interface ProjectListResponse {
  items: Project[]
  total: number
}

export const ProjectService = {
  list: (page: number): Promise<ServiceResult<ProjectListResponse>> =>
    api.get('/projects', { query: { page }, fallbackMessage: "We couldn't load your projects." }),

  create: (input: { name: string }): Promise<ServiceResult<Project>> =>
    api.post('/projects', { body: input, fallbackMessage: "We couldn't create that project." }),

  async getName(id: string): Promise<ServiceResult<string>> {
    const result = await api.get<Project>(`/projects/${encodeURIComponent(id)}`, {
      fallbackMessage: "We couldn't load that project.",
    })
    return result.success ? ok(result.data.name) : result
  },
}
```

**Why these rules:**
- **Everything returns `ServiceResult<T>`**: `{ success: true, data }` or `{ success: false, error }`. `api` never throws, so neither does a service.
- **`fallbackMessage` is user-facing copy.** Write the sentence a user should read when something unexpected fails, not a developer note.
- **Encode path params** (`encodeURIComponent`). Query params go through `query`, which skips `undefined`.
- **Validation (400/422) and conflict (409) messages from the server are shown verbatim.** Ask the backend for readable messages, and mirror its validation in forms so most errors never reach the server.
- One product action that needs several requests where a partial failure leaves bad state belongs in **one backend endpoint**. Raise it rather than chaining requests in the client.

## Step 3: Test it

Next to the service: `<module>.service.test.ts`. Stub `fetch`, assert the request and the result:

```ts
const fetchMock = vi.fn<typeof fetch>(async () => Response.json({ items: [], total: 0 }))
vi.stubGlobal('fetch', fetchMock)

const result = await ProjectService.list(2)

expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/projects\?page=2$/)
expect(result).toEqual({ success: true, data: { items: [], total: 0 } })
```

Cover the success path, any mapping you wrote, and the failure copy. `afterEach(() => vi.unstubAllGlobals())`.

## Step 4: Wrap reads in a hook

`src/features/<module>/hooks/use<Thing>.ts` (or `src/hooks/` if shared):

```ts
export const useProjects = (page: number) => {
  const fetcher = useCallback(() => ProjectService.list(page), [page])
  return useAsyncData(fetcher)
}

export const useProject = (id: string | undefined) => {
  const fetcher = useCallback(() => ProjectService.get(id ?? ''), [id])
  return useAsyncData(fetcher, { enabled: Boolean(id) })
}
```

**`useAsyncData` keys its cache on the fetcher's identity.** An inline arrow re-fetches forever, so `useCallback` with **primitive** deps is load-bearing, not style. Destructure object params before the deps array.

After a write, call the read hook's `reload()`; there is no invalidation layer.

## Step 5: Wire into the UI

```tsx
const projects = useProjects(page)
const [isPending, startCreate] = useTransition()
const { showSuccess, showServiceError } = useToast()

const handleCreate = (name: string) => {
  startCreate(async () => {
    const result = await ProjectService.create({ name })
    if (!result.success) {
      showServiceError(result.error)
      return
    }
    showSuccess('Project created')
    projects.reload()
  })
}
```

Render reads through `PageState` (see **create-component**).

## Step 6: Mock data (until the backend exists)

With `API_URL=/mock`, `GET /x.json` serves `public/mock/x.json`. Add a fixture there for GET endpoints so the screen and e2e work without a backend, and note in the module doc that it's mock-backed.

## Step 7: Verify before reporting done

```
[ ] Types in the feature's types.ts (or src/types/); API quirks mapped in the service
[ ] <module>.service.ts exports <Module>Service; every method returns ServiceResult<T>
[ ] Every call has user-facing fallbackMessage copy; path params encoded
[ ] Service test covers success, mapping and failure copy
[ ] Read hook uses useCallback with primitive deps (+ enabled when an id may be missing)
[ ] No api/fetch call in a component; writes in useTransition with useToast feedback
[ ] Module doc's "Data contracts" table updated (method, endpoint, request, response)
```

```bash
npm run check
```

## Related skills

- Building the UI that calls this → **create-component**
- A new product area → **add-module**
- Changing an existing screen → **edit-component**
- Auditing → **lint-audit**
