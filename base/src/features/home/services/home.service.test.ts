import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomeService } from './home.service'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('HomeService.getSummary', () => {
  it('requests /home.json and returns the summary', async () => {
    const summary = { title: 'Hi', subtitle: 'There', stats: [] }
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json(summary))
    vi.stubGlobal('fetch', fetchMock)

    const result = await HomeService.getSummary()

    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/home\.json$/)
    expect(result).toEqual({ success: true, data: summary })
  })

  it('returns domain copy when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })))

    const result = await HomeService.getSummary()

    expect(result).toMatchObject({ success: false, error: { message: "We couldn't load your dashboard." } })
  })
})
