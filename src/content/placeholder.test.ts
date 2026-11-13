import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { findPlaceholders, isPlaceholder, orPlaceholder, placeholderSchema } from './placeholder';

describe('placeholders', () => {
  it('recognises a whole-value placeholder', () => {
    expect(isPlaceholder('[ФИО]')).toBe(true);
    expect(isPlaceholder('Мария [ФИО]')).toBe(false);
    expect(isPlaceholder(2022)).toBe(false);
    expect(placeholderSchema.safeParse('[]').success).toBe(false);
  });

  it('finds placeholders inside text but not Markdown links', () => {
    expect(findPlaceholders('Услуги оказывает [ФИО], УНП [номер]. [Политика](/privacy)')).toEqual([
      '[ФИО]',
      '[номер]',
    ]);
  });

  it('accepts either a valid value or a placeholder', () => {
    const year = orPlaceholder(z.int());
    expect(year.safeParse(2022).success).toBe(true);
    expect(year.safeParse('[год]').success).toBe(true);
    expect(year.safeParse('2022').success).toBe(false);
  });
});
