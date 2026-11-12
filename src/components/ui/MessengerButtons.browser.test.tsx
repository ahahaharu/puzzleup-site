import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { MessengerButtons, type MessengerLabel } from './MessengerButtons';

const TUTOR = { telegram: 'example_tutor', viber: '+375 29 000-00-00', nameDative: 'Андрею' };

/** Текст ссылки, который видно на экране: sr-only сжимает элемент до 1 px. */
function visibleText(link: Element) {
  const hidden = [...link.querySelectorAll('span span')]
    .filter((span) => span.getBoundingClientRect().width <= 1)
    .map((span) => span.textContent);
  return hidden.reduce((text, part) => text.replace(part, ''), link.textContent).trim();
}

/** Видимая подпись – цельная часть доступного имени (WCAG 2.5.3 Label in Name). */
function expectLabelInName(link: Element, name: string) {
  expect(name).toContain(visibleText(link));
}

describe('MessengerButtons', () => {
  it.each<[MessengerLabel, string]>([
    ['short', 'Андрею '],
    ['action', ''],
    ['personal', 'Андрею '],
  ])('links to both chats with label "%s"', async (label, name) => {
    const screen = await render(<MessengerButtons {...TUTOR} label={label} />);

    await expect
      .element(screen.getByRole('link', { name: `Написать ${name}в Telegram` }))
      .toHaveAttribute('href', 'https://t.me/example_tutor');
    await expect
      .element(screen.getByRole('link', { name: `Написать ${name}в Viber` }))
      .toHaveAttribute('href', 'viber://chat?number=%2B375290000000');
  });

  it('shows only messenger names in a narrow card, the name stays personal', async () => {
    const screen = await render(
      <div style={{ width: 328 }}>
        <MessengerButtons {...TUTOR} />
      </div>,
    );
    const telegram = screen.getByRole('link', { name: 'Написать Андрею в Telegram' }).element();

    expect(visibleText(telegram)).toBe('Telegram');
    expectLabelInName(telegram, 'Написать Андрею в Telegram');
  });

  it.each([
    [328, 'Telegram'],
    [640, 'Написать в Telegram'],
  ])('with label "action" at %i px shows «%s» inside the accessible name', async (width, text) => {
    const screen = await render(
      <div style={{ width }}>
        <MessengerButtons {...TUTOR} label="action" />
      </div>,
    );
    const telegram = screen.getByRole('link', { name: 'Написать в Telegram' }).element();

    expect(visibleText(telegram)).toBe(text);
    expectLabelInName(telegram, 'Написать в Telegram');
  });

  it('with label "personal" always shows the full text and stacks while narrow', async () => {
    const screen = await render(
      <div style={{ width: 547 }}>
        <MessengerButtons {...TUTOR} label="personal" tone="dark" />
      </div>,
    );
    const telegram = screen.getByRole('link', { name: 'Написать Андрею в Telegram' }).element();
    const viber = screen.getByRole('link', { name: 'Написать Андрею в Viber' }).element();

    expect(visibleText(telegram)).toBe('Написать Андрею в Telegram');
    expect(viber.getBoundingClientRect().top).toBeGreaterThan(
      telegram.getBoundingClientRect().bottom,
    );
    expect(telegram.scrollWidth).toBeLessThanOrEqual(telegram.clientWidth);
  });

  it('with label "personal" puts the pair in one row when it fits', async () => {
    const screen = await render(
      <div style={{ width: 720 }}>
        <MessengerButtons {...TUTOR} label="personal" />
      </div>,
    );
    const telegram = screen.getByRole('link', { name: /Telegram/ }).element();
    const viber = screen.getByRole('link', { name: /Viber/ }).element();

    expect(telegram.getBoundingClientRect().top).toBe(viber.getBoundingClientRect().top);
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
