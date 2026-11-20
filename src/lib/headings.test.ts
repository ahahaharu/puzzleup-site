import { describe, expect, it } from 'vitest';

import { anchorId, markdownHeadings } from './headings';

describe('anchorId', () => {
  it('drops the section number and transliterates', () => {
    expect(anchorId('4. Права субъекта')).toBe('prava-subekta');
    expect(anchorId('2.1 Какие данные собираются')).toBe('kakie-dannye-sobirayutsya');
  });

  it('keeps latin words and digits, joins the rest with hyphens', () => {
    expect(anchorId('Cookie «Яндекс Метрики» – 2 года')).toBe('cookie-yandeks-metriki-2-goda');
    expect(anchorId('Щётка, ёж и ў')).toBe('shchetka-ezh-i-u');
  });

  it('returns an empty id for a heading without letters or digits', () => {
    expect(anchorId('1. – «»')).toBe('');
  });
});

describe('markdownHeadings', () => {
  it('lists second-level headings in order', () => {
    const source =
      '# Title\n\nText\n\n## 1. Общие положения\n\n### Подраздел\n\n## 2. Контакты ##\n';
    expect(markdownHeadings(source)).toEqual([
      { id: 'obshchie-polozheniya', title: '1. Общие положения' },
      { id: 'kontakty', title: '2. Контакты' },
    ]);
  });

  it('skips lines inside code blocks', () => {
    expect(markdownHeadings('```\n## Не заголовок\n```\n## Заголовок')).toEqual([
      { id: 'zagolovok', title: 'Заголовок' },
    ]);
  });

  it('returns nothing for a text without sections', () => {
    expect(markdownHeadings('[Текст политики – отдельный документ.]')).toEqual([]);
  });
});
