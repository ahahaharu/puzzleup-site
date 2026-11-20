import { expect, test } from '@playwright/test';

// Служебные страницы – ТЗ страницы репетитора, раздел 7: 404, `/privacy` и `/cookies`.

test.describe('404', () => {
  test('an unknown address answers 404, is hidden from search and leads back', async ({ page }) => {
    const response = await page.goto('/no-such-page');

    expect(response?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Этой детали здесь нет');

    await page.getByRole('main').getByRole('link', { name: 'Выбрать репетитора' }).click();
    await expect(page).toHaveURL(/\/\?entry=404#tutors$/);
  });

  test('buttons stack full width on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/no-such-page');
    const main = page.getByRole('main');

    const home = await main.getByRole('link', { name: 'На главную' }).boundingBox();
    const cta = await main.getByRole('link', { name: 'Выбрать репетитора' }).boundingBox();
    expect(home && cta && cta.y > home.y && home.width === cta.width).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  });
});

test.describe('policies', () => {
  test('the privacy policy is indexed and links to its sections', async ({ page, isMobile }) => {
    const response = await page.goto('/privacy');

    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Политика обработки персональных данных',
    );

    // Телефон: оглавление свёрнуто над текстом; десктоп – слева.
    if (isMobile) await page.getByText('Содержание', { exact: true }).last().click();
    const toc = page.getByRole('navigation', { name: 'Содержание' });
    const links = toc.getByRole('link');
    await expect(links.first()).toBeVisible();
    for (const href of await links.evaluateAll((items) =>
      items.map((item) => item.getAttribute('href')),
    )) {
      await expect(page.locator(`h2${href}`)).toHaveCount(1);
    }

    await toc.getByRole('link', { name: '4. Права субъекта' }).click();
    await expect(page).toHaveURL(/\/privacy#prava-subekta$/);
    await expect(page.locator('#prava-subekta')).toBeInViewport();
  });

  test('the current section is highlighted in the table of contents', async ({
    page,
    isMobile,
    javaScriptEnabled,
  }) => {
    test.skip(isMobile || !javaScriptEnabled, 'desktop table of contents with JavaScript');
    await page.goto('/privacy#prava-subekta');

    await expect(
      page.getByRole('navigation', { name: 'Содержание' }).getByRole('link', {
        name: '4. Права субъекта',
      }),
    ).toHaveAttribute('aria-current', 'location');
  });

  test('the cookie policy uses the same template', async ({ page }) => {
    const response = await page.goto('/cookies');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Политика cookie');
    await expect(page.getByText(/^Действует с /)).toBeVisible();
  });
});
