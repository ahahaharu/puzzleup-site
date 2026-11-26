import type { ReactNode } from 'react';

import { PUZZLE_PIECE_PATH } from '@/components/ui/PuzzlePiece';

import { OG_SIZE } from '../metadata';
import { withAlpha, type OgColors } from './assets';

export { OG_SIZE };

// Шаблоны OG-картинок 1200×630 для `next/og` – макет P-og: фон в клетку, слева вклейка, справа
// текст, в правом нижнем углу логотип. Только то, что умеет `next/og`: flex-раскладка, стили
// в `style`, цвета в hex и rgba. Главная – тот же шаблон, вместо фото – деталь пазла (ADR-055).

const DISPLAY = 'Unbounded';
const TEXT = 'Golos Text';

function Logo({ colors }: { colors: OgColors }) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 56,
        bottom: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <svg width="44" height="44" viewBox="0 0 120 120">
        <path d={PUZZLE_PIECE_PATH} fill={colors.accent} />
      </svg>
      <span
        style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, letterSpacing: '-0.01em' }}
      >
        PuzzleUp
      </span>
    </div>
  );
}

function Frame({
  colors,
  left,
  children,
}: {
  colors: OgColors;
  left: ReactNode;
  children: ReactNode;
}) {
  const grid = withAlpha(colors.ink, 0.06);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 64,
        padding: '0 80px',
        backgroundColor: colors.paper,
        backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        fontFamily: TEXT,
        color: colors.ink,
      }}
    >
      <div style={{ width: 360, flex: 'none', display: 'flex', position: 'relative' }}>{left}</div>
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}
      >
        {children}
      </div>
      <Logo colors={colors} />
    </div>
  );
}

function Heading({ children, size }: { children: string; size: number }) {
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.03em',
      }}
    >
      {children}
    </div>
  );
}

/** Короткий предлог или союз не висит в конце строки: «по\u00a0математике», «и\u00a0физике». */
export function bindShortWords(text: string): string {
  return text.replace(/(^|\s)(по|для|и|в|с)\s+/gu, '$1$2\u00a0');
}

function Subheading({ children }: { children: string }) {
  return (
    <div style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 32, lineHeight: 1.25 }}>
      {bindShortWords(children)}
    </div>
  );
}

function Note({ children, colors }: { children: string; colors: OgColors }) {
  return <div style={{ fontSize: 24, color: colors['ink-2'] }}>{children}</div>;
}

type TutorOgProps = {
  colors: OgColors;
  name: string;
  /** «репетитор по математике». */
  role: string;
  /** «5–9 классы · онлайн». */
  note: string;
  /** Фото как data URI; без фото – инициал на kraft, как на странице. */
  photo?: string | undefined;
};

export function TutorOg({ colors, name, role, note, photo }: TutorOgProps) {
  const initial = name.trim().charAt(0).toUpperCase();
  const pasted = (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        padding: 12,
        backgroundColor: colors.white,
        boxShadow: `0 2px 6px ${withAlpha(colors.ink, 0.15)}`,
        transform: 'rotate(-1.5deg)',
      }}
    >
      <div
        style={{
          width: 336,
          height: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.kraft,
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 96,
          color: withAlpha(colors.ink, 0.4),
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- картинка `next/og`, не страница
          <img src={photo} width={336} height={420} style={{ objectFit: 'cover' }} />
        ) : (
          initial
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          left: -18,
          top: -8,
          width: 70,
          height: 22,
          backgroundColor: withAlpha(colors.accent, 0.35),
          transform: 'rotate(-35deg)',
        }}
      />
    </div>
  );

  return (
    <Frame colors={colors} left={pasted}>
      <Heading size={88}>{name}</Heading>
      <Subheading>{role}</Subheading>
      <Note colors={colors}>{note}</Note>
    </Frame>
  );
}

type HomeOgProps = {
  colors: OgColors;
  slogan: string;
  /** «Онлайн-репетиторы по математике для 5–11 классов». */
  title: string;
  /** «Андрей и Максим»; при трёх и более репетиторах – пусто. */
  names: string;
};

export function HomeOg({ colors, slogan, title, names }: HomeOgProps) {
  const piece = (
    <svg width="360" height="360" viewBox="0 0 120 120" style={{ transform: 'rotate(-8deg)' }}>
      <path d={PUZZLE_PIECE_PATH} fill={colors.accent} />
    </svg>
  );

  return (
    <Frame colors={colors} left={piece}>
      <Heading size={72}>{slogan}</Heading>
      <Subheading>{title}</Subheading>
      {names ? <Note colors={colors}>{names}</Note> : null}
    </Frame>
  );
}
