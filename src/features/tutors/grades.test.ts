import { describe, expect, it } from 'vitest';

import { gradesRange, tutorGrades } from './grades';

const SUBJECTS = [
  { id: 'math', status: 'active' },
  { id: 'physics', status: 'active' },
  { id: 'chemistry', status: 'hidden' },
] as const;

describe('tutorGrades', () => {
  it('spans every active subject of the tutor', () => {
    const tutor = {
      subjects: [
        { id: 'math', from: 5, to: 9 },
        { id: 'physics', from: 7, to: 11 },
      ],
    };
    expect(tutorGrades(tutor, SUBJECTS)).toEqual({ from: 5, to: 11 });
  });

  it('ignores hidden subjects', () => {
    const tutor = {
      subjects: [
        { id: 'math', from: 5, to: 9 },
        { id: 'chemistry', from: 8, to: 11 },
      ],
    };
    expect(tutorGrades(tutor, SUBJECTS)).toEqual({ from: 5, to: 9 });
    expect(tutorGrades({ subjects: [{ id: 'chemistry', from: 8, to: 11 }] }, SUBJECTS)).toBeNull();
  });
});

describe('gradesRange', () => {
  it('keeps a range on one line and shows a single grade as is', () => {
    expect(gradesRange({ from: 5, to: 9 })).toBe('5–⁠9');
    expect(gradesRange({ from: 9, to: 9 })).toBe('9');
  });
});
