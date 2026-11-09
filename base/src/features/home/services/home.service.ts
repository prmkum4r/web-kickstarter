import { api } from '@/lib/api/client'
import type { ServiceResult } from '@/lib/api/errors'
import type { HomeSummary } from '../types'

export const HomeService = {
  getSummary: (): Promise<ServiceResult<HomeSummary>> =>
    api.get<HomeSummary>('/home.json', { fallbackMessage: "We couldn't load your dashboard." }),
}
