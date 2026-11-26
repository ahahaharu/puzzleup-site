import { describe, expect, it } from 'vitest';

import { bindShortWords } from './OgImage';

describe('bindShortWords', () => {
  it('glues short prepositions to the next word', () => {
    expect(bindShortWords('Онлайн-репетиторы по математике и физике для 5–11 классов')).toBe(
      'Онлайн-репетиторы по математике и физике для 5–11 классов',
    );
  });

  it('leaves words that merely end with a preposition', () => {
    expect(bindShortWords('репетитор математики')).toBe('репетитор математики');
  });
});
