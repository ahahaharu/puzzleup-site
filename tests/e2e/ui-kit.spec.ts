import { expect, test } from '@playwright/test';

test('UI kit showcase is not served in production', async ({ page }) => {
  const response = await page.goto('/dev/ui');

  expect(response?.status()).toBe(404);
});
