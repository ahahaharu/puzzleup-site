import { describe, expect, it } from 'vitest';

import { faqItems, tutorsGradesText } from './items';

const SUBJECTS = [{ id: 'math', status: 'active' }] as const;
const TUTORS = [
  { name: 'Андрей', subjects: [{ id: 'math', from: 5, to: 9 }] },
  { name: 'Максим', subjects: [{ id: 'math', from: 5, to: 11 }] },
];

describe('tutorsGradesText', () => {
  it('lists every tutor with their grades', () => {
    expect(tutorsGradesText(TUTORS, SUBJECTS)).toBe(
      'Андрей – с 5–⁠9 классом, Максим – с 5–⁠11 классом',
    );
  });

  it('writes a single grade and skips tutors without active subjects', () => {
    const tutors = [
      { name: 'Анна', subjects: [{ id: 'math', from: 9, to: 9 }] },
      { name: 'Игорь', subjects: [{ id: 'physics', from: 7, to: 11 }] },
    ];
    expect(tutorsGradesText(tutors, SUBJECTS)).toBe('Анна – с 9 классом');
  });
});

describe('faqItems', () => {
  it('fills the placeholders and keeps other answers as they are', () => {
    const items = faqItems(
      [
        { id: 'grades', question: 'С какими классами?', answer: '{tutorsGrades}.' },
        { id: 'other', question: 'Вопрос?', answer: 'Ответ.' },
      ],
      TUTORS,
      SUBJECTS,
    );
    expect(items.map((item) => item.answer)).toEqual([
      'Андрей – с 5–⁠9 классом, Максим – с 5–⁠11 классом.',
      'Ответ.',
    ]);
  });
});
