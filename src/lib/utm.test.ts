import { describe, expect, it } from 'vitest';

import { rememberUtm, utmFromSearch } from './utm';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

describe('utmFromSearch', () => {
  it('reads the five UTM parameters and ignores the rest', () => {
    expect(
      utmFromSearch('?utm_source=instagram&utm_medium=cpc&utm_campaign=winter&entry=hero&goal=ct'),
    ).toEqual({ utm_source: 'instagram', utm_medium: 'cpc', utm_campaign: 'winter' });
  });

  it('drops empty and too long values', () => {
    expect(utmFromSearch(`?utm_source=&utm_term=${'a'.repeat(201)}`)).toEqual({});
  });
});

describe('rememberUtm', () => {
  it('saves the tags of the first visit', () => {
    const storage = memoryStorage();
    expect(rememberUtm('?utm_source=instagram', storage)).toEqual({ utm_source: 'instagram' });
    expect(rememberUtm('', storage)).toEqual({ utm_source: 'instagram' });
  });

  it('does not overwrite the tags of the first visit', () => {
    const storage = memoryStorage();
    rememberUtm('?utm_source=instagram', storage);
    expect(rememberUtm('?utm_source=tiktok', storage)).toEqual({ utm_source: 'instagram' });
  });

  it('works without storage and with broken saved data', () => {
    expect(rememberUtm('?utm_source=instagram', undefined)).toEqual({ utm_source: 'instagram' });
    const broken = memoryStorage({ 'puzzleup:utm': '{oops' });
    expect(rememberUtm('?utm_medium=cpc', broken)).toEqual({ utm_medium: 'cpc' });
  });

  it('survives a storage that throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(rememberUtm('?utm_source=instagram', storage)).toEqual({ utm_source: 'instagram' });
  });
});
