import { describe, expect, it } from 'vitest';

import { EnvError, parseEnv } from './env';

// Выдуманные учётные данные: только для проверки разбора.
const DB = 'postgres://localhost:5432/puzzleup';
const TOKEN = '123456:AAFakeTokenFakeTokenFakeTokenFake01';
const SECRET = 'fake-webhook-secret-fake-webhook-secret';
const TELEGRAM = {
  TELEGRAM_BOT_TOKEN: TOKEN,
  TELEGRAM_WEBHOOK_SECRET: SECRET,
  TELEGRAM_LEADS_CHAT_ID: '-1001234567890',
  TELEGRAM_ALERT_CHAT_ID: '111111111',
  TELEGRAM_TUTORS: '{"111111111":"t-andrei","222222222":"t-maxim"}',
};
const DEPLOYED = { SITE_URL: 'https://puzzle-up.by', DATABASE_URL: DB, ...TELEGRAM };

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
      parseEnv({ ...DEPLOYED, APP_ENV: 'production', SITE_URL: 'https://puzzle-up.by/' }),
    ).toMatchObject({
      APP_ENV: 'production',
      SITE_URL: 'https://puzzle-up.by',
      DATABASE_URL: DB,
    });
  });

  it.each(['staging', 'production'])('requires SITE_URL when APP_ENV=%s', (appEnv) => {
    expect(() => parseEnv({ ...DEPLOYED, APP_ENV: appEnv, SITE_URL: undefined })).toThrow(
      /SITE_URL is required/,
    );
  });

  it.each(['staging', 'production'])('requires https SITE_URL when APP_ENV=%s', (appEnv) => {
    expect(() =>
      parseEnv({ ...DEPLOYED, APP_ENV: appEnv, SITE_URL: 'http://puzzle-up.by' }),
    ).toThrow(/must use https/);
  });

  it.each(['staging', 'production'])('requires DATABASE_URL when APP_ENV=%s', (appEnv) => {
    expect(() => parseEnv({ ...DEPLOYED, APP_ENV: appEnv, DATABASE_URL: undefined })).toThrow(
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

  describe('Telegram', () => {
    it('is off locally when no TELEGRAM_* variable is set', () => {
      expect(parseEnv({})).not.toHaveProperty('telegram');
    });

    it('parses the bot settings', () => {
      expect(parseEnv(TELEGRAM).telegram).toEqual({
        token: TOKEN,
        webhookSecret: SECRET,
        leadsChatId: -1001234567890,
        alertChatId: 111111111,
        tutors: { '111111111': 't-andrei', '222222222': 't-maxim' },
      });
    });

    it('requires all variables once any is set', () => {
      expect(() => parseEnv({ TELEGRAM_BOT_TOKEN: TOKEN })).toThrow(
        /TELEGRAM_WEBHOOK_SECRET is required when any TELEGRAM_\* variable is set/,
      );
    });

    it.each(['staging', 'production'])('requires the bot when APP_ENV=%s', (appEnv) => {
      const { TELEGRAM_TUTORS: _, ...rest } = DEPLOYED;
      expect(() => parseEnv({ ...rest, APP_ENV: appEnv })).toThrow(
        new RegExp(`TELEGRAM_TUTORS is required when APP_ENV=${appEnv}`),
      );
    });

    it.each([
      ['not JSON', '{t-andrei}', /must be JSON/],
      ['an empty map', '{}', /at least one tutor/],
      ['a username key', '{"andrei":"t-andrei"}', /TELEGRAM_TUTORS.*Invalid key/],
      ['a slug value', '{"111111111":"andrei"}', /tutor ids/],
    ])('rejects TELEGRAM_TUTORS with %s', (_, value, message) => {
      expect(() => parseEnv({ ...TELEGRAM, TELEGRAM_TUTORS: value })).toThrow(message);
    });

    it.each([
      ['TELEGRAM_LEADS_CHAT_ID', '@puzzleup_leads'],
      ['TELEGRAM_WEBHOOK_SECRET', 'short'],
      ['TELEGRAM_BOT_TOKEN', 'token'],
    ])('rejects malformed %s', (key, value) => {
      expect(() => parseEnv({ ...TELEGRAM, [key]: value })).toThrow(new RegExp(key));
    });

    it('does not leak the token or the secret into the error message', () => {
      const leaked = expect.not.stringMatching(/AAFake|fake-webhook/);
      expect(() => parseEnv({ ...TELEGRAM, TELEGRAM_BOT_TOKEN: 'AAFake' })).toThrow(
        expect.objectContaining({ message: leaked }),
      );
      expect(() => parseEnv({ ...TELEGRAM, TELEGRAM_WEBHOOK_SECRET: 'fake-webhook!' })).toThrow(
        expect.objectContaining({ message: leaked }),
      );
    });
  });
});
