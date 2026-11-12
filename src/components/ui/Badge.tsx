import type { Availability } from '@/lib/availability';
import { cn } from '@/lib/cn';

// Плашка занятости – ТЗ страницы репетитора, раздел 5; docs/design-system.md, раздел 6; макет T-S-statuses.

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: 'Есть свободное время',
  few: 'Последние места',
  full: 'Мест нет',
};

// Цвет кружка – только подсказка: статус всегда назван словами.
const DOT: Record<Availability, string> = {
  available: 'bg-success',
  few: 'bg-accent-strong',
  full: 'bg-ink-muted',
};

type BadgeProps = {
  status: Availability;
  className?: string;
};

export function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        // Рамка ink 18 % – из макета T-S-statuses.
        'inline-flex min-h-8 items-center gap-2 self-start rounded-full border border-ink/18 bg-paper px-3.5 py-1 text-caption font-medium whitespace-nowrap text-ink',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-2 flex-none rounded-full', DOT[status])} />
      {AVAILABILITY_LABELS[status]}
    </span>
  );
}
