import { expect, test } from '@playwright/test';

test('home page responds and shows the site disclosure', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(
    page.getByText(
      'PuzzleUp – общий сайт независимых репетиторов. Не является организацией, юридическим лицом или ИП.',
    ),
  ).toBeVisible();
});
