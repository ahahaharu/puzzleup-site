import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import { Faq } from './Faq';

const ITEMS = [
  { id: 'organization', question: 'Это одна организация?', answer: 'Нет. Это общий сайт.' },
  {
    id: 'policy',
    question: 'Где политика?',
    answer: 'Первый абзац.\n\nВо втором – **важное** и [политика](/privacy).',
  },
];

describe('Faq', () => {
  it('renders nothing without questions', async () => {
    const screen = await render(<Faq items={[]} />);
    expect(screen.container.innerHTML).toBe('');
  });

  it('starts with every question closed', async () => {
    const screen = await render(<Faq items={ITEMS} />);

    await expect
      .element(screen.getByRole('heading', { level: 2, name: 'Частые вопросы' }))
      .toBeVisible();
    const details = [...screen.container.querySelectorAll('details')];
    expect(details).toHaveLength(2);
    expect(details.every((item) => !item.open)).toBe(true);
  });

  it('opens an answer from the keyboard and turns the plus into a cross', async () => {
    const screen = await render(<Faq items={ITEMS} />);
    const summary = screen.getByText('Где политика?');

    summary.element().closest('summary')?.focus();
    await userEvent.keyboard('{Enter}');

    const details = summary.element().closest('details')!;
    expect(details.open).toBe(true);
    await expect
      .element(screen.getByRole('link', { name: 'политика' }))
      .toHaveAttribute('href', '/privacy');
    expect(details.querySelectorAll('p')).toHaveLength(2);
    const icon = details.querySelector('svg')!;
    await expect.poll(() => getComputedStyle(icon).rotate).toBe('45deg');
  });

  it('shows one button: under the heading on desktop, after the questions on phones', async () => {
    await page.viewport(1280, 900);
    const screen = await render(<Faq items={ITEMS} />);
    const visible = () =>
      screen
        .getByRole('link', { name: 'Выбрать репетитора' })
        .all()
        .filter((link) => link.element().checkVisibility());
    expect(visible()).toHaveLength(1);

    await page.viewport(360, 740);
    const [button] = visible();
    expect(visible()).toHaveLength(1);
    const last = screen.container.querySelectorAll('details')[1]!;
    expect(button!.element().getBoundingClientRect().top).toBeGreaterThan(
      last.getBoundingClientRect().bottom,
    );
  });
});
