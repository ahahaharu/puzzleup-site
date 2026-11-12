import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { Chip, type ChipVariant } from './Chip';

describe('Chip', () => {
  it.each<[ChipVariant, string, string]>([
    ['solid', 'rgb(29, 35, 64)', 'rgb(247, 244, 236)'],
    ['outline', 'rgb(247, 244, 236)', 'rgb(29, 35, 64)'],
    ['kraft', 'rgb(233, 223, 199)', 'rgb(29, 35, 64)'],
  ])('variant "%s" fills %s with %s text', async (variant, background, color) => {
    const screen = await render(<Chip variant={variant}>Математика · 5–9 класс</Chip>);
    const style = getComputedStyle(screen.getByText('Математика · 5–9 класс').element());

    expect(style.backgroundColor).toBe(background);
    expect(style.color).toBe(color);
  });

  it('variant "dashed" has a dashed border and no fill', async () => {
    const screen = await render(<Chip variant="dashed">и другие предметы</Chip>);
    const style = getComputedStyle(screen.getByText('и другие предметы').element());

    expect(style.borderTopStyle).toBe('dashed');
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('is fully rounded, 14 px and never wraps', async () => {
    const screen = await render(
      <div style={{ width: 80 }}>
        <Chip>Онлайн · 5–11 класс</Chip>
      </div>,
    );
    const style = getComputedStyle(screen.getByText('Онлайн · 5–11 класс').element());

    expect(style.fontSize).toBe('14px');
    expect(style.whiteSpace).toBe('nowrap');
    expect(Number.parseFloat(style.borderTopLeftRadius)).toBeGreaterThan(100);
  });
});
