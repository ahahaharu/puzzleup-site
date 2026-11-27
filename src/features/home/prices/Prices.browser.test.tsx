import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { Prices } from './Prices';
import type { PriceRow } from './rows';

const PRICES = {
  trial: {
    title: 'Пробное занятие',
    price: 0,
    caption: '30 минут, онлайн, ни к чему не обязывает',
  },
  lesson: { title: 'Занятие', caption: '60 минут, индивидуально, онлайн' },
  paymentNote: 'Оплата – переводом напрямую репетитору, он присылает чек.',
  offerNote: 'Цены на сайте не являются публичной офертой',
};

const ROWS: PriceRow[] = [
  { slug: 'andrei', name: 'Андрей', grades: '5–9 класс', price: '40', href: '/tutors/andrei' },
  { slug: 'maxim', name: 'Максим', grades: '5–11 класс', price: '45', href: '/tutors/maxim' },
];

describe('Prices', () => {
  it('renders nothing without tutors', async () => {
    const screen = await render(<Prices prices={PRICES} rows={[]} />);
    expect(screen.container.innerHTML).toBe('');
  });

  it('shows the free trial and a price per tutor', async () => {
    const screen = await render(<Prices prices={PRICES} rows={ROWS} />);

    await expect.element(screen.getByRole('heading', { level: 2, name: 'Цены' })).toBeVisible();
    await expect.element(screen.getByText('Цену назначает каждый репетитор сам')).toBeVisible();
    await expect.element(screen.getByText(PRICES.trial.caption)).toBeVisible();
    await expect.element(screen.getByText(/^45 BYN$/)).toBeVisible();
    const tutor = screen.getByRole('link', { name: 'Максим · 5–11 класс' });
    await expect.element(tutor).toHaveAttribute('href', '/tutors/maxim');
    expect(tutor.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });

  it('keeps the offer footnote at 14 px', async () => {
    const screen = await render(<Prices prices={PRICES} rows={ROWS} />);
    const note = screen.getByText(PRICES.offerNote).element();
    expect(Number.parseFloat(getComputedStyle(note).fontSize)).toBe(14);
  });

  it('puts the trial card first in a column on phones', async () => {
    await page.viewport(360, 740);
    const screen = await render(<Prices prices={PRICES} rows={ROWS} />);
    const trial = screen.getByRole('heading', { name: 'Пробное занятие' }).element();
    const lesson = screen.getByRole('heading', { name: 'Занятие', exact: true }).element();

    expect(trial.getBoundingClientRect().bottom).toBeLessThan(lesson.getBoundingClientRect().top);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(360);
  });
});
