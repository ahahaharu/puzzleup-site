import { DrizzleQueryError } from 'drizzle-orm/errors';
import { describe, expect, it } from 'vitest';

import { errorCode, OutboxJobError } from './worker';

const pgError = (code: string) => Object.assign(new Error('relation does not exist'), { code });

describe('errorCode', () => {
  it('keeps only the class name and the pg or Node code', () => {
    expect(errorCode(pgError('42P01'))).toBe('Error:42P01');
    expect(errorCode(new TypeError('Мария, +375 29 000-00-00'))).toBe('TypeError');
    expect(errorCode('text')).toBe('unknown');
    expect(errorCode(new OutboxJobError('telegram_403'))).toBe('telegram_403');
  });

  it('reads the code of the pg error wrapped by Drizzle', () => {
    const wrapped = new DrizzleQueryError('select 1', ['Мария'], pgError('42P01'));
    expect(errorCode(wrapped)).toBe('Error:42P01');
  });
});
