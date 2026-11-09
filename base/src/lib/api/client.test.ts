import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const mockFetch = (impl: () => Promise<Response>) => {
  const fetchMock = vi.fn<typeof fetch>(impl)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api client', () => {
  it('returns parsed data on success', async () => {
    mockFetch(async () => jsonResponse(200, { id: 1 }))
    const result = await api.get<{ id: number }>('/things/1', { fallbackMessage: 'Could not load' })
    expect(result).toEqual({ success: true, data: { id: 1 } })
  })

  it('serialises query params and skips undefined values', async () => {
    const fetchMock = mockFetch(async () => jsonResponse(200, []))
    await api.get('/things', { fallbackMessage: 'x', query: { page: 2, q: undefined, active: true } })
    expect(fetchMock.mock.calls[0]?.[0]).toMatch(/\/things\?page=2&active=true$/)
  })

  it('surfaces the server message for validation errors', async () => {
    mockFetch(async () => jsonResponse(422, { message: 'Name is required' }))
    const result = await api.post('/things', { fallbackMessage: 'x', body: {} })
    expect(result).toMatchObject({ success: false, error: { code: 'validation', message: 'Name is required', status: 422 } })
  })

  it('hides the server message for auth errors', async () => {
    mockFetch(async () => jsonResponse(401, { message: 'jwt malformed' }))
    const result = await api.get('/me', { fallbackMessage: 'x' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('auth')
      expect(result.error.message).not.toContain('jwt')
    }
  })

  it('uses the fallback message for unmapped server errors', async () => {
    mockFetch(async () => jsonResponse(500, { message: 'stack trace' }))
    const result = await api.get('/things', { fallbackMessage: "We couldn't load your things." })
    expect(result).toMatchObject({ success: false, error: { code: 'unexpected', message: "We couldn't load your things." } })
  })

  it('maps a failed fetch to a network error', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch')
    })
    const result = await api.get('/things', { fallbackMessage: 'x' })
    expect(result).toMatchObject({ success: false, error: { code: 'network' } })
  })

  it('treats 204 as success with null data', async () => {
    mockFetch(async () => new Response(null, { status: 204 }))
    const result = await api.delete('/things/1', { fallbackMessage: 'x' })
    expect(result).toEqual({ success: true, data: null })
  })
})
