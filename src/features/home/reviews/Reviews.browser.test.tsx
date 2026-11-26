import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import { FIXTURE_REVIEW_COLUMNS } from './fixtures';
import { Reviews } from './Reviews';

const TWO = FIXTURE_REVIEW_COLUMNS.slice(0, 2);

describe('Reviews', () => {
  it('renders nothing without columns', async () => {
    const screen = await render(<Reviews columns={[]} />);
    expect(screen.container.innerHTML).toBe('');
  });

  it('shows the screenshot strip instead of the card when the tutor has screenshots', async () => {
    const [first, second] = TWO;
    if (!first || !second) throw new Error('fixture');
    const withScreenshots = {
      ...first,
      screenshots: [{ ...first.review, id: 's-1', screenshot: '/reviews/s-1.png' }],
    };
    const screen = await render(<Reviews columns={[withScreenshots, second]} />);

    await expect
      .element(screen.getByRole('list', { name: 'Скриншоты отзывов о Анне' }))
      .toBeInTheDocument();
    // Карточка с кавычкой – только у второго репетитора.
    expect(screen.container.querySelectorAll('blockquote')).toHaveLength(1);
  });

  it('gives every tutor a column with a link to all their reviews', async () => {
    const screen = await render(<Reviews columns={TWO} />);

    await expect
      .element(screen.getByRole('heading', { level: 2, name: 'Отзывы о репетиторах' }))
      .toBeVisible();
    await expect
      .element(screen.getByRole('link', { name: 'Анна' }))
      .toHaveAttribute('href', '/tutors/example-1');
    await expect
      .element(screen.getByRole('link', { name: 'Все отзывы об Игоре' }))
      .toHaveAttribute('href', '/tutors/example-2#reviews');
    await expect.element(screen.getByText('Ольга, мама ученика 7 класса').first()).toBeVisible();
    expect(screen.container.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-12');
  });

  it('cuts a long review to 8 lines and opens it in place', async () => {
    await page.viewport(1280, 900);
    const screen = await render(<Reviews columns={TWO} />);
    const button = screen.getByRole('button', { name: 'Читать полностью' });

    // Кнопка только у длинного отзыва.
    expect(screen.getByRole('button').all()).toHaveLength(1);
    await expect.element(button).toHaveAttribute('aria-expanded', 'false');
    const text = screen.container.querySelector('blockquote p')!;
    expect(text.getBoundingClientRect().height).toBe(8 * 32);

    await userEvent.click(button);
    await expect
      .element(screen.getByRole('button', { name: 'Свернуть' }))
      .toHaveAttribute('aria-expanded', 'true');
    expect(text.getBoundingClientRect().height).toBeGreaterThan(8 * 32);
  });

  it('keeps the cards of one row the same height', async () => {
    await page.viewport(1280, 900);
    const screen = await render(<Reviews columns={TWO} />);
    const [first, second] = [...screen.container.querySelectorAll('figure')];

    expect(first!.getBoundingClientRect().height).toBe(second!.getBoundingClientRect().height);
  });

  it('puts three tutors in three columns on desktop and stacks them on phones', async () => {
    await page.viewport(1280, 900);
    const screen = await render(<Reviews columns={FIXTURE_REVIEW_COLUMNS} />);
    const tops = () =>
      [...screen.container.querySelectorAll('figure')].map(
        (card) => card.getBoundingClientRect().top,
      );
    expect(new Set(tops()).size).toBe(1);

    await page.viewport(360, 740);
    expect(new Set(tops()).size).toBe(3);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(360);
  });
});
