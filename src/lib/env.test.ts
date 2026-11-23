import { describe, expect, it } from 'vitest';

import { EnvError, parseEnv } from './env';

// Выдуманные учётные данные: только для проверки разбора.
const DB = 'postgres://localhost:5432/puzzleup';

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
    expect(
      parseEnv({ APP_ENV: 'production', SITE_URL: 'https://puzzle-up.by/', DATABASE_URL: DB }),
    ).toEqual({
      APP_ENV: 'production',
      SITE_URL: 'https://puzzle-up.by',
      DATABASE_URL: DB,
    });
  });

  it.each(['staging', 'production'])('requires SITE_URL when APP_ENV=%s', (appEnv) => {
    expect(() => parseEnv({ APP_ENV: appEnv, DATABASE_URL: DB })).toThrow(/SITE_URL is required/);
  });

  it.each(['staging', 'production'])('requires https SITE_URL when APP_ENV=%s', (appEnv) => {
    expect(() =>
      parseEnv({ APP_ENV: appEnv, SITE_URL: 'http://puzzle-up.by', DATABASE_URL: DB }),
    ).toThrow(/must use https/);
  });

  it.each(['staging', 'production'])('requires DATABASE_URL when APP_ENV=%s', (appEnv) => {
    expect(() => parseEnv({ APP_ENV: appEnv, SITE_URL: 'https://puzzle-up.by' })).toThrow(
      /DATABASE_URL is required/,
    );
  });

  it('keeps DATABASE_URL optional locally', () => {
    expect(parseEnv({})).not.toHaveProperty('DATABASE_URL');
    expect(parseEnv({ DATABASE_URL: 'postgresql://localhost/puzzleup' }).DATABASE_URL).toBe(
      'postgresql://localhost/puzzleup',
    );
  });

  it.each(['mysql://localhost/puzzleup', 'localhost:5432'])(
    'rejects non-Postgres DATABASE_URL %s',
    (url) => {
      expect(() => parseEnv({ DATABASE_URL: url })).toThrow(/DATABASE_URL/);
    },
  );

  it('does not leak the database password into the error message', () => {
    expect(() => parseEnv({ DATABASE_URL: 'mysql://app:secret-pass@db/x' })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('secret-pass') }),
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
