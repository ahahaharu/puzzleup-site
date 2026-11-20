import { describe, expect, it } from 'vitest';

import { situationCards } from './cards';

const TUTORS = [
  { id: 't-andrei', slug: 'andrei', name: 'Андрей', goals: ['grades', 'exam9'] },
  { id: 't-maxim', slug: 'maxim', name: 'Максим', goals: ['grades', 'exam9', 'ct'] },
] as const satisfies Parameters<typeof situationCards>[1];

const situation = (id: string, goal: 'grades' | 'ct' | 'olymp', tutors?: string[]) => ({
  id,
  title: id,
  text: 'Текст.',
  goal,
  ...(tutors ? { tutors } : {}),
});

describe('situationCards', () => {
  it('links every tutor with the goal to their form with goal and entry', () => {
    const [card] = situationCards([situation('grades', 'grades')], TUTORS);
    expect(card?.tutors).toEqual([
      { slug: 'andrei', name: 'Андрей', href: '/tutors/andrei?entry=situations&goal=grades#lead' },
      { slug: 'maxim', name: 'Максим', href: '/tutors/maxim?entry=situations&goal=grades#lead' },
    ]);
  });

  it('keeps only the tutors named in the card', () => {
    const [card] = situationCards([situation('grades', 'grades', ['t-maxim'])], TUTORS);
    expect(card?.tutors.map((tutor) => tutor.name)).toEqual(['Максим']);
  });

  it('hides a card nobody works with and numbers the rest in order', () => {
    const cards = situationCards(
      [situation('a', 'grades'), situation('olymp', 'olymp'), situation('ct', 'ct')],
      TUTORS,
    );
    expect(cards.map((card) => [card.id, card.number])).toEqual([
      ['a', '01'],
      ['ct', '02'],
    ]);
  });

  it('drops a named tutor who has left the site', () => {
    expect(situationCards([situation('a', 'grades', ['t-anna'])], TUTORS)).toEqual([]);
  });
});
