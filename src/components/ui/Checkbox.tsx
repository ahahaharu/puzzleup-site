import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Icon } from './Icon';

// Чекбокс – ТЗ главной, раздел 2 «Компоненты» и раздел 9, поле 9; docs/design-system.md, раздел 6; макет ds/DS-States.

type Tone = 'light' | 'dark';

type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'className' | 'children'> & {
  id: string;
  /** Подпись у галочки; может содержать ссылку. */
  label: ReactNode;
  /** Мелкий текст под подписью, вне `<label>`: связан через `aria-describedby`. */
  description?: ReactNode;
  error?: string | undefined;
  /** `dark` – на тёмной детали формы. */
  tone?: Tone;
  className?: string;
};

// Рамка 1,5 px и скругление 6 px – из макета DS-States, в шкале ДС их нет.
const BOX: Record<Tone, string> = {
  light: 'border-ink/60 text-paper group-has-checked:border-ink group-has-checked:bg-ink',
  dark: 'border-paper/60 text-ink group-has-checked:border-paper group-has-checked:bg-paper',
};
// Отмеченный после ошибки сервера (форма без JS) – та же заливка, что у обычного отмеченного.
const BOX_ERROR: Record<Tone, string> = {
  light: 'border-2 border-error text-paper group-has-checked:bg-ink',
  dark: 'border-2 border-error-light text-ink group-has-checked:bg-paper',
};
const TEXT: Record<Tone, string> = { light: 'text-ink-2', dark: 'text-on-ink-label' };
const ERROR_TEXT: Record<Tone, string> = { light: 'text-error', dark: 'text-error-light' };

/**
 * Квадрат 24 px; зона клика – вся подпись, не меньше 44×44. Нативный инпут визуально скрыт,
 * поэтому кольцо фокуса рисуется на квадрате.
 */
export function Checkbox({
  id,
  label,
  description,
  error,
  tone = 'light',
  className,
  ...inputProps
}: CheckboxProps) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const describedBy = [description ? descriptionId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cn(
          'group relative flex cursor-pointer items-start gap-3 pt-2.5 text-small has-disabled:cursor-not-allowed has-disabled:opacity-40',
          // Мелкий текст и ошибка – на 6 px ниже подписи, как в T-6-form: высоту 44 px тогда держит
          // зона клика вокруг квадрата (::before), а не вся подпись.
          description || error ? 'pb-0' : 'min-h-11 pb-2.5',
          TEXT[tone],
        )}
      >
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...inputProps}
        />
        <span
          aria-hidden="true"
          className={cn(
            'relative grid size-6 flex-none place-items-center rounded-[6px]',
            // Зона клика 44×44 вокруг квадрата 24 px.
            "before:absolute before:-inset-2.5 before:content-['']",
            'group-has-focus-visible:outline-2 group-has-focus-visible:outline-offset-2 group-has-focus-visible:outline-focus',
            error ? BOX_ERROR[tone] : cn('border-[1.5px]', BOX[tone]),
          )}
        >
          <Icon
            name="check"
            size={18}
            strokeWidth={2.5}
            className="hidden group-has-checked:block"
          />
        </span>
        <span className="pt-0.5">{label}</span>
      </label>
      {description && (
        // Отступ слева – ширина квадрата и зазор: текст выровнен по подписи.
        <div id={descriptionId} className={cn('pl-9 text-caption', TEXT[tone])}>
          {description}
        </div>
      )}
      {error && (
        <p
          id={errorId}
          className={cn('flex items-start gap-1.5 pl-9 text-caption', ERROR_TEXT[tone])}
        >
          <Icon name="alert" size={18} className="mt-px" />
          {error}
        </p>
      )}
    </div>
  );
}
