import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import {
  FIXTURE_ANNA,
  FIXTURE_IGOR,
  FIXTURE_SITE,
  FIXTURE_SUBJECTS,
} from '@/features/tutor-page/fixtures';

import { submitLead, type LeadActionState } from './action';
import { leadFormData } from './form-data';
import { LeadForm } from './LeadForm';
import { ERRORS, RATE_LIMIT_ERROR, SERVER_ERROR } from './texts';

// Server Action – подмена: компонент проверяется без сервера и базы.
vi.mock('./action', () => ({ submitLead: vi.fn() }));

// Адрес вместо роутера Next.js: useSearchParams читает location и, как в Next, возвращает тот же
// объект, пока адрес не изменился.
vi.mock('next/navigation', async () => {
  const { useMemo } = await import('react');
  const useSearchParams = () => {
    const search = window.location.search;
    return useMemo(() => new URLSearchParams(search), [search]);
  };
  return { useSearchParams, default: { useSearchParams } };
});

const submit = vi.mocked(submitLead);

const site = {
  responseHours: FIXTURE_SITE.responseHours,
  consent: {
    version: '2026-11-12',
    label: 'Согласен на обработку персональных данных',
    policyLinkLabel: 'политика',
    details: 'Операторы – репетиторы {operators}.',
  },
};
const data = leadFormData(FIXTURE_ANNA, {
  site,
  subjects: FIXTURE_SUBJECTS,
  tutors: [FIXTURE_ANNA, FIXTURE_IGOR],
});

const success: LeadActionState = {
  status: 'success',
  result: { status: 'success' },
  thanks: { contactMethod: 'viber', night: false, entry: 'direct' },
};

beforeEach(() => {
  submit.mockReset();
  window.sessionStorage.clear();
});

afterEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

/** Чип – подпись вокруг визуально скрытого инпута: нажимается подпись, как пальцем. */
const chip = (name: string) =>
  page.getByRole('group', { name: /./ }).getByText(name, { exact: true }).first();

const button = () => page.getByRole('button', { name: 'Записаться на пробное занятие' });

// Только выдуманные данные (docs/conventions.md, «Тесты»).
async function fillRequired() {
  await page.getByLabelText('Имя родителя').fill('Мария');
  await page.getByLabelText('Телефон').fill('+375 29 000-00-00');
  await chip('Viber').click();
  await chip('7').click();
  // У левого края подписи: в середине – ссылка на политику.
  await page
    .getByText(/^Согласен на обработку персональных данных/)
    .click({ position: { x: 4, y: 8 } });
}

describe('LeadForm', () => {
  it('keeps optional fields collapsed and preselects the only subject', async () => {
    await render(<LeadForm data={data} />);
    expect(document.querySelector('details')?.open).toBe(false);
    await expect.element(page.getByRole('checkbox', { name: 'Математика' })).toBeChecked();
  });

  it('opens the details and selects the goal from ?goal=', async () => {
    window.history.replaceState(null, '', '?goal=exam9&entry=situations');
    await render(<LeadForm data={data} />);
    await expect.poll(() => document.querySelector('details')?.open).toBe(true);
    const goal = page.getByRole('radio', { name: /Экзамен после 9/ });
    await expect.element(goal).toBeChecked();
    expect(document.querySelector<HTMLInputElement>('input[name=entry]')?.value).toBe('situations');
    // Повторное нажатие снимает выбор (ТЗ главной, блок 9, поле 6).
    await chip('Экзамен после 9\u00a0класса').click();
    await expect.element(goal).not.toBeChecked();
  });

  it('formats the phone while typing', async () => {
    await render(<LeadForm data={data} />);
    const phone = page.getByLabelText('Телефон');
    await phone.click();
    await userEvent.keyboard('290000000');
    await expect.element(phone).toHaveValue('+375 (29) 000-00-00');
  });

  it('validates a field when it loses focus', async () => {
    await render(<LeadForm data={data} />);
    await page.getByLabelText('Имя родителя').fill('Мария2');
    await page.getByLabelText('Телефон').click();
    await expect.element(page.getByText(ERRORS.nameInvalid)).toBeVisible();
    await expect.element(page.getByLabelText('Имя родителя')).toHaveAttribute('aria-invalid');
  });

  it('focuses the first invalid field and announces the number of errors', async () => {
    await render(<LeadForm data={data} />);
    await page.getByLabelText('Телефон').fill('+375 29 000-00-00');
    await button().click();
    await expect.element(page.getByLabelText('Имя родителя')).toHaveFocus();
    await expect
      .poll(() => document.querySelector('p[aria-live]:last-of-type')?.textContent)
      .toBe('В форме 4 ошибки');
    await expect.element(page.getByText(ERRORS.contactEmpty)).toBeVisible();
    expect(submit).not.toHaveBeenCalled();
  });

  it('keeps the focus in the field while it is rechecked after a failed submit', async () => {
    await render(<LeadForm data={data} />);
    await button().click();
    const name = page.getByLabelText('Имя родителя');
    await expect.element(name).toHaveFocus();
    // Перепроверка при вводе – служебная отправка Conform, а не отправка родителя.
    await userEvent.keyboard('Мария');
    await expect.element(name).toHaveValue('Мария');
    await expect.element(name).toHaveFocus();
  });

  it('shows the grade hint with a link to the other tutor', async () => {
    await render(<LeadForm data={data} />);
    await chip('10').click();
    const link = page.getByRole('link', { name: 'его страница' });
    await expect
      .element(link)
      .toHaveAttribute('href', '/tutors/igor?entry=tutor_more&subject=math&grade=10#lead');
  });

  it('counts comment characters from 800', async () => {
    await render(<LeadForm data={data} />);
    await page.getByText('Добавить подробности (необязательно)').click();
    const comment = page.getByLabelText('Комментарий');
    await comment.fill('а'.repeat(799));
    expect(page.getByText('/ 1000').query()).toBeNull();
    await comment.fill('а'.repeat(800));
    await expect.element(page.getByText('800 / 1000')).toBeVisible();
  });

  it('sends the form with UTM and shows the thanks screen', async () => {
    window.sessionStorage.setItem('puzzleup:utm', JSON.stringify({ utm_source: 'instagram' }));
    submit.mockResolvedValue(success);
    await render(<LeadForm data={data} />);
    await fillRequired();
    await button().click();

    const heading = page.getByRole('heading', { name: 'Заявка принята!' });
    await expect.element(heading).toHaveFocus();
    await expect.element(page.getByText('Анна скоро напишет вам в Viber.')).toBeVisible();
    const sent = submit.mock.calls[0]?.[1];
    expect(sent?.get('utm_source')).toBe('instagram');
    expect(sent?.get('tutorId')).toBe('t-anna');
    expect(sent?.get('phone')).toBe('+375 (29) 000-00-00');

    // «Отправить ещё одну заявку» – пустая форма без перезагрузки.
    await page.getByRole('link', { name: 'Отправить ещё одну заявку' }).click();
    await expect.element(page.getByLabelText('Имя родителя')).toHaveFocus();
    await expect.element(page.getByLabelText('Имя родителя')).toHaveValue('');
  });

  it('shows the night text outside the response hours', async () => {
    submit.mockResolvedValue({
      ...success,
      thanks: { contactMethod: 'call', night: true, entry: 'direct' },
    });
    await render(<LeadForm data={data} />);
    await fillRequired();
    await button().click();
    await expect
      .element(page.getByText('Сейчас Анна не на связи – позвонит вам после 9:00.'))
      .toBeVisible();
  });

  it('keeps the data and shows the banner when the network fails', async () => {
    submit.mockRejectedValue(new TypeError('Failed to fetch'));
    await render(<LeadForm data={data} />);
    await fillRequired();
    await button().click();
    await expect.element(page.getByRole('alert').getByText(SERVER_ERROR)).toBeVisible();
    await expect.element(page.getByLabelText('Имя родителя')).toHaveValue('Мария');
  });

  it('shows the rate limit text', async () => {
    submit.mockResolvedValue({
      status: 'error',
      result: { status: 'error' },
      problem: 'rate_limit',
    });
    await render(<LeadForm data={data} />);
    await fillRequired();
    await button().click();
    await expect.element(page.getByRole('alert').getByText(RATE_LIMIT_ERROR)).toBeVisible();
  });

  it('shows «Отправляем…» and does not send twice while sending', async () => {
    let resolve: (state: LeadActionState) => void = () => {};
    submit.mockReturnValue(new Promise((done) => (resolve = done)));
    await render(<LeadForm data={data} />);
    await fillRequired();
    await button().click();
    const sending = page.getByRole('button', { name: 'Отправляем…' });
    await expect.element(sending).toBeVisible();
    await sending.click({ force: true });
    expect(submit).toHaveBeenCalledTimes(1);
    resolve(success);
    await expect.element(page.getByRole('heading', { name: 'Заявка принята!' })).toBeVisible();
  });
});
