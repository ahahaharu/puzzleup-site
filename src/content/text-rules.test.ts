import { describe, expect, it } from 'vitest';

import { checkText } from './text-rules';

const matches = (text: string) => checkText(text).map((violation) => violation.match);

describe('checkText: wording', () => {
  it.each([
    ['Мы подберём репетитора', ['Мы', 'подберём']],
    ['Наши репетиторы', ['Наши']],
    ['Команда центра', ['Команда', 'центра']],
    ['Онлайн-школа', ['школа']],
    ['Компания PuzzleUp', ['Компания']],
    ['Гарантируем результат', ['Гарантируем']],
    ['Поймёт с первого раза', ['с первого раза']],
    ['Опытный преподаватель и педагог', ['педагог', 'Опытный преподаватель']],
    ['Находим пробелы и решаем задачи', ['Находим', 'решаем']],
    ['© PuzzleUp', ['© PuzzleUp']],
  ])('flags «%s»', (text, expected) => {
    expect(matches(text).sort()).toEqual([...expected].sort());
  });

  it.each([
    'Перед первым занятием репетитор просит подтвердить, что ребёнок учится в школе',
    'справку из школы или дневник',
    'Репетитор находит пробелы',
    'Разбор заданий прошлых лет',
    'Математика · 5–11 класс',
    'мысль, умыть, монашка', // «мы» и «наш» – только отдельным словом
  ])('allows «%s»', (text) => {
    expect(checkText(text).filter((violation) => violation.kind === 'wording')).toEqual([]);
  });
});

describe('checkText: typography', () => {
  it('flags a hyphen or em dash used as a dash and straight quotes', () => {
    expect(
      checkText('Пробное - бесплатно — и "без оценок"').map((violation) => violation.kind),
    ).toEqual(['typography', 'typography', 'typography', 'typography']);
  });

  it('allows en dash, «ёлочки», hyphenated words and Markdown lists', () => {
    expect(checkText('Онлайн-занятия – «Налог на профессиональный доход»\n- пункт списка')).toEqual(
      [],
    );
  });
});
