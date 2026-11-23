import { describe, expect, it } from 'vitest';

import {
  contactMethodSchema,
  contactTimeSchema,
  leadSourceSchema,
  leadStatusSchema,
  referralChannelSchema,
  rejectionReasonSchema,
} from './lead';

// Значения хранятся в базе (pgEnum) и Таблице: переименование – только миграцией.
describe('lead enums match docs/data-model.md', () => {
  it.each([
    ['ContactMethod', contactMethodSchema, ['telegram', 'viber', 'call']],
    ['ContactTime', contactTimeSchema, ['morning', 'day', 'evening', 'any']],
    ['LeadSource', leadSourceSchema, ['form', 'telegram', 'viber', 'call', 'other']],
    [
      'LeadStatus',
      leadStatusSchema,
      [
        'new',
        'contacted',
        'no_answer',
        'trial_scheduled',
        'trial_done',
        'student',
        'rejected',
        'waitlist',
      ],
    ],
    [
      'RejectionReason',
      rejectionReasonSchema,
      ['expensive', 'schedule', 'chose_other', 'no_response', 'other'],
    ],
    [
      'ReferralChannel',
      referralChannelSchema,
      ['instagram', 'tiktok', 'telegram', 'word_of_mouth', 'search', 'other'],
    ],
  ] as const)('%s', (_, schema, values) => {
    expect(schema.options).toEqual(values);
  });
});
