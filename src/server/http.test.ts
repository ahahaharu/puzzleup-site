import { describe, expect, it } from 'vitest';

import { clientIp, contextFromReferer, isSameOrigin } from './http';

const SITE = 'https://puzzle-up.by';

describe('clientIp', () => {
  it('takes the address added by the nearest proxy', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '10.0.0.1, 203.0.113.7' }))).toBe(
      '203.0.113.7',
    );
    expect(clientIp(new Headers())).toBe('unknown');
  });
});

describe('isSameOrigin', () => {
  it('accepts only the site origin', () => {
    expect(isSameOrigin(new Headers({ origin: SITE }), SITE)).toBe(true);
    expect(isSameOrigin(new Headers({ origin: 'https://evil.example' }), SITE)).toBe(false);
    expect(isSameOrigin(new Headers({ origin: 'null' }), SITE)).toBe(false);
    expect(isSameOrigin(new Headers(), SITE)).toBe(false);
  });
});

describe('contextFromReferer', () => {
  it('reads entry and UTM from the page address of this site', () => {
    const headers = new Headers({
      referer: `${SITE}/tutors/anna?entry=tutors&utm_source=instagram#lead`,
    });
    expect(contextFromReferer(headers, SITE)).toEqual({
      entry: 'tutors',
      utm: { utm_source: 'instagram' },
    });
  });

  it('ignores other sites and unknown entries', () => {
    expect(
      contextFromReferer(new Headers({ referer: 'https://evil.example/?entry=hero' }), SITE),
    ).toEqual({ utm: {} });
    expect(
      contextFromReferer(new Headers({ referer: `${SITE}/tutors/anna?entry=x` }), SITE),
    ).toEqual({ utm: {} });
    expect(contextFromReferer(new Headers(), SITE)).toEqual({ utm: {} });
  });
});
