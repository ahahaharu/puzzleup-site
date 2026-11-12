import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

// Метка-плашка – docs/design-system.md, раздел 6; макеты ds/Chip, T-1-profile (предметы на kraft).

export type ChipVariant = 'solid' | 'dashed' | 'outline' | 'kraft';

// Рамка 1,5 px у `dashed` – из макета ds/Chip, в шкале Tailwind такой ширины нет.
// Отступ и размер текста – в каждом варианте: `cn` не разрешает конфликты классов.
const SMALL = 'py-2 text-caption';
const VARIANTS: Record<ChipVariant, string> = {
  solid: cn(SMALL, 'bg-ink text-paper'),
  dashed: cn(SMALL, 'border-[1.5px] border-dashed border-ink/45 text-ink-2'),
  outline: cn(SMALL, 'border border-ink/25 bg-paper text-ink'),
  // Предметы с классами в профиле репетитора: «Математика · 5–9 класс», 15 px, как в T-1-profile.
  kraft: 'bg-kraft py-1.5 text-small text-ink',
};

type ChipProps = {
  variant?: ChipVariant;
  className?: string;
  children: ReactNode;
};

/** Неинтерактивная метка: предмет, классы, формат занятий. */
export function Chip({ variant = 'solid', className, children }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3.5 font-medium whitespace-nowrap',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
