import type { AnchorHTMLAttributes, ReactElement } from 'react'

// The stack-neutral API both src/platform/router.tsx implementations must satisfy.
// Feature code depends on this, never on next/* or react-router.

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
  replace?: boolean
}

export type Navigate = (to: string, options?: { replace?: boolean }) => void

export type ReadonlySearchParams = Pick<URLSearchParams, 'get' | 'getAll' | 'has' | 'toString' | 'entries' | 'keys' | 'forEach'>

export interface PlatformRouter {
  Link: (props: LinkProps) => ReactElement
  useNavigate: () => Navigate
  usePathname: () => string
  useParams: <T extends Record<string, string>>() => Partial<T>
  useSearchParams: () => ReadonlySearchParams
}

/** Raw env values; src/platform/env.ts reads them with the stack's prefix. */
export interface PlatformEnv {
  /** e.g. NEXT_PUBLIC_ or VITE_ — used to name variables in error messages. */
  prefix: string
  values: {
    API_URL: string | undefined
    APP_NAME: string | undefined
  }
  isDev: boolean
}
