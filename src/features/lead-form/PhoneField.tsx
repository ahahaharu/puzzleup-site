'use client';

import type { FormEvent } from 'react';

import { Field } from '@/components/ui/Field';
import { maskPhoneInput } from '@/lib/phone';

import { LABEL_PHONE } from './texts';

// Телефон с маской +375 (XX) XXX-XX-XX – ТЗ главной, блок 9, поле 2. Поле неуправляемое: маска
// правит значение прямо в DOM до того, как его прочитает Conform. Без JavaScript родитель вводит
// номер в любом виде – сервер приводит его к E.164 той же функцией.

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
      // Пример формата – из макета T-6-form.
      placeholder="+375 (29) 123-45-67"
      defaultValue={defaultValue}
      error={error}
      onInput={mask}
    />
  );
}
