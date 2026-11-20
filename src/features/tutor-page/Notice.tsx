import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

// Плашка на kraft – ушедший репетитор над профилем и лист ожидания над формой (ТЗ страницы
// репетитора, раздел 5); макеты T-S-archived, T-S-formfull, TM-S-*.

// Текст 16 px на телефоне и 18 px на десктопе – из макетов T-S-archived и TM-S-archived.
export function Notice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-card border border-ink/15 bg-kraft px-5 py-4 text-field leading-normal text-ink lg:px-7 lg:py-5 lg:text-[1.125rem]',
        className,
      )}
    >
      <Icon name="alert" size={22} />
      <p>{children}</p>
    </div>
  );
}
