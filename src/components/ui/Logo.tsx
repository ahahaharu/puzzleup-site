import type { CSSProperties } from 'react';

import { cn } from '@/lib/cn';

import { PuzzlePiece } from './PuzzlePiece';

// Логотип – деталь accent и «PuzzleUp» Unbounded 700; docs/design-system.md, раздел 6; макет ds/Logo.

type LogoProps = {
  /** Сторона детали в px (26 в шапке); слово и зазор масштабируются от неё, как на холсте. */
  size?: number;
  /** `paper` – на тёмном фоне. */
  tone?: 'ink' | 'paper';
  className?: string;
};

/** Слово «PuzzleUp» – текст, поэтому ссылка с логотипом получает доступное имя без aria-label. */
export function Logo({ size = 26, tone = 'ink', className }: LogoProps) {
  const style: CSSProperties & Record<'--logo', string> = { '--logo': `${size}px` };

  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center gap-[calc(var(--logo)*0.46)]',
        tone === 'ink' ? 'text-ink' : 'text-paper',
        className,
      )}
    >
      <PuzzlePiece size={size} className="text-accent" />
      {/* Пропорции слова – из макета ds/Logo: 0,73 стороны детали, но не мельче 14 px. */}
      <span className="font-display text-[max(0.875rem,calc(var(--logo)*0.73))] leading-none font-bold tracking-[-0.01em] whitespace-nowrap">
        PuzzleUp
      </span>
    </span>
  );
}
