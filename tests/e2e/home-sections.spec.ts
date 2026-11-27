import { expect, test } from '@playwright/test';

import reviews from '../../content/reviews.json' with { type: 'json' };

// Блоки главной после «Репетиторов» – ТЗ главной, блоки 2–4 и 6–9. Проект no-js проверяет те же
// сценарии без JavaScript. Раскладки на другое число предметов, отзывов и репетиторов проверяют
// компонентные тесты на выдуманных данных.

// Пустой массив в JSON TypeScript выводит как never[] – тип задаёт объявление.
const allReviews: ReadonlyArray<{ consent: boolean }> = reviews;
const hasReviews = allReviews.some((review) => review.consent);

test('the blocks follow the order of the spec', async ({ page }) => {
  await page.goto('/');
  const ids = await page
    .locator('main > section[id]')
    .evaluateAll((sections) => sections.map((section) => section.id));

  expect(ids).toEqual([
    'top',
    'tutors',
    'situations',
    'how',
    'subjects',
    ...(hasReviews ? ['reviews'] : []),
    'prices',
    'faq',
    'about',
  ]);
});

test('the reviews block and its menu item come and go together', async ({ page }) => {
  await page.goto('/');
  const item = page.locator('footer').getByRole('link', { name: 'Отзывы', exact: true });

  await expect(page.locator('#reviews')).toHaveCount(hasReviews ? 1 : 0);
  await expect(item).toHaveCount(hasReviews ? 1 : 0);
});

test('situation links lead to the tutor form with the goal', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('#situations').getByRole('link', { name: /записаться на пробное/ });

  expect(await links.count()).toBeGreaterThan(0);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute(
      'href',
      /^\/tutors\/[a-z0-9-]+\?entry=situations&goal=(grades|exam9|ct|olymp)#lead$/,
    );
  }
});

test('every block button leads to the tutors block', async ({ page }) => {
  await page.goto('/');

  for (const id of ['situations', 'how', 'prices', 'faq']) {
    const button = page
      .locator(`#${id}`)
      .getByRole('link', { name: 'Выбрать репетитора', exact: true })
      .filter({ visible: true });
    await expect(button).toHaveAttribute('href', '#tutors');
  }
  await expect(
    page
      .locator('#subjects')
      .getByRole('link', { name: /^Выбрать репетитора по / })
      .first(),
  ).toHaveAttribute('href', /#tutors$/);
});

test('a question opens and closes', async ({ page }) => {
  await page.goto('/');
  const item = page.locator('#faq details').first();

  await expect(item).not.toHaveAttribute('open');
  await item.locator('summary').click();
  await expect(item).toHaveAttribute('open');
  await expect(item.locator('p').first()).toBeVisible();
  await item.locator('summary').click();
  await expect(item).not.toHaveAttribute('open');
});

test('the grades answer is built from the tutors', async ({ page }) => {
  await page.goto('/');
  const item = page.locator('#faq details', {
    has: page.getByText('С какими классами занимаются репетиторы?', { exact: true }),
  });

  await item.locator('summary').click();
  await expect(item.locator('p')).toHaveText(/^[А-ЯЁ][а-яё]+ – с [\d–\u2060]+\sклассом/);
});

// Раскрытие «не организация» – в реквизитах подвала (ADR-072, проверяют layout и smoke).
test('the about block describes the site', async ({ page }) => {
  await page.goto('/');
  const block = page.locator('#about');

  await expect(block.getByRole('heading', { level: 2, name: 'О сайте' })).toBeVisible();
  await expect(block.getByText(/^PuzzleUp – общий сайт/)).toBeVisible();
});

test('on a 360 px phone the new blocks fit and no text is smaller than 14 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  for (const id of ['situations', 'how', 'subjects', 'prices', 'faq', 'about']) {
    const sizes = await page
      .locator(`#${id}`)
      .evaluate((section) =>
        [...section.querySelectorAll<HTMLElement>('h2, h3, p, a, span, button, summary')]
          .filter((node) => node.checkVisibility() && node.textContent.trim() !== '')
          .map((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
      );
    expect(Math.min(...sizes), id).toBeGreaterThanOrEqual(14);
  }
});
