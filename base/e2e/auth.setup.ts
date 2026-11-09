import { test as setup } from '@playwright/test'
import { AUTH_FILE } from './constants'

/**
 * Signs in once through the real UI and saves the session for every signed-in spec.
 *
 * The app has no sign-in yet, so this only saves an anonymous session. When auth lands,
 * replace the body with the real flow and add E2E_EMAIL / E2E_PASSWORD to .env.example:
 *
 *   await page.goto('/login')
 *   await page.getByLabel('Email').fill(requireEnv('E2E_EMAIL'))
 *   await page.getByLabel('Password').fill(requireEnv('E2E_PASSWORD'))
 *   await page.getByRole('button', { name: 'Sign in' }).click()
 *   await expect(page.getByTestId('app-header')).toBeVisible()
 */
setup('authenticate', async ({ page }) => {
  await page.goto('/')
  await page.context().storageState({ path: AUTH_FILE })
})
