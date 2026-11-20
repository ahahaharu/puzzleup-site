import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import type { SituationCard } from './cards';
import { Situations } from './Situations';
import { CTA_TITLE } from './texts';

const card = (id: string, number: string, names: string[]): SituationCard => ({
  id,
  number,
  title: `Ситуация ${number}`,
  text: 'Репетитор находит тему, с которой начались трудности.',
  goal: 'grades',
  tutors: names.map((name) => ({
    slug: name,
    name,
    href: `/tutors/${name}?entry=situations&goal=grades#lead`,
  })),
});

const CARDS = [
  card('a', '01', ['Андрей', 'Максим']),
  card('b', '02', ['Андрей']),
  card('c', '03', ['Максим']),
  card('d', '04', ['Андрей', 'Максим']),
];

describe('Situations', () => {
  it('renders nothing without cards', async () => {
    const screen = await render(<Situations cards={[]} />);
    expect(screen.container.innerHTML).toBe('');
  });

  it('lists the cards with tutor links and the call to action last', async () => {
    const screen = await render(<Situations cards={CARDS} />);

    await expect
      .element(screen.getByRole('heading', { level: 2, name: 'Узнаёте ситуацию?' }))
      .toBeVisible();
    const items = screen.getByRole('listitem').all();
    expect(items).toHaveLength(5);
    expect(items.at(-1)?.element().textContent).toContain(CTA_TITLE);

    const link = screen
      .getByRole('link', { name: 'Андрей – записаться на пробное занятие' })
      .first();
    await expect
      .element(link)
      .toHaveAttribute('href', '/tutors/Андрей?entry=situations&goal=grades#lead');
    expect(link.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await expect
      .element(screen.getByRole('link', { name: 'Выбрать репетитора' }))
      .toHaveAttribute('href', '#tutors');
  });

  it('stretches the call to action over the rest of the last row', async () => {
    await page.viewport(1280, 900);
    const screen = await render(<Situations cards={CARDS} />);
    const items = screen.getByRole('listitem').all();
    const fourth = items[3]!.element().getBoundingClientRect();
    const cta = items[4]!.element().getBoundingClientRect();

    expect(cta.top).toBe(fourth.top);
    expect(Math.round(cta.width)).toBeGreaterThan(Math.round(fourth.width * 2));
  });

  it('shows knobs only towards neighbours', async () => {
    await page.viewport(1280, 900);
    const screen = await render(<Situations cards={CARDS} />);
    const visibleKnobs = (index: number) =>
      [
        ...screen.getByRole('listitem').all()[index]!.element().querySelectorAll('svg.absolute'),
      ].filter((svg) => getComputedStyle(svg).display !== 'none').length;

    // 01 02 03 / 04 CTA: у 03 – только нижний выступ, у 04 – только правый.
    expect(visibleKnobs(0)).toBe(2);
    expect(visibleKnobs(2)).toBe(1);
    expect(visibleKnobs(3)).toBe(1);
    expect(visibleKnobs(4)).toBe(0);
  });

  it('turns into a ribbon on phones', async () => {
    await page.viewport(360, 740);
    const screen = await render(<Situations cards={CARDS} />);
    const [first, second] = screen.getByRole('listitem').all();

    expect(second!.element().getBoundingClientRect().top).toBe(
      first!.element().getBoundingClientRect().top,
    );
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(360);
  });
});
