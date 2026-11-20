import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import type { SubjectCardData } from './cards';
import { Subjects } from './Subjects';

const subject = (id: string): SubjectCardData => ({
  id,
  title: `Предмет ${id}`,
  grades: '5–11 класс',
  topics: ['Дроби и проценты', 'уравнения и неравенства', 'ЦТ и ЦЭ'],
  formula: 'x² − 5x + 6 = 0',
  paper: 'cell',
  tutors: [{ slug: 'andrei', name: 'Андрей', grades: '5–9 класс', href: '/tutors/andrei' }],
  ctaLabel: 'Выбрать репетитора по математике',
  ctaHref: `/?subject=${id}#tutors`,
});

const many = (count: number) => Array.from({ length: count }, (_, index) => subject(`s${index}`));

/** Сколько карточек в первой строке сетки. */
function firstRow(container: HTMLElement): number {
  const items = [...container.querySelectorAll('li')];
  const top = items[0]?.getBoundingClientRect().top;
  return items.filter((item) => item.getBoundingClientRect().top === top).length;
}

describe('Subjects', () => {
  it('renders nothing without subjects', async () => {
    const screen = await render(<Subjects subjects={[]} />);
    expect(screen.container.innerHTML).toBe('');
  });

  it('links the tutors and the filtered tutors block', async () => {
    const screen = await render(<Subjects subjects={[subject('math')]} />);

    await expect.element(screen.getByRole('heading', { level: 2, name: 'Предметы' })).toBeVisible();
    const tutor = screen.getByRole('link', { name: /^Андрей/ });
    await expect.element(tutor).toHaveAttribute('href', '/tutors/andrei');
    expect(tutor.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await expect
      .element(screen.getByRole('link', { name: 'Выбрать репетитора по математике' }))
      .toHaveAttribute('href', '/?subject=math#tutors');
  });

  it.each([
    [1, 1],
    [2, 2],
    [4, 2],
    [5, 3],
  ])('puts %i subjects %i in a row at 1280 px', async (count, row) => {
    await page.viewport(1280, 900);
    const screen = await render(<Subjects subjects={many(count)} />);
    expect(firstRow(screen.container)).toBe(row);
  });

  it('puts the paper on the left of a single wide card and on top on phones', async () => {
    await page.viewport(1280, 900);
    const wide = await render(<Subjects subjects={[subject('math')]} />);
    const paper = () => wide.container.querySelector('.paper-cell')!.getBoundingClientRect();
    const title = () => wide.getByRole('heading', { level: 3 }).element().getBoundingClientRect();
    expect(paper().right).toBeLessThanOrEqual(title().left);

    await page.viewport(360, 740);
    expect(paper().bottom).toBeLessThanOrEqual(title().top);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(360);
  });
});
