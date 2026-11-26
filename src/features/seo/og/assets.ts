import 'server-only';

import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

import { isHexColor, parseThemeColors } from '@/lib/theme-tokens';

// Шрифты, цвета и фото для OG-картинок. Картинки рисуются при сборке, файлы читаются с диска:
// `next/og` не видит `next/font` и не читает woff2 – шрифты лежат в `assets/fonts` в TTF
// (OFL, лицензии рядом). Цвета – из `@theme` в globals.css, как у страниц (ADR-055).
// Чтение синхронное: с Cache Components асинхронный ввод-вывод без кэша делает обработчик
// динамическим, и картинка рисовалась бы на каждый запрос, а не при сборке.

const ROOT = process.cwd();

type OgFont = { name: string; data: Buffer; weight: 400 | 500 | 700; style: 'normal' };

export function ogFonts(): OgFont[] {
  const font = (file: string, name: string, weight: OgFont['weight']): OgFont => ({
    name,
    data: readFileSync(join(ROOT, 'assets/fonts', file)),
    weight,
    style: 'normal',
  });
  return [
    font('Unbounded-Medium.ttf', 'Unbounded', 500),
    font('Unbounded-Bold.ttf', 'Unbounded', 700),
    font('GolosText-Regular.ttf', 'Golos Text', 400),
  ];
}

export type OgColors = {
  paper: string;
  kraft: string;
  white: string;
  ink: string;
  'ink-2': string;
  accent: string;
};

export function ogColors(): OgColors {
  const css = readFileSync(join(ROOT, 'src/styles/globals.css'), 'utf8');
  const colors = new Map(parseThemeColors(css).map((color) => [color.name, color.value]));
  const token = (name: keyof OgColors) => {
    const value = colors.get(name);
    if (!value || !isHexColor(value)) throw new Error(`OG image: no hex token --color-${name}`);
    return value;
  };
  return {
    paper: token('paper'),
    kraft: token('kraft'),
    white: token('white'),
    ink: token('ink'),
    'ink-2': token('ink-2'),
    accent: token('accent'),
  };
}

/** `#1d2340`, 0.06 → `rgba(29, 35, 64, 0.06)`: `next/og` не понимает `rgb(… / a)` и `color-mix`. */
export function withAlpha(hex: string, alpha: number): string {
  const channel = (offset: number) => Number.parseInt(hex.slice(offset, offset + 2), 16);
  return `rgba(${channel(1)}, ${channel(3)}, ${channel(5)}, ${alpha})`;
}

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

/** Фото из `public/tutors/` как data URI; формат – JPEG или PNG (схема контента). */
export function ogPhoto(fileName: string): string {
  const mime = MIME[extname(fileName).toLowerCase()];
  if (!mime) throw new Error(`OG image: unsupported photo format «${fileName}»`);
  const data = readFileSync(join(ROOT, 'public/tutors', fileName));
  return `data:${mime};base64,${data.toString('base64')}`;
}
