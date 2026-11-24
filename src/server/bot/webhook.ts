import 'server-only';

import { secretMatches } from '@/server/http';

/** Заголовок, в котором Telegram присылает секрет из `setWebhook` (`pnpm bot:set-webhook`). */
export const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

export function isTelegramRequest(headers: Pick<Headers, 'get'>, secret: string): boolean {
  return secretMatches(headers.get(SECRET_HEADER), secret);
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
