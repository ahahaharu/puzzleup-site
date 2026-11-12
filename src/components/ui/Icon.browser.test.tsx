import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { Icon, ICON_NAMES } from './Icon';

describe('Icon', () => {
  it.each(ICON_NAMES)('renders "%s" as a hidden 24 px line icon', async (name) => {
    const { container } = await render(<Icon name={name} />);
    const svg = container.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getBoundingClientRect().width).toBe(24);
    expect(svg?.querySelector('path, circle')).not.toBeNull();
  });

  it('takes size and stroke width', async () => {
    const { container } = await render(<Icon name="check" size={18} strokeWidth={2.2} />);
    const svg = container.querySelector('svg');

    expect(svg?.getBoundingClientRect().width).toBe(18);
    expect(svg?.getAttribute('stroke-width')).toBe('2.2');
  });
});
