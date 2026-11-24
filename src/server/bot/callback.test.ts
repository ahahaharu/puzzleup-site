import { describe, expect, it } from 'vitest';

import { callbackData, parseCallback } from './callback';

describe('parseCallback', () => {
  it.each([
    [callbackData.status(1024, 'contacted'), { kind: 'status', leadId: 1024, status: 'contacted' }],
    [callbackData.reject(1024), { kind: 'reject', leadId: 1024 }],
    [callbackData.reason(1024, 'schedule'), { kind: 'reason', leadId: 1024, reason: 'schedule' }],
    [callbackData.back(1024), { kind: 'back', leadId: 1024 }],
    [callbackData.add('grade', 7), { kind: 'add', step: 'grade', value: '7' }],
    [
      callbackData.availability('t-anna', 'full'),
      { kind: 'availability', tutorId: 't-anna', status: 'full' },
    ],
  ])('reads %s', (data, expected) => {
    expect(parseCallback(data)).toEqual(expected);
  });

  it.each([
    '',
    'st:1024',
    'st:1024:done',
    'st:abc:new',
    'st:-1:new',
    'rr:1024:rude',
    'rj:1024:x',
    'add:grade',
    'xx:1',
    'st:1:new:1',
    'av:t-anna',
    'av:t-anna:busy',
    'av:anna:full',
  ])('ignores %j', (data) => {
    expect(parseCallback(data)).toBeUndefined();
  });

  it('fits the longest data into 64 bytes', () => {
    expect(
      Buffer.byteLength(callbackData.status(9_999_999_999, 'trial_scheduled')),
    ).toBeLessThanOrEqual(64);
    expect(
      Buffer.byteLength(callbackData.availability(`t-${'a'.repeat(40)}`, 'available')),
    ).toBeLessThanOrEqual(64);
  });
});
