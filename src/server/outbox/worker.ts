import 'server-only';

import { setTimeout as delay } from 'node:timers/promises';

import { and, asc, eq, inArray, lt, lte, sql } from 'drizzle-orm';
import { Client } from 'pg';

import type { Clock } from '@/lib/time';
import type { Db } from '@/server/db/client';
import { outbox, OUTBOX_CHANNEL, outboxTypeEnum } from '@/server/db/schema';

import { backoffMs, MAX_ATTEMPTS } from './backoff';
import { enqueue, type OutboxType } from './enqueue';

// Воркер outbox – docs/architecture.md, раздел 5. Задание захватывается короткой транзакцией
// (`FOR UPDATE SKIP LOCKED` → `processing`), обработчик работает вне транзакции, без блокировки
// строки на время запроса к Telegram или Google. Итог – `done`, повтор с backoff или `dead`
// с предупреждением Андрею. В `last_error` и логи – только код ошибки, без текста: в нём
// бывают значения полей.

export type OutboxJob = {
  id: number;
  type: OutboxType;
  payload: Record<string, number>;
  /** Номер текущей попытки, с 1. */
  attempts: number;
};

/** Обработчик задания. Исключение – неудачная попытка; `signal` срабатывает по тайм-ауту. */
export type OutboxHandler = (job: OutboxJob, signal: AbortSignal) => Promise<void>;

/**
 * Обработчики по типу. Задания без обработчика воркер не берёт: они ждут в `pending`, пока
 * интеграция не включена (локально Telegram может быть выключен).
 */
export type OutboxHandlers = Partial<Record<OutboxType, OutboxHandler>>;

/** Ошибка обработчика с кодом для `last_error` и логов. Код не должен содержать ПД. */
export class OutboxJobError extends Error {
  override readonly name = 'OutboxJobError';
  constructor(readonly code: string) {
    super(code);
  }
}

export type OutboxLog = (event: string, fields: Record<string, string | number>) => void;

const jsonLog: OutboxLog = (event, fields) =>
  console.error(JSON.stringify({ scope: 'outbox', event, ...fields }));

export type OutboxOptions = {
  db: Db;
  handlers: OutboxHandlers;
  clock: Clock;
  log?: OutboxLog;
  /** Заданий за один захват. */
  batchSize?: number;
  /** Сколько ждать обработчик. */
  handlerTimeoutMs?: number;
  /**
   * Через сколько `processing` считается брошенным (воркер упал посреди задания). Больше, чем
   * пачка заданий с тайм-аутом каждого: живой воркер не теряет захваченное.
   */
  lockTimeoutMs?: number;
};

const DEFAULTS = { batchSize: 10, handlerTimeoutMs: 30_000, lockTimeoutMs: 15 * 60_000 };

const MAX_ERROR_LENGTH = 200;

/** Код ошибки без сообщения: имя класса и, если есть, код pg (SQLSTATE) или Node (`ECONNRESET`). */
export function errorCode(error: unknown): string {
  if (error instanceof OutboxJobError) return error.code.slice(0, MAX_ERROR_LENGTH);
  if (!(error instanceof Error)) return 'unknown';
  const code = 'code' in error && typeof error.code === 'string' ? `:${error.code}` : '';
  return `${error.name}${code}`.slice(0, MAX_ERROR_LENGTH);
}

/**
 * Один проход: вернуть брошенные задания в очередь, захватить до `batchSize` готовых и
 * выполнить их по порядку. Возвращает число захваченных заданий.
 */
export async function runOutboxBatch(options: OutboxOptions): Promise<number> {
  const { db, handlers, clock, log = jsonLog } = options;
  const { batchSize, handlerTimeoutMs, lockTimeoutMs } = { ...DEFAULTS, ...options };

  await recoverAbandoned(db, clock, lockTimeoutMs, log);

  const types = outboxTypeEnum.enumValues.filter((type) => handlers[type] !== undefined);
  if (types.length === 0) return 0;

  const now = new Date(clock.now());
  const ready = db
    .select({ id: outbox.id })
    .from(outbox)
    .where(and(eq(outbox.status, 'pending'), lte(outbox.runAt, now), inArray(outbox.type, types)))
    .orderBy(asc(outbox.id))
    .limit(batchSize)
    .for('update', { skipLocked: true });
  const jobs = await db
    .update(outbox)
    .set({ status: 'processing', lockedAt: now, attempts: sql`${outbox.attempts} + 1` })
    .where(inArray(outbox.id, ready))
    .returning({
      id: outbox.id,
      type: outbox.type,
      payload: outbox.payload,
      attempts: outbox.attempts,
    });
  // RETURNING не гарантирует порядок: задания одной заявки идут в порядке постановки.
  jobs.sort((a, b) => a.id - b.id);

  for (const job of jobs) {
    const handler = handlers[job.type];
    try {
      if (handler === undefined) throw new OutboxJobError('no_handler');
      await withTimeout(handler, job, handlerTimeoutMs);
      await complete(db, clock, job);
    } catch (error) {
      await fail(db, clock, job, errorCode(error), log);
    }
  }
  return jobs.length;
}

async function withTimeout(handler: OutboxHandler, job: OutboxJob, ms: number): Promise<void> {
  const signal = AbortSignal.timeout(ms);
  let onAbort: (() => void) | undefined;
  const timeout = new Promise<never>((_, reject) => {
    onAbort = () => reject(new OutboxJobError('timeout'));
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    await Promise.race([handler(job, signal), timeout]);
  } finally {
    if (onAbort) signal.removeEventListener('abort', onAbort);
  }
}

// Условие на `attempts`: если задание успели вернуть в очередь и захватить снова, итог старой
// попытки его не трогает.
const current = (job: OutboxJob) =>
  and(eq(outbox.id, job.id), eq(outbox.status, 'processing'), eq(outbox.attempts, job.attempts));

async function complete(db: Db, clock: Clock, job: OutboxJob) {
  await db
    .update(outbox)
    .set({ status: 'done', doneAt: new Date(clock.now()), lockedAt: null, lastError: null })
    .where(current(job));
}

async function fail(db: Db, clock: Clock, job: OutboxJob, code: string, log: OutboxLog) {
  const fields = { jobId: job.id, type: job.type, attempts: job.attempts, code };
  if (job.attempts < MAX_ATTEMPTS) {
    await db
      .update(outbox)
      .set({
        status: 'pending',
        runAt: new Date(clock.now() + backoffMs(job.attempts)),
        lockedAt: null,
        lastError: code,
      })
      .where(current(job));
    log('job_failed', fields);
    return;
  }

  await db.transaction(async (tx) => {
    const [dead] = await tx
      .update(outbox)
      .set({ status: 'dead', lockedAt: null, lastError: code })
      .where(current(job))
      .returning({ id: outbox.id });
    // О не доставленном предупреждении предупреждать некуда: только лог.
    if (dead && job.type !== 'telegram.alert') {
      await enqueue(tx, [{ type: 'telegram.alert', payload: { outboxId: job.id } }]);
    }
  });
  log('job_dead', fields);
}

/** Задания, брошенные упавшим воркером, – неудачная попытка с кодом `lock_expired`. */
async function recoverAbandoned(db: Db, clock: Clock, lockTimeoutMs: number, log: OutboxLog) {
  const abandoned = await db
    .select({
      id: outbox.id,
      type: outbox.type,
      payload: outbox.payload,
      attempts: outbox.attempts,
    })
    .from(outbox)
    .where(
      and(
        eq(outbox.status, 'processing'),
        lt(outbox.lockedAt, new Date(clock.now() - lockTimeoutMs)),
      ),
    )
    .orderBy(asc(outbox.id));
  for (const job of abandoned) await fail(db, clock, job, 'lock_expired', log);
}

export type OutboxWorkerOptions = OutboxOptions & {
  /** Отдельное соединение под `LISTEN outbox` – пул его не держит. */
  databaseUrl: string;
  /** Опрос – страховка на случай пропущенного NOTIFY и для заданий с `run_at` в будущем. */
  pollMs?: number;
};

export type OutboxWorker = { stop(): Promise<void> };

/**
 * Цикл воркера: проход сразу после NOTIFY о новом задании, иначе раз в `pollMs`. Полная пачка –
 * следующий проход без паузы. `stop()` дожидается текущего задания и закрывает соединение.
 */
export function startOutboxWorker(options: OutboxWorkerOptions): OutboxWorker {
  const { databaseUrl, pollMs = 5000, log = jsonLog } = options;
  const batchSize = options.batchSize ?? DEFAULTS.batchSize;
  let stopped = false;
  const stopping = new AbortController();
  let woken = false;
  let wakeUp: (() => void) | undefined;

  const wake = () => {
    woken = true;
    wakeUp?.();
  };
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(done, ms);
      wakeUp = done;
      function done() {
        clearTimeout(timer);
        wakeUp = undefined;
        resolve();
      }
    });

  let listener: Client | undefined;
  const listen = async () => {
    while (!stopped) {
      const client = new Client({ connectionString: databaseUrl });
      listener = client;
      const closed = new Promise<void>((resolve) => {
        client.on('error', (error) => {
          log('listen_error', { code: errorCode(error) });
          resolve();
        });
        client.on('end', () => resolve());
      });
      client.on('notification', wake);
      try {
        await client.connect();
        await client.query(`LISTEN ${OUTBOX_CHANNEL}`);
        // Пока соединения не было, NOTIFY могли пропустить.
        wake();
        await closed;
      } catch (error) {
        if (!stopped) log('listen_error', { code: errorCode(error) });
      }
      await client.end().catch(() => {});
      await delay(pollMs, undefined, { signal: stopping.signal }).catch(() => {});
    }
  };

  const loop = async () => {
    while (!stopped) {
      woken = false;
      let claimed = 0;
      try {
        claimed = await runOutboxBatch(options);
      } catch (error) {
        log('batch_error', { code: errorCode(error) });
      }
      if (stopped) break;
      if (claimed < batchSize && !woken) await sleep(pollMs);
    }
  };

  const listening = listen();
  const running = loop();
  return {
    async stop() {
      stopped = true;
      stopping.abort();
      wakeUp?.();
      await listener?.end().catch(() => {});
      await Promise.all([running, listening]);
    },
  };
}
