import { platformEnv } from '@/platform/env'

/**
 * The only place configuration is read. Required values are validated once, at startup,
 * so a missing variable shows the MissingConfig screen instead of failing deep in a request.
 *
 * Adding a variable: add it to PlatformEnv (src/types/platform.ts), to BOTH stack-specific
 * src/platform/env.ts readers' literal reads, to .env.example, and here.
 */

const REQUIRED_KEYS = ['API_URL'] as const satisfies readonly (keyof typeof platformEnv.values)[]

const clean = (value: string | undefined): string => value?.trim() ?? ''

export const env = {
  apiUrl: clean(platformEnv.values.API_URL).replace(/\/+$/, ''),
  appName: clean(platformEnv.values.APP_NAME) || 'App',
  isDev: platformEnv.isDev,
}

export interface EnvValidation {
  valid: boolean
  /** Full variable names, prefix included, ready to show to a developer. */
  missing: string[]
}

export const validateEnv = (): EnvValidation => {
  const missing = REQUIRED_KEYS.filter((key) => clean(platformEnv.values[key]) === '').map(
    (key) => `${platformEnv.prefix}${key}`,
  )
  return { valid: missing.length === 0, missing }
}
