import type { ReactNode } from 'react';

import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { Icon } from '@/components/ui/Icon';

import type { Option } from './form-data';

// Группа чипов формы – поля 3–7 (ТЗ главной, блок 9): подпись – `<legend>`, ошибка и подсказка –
// под чипами. Ошибка связана с каждым чипом: фокус при ошибке встаёт на первый из них.

type ChipGroupProps<T extends string | number> = {
  id: string;
  name: string;
  legend: string;
  type: 'radio' | 'checkbox';
  options: readonly Option<T>[];
  error?: string | undefined;
  /** Подсказка под чипами; меняется по выбору – объявляется дикторам. */
  hint?: ReactNode;
  /** Управляемый выбор; без него – `defaultValues`. */
  checked?: (value: T) => boolean;
  onToggle?: (value: T, checked: boolean) => void;
  /** Повторное нажатие на выбранный чип – только у «Цели» (поле 6). */
  onRepeat?: (value: T) => void;
  defaultValues?: readonly string[];
};

export function ChipGroup<T extends string | number>({
  id,
  name,
  legend,
  type,
  options,
  error,
  hint,
  checked,
  onToggle,
  onRepeat,
  defaultValues,
}: ChipGroupProps<T>) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-caption font-medium text-on-ink-label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const value = String(option.value);
          const control =
            checked === undefined
              ? { defaultChecked: defaultValues?.includes(value) ?? false }
              : {
                  checked: checked(option.value),
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    onToggle?.(option.value, event.currentTarget.checked),
                };
          return (
            <ChoiceChip
              key={value}
              type={type}
              tone="dark"
              name={name}
              value={value}
              {...control}
              onClick={
                onRepeat && checked?.(option.value) ? () => onRepeat(option.value) : undefined
              }
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy || undefined}
            >
              {option.label}
            </ChoiceChip>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-caption text-error-light">
          <Icon name="alert" size={18} className="mt-px" />
          {error}
        </p>
      )}
      <div id={hintId} aria-live="polite" className="text-caption text-on-ink-label empty:hidden">
        {hint}
      </div>
    </fieldset>
  );
}
