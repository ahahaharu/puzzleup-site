// Воркер (docs/architecture.md, разделы 5 и 7): выполняет задания outbox и задания по
// расписанию. Тот же образ, что у сайта, команда `node worker.js`; локально – `pnpm worker:dev`.
// Обработчики добавляются в фичах интеграций: Google Таблица – 3.5. Пока обработчика нет
// (или бот выключен локально), задания его типа ждут в очереди.
import { EnvError, parseEnv, type Env } from '@/lib/env';
import { systemClock } from '@/lib/time';
import { contentDirectory } from '@/server/bot/directory';
import { createTelegramApi } from '@/server/bot/telegram-api';
import { createDb } from '@/server/db/client';
import { enqueueReminders } from '@/server/jobs/reminders';
import { startScheduler, type ScheduledJob } from '@/server/jobs/scheduler';
import { telegramHandlers } from '@/server/outbox/handlers/telegram';
import { errorCode, startOutboxWorker, type OutboxHandlers } from '@/server/outbox/worker';

const log = (event: string, fields: Record<string, string> = {}) =>
  console.error(JSON.stringify({ scope: 'worker', event, ...fields }));

// Та же проверка окружения, что у приложения (src/lib/env.ts): в сообщении нет значений.
let env: Env | undefined;
try {
  env = parseEnv(process.env);
} catch (error) {
  if (!(error instanceof EnvError)) throw error;
  console.error(error.message);
  process.exit(1);
}
const url = env?.DATABASE_URL;
if (env === undefined || url === undefined) {
  console.error('DATABASE_URL is not set: see .env.example, local Postgres – `pnpm db:up`');
  process.exit(1);
}

const db = createDb(url);
// Ошибка простаивающего соединения пула иначе роняет процесс; пул переподключится сам.
db.$client.on('error', (error) => log('pool_error', { code: errorCode(error) }));

const directory = contentDirectory();
const handlers: OutboxHandlers = {};
const jobs: ScheduledJob[] = [];
if (env.telegram) {
  Object.assign(
    handlers,
    telegramHandlers({
      db,
      telegram: createTelegramApi(env.telegram.token),
      directory,
      leadsChatId: env.telegram.leadsChatId,
      alertChatId: env.telegram.alertChatId,
    }),
  );
  // Без бота напоминания копились бы в очереди и пришли бы разом, когда его включат.
  jobs.push({
    name: 'reminders',
    everyMs: 60_000,
    run: () => enqueueReminders(db, systemClock, directory.responseHours),
  });
}

const worker = startOutboxWorker({ db, databaseUrl: url, clock: systemClock, handlers });
const scheduler = startScheduler(jobs, log);
log('started', {
  handlers: Object.keys(handlers).join(','),
  jobs: jobs.map((job) => job.name).join(','),
});

// Docker останавливает контейнер сигналом SIGTERM: текущее задание дорабатывает, новые не берутся.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, async () => {
    await Promise.all([worker.stop(), scheduler.stop()]);
    await db.$client.end();
    log('stopped', { signal });
    process.exit(0);
  });
}
