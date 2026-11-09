import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import { AUTH_FILE } from './e2e/constants'

// Same env files the app reads, so e2e config and credentials live in one place.
loadEnv({ path: ['.env.local', '.env'], quiet: true })

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for e2e. Set it in .env.local (see .env.example).`)
  return value
}

const baseURL = requireEnv('E2E_BASE_URL')
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(baseURL)

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Against a local URL, Playwright builds and serves the app itself (or reuses one already running).
  webServer: isLocal
    ? {
        command: 'npm run build && npm run preview',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
  projects: [
    // Signs in once and saves the session; the single point of failure for signed-in specs, so always retried.
    { name: 'setup', testMatch: /auth\.setup\.ts/, retries: 2 },
    {
      name: 'chromium-public',
      testMatch: /.*\.public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*\.public\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
    },
  ],
})
