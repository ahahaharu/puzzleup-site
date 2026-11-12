import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { MessengerButtons, type MessengerLabel } from './MessengerButtons';

const TUTOR = { telegram: 'example_tutor', viber: '+375 29 000-00-00', nameDative: 'Андрею' };

/** Слова подписи, которые видно на экране: sr-only сжимает элемент до 1 px. */
function visibleWords(link: Element) {
  return [...link.querySelectorAll('span span')]
    .filter((span) => span.getBoundingClientRect().width > 1)
    .map((span) => span.textContent);
}

describe('MessengerButtons', () => {
  it.each<MessengerLabel>(['short', 'action', 'personal'])(
    'names both links in full for screen readers with label "%s"',
    async (label) => {
      const screen = await render(<MessengerButtons {...TUTOR} label={label} />);

      await expect
        .element(screen.getByRole('link', { name: 'Написать Андрею в Telegram' }))
        .toHaveAttribute('href', 'https://t.me/example_tutor');
      await expect
        .element(screen.getByRole('link', { name: 'Написать Андрею в Viber' }))
        .toHaveAttribute('href', 'viber://chat?number=%2B375290000000');
    },
  );

  it('shows only messenger names on a narrow pair', async () => {
    const screen = await render(
      <div style={{ width: 328 }}>
        <MessengerButtons {...TUTOR} label="personal" />
      </div>,
    );

    const telegram = screen.getByRole('link', { name: 'Написать Андрею в Telegram' }).element();
    expect(visibleWords(telegram)).toEqual([]);
  });

  it('shows "Написать в Telegram" on a wide pair with label "action"', async () => {
    const screen = await render(
      <div style={{ width: 640 }}>
        <MessengerButtons {...TUTOR} label="action" />
      </div>,
    );
    const telegram = screen.getByRole('link', { name: 'Написать Андрею в Telegram' }).element();
    expect(visibleWords(telegram)).toEqual(['Написать ', 'в ']);
  });

  it('shows the full personal label on a wide pair', async () => {
    const screen = await render(
      <div style={{ width: 720 }}>
        <MessengerButtons {...TUTOR} label="personal" tone="dark" />
      </div>,
    );
    const telegram = screen.getByRole('link', { name: 'Написать Андрею в Telegram' }).element();

    expect(visibleWords(telegram)).toEqual(['Написать ', 'Андрею ', 'в ']);
  });

  it('keeps both buttons on one row with equal width at 360 px', async () => {
    const screen = await render(
      <div style={{ width: 328 }}>
        <MessengerButtons {...TUTOR} />
      </div>,
    );
    const telegram = screen
      .getByRole('link', { name: /Telegram/ })
      .element()
      .getBoundingClientRect();
    const viber = screen.getByRole('link', { name: /Viber/ }).element().getBoundingClientRect();

    expect(telegram.top).toBe(viber.top);
    expect(telegram.width).toBe(viber.width);
    expect(telegram.height).toBe(48);
  });
});
