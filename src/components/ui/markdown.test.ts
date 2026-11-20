import { describe, expect, it } from 'vitest';

import { parseMarkdown } from './Markdown';

describe('parseMarkdown', () => {
  it('splits paragraphs on blank lines', () => {
    expect(parseMarkdown('Первый.\n\nВторой.\n  \nТретий.')).toEqual([
      [{ kind: 'text', text: 'Первый.' }],
      [{ kind: 'text', text: 'Второй.' }],
      [{ kind: 'text', text: 'Третий.' }],
    ]);
  });

  it('finds bold text and links inside a paragraph', () => {
    expect(parseMarkdown('Да. **Важно:** см. [политику](/privacy).')).toEqual([
      [
        { kind: 'text', text: 'Да. ' },
        { kind: 'strong', text: 'Важно:' },
        { kind: 'text', text: ' см. ' },
        { kind: 'link', text: 'политику', href: '/privacy' },
        { kind: 'text', text: '.' },
      ],
    ]);
  });

  it('leaves plain text and placeholders alone', () => {
    expect(parseMarkdown('[Текст отзыва]')).toEqual([[{ kind: 'text', text: '[Текст отзыва]' }]]);
    expect(parseMarkdown('')).toEqual([]);
  });
});
