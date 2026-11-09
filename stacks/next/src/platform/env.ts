import type { PlatformEnv } from '@/types/platform'

// Next only inlines NEXT_PUBLIC_ values into the browser bundle when they are read as literal
// `process.env.NEXT_PUBLIC_X` expressions — never destructure or index process.env here.
export const platformEnv: PlatformEnv = {
  prefix: 'NEXT_PUBLIC_',
  values: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  isDev: process.env.NODE_ENV !== 'production',
}
