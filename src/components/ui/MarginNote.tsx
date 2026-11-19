import type { CSSProperties } from 'react';

import { cn } from '@/lib/cn';

// «Пометка на полях» – формула от руки: docs/design-system.md, раздел 6 (Margins); ТЗ главной,
// раздел 2 «Компоненты»; макет D-1-hero. Декор: скрыт от дикторов и от мыши.

const SIZES = {
  sm: 'text-hand-sm',
  md: 'text-hand-md',
  lg: 'text-hand-lg',
} as const;

type NoteStyle = CSSProperties & Record<'--note-opacity', number>;

type MarginNoteProps = {
  /** Формула: «D = b² − 4ac». */
  children: string;
  size?: keyof typeof SIZES;
  /** Прозрачность чернил, по ДС – 0,35–0,45. */
  opacity?: number;
  /** На телефоне пометки наезжают на текст – по умолчанию видны только от md. */
  hideOnMobile?: boolean;
  /** Положение и поворот ±3–4° – классами (`absolute -z-10 left-… -rotate-3`). */
  className?: string;
};

export function MarginNote({
  children,
  size = 'md',
  opacity = 0.35,
  hideOnMobile = true,
  className,
}: MarginNoteProps) {
  // Прозрачность – переменной: inline-стиль допустим только для CSS-переменных (conventions).
  const style: NoteStyle = { '--note-opacity': opacity };

  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        'pointer-events-none font-hand whitespace-nowrap text-ink italic opacity-(--note-opacity) select-none',
        SIZES[size],
        hideOnMobile && 'max-md:hidden',
        className,
      )}
    >
      {children}
    </span>
  );
}
