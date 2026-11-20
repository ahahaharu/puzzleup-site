import { expect, test } from '@playwright/test';

// Страница репетитора – ТЗ страницы репетитора, разделы 3–6, на настоящем контенте (оба репетитора
// принимают учеников). Статусы «Мест нет» и ушедший, отзывы и «Показать ещё» проверяют компонентные
// тесты на выдуманных данных. Проект no-js проверяет те же сценарии без JavaScript.

test('the page is static content with the blocks in order', async ({ page }) => {
  await page.goto('/tutors/andrei');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Андрей – репетитор по математике',
  );
  await expect(page).toHaveTitle(
    /^Андрей – репетитор по математике онлайн, 5–9 класс \| PuzzleUp$/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');

  const ids = await page
    .locator('main > section')
    .evaluateAll((sections) =>
      sections.map((section) => section.id || section.getAttribute('aria-labelledby')),
    );
  expect(ids.filter((id) => id !== 'reviews')).toEqual([
    'top',
    'about',
    'outside-title',
    'how',
    'lead',
    'more',
  ]);
});

test('the profile button leads to this tutor’s form', async ({ page }) => {
  await page.goto('/tutors/andrei');
  await page.locator('#top').getByRole('link', { name: 'Записаться к Андрею' }).click();

  await expect(page).toHaveURL(/\/tutors\/andrei\?entry=tutor_profile#lead$/);
  await expect(page.locator('#lead')).toBeInViewport();
});

test('the other tutor and the breadcrumbs lead out of the page', async ({ page }) => {
  await page.goto('/tutors/andrei');
  await page.locator('#more').getByRole('link', { name: 'Максим', exact: true }).click();
  await expect(page).toHaveURL(/\/tutors\/maxim$/);

  await page
    .getByRole('navigation', { name: 'Хлебные крошки' })
    .getByRole('link', { name: 'Репетиторы' })
    .click();
  await expect(page).toHaveURL(/\/#tutors$/);
});

test('an unknown tutor answers 404', async ({ page }) => {
  const response = await page.goto('/tutors/nobody');
  expect(response?.status()).toBe(404);
});

test('nothing scrolls sideways on a 360 px phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const slug of ['andrei', 'maxim']) {
    await page.goto(`/tutors/${slug}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  }
});
