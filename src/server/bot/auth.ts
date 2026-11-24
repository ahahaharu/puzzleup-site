import 'server-only';

import { findTutor, type BotDirectory, type BotTutor } from './directory';
import type { Chat } from './update';

/** Часть настроек бота, нужная для проверки доступа (src/lib/env.ts, `TelegramEnv`). */
export type BotAccess = {
  leadsChatId: number;
  /** Telegram ID → tutorId. */
  tutors: Readonly<Record<string, string>>;
};

/**
 * Репетитор по Telegram ID – белый список `TELEGRAM_TUTORS` (docs/architecture.md, раздел 6).
 * Ушедший репетитор и id, которого нет в content/tutors, доступа не дают.
 */
export function tutorOf(
  access: BotAccess,
  directory: BotDirectory,
  userId: number,
): BotTutor | undefined {
  const tutorId = access.tutors[String(userId)];
  const tutor = tutorId === undefined ? undefined : findTutor(directory, tutorId);
  return tutor?.archived === false ? tutor : undefined;
}

/** Бот работает только в общем чате и в личке с репетитором. */
export function isAllowedChat(access: BotAccess, chat: Chat, userId: number): boolean {
  return chat.id === access.leadsChatId || (chat.type === 'private' && chat.id === userId);
}
