import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import type { Availability } from '@/lib/availability';

import { Badge } from './Badge';

describe('Badge', () => {
  it.each<[Availability, string, string]>([
    ['available', 'Есть свободное время', 'rgb(47, 125, 87)'],
    ['few', 'Последние места', 'rgb(201, 74, 36)'],
    ['full', 'Мест нет', 'rgb(74, 79, 102)'],
  ])('names status "%s" in words: «%s»', async (status, text, dotColor) => {
    const screen = await render(<Badge status={status} />);
    const badge = screen.getByText(text).element();
    const dot = badge.querySelector('[aria-hidden="true"]');
    if (!dot) throw new Error('status dot not found');

    expect(getComputedStyle(dot).backgroundColor).toBe(dotColor);
    expect(dot.getBoundingClientRect().width).toBe(8);
    expect(badge.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
  });

  it('keeps the text on one line in a narrow column', async () => {
    const screen = await render(
      <div style={{ width: 120 }}>
        <Badge status="available" />
      </div>,
    );
    const badge = screen.getByText('Есть свободное время').element();

    expect(getComputedStyle(badge).whiteSpace).toBe('nowrap');
    expect(badge.getBoundingClientRect().height).toBe(32);
  });
});
