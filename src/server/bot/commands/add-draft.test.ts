import { describe, expect, it } from 'vitest';

import { directory } from '../fixtures';
import { addOptions, applyAnswer, nextStep, NO_GOAL } from './add-draft';

const [anna, oleg] = directory.tutors;
if (!anna || !oleg) throw new Error('fixtures');

describe('/add draft', () => {
  it('goes through the steps in the order of the spec', () => {
    let draft = { messageId: 1 };
    for (const [step, value] of [
      ['source', 'telegram'],
      ['grade', '10'],
      ['subject', 'physics'],
      ['goal', 'ct'],
    ] as const) {
      expect(nextStep(draft)).toBe(step);
      draft = applyAnswer(step, anna, draft, value) ?? draft;
    }
    expect(draft).toEqual({
      messageId: 1,
      source: 'telegram',
      grade: 10,
      subject: 'physics',
      goal: 'ct',
    });
    expect(nextStep(draft)).toBe('referral');
  });

  it('picks the only subject for the grade by itself', () => {
    expect(applyAnswer('grade', anna, { messageId: 1, source: 'call' }, '5')).toMatchObject({
      grade: 5,
      subject: 'math',
    });
    expect(applyAnswer('grade', anna, { messageId: 1, source: 'call' }, '8')).not.toHaveProperty(
      'subject',
    );
  });

  it('offers the grades and goals of the tutor', () => {
    expect(addOptions('grade', oleg, { messageId: 1 })).toEqual(['5', '6', '7', '8', '9']);
    expect(addOptions('subject', anna, { messageId: 1, grade: 8 })).toEqual(['math', 'physics']);
    expect(addOptions('goal', oleg, { messageId: 1 })).toEqual(['grades', 'exam9', NO_GOAL]);
  });

  it('stores «Не указана» as no goal', () => {
    expect(applyAnswer('goal', oleg, { messageId: 1 }, NO_GOAL)).toEqual({
      messageId: 1,
      goal: null,
    });
  });

  it.each([
    ['source', 'form'],
    ['grade', '10'],
    ['goal', 'ct'],
    ['referral', 'radio'],
  ] as const)('rejects %s %s the tutor does not offer', (step, value) => {
    expect(applyAnswer(step, oleg, { messageId: 1 }, value)).toBeUndefined();
  });
});
