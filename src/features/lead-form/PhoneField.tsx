'use client';

import type { FocusEvent, FormEvent } from 'react';

import { Field } from '@/components/ui/Field';
import { maskPhoneInput, nationalDigits, PHONE_PREFIX } from '@/lib/phone';

import { LABEL_PHONE } from './texts';

// Телефон с маской +375 (XX) XXX-XX-XX – ТЗ главной, блок 9, поле 2. Поле неуправляемое: маска
// правит значение прямо в DOM до того, как его прочитает Conform. Фокус в пустом поле подставляет
// «+375 (»: видно, что код страны уже есть; набранный по привычке «+375» маска не дублирует. Без
// JavaScript родитель вводит номер в любом виде – сервер приводит его к E.164 той же функцией.

type PhoneFieldProps = {
  id: string;
  name: string;
  defaultValue?: string | undefined;
  error?: string | undefined;
};

function mask(event: FormEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  const { value, caret } = maskPhoneInput(input.value, input.selectionStart ?? input.value.length);
  if (value === input.value) return;
  input.value = value;
  input.setSelectionRange(caret, caret);
}

function prefill(event: FocusEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  if (input.value !== '') return;
  input.value = PHONE_PREFIX;
  // Клик ставит каретку после фокуса – в конец её переносит следующий кадр.
  requestAnimationFrame(() => input.setSelectionRange(PHONE_PREFIX.length, PHONE_PREFIX.length));
}

/** Без цифр номера поле пустеет: снова виден плейсхолдер, проверка скажет «Укажите номер». */
function clearPrefix(event: FocusEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  if (nationalDigits(input.value) === '') input.value = '';
}

export function PhoneField({ id, name, defaultValue, error }: PhoneFieldProps) {
  return (
    <Field
      id={id}
      name={name}
      label={LABEL_PHONE}
      tone="dark"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      // Шаблон, а не пример номера: пример выглядел бы уже введённым.
      placeholder="+375 (__) ___-__-__"
      defaultValue={defaultValue}
      error={error}
      onFocus={prefill}
      onInput={mask}
      onBlur={clearPrefix}
    />
  );
}
