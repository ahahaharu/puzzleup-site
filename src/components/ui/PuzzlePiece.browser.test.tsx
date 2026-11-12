import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { PUZZLE_PIECE_PATH, PuzzlePiece } from './PuzzlePiece';

describe('PuzzlePiece', () => {
  it('draws the logo piece in the current text color, hidden from screen readers', async () => {
    const { container } = await render(<PuzzlePiece size={64} className="text-accent" />);
    const svg = container.querySelector('svg');
    const path = svg?.querySelector('path');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getBoundingClientRect().width).toBe(64);
    expect(path?.getAttribute('d')).toBe(PUZZLE_PIECE_PATH);
    expect(getComputedStyle(path ?? container).fill).toBe('rgb(228, 87, 46)');
  });

  it('takes its size from classes when size is not set', async () => {
    const { container } = await render(<PuzzlePiece className="size-10" />);

    expect(container.querySelector('svg')?.getBoundingClientRect().width).toBe(40);
  });
});
