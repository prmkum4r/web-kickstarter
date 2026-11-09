import { useCallback, useEffect, useState } from 'react'
import type { AppError, ServiceResult } from '@/lib/api/errors'

export interface AsyncData<T> {
  data: T | null
  error: AppError | null
  loading: boolean
  reload: () => void
}

/** What the last settled request produced, plus which request it was for. */
interface Snapshot<T> {
  fetcher: unknown
  token: number
  data: T | null
  error: AppError | null
}

/**
 * Bridges a service call to the Loading / Error / Empty / Success states every data screen renders.
 *
 * `fetcher` identity is the cache key: wrap it in `useCallback` with primitive deps in the domain
 * hook, or every render re-fetches. `loading` is derived from whether the settled snapshot matches
 * the current request, which keeps the effect free of synchronous setState.
 */
export const useAsyncData = <T>(
  fetcher: () => Promise<ServiceResult<T>>,
  options: { enabled?: boolean } = {},
): AsyncData<T> => {
  const enabled = options.enabled ?? true
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null)
  const [token, setToken] = useState(0)

  const reload = useCallback(() => setToken((current) => current + 1), [])
  const isCurrent = snapshot !== null && snapshot.fetcher === fetcher && snapshot.token === token

  useEffect(() => {
    if (!enabled || isCurrent) return

    // Guards against a slow response landing after the inputs changed.
    let active = true

    void fetcher().then((result) => {
      if (!active) return
      setSnapshot({
        fetcher,
        token,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
      })
    })

    return () => {
      active = false
    }
  }, [fetcher, enabled, token, isCurrent])

  return {
    // Keep showing the previous data while a reload is in flight.
    data: enabled ? (snapshot?.data ?? null) : null,
    error: isCurrent ? snapshot.error : null,
    loading: enabled && !isCurrent,
    reload,
  }
}
