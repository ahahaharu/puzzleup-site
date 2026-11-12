import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Icon } from './Icon';

// Чип выбора – ТЗ главной, раздел 2 «Компоненты»; docs/design-system.md, раздел 6; макеты ds/DS-States, T-6-form.

type ChoiceChipProps = Omit<ComponentProps<'input'>, 'type' | 'className' | 'children'> & {
  /** `radio` – один выбор в группе, `checkbox` – несколько. */
  type: 'radio' | 'checkbox';
  /** `dark` – на тёмной детали формы: невыбранный светлый контур, выбранный – заливка paper. */
  tone?: 'light' | 'dark';
  className?: string;
  children: ReactNode;
};

// Рамка 1,5 px – из ДС, в шкале Tailwind такой ширины нет.
const TONES = {
  light:
    'border-ink/25 text-ink hover:border-ink/60 has-checked:border-ink has-checked:bg-ink has-checked:text-paper',
  dark: 'border-paper/35 text-paper hover:border-paper/70 has-checked:border-paper has-checked:bg-paper has-checked:text-ink',
} as const;

/**
 * Нативный `radio`/`checkbox` внутри `<label>`: выбор, клавиатура и отправка формы работают
 * без JavaScript. Выбранный отличается заливкой и галочкой, а не только цветом.
 * Кольцо фокуса рисуется на чипе: сам инпут визуально скрыт; `relative` держит его внутри
 * чипа, иначе фокус прокручивал бы страницу к началу.
 */
export function ChoiceChip({
  type,
  tone = 'light',
  className,
  children,
  ...inputProps
}: ChoiceChipProps) {
  return (
    <label
      className={cn(
        'relative inline-flex h-11 flex-none cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-4.5 text-field font-medium whitespace-nowrap select-none',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
        'has-disabled:cursor-not-allowed has-disabled:opacity-40',
        TONES[tone],
        className,
      )}
    >
      <input type={type} className="peer sr-only" {...inputProps} />
      {/* Толщина 2,2 – как у галочки чипа в макете DS-States. */}
      <Icon name="check" size={18} strokeWidth={2.2} className="hidden peer-checked:block" />
      {children}
    </label>
  );
}
