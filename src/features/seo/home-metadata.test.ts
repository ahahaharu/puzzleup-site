import { describe, expect, it } from 'vitest';

import { FIXTURE_ANNA, FIXTURE_IGOR, FIXTURE_SUBJECTS } from '@/features/tutor-page/fixtures';

import { homeMetadata } from './home-metadata';

const MATH = FIXTURE_SUBJECTS.filter((subject) => subject.id === 'math');

describe('homeMetadata', () => {
  it('builds title and description from the hero badge', () => {
    expect(homeMetadata(MATH, [FIXTURE_ANNA, FIXTURE_IGOR])).toEqual({
      title: 'Онлайн-репетиторы по математике для 5–11 классов | PuzzleUp',
      description:
        'Общий сайт независимых репетиторов по математике для 5–11 классов: Анна и Игорь. Занятия онлайн, пробное – 30 минут, бесплатно.',
    });
  });

  it('uses the singular for one tutor and drops names for three or more', () => {
    expect(homeMetadata(MATH, [FIXTURE_ANNA]).title).toBe(
      'Онлайн-репетитор по математике для 5–11 классов | PuzzleUp',
    );
    const many = homeMetadata(FIXTURE_SUBJECTS, [FIXTURE_ANNA, FIXTURE_IGOR, FIXTURE_ANNA]);
    expect(many.description).toBe(
      'Общий сайт независимых репетиторов по математике и физике для 5–11 классов. Занятия онлайн, пробное – 30 минут, бесплатно.',
    );
  });
});
