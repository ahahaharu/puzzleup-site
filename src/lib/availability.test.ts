import { describe, expect, it } from 'vitest';

import { withAvailability } from './availability';

describe('withAvailability', () => {
  it('puts the status from the database over the initial one from MDX', () => {
    const tutors = [
      { id: 't-anna', availability: 'available', name: 'Анна' },
      { id: 't-boris', availability: 'few', name: 'Борис' },
    ] as const;
    expect(withAvailability(tutors, { 't-anna': 'full' })).toEqual([
      { id: 't-anna', availability: 'full', name: 'Анна' },
      { id: 't-boris', availability: 'few', name: 'Борис' },
    ]);
  });

  it('keeps the initial statuses without the database', () => {
    const tutors = [{ id: 't-anna', availability: 'few' as const }];
    expect(withAvailability(tutors, {})).toEqual(tutors);
  });
});
