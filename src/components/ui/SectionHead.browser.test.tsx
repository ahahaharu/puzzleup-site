import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { SectionHead } from './SectionHead';

describe('SectionHead', () => {
  it('renders an H2 with the lead; the accent dot is not part of the name', async () => {
    const screen = await render(
      <SectionHead id="how-title" title="Как это работает" lead="Пять шагов." dot number="01" />,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Как это работает' });

    await expect.element(heading).toHaveAttribute('id', 'how-title');
    await expect.element(screen.getByText('Пять шагов.')).toBeVisible();
    // H2 на 360 px – 30 px (clamp даёт 30,0002 из-за округления).
    expect(Number.parseFloat(getComputedStyle(heading.element()).fontSize)).toBeCloseTo(30, 2);
  });

  it('can be the page H1 and omits empty parts', async () => {
    const screen = await render(<SectionHead as="h1" title="Страница не найдена" />);

    await expect.element(screen.getByRole('heading', { level: 1 })).toBeVisible();
    expect(screen.container.querySelector('p')).toBeNull();
  });
});
