import { useCallback } from 'react'
import { useAsyncData } from '@/hooks/useAsyncData'
import { HomeService } from '../services/home.service'

export const useHomeSummary = () => {
  // Stable fetcher: useAsyncData keys on its identity.
  const fetcher = useCallback(() => HomeService.getSummary(), [])
  return useAsyncData(fetcher)
}
