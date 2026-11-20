import { describe, expect, it } from 'vitest';

import type { Subject } from '@/content';

import { subjectCards, subjectColumns } from './cards';

const subject = (id: string, name: string, status: Subject['status'] = 'active'): Subject => ({
  id,
  name,
  nameAccusative: name,
  nameDativeWithPrep: `по ${name}`,
  gradeFrom: 5,
  gradeTo: 11,
  topics: ['дроби и проценты', 'уравнения', 'геометрия', 'ЦТ и ЦЭ'],
  formula: 'x² − 5x + 6 = 0',
  paper: 'cell',
  status,
});

const TUTORS = [
  { slug: 'andrei', name: 'Андрей', subjects: [{ id: 'math', from: 5, to: 9 }] },
  { slug: 'maxim', name: 'Максим', subjects: [{ id: 'math', from: 5, to: 11 }] },
];

describe('subjectCards', () => {
  it('builds the card from the subject and the tutors who teach it', () => {
    const [card] = subjectCards([subject('math', 'математика')], TUTORS);

    expect(card).toMatchObject({
      title: 'Математика',
      grades: '5–⁠11 класс',
      topics: ['Дроби и проценты', 'уравнения', 'геометрия', 'ЦТ и ЦЭ'],
      ctaLabel: 'Выбрать репетитора по математика',
      // Один предмет – вкладок фильтра нет, кнопка просто ведёт к репетиторам.
      ctaHref: '#tutors',
    });
    expect(card?.tutors).toEqual([
      { slug: 'andrei', name: 'Андрей', grades: '5–⁠9 класс', href: '/tutors/andrei' },
      { slug: 'maxim', name: 'Максим', grades: '5–⁠11 класс', href: '/tutors/maxim' },
    ]);
  });

  it('skips hidden subjects and subjects nobody teaches', () => {
    const cards = subjectCards(
      [subject('math', 'м'), subject('physics', 'ф', 'hidden'), subject('chemistry', 'х')],
      TUTORS,
    );
    expect(cards.map((card) => card.id)).toEqual(['math']);
  });

  it('turns on the subject filter when there are several subjects', () => {
    const tutors = [
      ...TUTORS,
      { slug: 'anna', name: 'Анна', subjects: [{ id: 'physics', from: 7, to: 11 }] },
    ];
    const cards = subjectCards([subject('math', 'м'), subject('physics', 'ф')], tutors);
    expect(cards.map((card) => card.ctaHref)).toEqual([
      '/?subject=math#tutors',
      '/?subject=physics#tutors',
    ]);
  });
});

describe('subjectColumns', () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 2],
    [5, 3],
    [6, 3],
  ])('%i subjects → %i columns', (count, columns) => {
    expect(subjectColumns(count)).toBe(columns);
  });
});
