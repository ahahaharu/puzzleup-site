import 'server-only';

import { createHash, timingSafeEqual } from 'node:crypto';

/** Заголовок, в котором Telegram присылает секрет из `setWebhook` (`pnpm bot:set-webhook`). */
export const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

// Сравнение хешей: одинаковая длина и время сравнения не выдают длину и начало секрета.
const digest = (value: string) => createHash('sha256').update(value).digest();

export function isTelegramRequest(headers: Pick<Headers, 'get'>, secret: string): boolean {
  const received = headers.get(SECRET_HEADER);
  return received !== null && timingSafeEqual(digest(received), digest(secret));
}

/**
 * Вебхук бота (docs/architecture.md, раздел 6): без бота – 404, чужой запрос – 401. Апдейт
 * обрабатывается до ответа; ошибки обработчик пишет в лог сам, а Telegram получает 200: иначе
 * он повторял бы тот же апдейт и держал очередь следующих.
 */
export async function handleWebhook(
  request: Request,
  bot: { secret: string; handle(update: unknown): Promise<void> } | undefined,
): Promise<Response> {
  if (bot === undefined) return new Response(null, { status: 404 });
  if (!isTelegramRequest(request.headers, bot.secret)) return new Response(null, { status: 401 });
  let update: unknown;
  try {
    update = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  await bot.handle(update);
  return new Response(null, { status: 200 });
}
