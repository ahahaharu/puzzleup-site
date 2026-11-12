import { describe, expect, it } from 'vitest';

import { EnvError, parseEnv } from './env';

describe('parseEnv', () => {
  it('defaults to local with localhost URL', () => {
    expect(parseEnv({})).toEqual({ APP_ENV: 'local', SITE_URL: 'http://localhost:3000' });
  });

  it('treats empty strings as unset', () => {
    expect(parseEnv({ APP_ENV: '', SITE_URL: '' })).toEqual({
      APP_ENV: 'local',
      SITE_URL: 'http://localhost:3000',
    });
  });

  it('accepts production with SITE_URL and strips trailing slash', () => {
    expect(parseEnv({ APP_ENV: 'production', SITE_URL: 'https://puzzle-up.by/' })).toEqual({
      APP_ENV: 'production',
      SITE_URL: 'https://puzzle-up.by',
    });
  });

  it.each(['staging', 'production'])('requires SITE_URL when APP_ENV=%s', (appEnv) => {
    expect(() => parseEnv({ APP_ENV: appEnv })).toThrow(/SITE_URL is required/);
  });

  it.each(['staging', 'production'])('requires https SITE_URL when APP_ENV=%s', (appEnv) => {
    expect(() => parseEnv({ APP_ENV: appEnv, SITE_URL: 'http://puzzle-up.by' })).toThrow(
      /must use https/,
    );
  });

  it('allows http SITE_URL locally', () => {
    expect(parseEnv({ SITE_URL: 'http://127.0.0.1:3100' }).SITE_URL).toBe('http://127.0.0.1:3100');
  });

  it('rejects unknown APP_ENV', () => {
    expect(() => parseEnv({ APP_ENV: 'prod' })).toThrow(EnvError);
  });

  it.each(['puzzle-up.by', 'ftp://puzzle-up.by'])('rejects invalid SITE_URL %s', (url) => {
    expect(() => parseEnv({ SITE_URL: url })).toThrow(EnvError);
  });

  it('does not leak values into the error message', () => {
    expect(() => parseEnv({ SITE_URL: 'not-a-url-secret' })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('not-a-url-secret') }),
    );
  });
});
