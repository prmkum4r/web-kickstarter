'use client'

import { useCallback } from 'react'
import {
  Link as RouterLink,
  useLocation,
  useNavigate as useRouterNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from 'react-router'
import type { PlatformRouter } from '@/types/platform'

export const Link: PlatformRouter['Link'] = ({ to, replace, ...rest }) => <RouterLink to={to} replace={replace} {...rest} />

export const useNavigate: PlatformRouter['useNavigate'] = () => {
  const navigate = useRouterNavigate()
  return useCallback((to, options) => void navigate(to, { replace: options?.replace }), [navigate])
}

export const usePathname: PlatformRouter['usePathname'] = () => useLocation().pathname

export const useParams = (<T extends Record<string, string>>() => useRouterParams() as Partial<T>) as PlatformRouter['useParams']

// Read-only to match Next; change the query with useNavigate().
export const useSearchParams: PlatformRouter['useSearchParams'] = () => useRouterSearchParams()[0]
