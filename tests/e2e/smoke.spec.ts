import { expect, test } from '@playwright/test';

test('home page responds and shows the site disclosure', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  // Раскрытие в подвале входит в реквизиты (ADR-041): обе фразы есть, между ними – ФИО и УНП.
  const footer = page.getByRole('contentinfo');
  await expect(footer).toContainText('PuzzleUp – общий сайт независимых репетиторов.');
  await expect(footer).toContainText('Не является организацией, юридическим лицом или ИП.');
});
