import { expect, test } from '@playwright/test'

test('unknown routes show the not-found page with a way home', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')

  await expect(page.getByTestId('not-found')).toBeVisible()
  await page.getByRole('button', { name: 'Back to home' }).click()
  await expect(page).toHaveURL('/')
})
