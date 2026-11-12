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

// Значения – ТЗ главной, раздел 2, и docs/design-system.md, раздел 1.
const EXPECTED_COLORS = {
  white: '#ffffff',
  paper: '#f7f4ec',
  'paper-alt': '#efeae0',
  card: '#fbf9f4',
  grid: 'rgb(29 35 64 / 0.06)',
  kraft: '#e9dfc7',
  'kraft-dark': '#d6ccb2',
  'kraft-shadow': '#e2daca',
  ink: '#1d2340',
  'ink-2': '#2e3452',
  'ink-muted': '#4a4f66',
  'on-ink-label': '#c9ccda',
  accent: '#e4572e',
  'accent-strong': '#c94a24',
  'accent-text': '#b23a17',
  'accent-light': '#f2a487',
  error: '#b3261e',
  'error-light': '#ffb4a8',
  focus: '#3a6fd8',
  success: '#2f7d57',
};

/** Наименьший размер роли текста в rem: нижняя граница clamp() или все значения переменной --fs-*. */
function minTextSizes(): Map<string, number> {
  const sizes = new Map<string, number>();
  for (const [, role = '', value = ''] of css.matchAll(/--text-([a-z0-9-]+):\s*([^;]+);/g)) {
    // `--text-*: initial` и параметры ролей (`--text-h2--line-height`) – не размеры.
    if (role === '*' || role.includes('--')) continue;
    const fsVar = /^var\((--fs-[a-z]+)\)$/.exec(value)?.[1];
    const candidates = fsVar
      ? [...css.matchAll(new RegExp(`${fsVar}:\\s*([0-9.]+)rem;`, 'g'))].map(([, rem]) => rem)
      : [/^clamp\(([0-9.]+)rem,/.exec(value)?.[1] ?? /^([0-9.]+)rem$/.exec(value)?.[1]];
    if (candidates.length === 0 || candidates.some((rem) => rem === undefined)) {
      throw new Error(`Cannot read the size of --text-${role}: ${value}`);
    }
    sizes.set(role, Math.min(...candidates.map(Number)));
  }
  return sizes;
}

describe('design tokens', () => {
  it('match the color values from the spec', () => {
    expect(Object.fromEntries(colors)).toEqual(EXPECTED_COLORS);
  });

  it('keep every text role at 14 px or larger and fields at 16 px or larger', () => {
    const sizes = minTextSizes();

    expect(sizes.size).toBeGreaterThan(0);
    for (const [role, rem] of sizes) {
      expect(rem, `--text-${role}`).toBeGreaterThanOrEqual(0.875);
    }
    expect(sizes.get('field')).toBeGreaterThanOrEqual(1);
  });

  describe.each(pairs)('%s', (foreground, backgrounds, min) => {
    it.each(backgrounds)(`on %s has contrast ≥ ${min}:1`, (background) => {
      expect(contrastRatio(token(foreground), token(background))).toBeGreaterThanOrEqual(min);
    });
  });
});
