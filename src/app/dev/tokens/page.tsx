import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

import { contrastRatio, isHexColor, parseThemeColors } from '@/lib/theme-tokens';

// Витрина токенов ДС для разработки. В production-сборке маршрута нет: страница отдаёт 404.

export const metadata: Metadata = {
  title: 'Токены дизайн-системы',
  robots: { index: false, follow: false },
};

async function readThemeCss() {
  'use cache';
  return readFile(path.join(process.cwd(), 'src/styles/globals.css'), 'utf8');
}

const TYPE_ROLES = [
  {
    className: 'font-display text-slogan',
    spec: 'text-slogan · Unbounded 700 · 48 → 96',
    sample: 'Всё сложится.',
  },
  {
    className: 'font-display text-name',
    spec: 'text-name · Unbounded 700 · 34 → 64',
    sample: 'Андрей',
  },
  {
    className: 'font-display text-h2',
    spec: 'text-h2 · Unbounded 700 · 30 → 48',
    sample: 'Как это работает',
  },
  {
    className: 'font-display text-h3',
    spec: 'text-h3 · Unbounded 500 · 19 → 22',
    sample: 'Пробное занятие',
  },
  {
    className: 'text-lead',
    spec: 'text-lead · Golos 400 · 18 / 20 от lg',
    sample: 'Репетитор находит пробелы в теме и объясняет её заново – по шагам.',
  },
  {
    className: 'text-body',
    spec: 'text-body · Golos 400 · 16 / 17 от lg',
    sample: 'Родитель выбирает репетитора и оставляет заявку на бесплатное пробное занятие.',
  },
  {
    className: 'text-small',
    spec: 'text-small · Golos 400 · 15',
    sample: 'Математика · 5–9 класс',
  },
  {
    className: 'text-caption',
    spec: 'text-caption · Golos 400/500 · 14',
    sample: 'Подпись под полем',
  },
  {
    className: 'text-button',
    spec: 'text-button · Golos 600 · 16 / 17 от lg',
    sample: 'Выбрать репетитора',
  },
  { className: 'text-field', spec: 'text-field · Golos 400 · 16', sample: '+375 29 000-00-00' },
  {
    className: 'font-hand italic text-hand-sm',
    spec: 'text-hand-sm · Spectral Italic · 16 → 18',
    sample: 'x² − 5x + 6 = 0',
  },
  {
    className: 'font-hand italic text-hand-md',
    spec: 'text-hand-md · Spectral Italic · 20 → 26',
    sample: 'a² + b² = c²',
  },
  {
    className: 'font-hand italic text-hand-lg',
    spec: 'text-hand-lg · Spectral Italic · 24 → 34',
    sample: '01 · 02 · 03',
  },
];

const PAPERS = [
  { className: 'paper-page', label: 'Фон страницы', hint: 'paper-page · клетка 24 / 32 px' },
  { className: 'paper-cell', label: 'Клетка', hint: 'paper-cell' },
  { className: 'paper-mm', label: 'Миллиметровка', hint: 'paper-mm' },
  { className: 'paper-lined', label: 'Линейка с полями', hint: 'paper-lined' },
  { className: 'paper-slanted', label: 'Косая линейка', hint: 'paper-slanted' },
  { className: 'paper-staff', label: 'Нотный стан', hint: 'paper-staff' },
  { className: 'paper-margin', label: 'Чистый лист с полями', hint: 'paper-margin' },
  { className: 'paper-plain', label: 'Чистый лист', hint: 'paper-plain' },
];

const RADII = [
  { className: 'rounded-field', label: 'rounded-field · 10' },
  { className: 'rounded-button', label: 'rounded-button · 12' },
  { className: 'rounded-card', label: 'rounded-card · 16' },
  { className: 'rounded-piece', label: 'rounded-piece · 20' },
  { className: 'rounded-full', label: 'rounded-full · чипы' },
];

const GRID_CELLS = Array.from({ length: 12 }, (_, index) => index + 1);

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-6">
      <h2 className="font-display text-h3 text-ink">{title}</h2>
      {children}
    </section>
  );
}

// Цвет образца – из токена; имя класса из данных не собрать, поэтому CSS-переменная.
function swatchStyle(name: string): CSSProperties {
  const style: CSSProperties & Record<'--swatch', string> = { '--swatch': `var(--color-${name})` };
  return style;
}

function formatRatio(foreground: string, background: string | undefined) {
  if (background === undefined || !isHexColor(foreground) || !isHexColor(background)) return '–';
  return `${contrastRatio(foreground, background).toFixed(1).replace('.', ',')}:1`;
}

export default async function TokensPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const colors = parseThemeColors(await readThemeCss());
  const byName = new Map(colors.map(({ name, value }) => [name, value]));
  const paper = byName.get('paper');
  const ink = byName.get('ink');

  return (
    <main className="page-container flex flex-col gap-14 py-14 lg:gap-24 lg:py-24">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-h2 text-ink">Токены дизайн-системы</h1>
        <p className="max-w-3xl text-lead">
          Витрина для разработки: значения читаются из <code>src/styles/globals.css</code>. Описание
          – <code>docs/design-system.md</code>.
        </p>
      </header>

      <Section id="colors" title="Цвета">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {colors.map(({ name, value }) => (
            <li
              key={name}
              className="flex gap-3 rounded-card border border-ink/12 bg-card p-3"
              style={swatchStyle(name)}
            >
              <span
                aria-hidden="true"
                className="size-16 flex-none rounded-field border border-ink/12 bg-(--swatch)"
              />
              <span className="flex flex-col gap-0.5 text-caption">
                <span className="font-semibold text-ink">{name}</span>
                <span>{value}</span>
                <span className="text-ink-muted">
                  на paper {formatRatio(value, paper)} · на ink {formatRatio(value, ink)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="type" title="Шрифты и роли текста">
        <ul className="flex flex-col gap-6 rounded-card border border-ink/12 bg-card p-5 lg:p-6">
          {TYPE_ROLES.map(({ className, spec, sample }) => (
            <li key={spec} className="flex flex-col gap-1">
              <span className="text-caption text-ink-muted">{spec}</span>
              <span className={`${className} text-ink`}>{sample}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="papers" title="Бумага">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PAPERS.map(({ className, label, hint }) => (
            <li key={className} className="flex flex-col gap-2">
              <span
                aria-hidden="true"
                className={`${className} block h-40 rounded-sm border border-ink/15 shadow-paper`}
              />
              <span className="font-semibold text-ink">{label}</span>
              <span className="text-caption text-ink-muted">{hint}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="shapes" title="Скругления и тени">
        <ul className="flex flex-wrap gap-6">
          {RADII.map(({ className, label }) => (
            <li key={className} className="flex flex-col items-start gap-2">
              <span aria-hidden="true" className={`${className} block h-14 w-24 bg-ink`} />
              <span className="text-caption">{label}</span>
            </li>
          ))}
          <li className="flex flex-col items-start gap-2">
            <span
              aria-hidden="true"
              className="block h-14 w-24 rounded-card bg-card shadow-paper"
            />
            <span className="text-caption">shadow-paper</span>
          </li>
          <li className="flex flex-col items-start gap-2">
            <span
              aria-hidden="true"
              className="block h-14 w-24 rounded-piece bg-accent shadow-flying"
            />
            <span className="text-caption">shadow-flying</span>
          </li>
        </ul>
      </Section>

      <Section id="grid" title="Сетка">
        <p className="text-caption text-ink-muted">
          page-grid: 4 колонки до 768 px, 8 – до 1024 px, 12 – дальше. Контейнер page-container –
          поля 16 / 32 / 48 / 64 px, от 1280 px ширина 1152 px.
        </p>
        <div aria-hidden="true" className="page-grid gap-y-4">
          {GRID_CELLS.map((cell) => (
            <span
              key={cell}
              className="flex h-16 items-center justify-center rounded-field bg-accent/15 font-hand text-hand-sm text-accent-text italic"
            >
              {cell}
            </span>
          ))}
        </div>
      </Section>

      <Section id="focus" title="Фокус">
        <p className="text-caption text-ink-muted">
          Нажмите Tab: кольцо 2 px цвета focus с отступом 2 px на светлом и на тёмном фоне.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="#focus"
            className="inline-flex min-h-12 items-center rounded-button bg-ink px-6 text-button text-paper hover:bg-ink-2"
          >
            Ссылка-кнопка
          </a>
          {/* Рамка 1,5 px – из ДС (Button secondary), в шкале Tailwind такой ширины нет. */}
          <button
            type="button"
            className="inline-flex min-h-12 items-center rounded-button border-[1.5px] border-ink px-6 text-button text-ink"
          >
            Кнопка
          </button>
          <span className="inline-flex rounded-piece bg-ink p-4">
            <a href="#focus" className="text-accent-light underline">
              Ссылка на тёмном
            </a>
          </span>
        </div>
      </Section>
    </main>
  );
}
