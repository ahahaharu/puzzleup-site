import { expect, test } from '@playwright/test';

// Первый экран главной – ТЗ главной, блок 1. Проект no-js проверяет тот же экран без JavaScript.

const BADGE = /^Онлайн-репетиторы? по .+ для \d+(–\d+)? класс/;

test('hero shows the badge heading, slogan and a button to the tutors block', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('#top');

  await expect(hero.getByRole('heading', { level: 1 })).toHaveText(BADGE);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(hero.getByText('Всё', { exact: true })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Выбрать репетитора' })).toHaveAttribute(
    'href',
    '#tutors',
  );
  await expect(hero.getByRole('img', { name: /^Пазл из кусочков разных тетрадей/ })).toBeVisible();
  await expect(hero.getByRole('listitem')).toHaveCount(3);
});

test('the main button is visible without scrolling on a 360×740 phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');

  const button = page.locator('#top').getByRole('link', { name: 'Выбрать репетитора' });
  await expect(button).toBeInViewport({ ratio: 1 });
});

test('no hero text is smaller than 14 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');

  const sizes = await page
    .locator('#top')
    .evaluate((hero) =>
      [...hero.querySelectorAll<HTMLElement>('h1, p, a, li span')]
        .filter((node) => node.checkVisibility())
        .map((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
    );
  expect(sizes.length).toBeGreaterThan(0);
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
});

test('with reduced motion the accent piece is already in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const illustration = page.locator('#top svg[role="img"]');
  await expect
    .poll(() =>
      illustration.evaluate((svg) =>
        svg
          .getAnimations({ subtree: true })
          .every((animation) => animation.playState === 'finished'),
      ),
    )
    .toBe(true);
});
