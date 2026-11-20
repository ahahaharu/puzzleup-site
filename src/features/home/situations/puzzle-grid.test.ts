import { describe, expect, it } from 'vitest';

import { ctaSpan, knobs } from './puzzle-grid';

describe('knobs', () => {
  it('links five cards and the call to action in a 3 × 2 grid as in the mockup', () => {
    // 01 02 03
    // 04 05 CTA
    expect([0, 1, 2, 3, 4, 5].map((index) => knobs(index, 5, 3))).toEqual([
      { right: true, bottom: true },
      { right: true, bottom: true },
      { right: false, bottom: true },
      { right: true, bottom: false },
      { right: true, bottom: false },
      { right: false, bottom: false },
    ]);
  });

  it('knobs into the wide call to action from the row above', () => {
    // 01 02 03
    // 04 CTA CTA
    expect(knobs(1, 4, 3)).toEqual({ right: true, bottom: true });
    expect(knobs(2, 4, 3)).toEqual({ right: false, bottom: true });
    expect(knobs(3, 4, 3)).toEqual({ right: true, bottom: false });
  });

  it('chains a ribbon into one row', () => {
    expect([0, 1, 2].map((index) => knobs(index, 2, 3))).toEqual([
      { right: true, bottom: false },
      { right: true, bottom: false },
      { right: false, bottom: false },
    ]);
  });
});

describe('ctaSpan', () => {
  it('fills the rest of the last row', () => {
    expect(ctaSpan(5, 3)).toBe(1);
    expect(ctaSpan(4, 3)).toBe(2);
    expect(ctaSpan(3, 3)).toBe(3);
    expect(ctaSpan(4, 2)).toBe(2);
    expect(ctaSpan(5, 2)).toBe(1);
  });
});
