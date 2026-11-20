import { expect, test, type Page } from '@playwright/test';

// Адаптив для всех страниц разом (CLAUDE.md, «Интерфейс»): на 360 px нет горизонтальной
// прокрутки и текста мельче 14 px. Страницы репетиторов и политик – из ссылок главной, не из списка.
test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, 'needs JavaScript to read styles');

async function pages(page: Page): Promise<string[]> {
  await page.goto('/');
  // Страницы репетиторов и документы из подвала (политики).
  const linked = await page
    .locator('a[href^="/tutors/"], #footer-documents ~ * a')
    .evaluateAll((links) =>
      links.map((link) => new URL(link.getAttribute('href') ?? '', location.href).pathname),
    );
  // Страница 404 по ссылкам не найти – её адрес задан явно.
  return ['/', ...new Set(linked), '/no-such-page'];
}

for (const width of [360, 768, 1024, 1440]) {
  test(`every page fits ${width} px and has no text smaller than 14 px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });

    for (const path of await pages(page)) {
      await page.goto(path);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path}: horizontal overflow`).toBeLessThanOrEqual(0);

      const tiny = await page.evaluate(() =>
        [...document.body.querySelectorAll<HTMLElement>('*')]
          .filter(
            (node) =>
              node.checkVisibility() &&
              [...node.childNodes].some(
                (child) =>
                  child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim() !== '',
              ) &&
              Number.parseFloat(getComputedStyle(node).fontSize) < 14,
          )
          .map((node) => `${node.tagName.toLowerCase()}: ${node.textContent.trim().slice(0, 40)}`),
      );
      expect(tiny, `${path}: text smaller than 14 px`).toEqual([]);
    }
  });
}
