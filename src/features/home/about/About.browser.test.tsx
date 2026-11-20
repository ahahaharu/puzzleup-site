import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { About } from './About';
import type { AboutTutor } from './cards';

const TEXT =
  'PuzzleUp – общий сайт независимых репетиторов. PuzzleUp не организация, не юрлицо и не ИП.';

const tutor = (slug: string, name: string, nameDative: string): AboutTutor => ({
  slug,
  name,
  nameDative,
  meta: '5–9 класс · 40 BYN',
  href: `/tutors/${slug}`,
  leadHref: `/tutors/${slug}?entry=about#lead`,
  telegram: `${slug}_tutor`,
  viber: '+375 29 000-00-00',
});

const TWO = [tutor('andrei', 'Андрей', 'Андрею'), tutor('maxim', 'Максим', 'Максиму')];

describe('About', () => {
  it('shows the site text with a card per tutor', async () => {
    const screen = await render(<About text={TEXT} tutors={TWO} />);

    await expect.element(screen.getByRole('heading', { level: 2, name: 'О сайте' })).toBeVisible();
    await expect.element(screen.getByText(TEXT)).toBeVisible();
    await expect
      .element(screen.getByRole('link', { name: 'Записаться к Максиму' }))
      .toHaveAttribute('href', '/tutors/maxim?entry=about#lead');
    await expect
      .element(screen.getByRole('link', { name: 'Андрей' }))
      .toHaveAttribute('href', '/tutors/andrei');
    await expect
      .element(screen.getByRole('link', { name: 'Написать Андрею в Telegram' }))
      .toHaveAttribute('href', 'https://t.me/andrei_tutor');
    await expect
      .element(screen.getByRole('link', { name: 'Написать Андрею в Viber' }))
      .toBeVisible();
    expect(screen.getByRole('link', { name: 'Выбрать репетитора' }).all()).toHaveLength(0);
  });

  it('shows only the button to the tutors block without cards', async () => {
    const screen = await render(<About text={TEXT} tutors={[]} />);

    await expect
      .element(screen.getByRole('link', { name: 'Выбрать репетитора' }))
      .toHaveAttribute('href', '#tutors');
    expect(screen.container.querySelector('li')).toBeNull();
  });

  it('keeps the messengers together on a phone', async () => {
    await page.viewport(360, 740);
    const screen = await render(<About text={TEXT} tutors={TWO} />);
    const telegram = screen.getByRole('link', { name: 'Написать Андрею в Telegram' }).element();
    const viber = screen.getByRole('link', { name: 'Написать Андрею в Viber' }).element();

    expect(viber.getBoundingClientRect().top).toBe(telegram.getBoundingClientRect().top);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(360);
  });

  it('keeps the disclosure text at 16 px or larger', async () => {
    await page.viewport(360, 740);
    const screen = await render(<About text={TEXT} tutors={TWO} />);
    const size = Number.parseFloat(getComputedStyle(screen.getByText(TEXT).element()).fontSize);
    expect(size).toBeGreaterThanOrEqual(16);
  });
});
