import type { CSSProperties } from 'react';

import { cn } from '@/lib/cn';

import { PuzzlePiece } from './PuzzlePiece';

// Логотип – деталь accent и «PuzzleUp» Unbounded 700; docs/design-system.md, раздел 6; макет ds/Logo.

type LogoProps = {
  /** Сторона детали в px (26 в шапке); слово и зазор масштабируются от неё, как на холсте. */
  size?: number;
  /**
   * Размер слова в px, если он не следует пропорции холста: в десктопной шапке и подвале деталь
   * 32 px, слово 22 px и зазор 12 px (ТЗ главной, блок 0; макеты X-header-d, D-10-footer).
   * Зазор тогда считается от слова.
   */
  wordSize?: number;
  /** `paper` – на тёмном фоне. */
  tone?: 'ink' | 'paper';
  className?: string;
};

type LogoStyle = CSSProperties & Record<'--logo-word' | '--logo-gap', string>;

/** Слово «PuzzleUp» – текст, поэтому ссылка с логотипом получает доступное имя без aria-label. */
export function Logo({ size = 26, wordSize, tone = 'ink', className }: LogoProps) {
  // Пропорции холста (ds/Logo): слово – 0,73 стороны детали, зазор – 0,46; слово не мельче 14 px.
  const style: LogoStyle =
    wordSize !== undefined
      ? { '--logo-word': `${wordSize}px`, '--logo-gap': `${(wordSize * 12) / 22}px` }
      : { '--logo-word': `${size * 0.73}px`, '--logo-gap': `${size * 0.46}px` };

  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center gap-(--logo-gap)',
        tone === 'ink' ? 'text-ink' : 'text-paper',
        className,
      )}
    >
      <PuzzlePiece size={size} className="text-accent" />
      <span className="font-display text-[max(0.875rem,var(--logo-word))] leading-none font-bold tracking-[-0.01em] whitespace-nowrap">
        PuzzleUp
      </span>
    </span>
  );
}
