// Воркер (docs/architecture.md, разделы 5 и 7): выполняет задания outbox. Тот же образ, что
// у сайта, команда `node worker.js`; локально – `pnpm worker:dev`. Обработчики добавляются в
// фичах интеграций: Telegram – 3.4, Google Таблица – 3.5. Пока обработчика нет, задания его
// типа ждут в очереди.
import { EnvError, parseEnv } from '@/lib/env';
import { systemClock } from '@/lib/time';
import { createDb } from '@/server/db/client';
import { errorCode, startOutboxWorker, type OutboxHandlers } from '@/server/outbox/worker';

const log = (event: string, fields: Record<string, string> = {}) =>
  console.error(JSON.stringify({ scope: 'worker', event, ...fields }));

// Та же проверка окружения, что у приложения (src/lib/env.ts): в сообщении нет значений.
let url: string | undefined;
try {
  url = parseEnv(process.env).DATABASE_URL;
} catch (error) {
  if (!(error instanceof EnvError)) throw error;
  console.error(error.message);
  process.exit(1);
}
if (url === undefined) {
  console.error('DATABASE_URL is not set: see .env.example, local Postgres – `pnpm db:up`');
  process.exit(1);
}

const handlers: OutboxHandlers = {};

const db = createDb(url);
// Ошибка простаивающего соединения пула иначе роняет процесс; пул переподключится сам.
db.$client.on('error', (error) => log('pool_error', { code: errorCode(error) }));

const worker = startOutboxWorker({ db, databaseUrl: url, clock: systemClock, handlers });
log('started', { handlers: Object.keys(handlers).join(',') });

// Docker останавливает контейнер сигналом SIGTERM: текущее задание дорабатывает, новые не берутся.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, async () => {
    await worker.stop();
    await db.$client.end();
    log('stopped', { signal });
    process.exit(0);
  });
}
