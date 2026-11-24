// `pnpm bot:poll`: бот без вебхука – для локальной разработки, без туннеля и https
// (docs/architecture.md, раздел 6). Снимает вебхук и забирает апдейты long polling, передавая
// каждый в тот же `handleUpdate`, что и `POST /api/telegram`. Только при APP_ENV=local: у бота
// один получатель апдейтов, polling на staging или production отнял бы их у вебхука.
// Вернуться к вебхуку – `pnpm bot:set-webhook`.
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { createBuilder } from '@content-collections/core';
import { Api, GrammyError } from 'grammy/web';

import { EnvError, parseEnv, type Env } from '@/lib/env';
import { systemClock } from '@/lib/time';
import { createTelegramApi } from '@/server/bot/telegram-api';
import { createDb } from '@/server/db/client';
import { errorCode } from '@/server/outbox/worker';

let env: Env;
try {
  env = parseEnv(process.env);
} catch (error) {
  if (!(error instanceof EnvError)) throw error;
  console.error(error.message);
  process.exit(1);
}
const { telegram, DATABASE_URL: url } = env;
if (env.APP_ENV !== 'local') {
  console.error(`bot:poll is for local development only, APP_ENV=${env.APP_ENV} uses the webhook`);
  process.exit(1);
}
if (telegram === undefined || url === undefined) {
  console.error('TELEGRAM_* and DATABASE_URL must be set: see .env.example');
  process.exit(1);
}

// Бот читает контент (имена, предметы) через сгенерированный модуль Content Collections –
// собираем его заранее, модули бота импортируются после сборки.
await (await createBuilder(resolve('content-collections.ts'))).build();
const { contentDirectory } = await import('@/server/bot/directory');
const { handleUpdate } = await import('@/server/bot/bot');

const log = (event: string, fields: Record<string, string | number> = {}) =>
  console.error(JSON.stringify({ scope: 'bot', event, ...fields }));

const db = createDb(url);
const deps = {
  db,
  clock: systemClock,
  telegram: createTelegramApi(telegram.token),
  access: { leadsChatId: telegram.leadsChatId, tutors: telegram.tutors },
  directory: contentDirectory(),
  log,
};

const api = new Api(telegram.token);

// Ctrl+C: пока бот ждёт апдейты – выход сразу (недополученный апдейт Telegram пришлёт снова),
// посреди обработки – после неё.
let stopped = false;
let handling = false;
const stop = async () => {
  await db.$client.end();
  log('stopped');
  process.exit(0);
};
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    stopped = true;
    if (!handling) void stop();
  });
}

// Апдейты, накопленные, пока бот был выключен, тоже обрабатываются: так же поступил бы вебхук.
try {
  await api.deleteWebhook();
} catch (error) {
  console.error(
    `Telegram API error: ${error instanceof GrammyError ? error.description : errorCode(error)}`,
  );
  process.exit(1);
}
log('polling');

let offset = 0;
while (!stopped) {
  try {
    const updates = await api.getUpdates({
      offset,
      timeout: 30,
      allowed_updates: ['message', 'callback_query'],
    });
    handling = true;
    for (const update of updates) {
      await handleUpdate(update, deps);
      offset = update.update_id + 1;
    }
  } catch (error) {
    // 409 – вебхук поставили снова или запущен второй `bot:poll`.
    if (error instanceof GrammyError && error.error_code === 409) {
      console.error(`Telegram API error: ${error.description}`);
      break;
    }
    log('poll_failed', { code: errorCode(error) });
    await delay(5000);
  } finally {
    handling = false;
  }
}
await stop();
