import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { MessengerIconButton } from './MessengerIconButton';

describe('MessengerIconButton', () => {
  it.each([
    ['telegram', 'example_tutor', 'Telegram', 'https://t.me/example_tutor'],
    ['viber', '+375 29 000-00-00', 'Viber', 'viber://chat?number=%2B375290000000'],
  ] as const)(
    'links to the %s chat with a personal name',
    async (messenger, value, title, href) => {
      const screen = await render(
        <MessengerIconButton messenger={messenger} value={value} nameDative="Андрею" />,
      );

      await expect
        .element(screen.getByRole('link', { name: `Написать Андрею в ${title}` }))
        .toHaveAttribute('href', href);
    },
  );

  it('is a 48×48 square', async () => {
    const screen = await render(
      <MessengerIconButton messenger="telegram" value="example_tutor" nameDative="Андрею" />,
    );
    const { width, height } = screen.getByRole('link').element().getBoundingClientRect();

    expect(width).toBe(48);
    expect(height).toBe(48);
  });
});
