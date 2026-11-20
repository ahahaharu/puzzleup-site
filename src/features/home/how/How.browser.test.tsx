import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { How } from './How';
import { EXAMPLE_TITLE, howSteps } from './texts';

const STEPS = howSteps({
  responseHours: { from: '09:00', to: '22:00' },
  platforms: ['Google Meet', 'Miro'],
});

const EXAMPLE = {
  name: 'Андрей',
  intro: 'Здравствуйте! Итог пробного занятия:',
  strong: 'дроби',
  improve: 'степени',
  startWith: 'уравнений',
  offer: 'Подойдёт?',
};

describe('How', () => {
  it('lists the steps in an ordered list and marks the trial as free', async () => {
    const screen = await render(<How steps={STEPS} example={EXAMPLE} />);

    const list = screen.container.querySelector('ol');
    expect(list?.querySelectorAll(':scope > li')).toHaveLength(5);
    await expect
      .element(screen.getByRole('heading', { level: 3, name: 'Пробное занятие бесплатно' }))
      .toBeVisible();
    await expect
      .element(screen.getByRole('link', { name: 'Выбрать репетитора' }))
      .toHaveAttribute('href', '#tutors');
  });

  it('shows the example message with the three lists', async () => {
    const screen = await render(<How steps={STEPS} example={EXAMPLE} />);

    await expect.element(screen.getByRole('heading', { name: EXAMPLE_TITLE })).toBeVisible();
    await expect.element(screen.getByText('Уверенно:')).toBeVisible();
    await expect.element(screen.getByText('Подтянуть:')).toBeVisible();
    await expect.element(screen.getByText('Начнём с:')).toBeVisible();
  });

  it('pins the example on desktop only', async () => {
    await page.viewport(1280, 900);
    const desktop = await render(<How steps={STEPS} example={EXAMPLE} />);
    const card = desktop.getByRole('heading', { name: EXAMPLE_TITLE }).element();
    expect(getComputedStyle(card.parentElement!.parentElement!.parentElement!).position).toBe(
      'sticky',
    );
    desktop.unmount();

    await page.viewport(390, 800);
    const phone = await render(<How steps={STEPS} example={EXAMPLE} />);
    const mobileCard = phone.getByRole('heading', { name: EXAMPLE_TITLE }).element();
    expect(getComputedStyle(mobileCard.parentElement!.parentElement!.parentElement!).position).toBe(
      'static',
    );
  });

  it('leaves the example out without data', async () => {
    const screen = await render(<How steps={STEPS} />);
    expect(screen.container.textContent).not.toContain(EXAMPLE_TITLE);
  });
});
