import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { MarginNote } from './MarginNote';

describe('MarginNote', () => {
  it('writes a formula in faded hand script, hidden from screen readers', async () => {
    await page.viewport(1280, 800);
    const { container } = await render(<MarginNote>D = b² − 4ac</MarginNote>);
    const note = container.querySelector('span');
    const style = getComputedStyle(note ?? container);

    expect(note?.textContent).toBe('D = b² − 4ac');
    expect(note?.getAttribute('aria-hidden')).toBe('true');
    expect(style.fontStyle).toBe('italic');
    expect(style.pointerEvents).toBe('none');
    expect(Number(style.opacity)).toBeCloseTo(0.35, 2);
    expect(Number.parseFloat(style.fontSize)).toBeGreaterThanOrEqual(16);
  });

  it('is hidden on phones unless asked otherwise', async () => {
    await page.viewport(360, 740);
    const { container } = await render(
      <>
        <MarginNote>sin²α + cos²α = 1</MarginNote>
        <MarginNote hideOnMobile={false}>D = b² − 4ac</MarginNote>
      </>,
    );
    const [hidden, shown] = container.querySelectorAll('span');

    expect(getComputedStyle(hidden ?? container).display).toBe('none');
    expect(getComputedStyle(shown ?? container).display).not.toBe('none');
  });
});
