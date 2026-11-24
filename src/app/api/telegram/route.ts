import { systemClock } from '@/lib/time';
import { invalidateAvailability } from '@/server/availability/cache';
import { handleUpdate } from '@/server/bot/bot';
import type { BotDeps } from '@/server/bot/deps';
import { contentDirectory } from '@/server/bot/directory';
import { createTelegramApi } from '@/server/bot/telegram-api';
import { handleWebhook } from '@/server/bot/webhook';
import { getDb } from '@/server/db/client';
import { env } from '@/server/env';

// Вебхук Telegram-бота: POST /api/telegram (docs/architecture.md, раздел 6).

let deps: BotDeps | undefined;

async function botDeps(telegram: NonNullable<typeof env.telegram>): Promise<BotDeps> {
  deps ??= {
    db: await getDb(),
    clock: systemClock,
    telegram: createTelegramApi(telegram.token),
    access: { leadsChatId: telegram.leadsChatId, tutors: telegram.tutors },
    directory: contentDirectory(),
    log: (event, fields) => console.error(JSON.stringify({ scope: 'bot', event, ...fields })),
    // Вебхук – маршрут Next.js: кэш страниц сбрасывается прямо здесь (ADR-053).
    invalidateAvailability: async () => invalidateAvailability(),
  };
  return deps;
}

export async function POST(request: Request) {
  const telegram = env.telegram;
  return handleWebhook(
    request,
    telegram && {
      secret: telegram.webhookSecret,
      handle: async (update) => handleUpdate(update, await botDeps(telegram)),
    },
  );
}
