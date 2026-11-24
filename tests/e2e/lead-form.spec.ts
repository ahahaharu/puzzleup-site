import { createHash } from 'node:crypto';

import { expect, test, type Page } from '@playwright/test';

// Форма заявки – ТЗ главной, блок 9; ТЗ страницы репетитора, блок 6. Проекты chromium и
// mobile-webkit проверяют форму с JavaScript, no-js – обычный POST в Server Action. Заявка
// пишется в базу: нужен Postgres с миграциями и DATABASE_URL (в CI – service-контейнер).
// Только выдуманные данные (docs/conventions.md, «Тесты»).

test.skip(
  !process.env.DATABASE_URL,
  'Lead form E2E needs DATABASE_URL (pnpm db:up && pnpm db:migrate)',
);

const SUBMIT = 'Записаться на пробное занятие';

/**
 * Свой IP для каждого теста: rate limit считает заявки по `X-Forwarded-For`, а тесты идут
 * параллельно с одного адреса.
 */
async function ownIp(page: Page) {
  const hash = createHash('sha256')
    .update(test.info().testId + test.info().project.name)
    .digest();
  await page.setExtraHTTPHeaders({
    'x-forwarded-for': `10.${hash[0]}.${hash[1]}.${hash[2]}`,
  });
}

/** Чип – подпись вокруг визуально скрытого инпута. */
const chip = (page: Page, group: string, name: string) =>
  page.getByRole('group', { name: group }).getByText(name, { exact: true });

async function fillRequired(page: Page) {
  await page.getByLabel('Имя родителя').fill('Мария');
  await page.getByLabel('Телефон').fill('+375 29 000-00-00');
  await chip(page, 'Как с вами связаться?', 'Viber').click();
  await chip(page, 'Класс', '7').click();
  // У левого края подписи: в середине – ссылка на политику.
  await page
    .locator('#lead')
    .getByText(/^Согласен на обработку персональных данных/)
    .click({ position: { x: 4, y: 8 } });
}

test.beforeEach(async ({ page }) => {
  await ownIp(page);
});

test('a parent sends the form and sees the thanks screen', async ({ page }) => {
  await page.goto('/tutors/andrei?entry=tutors#lead');
  await fillRequired(page);
  await page.getByRole('button', { name: SUBMIT }).click();

  const thanks = page.locator('[data-lead-thanks]');
  await expect(thanks.getByRole('heading', { name: 'Заявка принята!' })).toBeVisible();
  await expect(
    thanks.getByText(
      /^(Андрей скоро напишет вам в Viber\.|Сейчас Андрей не на связи – напишет вам в Viber после 9:00\.)$/,
    ),
  ).toBeVisible();
  await expect(thanks.getByRole('link', { name: 'Написать Андрею в Telegram' })).toBeVisible();
  await expect(page.locator('#lead').getByText('Недостающая деталь')).toBeHidden();

  // Новая пустая форма – и без JavaScript.
  await thanks.getByRole('link', { name: 'Отправить ещё одну заявку' }).click();
  await expect(page.getByLabel('Имя родителя')).toHaveValue('');
});

test('errors from the spec are shown and the entered data is kept', async ({ page }) => {
  await page.goto('/tutors/andrei#lead');
  await page.getByLabel('Имя родителя').fill('Мария2');
  await page.getByLabel('Телефон').fill('+375 29 12');
  // Ошибка телефона появляется при уходе из поля и сдвигает кнопку – уходим заранее.
  await page.getByLabel('Телефон').press('Tab');
  await page.getByRole('button', { name: SUBMIT }).click();

  const form = page.locator('#lead form');
  await expect(form.getByText('Имя может содержать только буквы, пробел и дефис')).toBeVisible();
  await expect(
    form.getByText('Проверьте номер: +375 и 9 цифр, например +375 (29) 123-45-67'),
  ).toBeVisible();
  await expect(form.getByText('Выберите, где вам удобнее общаться')).toBeVisible();
  await expect(form.getByText('Выберите класс')).toBeVisible();
  await expect(form.getByText('Без согласия репетиторы не смогут обработать заявку')).toBeVisible();
  await expect(page.getByLabel('Имя родителя')).toHaveValue('Мария2');
});

test('the sixth attempt in ten minutes gets the rate limit message', async ({ page }) => {
  // Без JavaScript каждая отправка доходит до сервера, даже с ошибками.
  test.skip(test.info().project.name !== 'no-js', 'Only plain POSTs reach the server unchecked');
  await page.goto('/tutors/andrei#lead');
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.getByRole('button', { name: SUBMIT }).click();
    await expect(page.getByText('Выберите класс')).toBeVisible();
  }
  await page.getByRole('button', { name: SUBMIT }).click();
  await expect(
    page.getByText(
      'Слишком много попыток подряд. Попробуйте через минуту или напишите репетитору в мессенджер.',
    ),
  ).toBeVisible();
});

test('the goal from the address opens the details', async ({ page }) => {
  test.skip(
    test.info().project.name === 'no-js',
    'The static page reads the address on the client',
  );
  await page.goto('/tutors/andrei?goal=exam9#lead');
  await expect(page.locator('#lead details')).toHaveAttribute('open', '');
  await expect(page.getByRole('radio', { name: /Экзамен после 9/ })).toBeChecked();
});
