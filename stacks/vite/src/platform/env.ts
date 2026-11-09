import type { PlatformEnv } from '@/types/platform'

// Only VITE_-prefixed values reach the browser bundle. Read them as literals so Vite can inline them.
export const platformEnv: PlatformEnv = {
  prefix: 'VITE_',
  values: {
    API_URL: import.meta.env.VITE_API_URL,
    APP_NAME: import.meta.env.VITE_APP_NAME,
  },
  isDev: import.meta.env.DEV,
}
