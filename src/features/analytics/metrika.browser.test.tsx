import { afterEach, describe, expect, it, vi } from 'vitest';

import { METRIKA_SCRIPT_URL } from '@/lib/analytics';

import { clearMetrikaData, loadMetrika, metrikaHit } from './metrika';

afterEach(() => {
  vi.restoreAllMocks();
  delete window.ym;
});

describe('loadMetrika', () => {
  it('queues init without Webvisor and adds tag.js once', () => {
    // tag.js в тестах не грузится: элемент перехватывается до вставки.
    const append = vi.spyOn(document.head, 'append').mockImplementation(() => {});

    loadMetrika(12345678);

    expect(window.ym?.a).toEqual([
      [12345678, 'init', expect.objectContaining({ webvisor: false, clickmap: true })],
    ]);
    const [script] = append.mock.calls[0] ?? [];
    expect(script).toBeInstanceOf(HTMLScriptElement);
    expect(script).toMatchObject({ src: METRIKA_SCRIPT_URL, async: true });
  });

  it('queues a hit with the previous address as referer', () => {
    vi.spyOn(document.head, 'append').mockImplementation(() => {});
    loadMetrika(1);

    metrikaHit(1, 'https://puzzle-up.by/tutors/andrei', 'https://puzzle-up.by/');

    expect(window.ym?.a?.[1]).toEqual([
      1,
      'hit',
      'https://puzzle-up.by/tutors/andrei',
      { referer: 'https://puzzle-up.by/' },
    ]);
  });
});

describe('clearMetrikaData', () => {
  it('removes only Metrika cookies and storage entries', () => {
    document.cookie = '_ym_uid=1; path=/';
    document.cookie = '_ym_d=2; path=/';
    document.cookie = 'keep=3; path=/';
    window.localStorage.setItem('_ym_retryReqs', '{}');
    window.localStorage.setItem('puzzleup:cookie-consent', 'necessary');

    clearMetrikaData();

    expect(document.cookie).not.toContain('_ym');
    expect(document.cookie).toContain('keep=3');
    expect(window.localStorage.getItem('_ym_retryReqs')).toBeNull();
    expect(window.localStorage.getItem('puzzleup:cookie-consent')).toBe('necessary');
    document.cookie = 'keep=; max-age=0; path=/';
    window.localStorage.clear();
  });
});
