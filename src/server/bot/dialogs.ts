import 'server-only';

import { and, eq, sql } from 'drizzle-orm';

import type { Db } from '@/server/db/client';
import { botDialogs } from '@/server/db/schema';

/** Диалог живёт 30 минут от последнего шага (docs/data-model.md, `bot_dialogs`). */
export const DIALOG_TTL_MS = 30 * 60_000;

export type DialogKey = { chatId: number; userId: number };
export type Dialog = typeof botDialogs.$inferSelect;

const byKey = (key: DialogKey) =>
  and(eq(botDialogs.chatId, key.chatId), eq(botDialogs.userId, key.userId));

export async function findDialog(db: Db, key: DialogKey): Promise<Dialog | undefined> {
  const [row] = await db.select().from(botDialogs).where(byKey(key));
  return row;
}

/** Диалог другого пользователя в этом чате, чьи кнопки под сообщением `messageId`. */
export async function findDialogByMessage(
  db: Db,
  chatId: number,
  messageId: number,
): Promise<Dialog | undefined> {
  const [row] = await db
    .select()
    .from(botDialogs)
    .where(
      and(
        eq(botDialogs.chatId, chatId),
        sql`(${botDialogs.data}->>'messageId')::bigint = ${messageId}`,
      ),
    );
  return row;
}

/** Новый диалог заменяет прежний: у пользователя в чате один активный диалог. */
export async function startDialog(
  db: Db,
  dialog: DialogKey & { kind: string; step: string; data: Record<string, unknown>; now: number },
) {
  const values = {
    chatId: dialog.chatId,
    userId: dialog.userId,
    kind: dialog.kind,
    step: dialog.step,
    data: dialog.data,
    expiresAt: new Date(dialog.now + DIALOG_TTL_MS),
  };
  await db
    .insert(botDialogs)
    .values(values)
    .onConflictDoUpdate({ target: [botDialogs.chatId, botDialogs.userId], set: values });
}

/**
 * Следующий шаг – только если диалог всё ещё на шаге `from`: повторная доставка того же нажатия
 * ничего не меняет. Возвращает, был ли шаг сделан.
 */
export async function advanceDialog(
  db: Db,
  key: DialogKey,
  change: { from: string; to: string; data: Record<string, unknown>; now: number },
): Promise<boolean> {
  const rows = await db
    .update(botDialogs)
    .set({ step: change.to, data: change.data, expiresAt: new Date(change.now + DIALOG_TTL_MS) })
    .where(and(byKey(key), eq(botDialogs.step, change.from)))
    .returning({ step: botDialogs.step });
  return rows.length > 0;
}

/** Удаляет диалог; `step` – только если он на этом шаге. Возвращает, было ли что удалять. */
export async function endDialog(db: Db, key: DialogKey, step?: string): Promise<boolean> {
  const rows = await db
    .delete(botDialogs)
    .where(step === undefined ? byKey(key) : and(byKey(key), eq(botDialogs.step, step)))
    .returning({ step: botDialogs.step });
  return rows.length > 0;
}
