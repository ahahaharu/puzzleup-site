import { describe, expect, it } from 'vitest';

import { fillTemplate, templateKeys } from './template';

describe('templateKeys', () => {
  it('lists unique keys in order', () => {
    expect(templateKeys('{a} и {b2}, снова {a}')).toEqual(['a', 'b2']);
  });

  it('ignores braces that are not placeholders', () => {
    expect(templateKeys('{} { a } {1a} текст')).toEqual([]);
  });
});

describe('fillTemplate', () => {
  it('replaces every occurrence', () => {
    expect(fillTemplate('{name} – {name}', { name: 'Мария' })).toBe('Мария – Мария');
  });

  it('throws on a missing value', () => {
    expect(() => fillTemplate('Привет, {name}', {})).toThrow('{name}');
  });
});
