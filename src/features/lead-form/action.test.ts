import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createLead } from '@/server/leads/service';

import { submitLead } from './action';

// Server Action целиком: порядок проверок (Origin → rate limit → ловушка → Zod → сервис).
// Заголовки, база и сервис – подмены; контент – настоящий.

const SITE = 'https://puzzle-up.by';
let requestHeaders = new Headers();

vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));
vi.mock('@/server/env', () => ({ env: { SITE_URL: 'https://puzzle-up.by' } }));
vi.mock('@/server/db/client', () => ({ getDb: async () => ({}) }));
vi.mock('@/server/leads/service', () => ({ createLead: vi.fn() }));

const create = vi.mocked(createLead);
let ip = 0;

function headersFrom(extra: Record<string, string> = {}) {
  ip += 1;
  return new Headers({ origin: SITE, 'x-forwarded-for': `10.0.0.${ip}`, ...extra });
}

// Только выдуманные данные (docs/conventions.md, «Тесты»).
function formData(extra: Record<string, string> = {}) {
  const data = new FormData();
  const fields = {
    tutorId: 't-andrei',
    entry: 'direct',
    landing: '/tutors/andrei',
    website: '',
    parentName: 'Мария',
    phone: '+375 29 000-00-00',
    contactMethod: 'viber',
    grade: '7',
    subjects: 'math',
    consent: 'on',
    ...extra,
  };
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

beforeEach(() => {
  create.mockReset();
  create.mockResolvedValue({ id: 1001, status: 'new' });
  requestHeaders = headersFrom();
});

describe('submitLead', () => {
  it('creates the lead with the context from the page address', async () => {
    requestHeaders = headersFrom({
      referer: `${SITE}/tutors/andrei?entry=tutors&utm_source=instagram#lead`,
    });
    const state = await submitLead(undefined, formData());

    expect(state).toMatchObject({ status: 'success', thanks: { contactMethod: 'viber' } });
    expect(create).toHaveBeenCalledTimes(1);
    const lead = create.mock.calls[0]?.[1];
    expect(lead).toMatchObject({
      tutorId: 't-andrei',
      phone: '+375290000000',
      entry: 'tutors',
      landingPath: '/tutors/andrei',
      utm: { utm_source: 'instagram' },
      consent: { version: expect.any(String) },
    });
    expect(lead?.consent.textSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('pretends success and writes nothing when the honeypot is filled', async () => {
    const state = await submitLead(undefined, formData({ website: 'https://spam.example' }));
    expect(state.status).toBe('success');
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a request from another origin', async () => {
    requestHeaders = headersFrom({ origin: 'https://evil.example' });
    const state = await submitLead(undefined, formData());
    expect(state).toMatchObject({ status: 'error', problem: 'server' });
    expect(create).not.toHaveBeenCalled();
  });

  it('returns field errors without calling the service', async () => {
    const state = await submitLead(undefined, formData({ phone: '+375 29 12' }));
    expect(state.status).toBe('error');
    expect(state.status === 'error' && state.problem).toBeFalsy();
    expect(create).not.toHaveBeenCalled();
  });

  it('blocks the sixth attempt from one address', async () => {
    const results = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      results.push(await submitLead(undefined, formData({ grade: '' })));
    }
    expect(results.at(-1)).toMatchObject({ status: 'error', problem: 'rate_limit' });
    expect(results.at(-2)).not.toHaveProperty('problem');
  });

  it('logs only the error code when the database fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    create.mockRejectedValue(
      Object.assign(new Error('Failing row contains (Мария, +375290000000)'), { code: '23514' }),
    );
    const state = await submitLead(undefined, formData());

    expect(state).toMatchObject({ status: 'error', problem: 'server' });
    const logged = log.mock.calls.flat().join(' ');
    expect(logged).toContain('23514');
    expect(logged).not.toMatch(/Мария|375290000000/);
    log.mockRestore();
  });
});
