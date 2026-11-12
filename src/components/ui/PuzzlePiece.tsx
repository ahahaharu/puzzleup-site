import { cn } from '@/lib/cn';

// Деталь пазла из логотипа – docs/design-system.md, раздел 6. Цвет – из `currentColor`.
export const PUZZLE_PIECE_PATH =
  'M20,28 A8,8 0 0 1 28,20 L48,20 C44,8 52,2 60,2 C68,2 76,8 72,20 L92,20 A8,8 0 0 1 100,28 L100,48 C112,44 118,52 118,60 C118,68 112,76 100,72 L100,92 A8,8 0 0 1 92,100 L72,100 C76,88 68,82 60,82 C52,82 44,88 48,100 L28,100 A8,8 0 0 1 20,92 Z';

type PuzzlePieceProps = {
  /** Сторона в px; без него размер задаётся классами. */
  size?: number;
  className?: string;
};

/** Декоративная деталь: скрыта от дикторов. */
export function PuzzlePiece({ size, className }: PuzzlePieceProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn('flex-none', className)}
    >
      <path d={PUZZLE_PIECE_PATH} fill="currentColor" />
    </svg>
  );
}
