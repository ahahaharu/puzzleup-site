import { describe, expect, it } from 'vitest';

import { contrastRatio, isHexColor, parseThemeColors } from './theme-tokens';

describe('parseThemeColors', () => {
  it('reads colors from every @theme block in declaration order', () => {
    const css = `
      @import 'tailwindcss';
      @theme static {
        --color-*: initial;
        --color-paper: #f7f4ec;
        --color-grid: rgb(29 35 64 / 0.06);
      }
      @theme inline { --font-sans: var(--font-golos), sans-serif; }
      @theme { --color-ink:#1d2340; --radius-card: 16px; }
    `;

    expect(parseThemeColors(css)).toEqual([
      { name: 'paper', value: '#f7f4ec' },
      { name: 'grid', value: 'rgb(29 35 64 / 0.06)' },
      { name: 'ink', value: '#1d2340' },
    ]);
  });

  it('ignores color variables outside @theme', () => {
    const css = `:root { --color-local: #000000; } @theme { --color-paper: #f7f4ec; }`;

    expect(parseThemeColors(css)).toEqual([{ name: 'paper', value: '#f7f4ec' }]);
  });
});

describe('isHexColor', () => {
  it('accepts only opaque #rrggbb', () => {
    expect(isHexColor('#1D2340')).toBe(true);
    expect(isHexColor('#fff')).toBe(false);
    expect(isHexColor('rgb(29 35 64 / 0.06)')).toBe(false);
  });
});

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
    // #767676 на белом – известная граница AA, 4,54:1.
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#1d2340', '#f7f4ec')).toBe(contrastRatio('#f7f4ec', '#1d2340'));
  });

  it('rejects non-hex input', () => {
    expect(() => contrastRatio('red', '#ffffff')).toThrow('Expected #rrggbb');
  });
});
