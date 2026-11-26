import { expect, test, type Page } from '@playwright/test';

// Cookie-баннер, счётчики и CSP – ТЗ главной, «Глобальные элементы» и блок 10; ADR-056.
// Счётчики работают только на боевом адресе, поэтому здесь проверяется, что они не грузятся.

const banner = (page: Page) => page.locator('[data-cookie-banner]');

test('every page is sent with a strict content security policy', async ({ request }) => {
  for (const path of ['/', '/tutors/andrei', '/cookies']) {
    const response = await request.get(path);
    const csp = response.headers()['content-security-policy'] ?? '';
    expect(csp, path).toContain("default-src 'self'");
    expect(csp, path).toContain("object-src 'none'");
    expect(csp, path).toContain("frame-ancestors 'none'");
    expect(csp, path).not.toContain('unsafe-eval');
  }
});

test.describe('with JavaScript', () => {
  test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, 'the banner needs JavaScript');

  test('asks once, remembers the choice and reopens from the footer', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (message) => {
      if (/Content.Security.Policy/i.test(message.text())) violations.push(message.text());
    });
    await page.goto('/');

    await expect(banner(page)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Политике cookie' })).toHaveAttribute(
      'href',
      '/cookies',
    );
    await page.getByRole('button', { name: 'Только необходимые' }).click();
    await expect(banner(page)).toHaveCount(0);

    await page.goto('/tutors/andrei');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(banner(page)).toHaveCount(0);

    await page.getByRole('contentinfo').getByRole('button', { name: 'Настройки cookie' }).click();
    await expect(banner(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Принять' })).toBeFocused();
    await page.getByRole('button', { name: 'Принять' }).click();
    await expect(banner(page)).toHaveCount(0);

    // Не боевой адрес: ни Метрики, ни Umami, и CSP ничего не заблокировала.
    expect(await page.evaluate(() => typeof window.ym)).toBe('undefined');
    await expect(page.locator('script[src*="mc.yandex"]')).toHaveCount(0);
    expect(violations).toEqual([]);
  });

  test('hides the bottom bar while the banner is shown', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'the bottom bar is shown below 1024 px');
    await page.goto('/');
    // Ниже первого экрана и блока репетиторов – там панель видна.
    await page.evaluate(() => document.getElementById('prices')?.scrollIntoView());
    const bottomBar = page.locator('[data-visible]').filter({ hasText: 'Выбрать репетитора' });

    await expect(banner(page)).toBeVisible();
    // Панель уже должна быть показана по прокрутке – её прячет только баннер.
    await expect(bottomBar).toHaveCount(1);
    await expect(bottomBar).toBeHidden();

    await page.getByRole('button', { name: 'Принять' }).click();
    await expect(bottomBar).toBeVisible();
  });
});

test('without JavaScript there is no banner and no cookie settings button', async ({
  page,
  javaScriptEnabled,
}) => {
  test.skip(javaScriptEnabled, 'checks the page without JavaScript');
  await page.goto('/');

  await expect(page.getByRole('contentinfo').getByText('Политика cookie')).toBeVisible();
  await expect(banner(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Настройки cookie' })).toHaveCount(0);
});
