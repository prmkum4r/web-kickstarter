'use client'

import NextLink from 'next/link'
import {
  useParams as useNextParams,
  usePathname as useNextPathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation'
import { useCallback } from 'react'
import type { PlatformRouter } from '@/types/platform'

export const Link: PlatformRouter['Link'] = ({ to, replace, ...rest }) => <NextLink href={to} replace={replace} {...rest} />

export const useNavigate: PlatformRouter['useNavigate'] = () => {
  const router = useRouter()
  return useCallback((to, options) => (options?.replace ? router.replace(to) : router.push(to)), [router])
}

export const usePathname: PlatformRouter['usePathname'] = () => useNextPathname()

export const useParams = (<T extends Record<string, string>>() => useNextParams<T>()) as PlatformRouter['useParams']

// Next requires a <Suspense> boundary above any component that calls this (see docs/platform.md).
export const useSearchParams: PlatformRouter['useSearchParams'] = () => useNextSearchParams()
