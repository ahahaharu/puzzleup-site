// `pnpm bot:set-webhook`: регистрирует вебхук бота `${SITE_URL}/api/telegram` с секретом из
// окружения и меню команд (docs/architecture.md, раздел 6). Запускается для каждого окружения
// с его переменными; повторный запуск безопасен.
import { Api, GrammyError } from 'grammy';

import { EnvError, parseEnv } from '@/lib/env';
import { BOT_COMMANDS } from '@/server/bot/format';

let env;
try {
  env = parseEnv(process.env);
} catch (error) {
  if (!(error instanceof EnvError)) throw error;
  console.error(error.message);
  process.exit(1);
}
if (env.telegram === undefined) {
  console.error('TELEGRAM_* variables are not set: see .env.example');
  process.exit(1);
}
// Telegram шлёт апдейты только на HTTPS; локально – через туннель с https-адресом в SITE_URL.
if (!env.SITE_URL.startsWith('https://')) {
  console.error('SITE_URL must use https: Telegram delivers webhooks over HTTPS only');
  process.exit(1);
}

const api = new Api(env.telegram.token);
const url = `${env.SITE_URL}/api/telegram`;
try {
  await api.setWebhook(url, {
    secret_token: env.telegram.webhookSecret,
    allowed_updates: ['message', 'callback_query'],
  });
  await api.setMyCommands([...BOT_COMMANDS]);
  const info = await api.getWebhookInfo();
  // Токен и секрет не печатаются.
  console.log(`Webhook set: ${info.url}, pending updates: ${info.pending_update_count}`);
} catch (error) {
  // Только описание ответа Telegram: в `payload` ошибки grammY лежит секрет вебхука.
  const reason =
    error instanceof GrammyError
      ? error.description
      : error instanceof Error
        ? error.name
        : 'unknown';
  console.error(`Telegram API error: ${reason}`);
  process.exit(1);
}
