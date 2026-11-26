import { describe, expect, it } from 'vitest';

import { hasCookieBanner, resolveAnalytics } from './analytics';
import { contentSecurityPolicy } from './csp';

const UMAMI = {
  scriptUrl: 'https://stats.example.by/script.js',
  websiteId: '0b6f5b37-8f8a-4c47-9b4a-0d3f3c6e2a11',
};

function directives(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy.split('; ').map((directive) => {
      const [name = '', ...sources] = directive.split(' ');
      return [name, sources];
    }),
  );
}

describe('resolveAnalytics', () => {
  it('keeps configured counters', () => {
    expect(resolveAnalytics({ umami: UMAMI, metrika: { counterId: 12345678 } })).toEqual({
      umami: UMAMI,
      metrikaId: 12345678,
    });
  });

  it('drops placeholders and missing counters', () => {
    expect(
      resolveAnalytics({
        umami: { scriptUrl: '[адрес]', websiteId: '[id]' },
        metrika: { counterId: '[номер]' },
      }),
    ).toEqual({});
    expect(resolveAnalytics({ umami: { ...UMAMI, websiteId: '[id]' } })).toEqual({});
    expect(resolveAnalytics({ umami: { ...UMAMI, scriptUrl: 'https://' } })).toEqual({});
    expect(resolveAnalytics(undefined)).toEqual({});
  });
});

describe('hasCookieBanner', () => {
  it('asks for consent whenever Metrika is set up, even with a placeholder number', () => {
    expect(hasCookieBanner({ metrika: { counterId: 12345678 } })).toBe(true);
    expect(hasCookieBanner({ metrika: { counterId: '[номер]' } })).toBe(true);
    expect(hasCookieBanner({ umami: UMAMI })).toBe(false);
    expect(hasCookieBanner(undefined)).toBe(false);
  });
});

describe('contentSecurityPolicy', () => {
  it('allows only the site itself without counters', () => {
    const csp = directives(contentSecurityPolicy({ analytics: {}, dev: false }));
    expect(csp['script-src']).toEqual(["'self'", "'unsafe-inline'"]);
    expect(csp['connect-src']).toEqual(["'self'"]);
    expect(csp['img-src']).toEqual(["'self'", 'data:', 'blob:']);
    expect(csp['frame-src']).toEqual(["'none'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['frame-ancestors']).toEqual(["'none'"]);
    expect(csp['form-action']).toEqual(["'self'"]);
    expect(csp['base-uri']).toEqual(["'self'"]);
  });

  it('adds the Umami origin and Metrika domains when they are configured', () => {
    const csp = directives(
      contentSecurityPolicy({ analytics: { umami: UMAMI, metrikaId: 12345678 }, dev: false }),
    );
    expect(csp['script-src']).toEqual([
      "'self'",
      "'unsafe-inline'",
      'https://stats.example.by',
      'https://mc.yandex.ru',
      'https://mc.yandex.by',
      'https://yastatic.net',
    ]);
    expect(csp['connect-src']).toEqual([
      "'self'",
      'https://stats.example.by',
      'https://mc.yandex.ru',
      'https://mc.yandex.by',
    ]);
    expect(csp['img-src']).toContain('https://mc.yandex.by');
    expect(csp['frame-src']).toEqual(['https://mc.yandex.ru', 'https://mc.yandex.by']);
  });

  it('allows eval and WebSocket only in development', () => {
    const csp = directives(contentSecurityPolicy({ analytics: {}, dev: true }));
    expect(csp['script-src']).toContain("'unsafe-eval'");
    expect(csp['connect-src']).toContain('ws:');
    expect(contentSecurityPolicy({ analytics: {}, dev: false })).not.toMatch(/unsafe-eval|ws:/);
  });

  it('never allows plugins or framing by other sites', () => {
    const csp = contentSecurityPolicy({ analytics: { umami: UMAMI, metrikaId: 1 }, dev: true });
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
