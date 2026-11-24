import 'server-only';

import { setTimeout as delay } from 'node:timers/promises';

import { errorCode } from '@/server/outbox/worker';

/**
 * `waitMs` – пауза после запуска: число для заданий «каждые N мс», функция – для заданий
 * к часу дня (`msUntilMinskTime`), считается заново после каждого запуска.
 */
export type ScheduledJob = {
  name: string;
  waitMs: number | (() => number);
  run: () => Promise<unknown>;
};

export type Scheduler = { stop(): Promise<void> };

/**
 * Планировщик воркера (docs/architecture.md, раздел 7): каждое задание – свой цикл «выполнить,
 * подождать `waitMs`», без внешнего cron. Первый запуск – сразу при старте. Задания идемпотентны,
 * поэтому пропуск или лишний запуск после перезапуска безопасен. Ошибка – код в лог, следующий
 * запуск по расписанию.
 */
export function startScheduler(
  jobs: readonly ScheduledJob[],
  log: (event: string, fields: Record<string, string>) => void,
): Scheduler {
  const stopping = new AbortController();
  const loops = jobs.map(async (job) => {
    while (!stopping.signal.aborted) {
      try {
        await job.run();
      } catch (error) {
        log('job_error', { job: job.name, code: errorCode(error) });
      }
      const waitMs = typeof job.waitMs === 'number' ? job.waitMs : job.waitMs();
      await delay(waitMs, undefined, { signal: stopping.signal }).catch(() => {});
    }
  });
  return {
    async stop() {
      stopping.abort();
      await Promise.all(loops);
    },
  };
}
