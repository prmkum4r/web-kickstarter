import { REQUEST_TIMEOUT_MS } from '@/config/constants'
import { env } from '@/config/env'
import { fail, fromResponse, fromThrown, ok, type ServiceResult } from './errors'

type Query = Record<string, string | number | boolean | undefined>

export interface RequestOptions {
  /** User-facing copy for failures nothing more specific explains. Required: every call site owns its wording. */
  fallbackMessage: string
  query?: Query
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

const buildUrl = (path: string, query?: Query): string => {
  const url = `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const search = params.toString()
  return search ? `${url}?${search}` : url
}

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  return response.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text
}

/**
 * The only place the app calls fetch. Never throws: every outcome is a ServiceResult.
 * Services wrap this; components never call it directly.
 */
export const request = async <T>(method: string, path: string, options: RequestOptions): Promise<ServiceResult<T>> => {
  const { fallbackMessage, query, body, headers, signal } = options
  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    const data = await parseBody(response)
    if (!response.ok) return fail(fromResponse(response.status, data, fallbackMessage))
    return ok(data as T)
  } catch (thrown) {
    return fail(fromThrown(thrown, fallbackMessage))
  }
}

export const api = {
  get: <T>(path: string, options: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, options: RequestOptions) => request<T>('POST', path, options),
  put: <T>(path: string, options: RequestOptions) => request<T>('PUT', path, options),
  patch: <T>(path: string, options: RequestOptions) => request<T>('PATCH', path, options),
  delete: <T>(path: string, options: RequestOptions) => request<T>('DELETE', path, options),
}
