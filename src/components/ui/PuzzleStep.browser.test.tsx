import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { PuzzleStep } from './PuzzleStep';

describe('PuzzleStep', () => {
  it('renders number, heading and text over a hidden outline', async () => {
    const screen = await render(
      <div style={{ width: 280 }}>
        <PuzzleStep n="01" title="Пробное занятие">
          30 минут, бесплатно.
        </PuzzleStep>
      </div>,
    );

    await expect
      .element(screen.getByRole('heading', { level: 3, name: 'Пробное занятие' }))
      .toBeVisible();
    await expect.element(screen.getByText('30 минут, бесплатно.')).toBeVisible();
    const step = screen.getByText('01').element().closest('div[style]');
    expect(step?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(step?.getBoundingClientRect().height).toBe(250);
  });

  it('moves the text right of the socket', async () => {
    const screen = await render(<PuzzleStep n="02" title="Занятия" left="socket" tone="ink" />);
    const content = screen.getByText('02').element().parentElement;
    if (!content) throw new Error('step content not found');

    expect(getComputedStyle(content).paddingLeft).toBe('56px');
    expect(getComputedStyle(content).color).toBe('rgb(247, 244, 236)');
  });

  it('gives each checked step its own grid pattern', async () => {
    const { container } = await render(
      <>
        <PuzzleStep n="01" title="Первый" />
        <PuzzleStep n="02" title="Второй" left="socket" />
      </>,
    );
    const ids = [...container.querySelectorAll('pattern')].map((pattern) => pattern.id);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
