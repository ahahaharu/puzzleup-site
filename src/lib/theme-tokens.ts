/**
 * Чтение цветовых токенов из `@theme` в globals.css и контраст по WCAG 2.2.
 * Используется витриной /dev/tokens и тестом контраста токенов.
 */

export type ThemeColor = { name: string; value: string };

const THEME_BLOCK = /@theme\b[^{]*\{([^}]*)\}/g;
const COLOR_DECLARATION = /--color-([a-z0-9-]+)\s*:\s*([^;]+);/g;
const HEX = /^#([0-9a-f]{6})$/i;

/**
 * Цвета в порядке объявления; сброс `--color-*: initial` пропускается.
 * Блок `@theme` читается до первой `}`: вложенные правила (`@keyframes`) ставить после цветов.
 */
export function parseThemeColors(css: string): ThemeColor[] {
  const colors: ThemeColor[] = [];
  for (const [, block = ''] of css.matchAll(THEME_BLOCK)) {
    for (const [, name = '', value = ''] of block.matchAll(COLOR_DECLARATION)) {
      if (name === '*') continue;
      colors.push({ name, value: value.trim() });
    }
  }
  return colors;
}

export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

function channel(hex: string, offset: number): number {
  const srgb = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color: string): number {
  const match = HEX.exec(color);
  if (!match?.[1]) throw new Error(`Expected #rrggbb, got "${color}"`);
  const hex = match[1];
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 2) + 0.0722 * channel(hex, 4);
}

/** Контраст двух непрозрачных цветов `#rrggbb`, от 1 до 21. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
