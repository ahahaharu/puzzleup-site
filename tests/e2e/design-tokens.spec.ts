import { expect, test } from '@playwright/test';

test('design tokens showcase is not served in production', async ({ page }) => {
  const response = await page.goto('/dev/tokens');

  expect(response?.status()).toBe(404);
});

test.describe('global styles', () => {
  // Проверки читают вычисленные стили через page.evaluate – без JS это не работает.
  test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, 'needs JavaScript to read styles');

  test('page uses Golos Text on paper with the notebook grid', async ({ page }) => {
    await page.goto('/');

    const body = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return {
        fontFamily: style.fontFamily,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
      };
    });

    expect(body.fontFamily).toContain('Golos Text');
    expect(body.backgroundColor).toBe('rgb(247, 244, 236)');
    expect(body.backgroundImage).toContain('linear-gradient');
  });

  test('keyboard focus shows a 2 px focus ring with a 2 px offset', async ({ page, isMobile }) => {
    test.skip(isMobile, 'emulated touch devices do not move focus with Tab');
    await page.goto('/');
    // На странице пока нет интерактивных элементов – добавляем кнопку, стиль кольца глобальный.
    // Кнопка, а не ссылка: WebKit по умолчанию не переводит фокус на ссылки клавишей Tab.
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'focus probe';
      document.body.prepend(button);
    });

    await page.keyboard.press('Tab');
    const probe = page.getByRole('button', { name: 'focus probe' });
    await expect(probe).toBeFocused();

    const ring = await probe.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        style: style.outlineStyle,
        width: style.outlineWidth,
        color: style.outlineColor,
        offset: style.outlineOffset,
      };
    });
    expect(ring).toEqual({
      style: 'solid',
      width: '2px',
      color: 'rgb(58, 111, 216)',
      offset: '2px',
    });
  });

  test('anchor scrolling is smooth unless reduced motion is requested', async ({ page }) => {
    const scrollBehavior = () => getComputedStyle(document.documentElement).scrollBehavior;

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    expect(await page.evaluate(scrollBehavior)).toBe('smooth');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(scrollBehavior)).toBe('auto');
  });
});
