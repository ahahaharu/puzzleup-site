import { describe, expect, it } from 'vitest';

import { formatPhone, maskPhoneInput, nationalDigits, parsePhone } from './phone';

describe('parsePhone', () => {
  it.each([
    '+375 (29) 000-00-00',
    '+375290000000',
    '375290000000',
    '8 029 000-00-00',
    '80290000000',
    '0290000000',
    '29 000 00 00',
  ])('normalizes %s to E.164', (value) => {
    expect(parsePhone(value)).toEqual({ ok: true, e164: '+375290000000' });
  });

  it('accepts every mobile code 25, 29, 33, 44', () => {
    for (const code of ['25', '29', '33', '44']) {
      expect(parsePhone(`+375 (${code}) 000-00-00`)).toEqual({
        ok: true,
        e164: `+375${code}0000000`,
      });
    }
  });

  it('reports an empty value', () => {
    expect(parsePhone('')).toEqual({ ok: false, problem: 'empty' });
    expect(parsePhone('+ ( ) -')).toEqual({ ok: false, problem: 'empty' });
    // Начало маски без цифр номера.
    expect(parsePhone('+375 (')).toEqual({ ok: false, problem: 'empty' });
  });

  it('reports an incomplete number', () => {
    expect(parsePhone('+375 (29) 12')).toEqual({ ok: false, problem: 'incomplete' });
    expect(parsePhone('+37529000000')).toEqual({ ok: false, problem: 'incomplete' });
    expect(parsePhone('+375 (29) 000-00-00 1')).toEqual({ ok: false, problem: 'incomplete' });
  });

  it('reports a code that is not a mobile operator', () => {
    expect(parsePhone('+375 (17) 000-00-00')).toEqual({ ok: false, problem: 'unknown_code' });
  });
});

describe('formatPhone', () => {
  it('adds separators only before the next digit', () => {
    expect(formatPhone('')).toBe('');
    expect(formatPhone('2')).toBe('+375 (2');
    expect(formatPhone('29')).toBe('+375 (29');
    expect(formatPhone('290')).toBe('+375 (29) 0');
    expect(formatPhone('290000')).toBe('+375 (29) 000-0');
    expect(formatPhone('29000000')).toBe('+375 (29) 000-00-0');
    expect(formatPhone('290000000')).toBe('+375 (29) 000-00-00');
  });
});

describe('nationalDigits', () => {
  it('keeps the first typed digit and drops extra digits', () => {
    expect(nationalDigits('8')).toBe('8');
    expect(nationalDigits('+375 (29) 000-00-001')).toBe('290000000');
  });

  it('drops a full number pasted into the masked field', () => {
    expect(nationalDigits('+375 (+375 29 000-00-00')).toBe('290000000');
    expect(nationalDigits('+375 (8 029 000-00-00')).toBe('290000000');
  });
});

describe('maskPhoneInput', () => {
  it('formats as the parent types and keeps the caret at the end', () => {
    expect(maskPhoneInput('2', 1)).toEqual({ value: '+375 (2', caret: 7 });
    expect(maskPhoneInput('+375 (290', 9)).toEqual({ value: '+375 (29) 0', caret: 11 });
  });

  it('deletes the separator together with the digit after it', () => {
    expect(maskPhoneInput('+375 (29) ', 10)).toEqual({ value: '+375 (29', caret: 8 });
  });

  it('keeps the start of the mask without digits and lets it be erased', () => {
    expect(maskPhoneInput('+375 (', 6)).toEqual({ value: '+375 (', caret: 6 });
    expect(maskPhoneInput('+375 ', 5)).toEqual({ value: '+375 ', caret: 5 });
    expect(maskPhoneInput('', 0)).toEqual({ value: '', caret: 0 });
  });

  it('does not repeat the country code the parent types out of habit', () => {
    // Фокус подставил «+375 (», родитель набирает «+375 29…».
    let value = '+375 (';
    for (const key of '+375291234567') {
      value = maskPhoneInput(value + key, value.length + 1).value;
    }
    expect(value).toBe('+375 (29) 123-45-67');
  });

  it('accepts the country code typed into an empty field', () => {
    let value = '';
    for (const key of '+375291234567') {
      value = maskPhoneInput(value + key, value.length + 1).value;
    }
    expect(value).toBe('+375 (29) 123-45-67');
  });

  it('drops the trunk prefix 8 0 typed before the code', () => {
    let value = '+375 (';
    for (const key of '80291234567') {
      value = maskPhoneInput(value + key, value.length + 1).value;
    }
    expect(value).toBe('+375 (29) 123-45-67');
  });

  it('keeps the caret after the same digit when editing in the middle', () => {
    // Стёрта «1» в «+375 (29) 123-45-67»: каретка остаётся после «29».
    expect(maskPhoneInput('+375 (29) 23-45-67', 10)).toEqual({
      value: '+375 (29) 234-56-7',
      caret: 8,
    });
  });

  it('normalizes a pasted number', () => {
    expect(maskPhoneInput('80290000000', 11)).toEqual({
      value: '+375 (29) 000-00-00',
      caret: 19,
    });
  });
});
