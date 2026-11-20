import { expect, test } from '@playwright/test';

// Блок «Репетиторы» – ТЗ главной, блок 5. Проект no-js проверяет те же сценарии без JavaScript:
// без скрипта видны все репетиторы. Раскладки на 3 и 7+ карточек и фильтр с несколькими
// предметами проверяют компонентные тесты на выдуманных данных – в контенте их пока нет.

test('the block shows every tutor card with a way to sign up', async ({ page }) => {
  await page.goto('/');
  const block = page.locator('#tutors');

  await expect(block.getByRole('heading', { level: 2, name: 'Репетиторы' })).toBeVisible();
  await expect(block.getByText(/^Выберите, к кому записаться\./)).toBeVisible();

  const cards = block.locator('article');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  for (const card of await cards.all()) {
    await expect(card.getByRole('heading', { level: 3 })).toBeVisible();
    await expect(card.getByText(/Есть свободное время|Последние места|Мест нет/)).toBeVisible();
    await expect(card.getByText(/^\d+(,\d+)? BYN · 60 минут$/)).toBeVisible();
    await expect(
      card.getByRole('link', { name: /^(Записаться к|В лист ожидания к) / }),
    ).toHaveAttribute('href', /^\/tutors\/[a-z0-9-]+\?entry=tutors#lead$/);
    await expect(card.getByRole('link', { name: /^Подробнее об? / })).toHaveAttribute(
      'href',
      /^\/tutors\/[a-z0-9-]+$/,
    );
    await expect(card.getByRole('link', { name: /в Telegram$/ })).toHaveAttribute(
      'href',
      /^https:\/\/t\.me\//,
    );
    await expect(card.getByRole('link', { name: /в Viber$/ })).toHaveAttribute(
      'href',
      /^viber:\/\/chat\?number=/,
    );
  }
});

test('an unknown subject in the address still shows everyone', async ({ page }) => {
  await page.goto('/');
  const all = await page.locator('#tutors article').count();

  await page.goto('/?subject=unknown#tutors');
  await expect(page.locator('#tutors article')).toHaveCount(all);
});

test('the card name leads to the tutor page', async ({ page }) => {
  await page.goto('/');
  const name = page.locator('#tutors article h3 a').first();

  await expect(name).toHaveAttribute('href', /^\/tutors\/[a-z0-9-]+$/);
});

test('on a 360 px phone the block fits the screen and no text is smaller than 14 px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const block = page.locator('#tutors');
  await block.scrollIntoViewIfNeeded();

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  const sizes = await block.evaluate((section) =>
    [...section.querySelectorAll<HTMLElement>('h2, h3, p, a, span, button')]
      .filter((node) => node.checkVisibility() && node.textContent.trim() !== '')
      .map((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
  );
  expect(sizes.length).toBeGreaterThan(0);
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
});
