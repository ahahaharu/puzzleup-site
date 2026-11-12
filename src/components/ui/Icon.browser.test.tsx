import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { Icon, ICON_NAMES } from './Icon';

describe('Icon', () => {
  it.each(ICON_NAMES)('renders "%s" as a hidden 24 px icon in the text color', async (name) => {
    const { container } = await render(<Icon name={name} />);
    const svg = container.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getBoundingClientRect().width).toBe(24);
    expect(svg?.querySelector('path, circle')).not.toBeNull();
    const colored =
      svg?.getAttribute('stroke') === 'currentColor' ||
      svg?.getAttribute('fill') === 'currentColor';
    expect(colored).toBe(true);
  });

  it.each(['telegram', 'viber'] as const)(
    'draws the "%s" brand mark filled, not outlined',
    async (name) => {
      const { container } = await render(<Icon name={name} />);
      const svg = container.querySelector('svg');

      expect(svg?.getAttribute('fill')).toBe('currentColor');
      expect(svg?.hasAttribute('stroke')).toBe(false);
    },
  );

  it('draws interface icons as 1.7 px lines', async () => {
    const { container } = await render(<Icon name="arrow-right" />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('fill')).toBe('none');
    expect(svg?.getAttribute('stroke-width')).toBe('1.7');
  });

  it('takes size and stroke width', async () => {
    const { container } = await render(<Icon name="check" size={18} strokeWidth={2.2} />);
    const svg = container.querySelector('svg');

    expect(svg?.getBoundingClientRect().width).toBe(18);
    expect(svg?.getAttribute('stroke-width')).toBe('2.2');
  });
});
