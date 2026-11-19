import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { LINKS, TUTORS } from './fixtures';
import { Footer } from './Footer';

const PROPS = {
  slogan: 'Всё сложится.',
  tagline: 'Общий сайт независимых репетиторов',
  links: LINKS,
  tutors: TUTORS,
  documents: [
    { title: 'Политика обработки персональных данных', href: '/privacy' },
    { title: 'Политика cookie', href: '/cookies' },
  ],
  requisites: 'PuzzleUp – общий сайт независимых репетиторов. Не является организацией.',
  copyright: '© 2026 Андреев Андрей Андреевич, Максимов Максим Максимович',
};

describe('Footer', () => {
  it('shows columns, tutor links, documents and requisites', async () => {
    const screen = await render(<Footer {...PROPS} />);

    for (const title of ['Навигация', 'Репетиторы', 'Документы']) {
      await expect.element(screen.getByRole('heading', { name: title })).toBeVisible();
    }
    await expect
      .element(screen.getByRole('link', { name: 'Максим' }))
      .toHaveAttribute('href', '/tutors/maxim');
    await expect
      .element(screen.getByRole('link', { name: 'Написать Андрею в Telegram' }))
      .toHaveAttribute('href', 'https://t.me/example_andrei');
    await expect
      .element(screen.getByRole('link', { name: 'Политика cookie' }))
      .toHaveAttribute('href', '/cookies');
    await expect.element(screen.getByText(PROPS.requisites)).toBeVisible();
    await expect.element(screen.getByText(PROPS.copyright)).toBeVisible();
  });

  it('keeps every link at least 44 px tall and text at least 14 px', async () => {
    const screen = await render(<Footer {...PROPS} />);

    for (const link of screen.getByRole('link').elements()) {
      expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
    for (const element of screen.container.querySelectorAll('p, a, h2')) {
      expect(parseFloat(getComputedStyle(element).fontSize)).toBeGreaterThanOrEqual(14);
    }
  });

  it('drops the tutors column without tutors', async () => {
    const screen = await render(<Footer {...PROPS} tutors={[]} />);

    await expect
      .element(screen.getByRole('heading', { name: 'Репетиторы' }))
      .not.toBeInTheDocument();
  });
});
