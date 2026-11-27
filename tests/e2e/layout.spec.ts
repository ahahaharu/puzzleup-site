import { expect, test } from '@playwright/test';

// Каркас страницы: ссылка «к содержанию», шапка, мобильное меню, подвал, нижняя панель.

test('skip link is the first Tab stop and moves focus to the content', async ({
  page,
  browserName,
}) => {
  // В WebKit Tab по умолчанию не останавливается на ссылках (настройка Safari).
  test.skip(browserName === 'webkit', 'Safari skips links on Tab by default');
  await page.goto('/');

  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Перейти к содержанию' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('footer shows navigation, documents and the site disclosure with requisites', async ({
  page,
}) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');

  await expect(
    footer.getByRole('link', { name: 'Политика обработки персональных данных' }),
  ).toHaveAttribute('href', '/privacy');
  await expect(footer.getByRole('link', { name: 'Андрей' })).toHaveAttribute(
    'href',
    '/tutors/andrei',
  );
  await expect(footer.getByText(/PuzzleUp – общий сайт .+ репетиторов\./)).toBeVisible();
  await expect(
    footer.getByText('Не является организацией, юридическим лицом или ИП.'),
  ).toBeVisible();
  const size = await footer
    .getByText(/Не является организацией/)
    .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(size).toBeGreaterThanOrEqual(14);
});

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop layout only');

  test('shows navigation in the header and no bottom bar', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('banner').getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Меню' })).toBeHidden();
    // Вне содержимого страницы кнопка одна – в шапке; кнопка первого экрана не в счёт.
    await expect(
      page.getByRole('link', { name: 'Выбрать репетитора' }).and(page.locator(':not(main *)')),
    ).toHaveCount(1);
  });
});

test.describe('mobile menu', () => {
  test.skip(({ isMobile }) => !isMobile, 'burger is shown below 1024 px');

  test('opens over the page, locks scroll and closes with the close button', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Меню' }).click();
    const menu = page.getByRole('dialog', { name: 'Меню' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Написать Андрею в Telegram' })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
      'hidden',
    );

    await menu.getByRole('button', { name: 'Закрыть меню' }).click();
    await expect(menu).toBeHidden();
  });

  test('closes with Escape', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Меню' }).click();
    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Меню' })).toBeHidden();
  });
});
