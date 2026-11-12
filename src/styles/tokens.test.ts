import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { contrastRatio, parseThemeColors } from '@/lib/theme-tokens';

// Контраст пар из docs/design-system.md, раздел 1. Порог WCAG 2.2 AA:
// 4,5 – обычный текст, 3 – текст от 24 px, элементы интерфейса и кольцо фокуса.
const TEXT = 4.5;
const LARGE_OR_UI = 3;

const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');
const colors = new Map(parseThemeColors(css).map(({ name, value }) => [name, value]));

function token(name: string): string {
  const value = colors.get(name);
  if (value === undefined) throw new Error(`Token --color-${name} is missing in globals.css`);
  return value;
}

const lightBackgrounds = ['paper', 'paper-alt', 'card'];

const pairs: [foreground: string, backgrounds: string[], min: number][] = [
  ['ink', lightBackgrounds, TEXT],
  ['ink-2', lightBackgrounds, TEXT],
  ['ink-muted', lightBackgrounds, TEXT],
  ['accent-text', lightBackgrounds, TEXT],
  ['error', lightBackgrounds, TEXT],
  ['accent', ['paper'], LARGE_OR_UI],
  ['accent-strong', ['paper'], LARGE_OR_UI],
  ['success', ['paper', 'card'], LARGE_OR_UI],
  ['focus', [...lightBackgrounds, 'ink'], LARGE_OR_UI],
  ['paper', ['ink', 'ink-2'], TEXT],
  ['on-ink-label', ['ink'], TEXT],
  ['accent-light', ['ink'], TEXT],
  ['error-light', ['ink'], TEXT],
  ['white', ['accent-strong'], TEXT],
];

describe('design tokens', () => {
  it('declares every color from the design system', () => {
    expect([...colors.keys()]).toEqual(
      expect.arrayContaining([
        'paper',
        'paper-alt',
        'card',
        'grid',
        'kraft',
        'kraft-dark',
        'kraft-shadow',
        'ink',
        'ink-2',
        'ink-muted',
        'on-ink-label',
        'accent',
        'accent-strong',
        'accent-text',
        'accent-light',
        'error',
        'error-light',
        'focus',
        'success',
        'white',
      ]),
    );
  });

  describe.each(pairs)('%s', (foreground, backgrounds, min) => {
    it.each(backgrounds)(`on %s has contrast ≥ ${min}:1`, (background) => {
      expect(contrastRatio(token(foreground), token(background))).toBeGreaterThanOrEqual(min);
    });
  });
});
