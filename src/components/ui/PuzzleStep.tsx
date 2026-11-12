import { useId, type CSSProperties, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { puzzleStepPath, type StepLeft, type StepRight } from './puzzle-step-path';

// Деталь-шаг – docs/design-system.md, раздел 6; макет ds/PuzzleStep. Детали цепочки стоят вплотную:
// выступ правой грани входит в паз левой грани следующей детали.

export type StepTone = 'cell' | 'sand' | 'ink' | 'accent';

const TONES: Record<StepTone, { fill: string; text: string; number: string }> = {
  cell: { fill: '', text: 'text-ink', number: 'text-accent-text' },
  sand: { fill: 'fill-kraft', text: 'text-ink', number: 'text-accent-text' },
  ink: { fill: 'fill-ink', text: 'text-paper', number: 'text-accent-light' },
  // Белый на accent-strong – 4,7:1.
  accent: { fill: 'fill-accent-strong', text: 'text-white', number: 'text-white' },
};

type PuzzleStepProps = {
  n: string;
  title: ReactNode;
  children?: ReactNode;
  tone?: StepTone;
  left?: StepLeft;
  right?: StepRight;
  /** Уровень заголовка шага – по иерархии секции. */
  as?: 'h3' | 'h4';
  /** Пропорции детали; ширина – по контейнеру. По умолчанию 280×250, как на холсте. */
  width?: number;
  height?: number;
  className?: string;
};

export function PuzzleStep({
  n,
  title,
  children,
  tone = 'cell',
  left = 'flat',
  right = 'knob',
  as: Heading = 'h3',
  width = 280,
  height = 250,
  className,
}: PuzzleStepProps) {
  const patternId = `step-cell-${useId()}`;
  const colors = TONES[tone];
  const style: CSSProperties & Record<'--step-ratio', string> = {
    '--step-ratio': `${width} / ${height}`,
  };

  return (
    <div style={style} className={cn('relative aspect-(--step-ratio) w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 size-full overflow-visible"
      >
        {tone === 'cell' && (
          <defs>
            {/* Клетка, как у paper-cell: 24 px, focus 22 %. */}
            <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
              <rect width="24" height="24" className="fill-(--paper-cell)" />
              <path d="M24 0 L0 0 0 24" fill="none" className="stroke-focus/22" strokeWidth="1" />
            </pattern>
          </defs>
        )}
        {/* Светлый шов 3 px между деталями цепочки. */}
        <path
          d={puzzleStepPath(width, height, left, right)}
          fill={tone === 'cell' ? `url(#${patternId})` : undefined}
          className={cn('stroke-paper', colors.fill)}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className={cn(
          'relative flex size-full flex-col justify-center gap-3 py-6 pr-7',
          // Паз уходит внутрь детали – текст сдвинут правее него.
          left === 'socket' ? 'pl-14' : 'pl-7',
          colors.text,
        )}
      >
        {/* Номер – декор: порядок шагов задаёт список <ol> вокруг деталей. */}
        <span
          aria-hidden="true"
          className={cn('font-hand text-hand-md leading-none italic', colors.number)}
        >
          {n}
        </span>
        {/* Межстрочный 1,15 и трекинг −0,01em – из макета ds/PuzzleStep: заголовок в узкой детали. */}
        <Heading className="font-display text-h3 leading-[1.15] tracking-[-0.01em]">
          {title}
        </Heading>
        {children && <p className="text-small">{children}</p>}
      </div>
    </div>
  );
}
