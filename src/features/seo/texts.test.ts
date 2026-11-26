import { describe, expect, it } from 'vitest';

import { tutorOgNote } from './texts';

describe('tutorOgNote', () => {
  it('keeps the number with its word', () => {
    expect(tutorOgNote({ from: 5, to: 9 })).toBe('5–9 классы · онлайн');
    expect(tutorOgNote({ from: 7, to: 7 })).toBe('7 класс · онлайн');
    expect(tutorOgNote(null)).toBe('онлайн');
  });
});
