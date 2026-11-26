import { expect, test } from '@playwright/test';

// Счётчики и CSP – ТЗ главной, «Глобальные элементы»; ADR-056, ADR-057. На запуске Метрики нет
// (в `site.json` нет `analytics.metrika`): cookie сайт не ставит, баннера и «Настроек cookie» нет.
// Сам баннер проверяют компонентные тесты src/features/analytics.

test('every page is sent with a strict content security policy', async ({ request }) => {
  for (const path of ['/', '/tutors/andrei', '/cookies']) {
    const response = await request.get(path);
    const csp = response.headers()['content-security-policy'] ?? '';
    expect(csp, path).toContain("default-src 'self'");
    expect(csp, path).toContain("object-src 'none'");
    expect(csp, path).toContain("frame-ancestors 'none'");
    expect(csp, path).not.toContain('unsafe-eval');
    // Без Метрики домены Яндекса не разрешены.
    expect(csp, path).not.toContain('yandex');
  }
});

test('without Metrika there is no cookie banner, no settings button and no cookies', async ({
  page,
  context,
}) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content.Security.Policy/i.test(message.text())) violations.push(message.text());
  });

  for (const path of ['/', '/tutors/andrei']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-cookie-banner]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Настройки cookie' })).toHaveCount(0);
  }
  await expect(page.getByRole('contentinfo').getByText('Политика cookie')).toBeVisible();

  await expect(page.locator('script[src*="mc.yandex"]')).toHaveCount(0);
  expect(await context.cookies()).toEqual([]);
  expect(violations).toEqual([]);
});
