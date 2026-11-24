import 'server-only';

import { setTimeout as delay } from 'node:timers/promises';

import { errorCode } from '@/server/outbox/worker';

export type ScheduledJob = { name: string; everyMs: number; run: () => Promise<unknown> };

export type Scheduler = { stop(): Promise<void> };

/**
 * Планировщик воркера (docs/architecture.md, раздел 7): каждое задание – свой цикл «выполнить,
 * подождать `everyMs`», без внешнего cron. Задания идемпотентны, поэтому пропуск или лишний
 * запуск после перезапуска безопасен. Ошибка – код в лог, следующий запуск по расписанию.
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
      await delay(job.everyMs, undefined, { signal: stopping.signal }).catch(() => {});
    }
  });
  return {
    async stop() {
      stopping.abort();
      await Promise.all(loops);
    },
  };
}
