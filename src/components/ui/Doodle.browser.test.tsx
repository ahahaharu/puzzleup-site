import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { Doodle, DOODLE_SHAPES } from './Doodle';

describe('Doodle', () => {
  it.each(DOODLE_SHAPES)('draws "%s" as hidden decoration', async (shape) => {
    await page.viewport(1280, 800);
    const { container } = await render(<Doodle shape={shape} size={100} />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
    expect(getComputedStyle(svg ?? container).pointerEvents).toBe('none');
    expect(svg?.getBoundingClientRect().width).toBe(100);
  });

  it('is hidden on phones unless asked otherwise', async () => {
    await page.viewport(360, 740);
    const { container } = await render(
      <>
        <Doodle shape="circle" />
        <Doodle shape="cube" hideOnMobile={false} />
      </>,
    );
    const [hidden, shown] = container.querySelectorAll('svg');

    expect(getComputedStyle(hidden ?? container).display).toBe('none');
    expect(getComputedStyle(shown ?? container).display).not.toBe('none');
  });
});
