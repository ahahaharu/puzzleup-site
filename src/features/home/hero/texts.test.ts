import { describe, expect, it } from 'vitest';

import { splitSlogan } from './texts';

describe('splitSlogan', () => {
  it('puts each word on its own line and keeps the final dot apart', () => {
    expect(splitSlogan('Всё сложится.')).toEqual({ lines: ['Всё', 'сложится'], dot: '.' });
  });

  it('works without final punctuation', () => {
    expect(splitSlogan('Всё  сложится')).toEqual({ lines: ['Всё', 'сложится'], dot: '' });
  });
});
