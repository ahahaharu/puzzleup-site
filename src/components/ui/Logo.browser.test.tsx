import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { Logo } from './Logo';

describe('Logo', () => {
  it('gives a wrapping link the name «PuzzleUp» and hides the piece', async () => {
    const screen = await render(
      <a href="#top">
        <Logo />
      </a>,
    );
    const link = screen.getByRole('link', { name: 'PuzzleUp' });
    const piece = link.element().querySelector('svg');

    await expect.element(link).toBeVisible();
    expect(piece?.getAttribute('aria-hidden')).toBe('true');
    // Деталь – accent, слово – ink.
    expect(getComputedStyle(piece ?? link.element()).color).toBe('rgb(228, 87, 46)');
  });

  it('scales the word from the piece size as on the canvas', async () => {
    const screen = await render(<Logo size={40} tone="paper" />);
    const word = screen.getByText('PuzzleUp').element();
    const style = getComputedStyle(word);

    expect(Number.parseFloat(style.fontSize)).toBeCloseTo(29.2, 1);
    expect(getComputedStyle(word.parentElement ?? word).color).toBe('rgb(247, 244, 236)');
  });
});
