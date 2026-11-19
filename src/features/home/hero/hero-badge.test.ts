import { describe, expect, it } from 'vitest';

import { heroBadge } from './hero-badge';

const subject = (
  nameDativeWithPrep: string,
  gradeFrom: number,
  gradeTo: number,
  status: 'active' | 'hidden' = 'active',
) => ({ nameDativeWithPrep, gradeFrom, gradeTo, status });

const MATH = subject('по математике', 5, 11);
const PHYSICS = subject('по физике', 7, 11);
const CHEMISTRY = subject('по химии', 8, 11);
const ENGLISH = subject('по английскому языку', 1, 11);

const ANDREI = { name: 'Андрей' };
const MAXIM = { name: 'Максим' };
const IVAN = { name: 'Иван' };

describe('heroBadge', () => {
  it('builds the badge from the current content', () => {
    expect(heroBadge([MATH, subject('по физике', 7, 11, 'hidden')], [ANDREI, MAXIM])).toBe(
      'Онлайн-репетиторы по математике для 5–11 классов: Андрей и Максим',
    );
  });

  it('lists up to three subjects and takes grades across all of them', () => {
    expect(heroBadge([PHYSICS, MATH], [ANDREI, MAXIM])).toBe(
      'Онлайн-репетиторы по физике и по математике для 5–11 классов: Андрей и Максим',
    );
    expect(heroBadge([PHYSICS, CHEMISTRY, ENGLISH], [ANDREI, MAXIM])).toBe(
      'Онлайн-репетиторы по физике, по химии и по английскому языку для 1–11 классов: Андрей и Максим',
    );
  });

  it('counts subjects when there are more than three', () => {
    expect(heroBadge([MATH, PHYSICS, CHEMISTRY, ENGLISH], [ANDREI, MAXIM])).toBe(
      'Онлайн-репетиторы по 4 предметам для 1–11 классов: Андрей и Максим',
    );
  });

  it('declines the subject count', () => {
    const many = (count: number) =>
      Array.from({ length: count }, (_, index) => subject(`по предмету ${index}`, 5, 11));

    expect(heroBadge(many(5), [ANDREI, MAXIM])).toContain('по 5 предметам');
    expect(heroBadge(many(11), [ANDREI, MAXIM])).toContain('по 11 предметам');
    expect(heroBadge(many(21), [ANDREI, MAXIM])).toContain('по 21 предмету');
  });

  it('ignores hidden subjects', () => {
    expect(heroBadge([MATH, subject('по физике', 7, 12, 'hidden')], [ANDREI, MAXIM])).toBe(
      'Онлайн-репетиторы по математике для 5–11 классов: Андрей и Максим',
    );
  });

  it('names a single grade in the singular', () => {
    expect(heroBadge([subject('по математике', 9, 9)], [ANDREI, MAXIM])).toBe(
      'Онлайн-репетиторы по математике для 9 класса: Андрей и Максим',
    );
  });

  it('uses the singular for one tutor', () => {
    expect(heroBadge([MATH], [ANDREI])).toBe(
      'Онлайн-репетитор по математике для 5–11 классов: Андрей',
    );
  });

  it('drops names for three or more tutors', () => {
    expect(heroBadge([MATH], [ANDREI, MAXIM, IVAN])).toBe(
      'Онлайн-репетиторы по математике для 5–11 классов',
    );
  });

  it('omits subjects and grades when no subject is active', () => {
    expect(heroBadge([subject('по физике', 7, 11, 'hidden')], [ANDREI, MAXIM])).toBe(
      'Онлайн-репетиторы: Андрей и Максим',
    );
  });
});
