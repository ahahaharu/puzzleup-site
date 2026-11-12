import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Icon } from './Icon';

// Поле ввода – ТЗ главной, раздел 2 «Компоненты» и раздел 9 «Проверка полей»;
// docs/design-system.md, раздел 6; макеты ds/DS-States, X-form-errors, T-6-form.

type Tone = 'light' | 'dark';

type CommonProps = {
  /** Связывает подпись, подсказку и ошибку; id подсказки и ошибки – `${id}-hint`, `${id}-error`. */
  id: string;
  /** Подпись всегда над полем: плейсхолдер её не заменяет. */
  label: ReactNode;
  hint?: ReactNode;
  /** Текст ошибки из ТЗ; есть – поле помечено `aria-invalid`. */
  error?: string | undefined;
  /** `dark` – на тёмной детали формы: подписи on-ink-label, ошибка error-light. */
  tone?: Tone;
  className?: string;
};

type InputFieldProps = CommonProps &
  Omit<ComponentProps<'input'>, keyof CommonProps | 'children'> & { multiline?: false };

type TextareaFieldProps = CommonProps &
  Omit<ComponentProps<'textarea'>, keyof CommonProps | 'children'> & { multiline: true };

export type FieldProps = InputFieldProps | TextareaFieldProps;

const LABEL: Record<Tone, string> = { light: 'text-ink', dark: 'text-on-ink-label' };
const HINT: Record<Tone, string> = { light: 'text-ink-muted', dark: 'text-on-ink-label' };
const ERROR_TEXT: Record<Tone, string> = { light: 'text-error', dark: 'text-error-light' };
const ERROR_BORDER: Record<Tone, string> = {
  light: 'border-2 border-error',
  dark: 'border-2 border-error-light',
};

// Поле светлое на любом фоне. 52 px, рамка 1,5 px ink 30 % – из ДС; текст 16 px, чтобы iOS не масштабировал.
const CONTROL =
  'w-full rounded-field bg-paper px-4 text-field text-ink placeholder:text-ink-muted disabled:opacity-40';

function InputControl({ multiline, ...props }: ComponentProps<'input'> & { multiline?: false }) {
  return <input {...props} />;
}

function TextareaControl({
  multiline,
  ...props
}: ComponentProps<'textarea'> & { multiline: true }) {
  return <textarea {...props} />;
}

export function Field({
  id,
  label,
  hint,
  error,
  tone = 'light',
  className,
  ...control
}: FieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  const shared = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
    className: cn(
      CONTROL,
      error ? ERROR_BORDER[tone] : 'border-[1.5px] border-ink/30',
      control.multiline ? 'min-h-32 resize-y py-3.5 leading-normal' : 'h-13',
    ),
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className={cn('text-caption font-medium', LABEL[tone])}>
        {label}
      </label>
      {control.multiline ? (
        <TextareaControl {...control} {...shared} />
      ) : (
        <InputControl {...control} {...shared} />
      )}
      {hint && (
        <p id={hintId} className={cn('text-caption', HINT[tone])}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={cn('flex items-start gap-1.5 text-caption', ERROR_TEXT[tone])}>
          {/* Ошибка – иконкой и текстом, а не только цветом рамки. */}
          <Icon name="alert" size={18} className="mt-px" />
          {error}
        </p>
      )}
    </div>
  );
}
