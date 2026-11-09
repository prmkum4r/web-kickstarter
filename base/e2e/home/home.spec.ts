import { expect, test } from '@playwright/test'

test.describe('home', () => {
  test('renders the summary from the API', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('app-header')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByTestId('summary-card')).not.toHaveCount(0)
  })
})
