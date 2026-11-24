import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { systemClock, type Clock } from '@/lib/time';

import { createTestDb } from '../../../tests/setup/db';
import type { Db } from '../db/client';
import { outbox } from '../db/schema';
import { MAX_ATTEMPTS } from './backoff';
import { enqueue } from './enqueue';
import {
  OutboxJobError,
  runOutboxBatch,
  startOutboxWorker,
  type OutboxHandler,
  type OutboxOptions,
} from './worker';

let db: Db;
let url: string;

beforeAll(async () => {
  ({ db, url } = await createTestDb());
});

beforeEach(async () => {
  await db.delete(outbox);
});

const START = Date.parse('2026-11-24T10:00:00Z');

/** Часы теста: идут, только когда их двигают. */
function testClock(): Clock & { advance(ms: number): void } {
  let now = START;
  return { now: () => now, advance: (ms) => (now += ms) };
}

async function addJob(values: Partial<typeof outbox.$inferInsert> = {}) {
  const [row] = await db
    .insert(outbox)
    .values({
      type: 'telegram.lead_created',
      payload: { leadId: 1001 },
      runAt: new Date(START),
      ...values,
    })
    .returning({ id: outbox.id });
  if (!row) throw new Error('no row');
  return row.id;
}

const job = async (id: number) => (await db.select().from(outbox).where(eq(outbox.id, id)))[0];

const ok: OutboxHandler = async () => {};
const broken: OutboxHandler = async () => {
  throw new OutboxJobError('telegram_429');
};

function options(overrides: Partial<OutboxOptions> = {}): OutboxOptions {
  return { db, clock: testClock(), handlers: {}, log: () => {}, ...overrides };
}

describe('runOutboxBatch', () => {
  it('runs a ready job and marks it done', async () => {
    const id = await addJob();
    const handler = vi.fn(ok);

    expect(await runOutboxBatch(options({ handlers: { 'telegram.lead_created': handler } }))).toBe(
      1,
    );

    expect(handler).toHaveBeenCalledWith(
      { id, type: 'telegram.lead_created', payload: { leadId: 1001 }, attempts: 1 },
      expect.any(AbortSignal),
    );
    expect(await job(id)).toMatchObject({
      status: 'done',
      attempts: 1,
      doneAt: new Date(START),
      lockedAt: null,
      lastError: null,
    });
  });

  it('runs jobs in the order they were queued', async () => {
    const first = await addJob();
    const second = await addJob({ type: 'sheets.upsert' });
    const seen: number[] = [];
    const record: OutboxHandler = async (j) => void seen.push(j.id);

    await runOutboxBatch(
      options({ handlers: { 'telegram.lead_created': record, 'sheets.upsert': record } }),
    );
    expect(seen).toEqual([first, second]);
  });

  it('takes at most batchSize jobs', async () => {
    await addJob();
    await addJob();
    await addJob();
    const handler = vi.fn(ok);

    expect(
      await runOutboxBatch(
        options({ batchSize: 2, handlers: { 'telegram.lead_created': handler } }),
      ),
    ).toBe(2);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('leaves jobs that are not due yet', async () => {
    const id = await addJob({ runAt: new Date(START + 1000) });
    expect(await runOutboxBatch(options({ handlers: { 'telegram.lead_created': ok } }))).toBe(0);
    expect(await job(id)).toMatchObject({ status: 'pending', attempts: 0 });
  });

  it('leaves jobs whose type has no handler', async () => {
    const id = await addJob({ type: 'sheets.upsert' });
    expect(await runOutboxBatch(options({ handlers: { 'telegram.lead_created': ok } }))).toBe(0);
    expect(await runOutboxBatch(options())).toBe(0);
    expect(await job(id)).toMatchObject({ status: 'pending', attempts: 0 });
  });

  it('retries a failed job with backoff and keeps only the error code', async () => {
    const id = await addJob();
    const clock = testClock();
    const log = vi.fn();
    const leaky: OutboxHandler = async () => {
      // Сообщение с выдуманными ПД не должно попасть ни в базу, ни в лог.
      throw new Error('Мария +375290000000');
    };
    const run = () =>
      runOutboxBatch(options({ clock, log, handlers: { 'telegram.lead_created': leaky } }));

    await run();
    expect(await job(id)).toMatchObject({
      status: 'pending',
      attempts: 1,
      runAt: new Date(START + 10_000),
      lockedAt: null,
      lastError: 'Error',
    });
    expect(log).toHaveBeenCalledWith('job_failed', {
      jobId: id,
      type: 'telegram.lead_created',
      attempts: 1,
      code: 'Error',
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/Мария|375/);

    clock.advance(9_999);
    expect(await run()).toBe(0);

    clock.advance(1);
    await run();
    expect(await job(id)).toMatchObject({
      attempts: 2,
      runAt: new Date(START + 10_000 + 30_000),
    });
  });

  it('marks the job dead after the last attempt and queues an alert', async () => {
    const id = await addJob({ attempts: MAX_ATTEMPTS - 1 });
    const log = vi.fn();

    await runOutboxBatch(options({ log, handlers: { 'telegram.lead_created': broken } }));

    expect(await job(id)).toMatchObject({
      status: 'dead',
      attempts: MAX_ATTEMPTS,
      lockedAt: null,
      lastError: 'telegram_429',
      doneAt: null,
    });
    expect(log).toHaveBeenCalledWith('job_dead', expect.objectContaining({ jobId: id }));
    const alerts = await db.select().from(outbox).where(eq(outbox.type, 'telegram.alert'));
    expect(alerts).toMatchObject([{ status: 'pending', payload: { outboxId: id } }]);
  });

  it('does not alert about a dead alert', async () => {
    const id = await addJob({ type: 'telegram.alert', payload: { outboxId: 1 }, attempts: 9 });

    await runOutboxBatch(options({ handlers: { 'telegram.alert': broken } }));

    expect(await db.select({ id: outbox.id, status: outbox.status }).from(outbox)).toEqual([
      { id, status: 'dead' },
    ]);
  });

  it('fails a job whose handler does not answer in time', async () => {
    const id = await addJob();
    const hang: OutboxHandler = (_, signal) =>
      new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)));

    await runOutboxBatch(
      options({ handlerTimeoutMs: 20, handlers: { 'telegram.lead_created': hang } }),
    );
    expect(await job(id)).toMatchObject({ status: 'pending', lastError: 'timeout' });
  });

  it('returns a job abandoned by a crashed worker to the queue', async () => {
    const clock = testClock();
    const abandoned = await addJob({
      status: 'processing',
      attempts: 1,
      lockedAt: new Date(START - 15 * 60_000 - 1),
    });
    const fresh = await addJob({ status: 'processing', attempts: 1, lockedAt: new Date(START) });
    const last = await addJob({
      status: 'processing',
      attempts: MAX_ATTEMPTS,
      lockedAt: new Date(START - 60 * 60_000),
    });

    await runOutboxBatch(options({ clock }));

    expect(await job(abandoned)).toMatchObject({
      status: 'pending',
      attempts: 1,
      runAt: new Date(START + 10_000),
      lastError: 'lock_expired',
    });
    expect(await job(fresh)).toMatchObject({ status: 'processing' });
    expect(await job(last)).toMatchObject({ status: 'dead', lastError: 'lock_expired' });
  });

  it('skips a job another worker is claiming instead of waiting for it', async () => {
    const locked = await addJob();
    const free = await addJob();
    const handler = vi.fn(ok);
    // Другой воркер посреди захвата: строка заблокирована его транзакцией.
    const other = await db.$client.connect();
    try {
      await other.query('BEGIN');
      await other.query('SELECT id FROM outbox WHERE id = $1 FOR UPDATE', [locked]);

      const claimed = await runOutboxBatch(
        options({ handlers: { 'telegram.lead_created': handler } }),
      );

      expect(claimed).toBe(1);
      expect(handler).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: free }),
        expect.any(AbortSignal),
      );
    } finally {
      await other.query('ROLLBACK');
      other.release();
    }
    expect(await job(locked)).toMatchObject({ status: 'pending', attempts: 0 });
  }, 3000);
});

describe('startOutboxWorker', () => {
  it('picks up a new job on NOTIFY without waiting for the poll', async () => {
    const handler = vi.fn(ok);
    // Опрос раз в минуту: задание за секунды подхватит только NOTIFY.
    const worker = startOutboxWorker({
      db,
      databaseUrl: url,
      clock: systemClock,
      handlers: { 'telegram.lead_created': handler },
      log: () => {},
      pollMs: 60_000,
    });
    try {
      // Первый проход после подключения LISTEN – пустой.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await enqueue(db, [{ type: 'telegram.lead_created', payload: { leadId: 1001 } }]);
      await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce(), { timeout: 3000 });
    } finally {
      await worker.stop();
    }
    const [row] = await db.select().from(outbox);
    expect(row?.status).toBe('done');
  });

  it('stops promptly while idle', async () => {
    const worker = startOutboxWorker({
      db,
      databaseUrl: url,
      clock: systemClock,
      handlers: {},
      log: () => {},
      pollMs: 60_000,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const started = performance.now();
    await worker.stop();
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
