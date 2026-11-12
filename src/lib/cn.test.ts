import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('joins classes and skips empty values', () => {
    expect(cn('a', false, 'b', undefined, null, '', 'c')).toBe('a b c');
  });

  it('returns an empty string when nothing is set', () => {
    expect(cn(undefined, false)).toBe('');
  });
});
