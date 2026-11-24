import 'server-only';

import { eq } from 'drizzle-orm';

import type { BotDirectory } from '@/server/bot/directory';
import { alertMessage, leadMessage, reminderMessage } from '@/server/bot/format';
import type { TelegramPort } from '@/server/bot/port';
import type { Db } from '@/server/db/client';
import { outbox } from '@/server/db/schema';
import { findLead, saveTelegramMessageId } from '@/server/leads/repository';

import { OutboxJobError, type OutboxHandler, type OutboxHandlers, type OutboxJob } from '../worker';

export type TelegramHandlersDeps = {
  db: Db;
  telegram: TelegramPort;
  directory: BotDirectory;
  /** Общий чат репетиторов. */
  leadsChatId: number;
  /** Личка Андрея для предупреждений. */
  alertChatId: number;
};

const idOf = (job: OutboxJob, key: 'leadId' | 'outboxId') => {
  const id = job.payload[key];
  if (typeof id !== 'number') throw new OutboxJobError('bad_payload');
  return id;
};

/**
 * Обработчики заданий Telegram (docs/architecture.md, раздел 5). Данные читаются из базы по id
 * из payload. Заявки, удалённой по сроку хранения, нет – задание просто выполнено.
 */
export function telegramHandlers(deps: TelegramHandlersDeps): OutboxHandlers {
  const { db, telegram, directory, leadsChatId } = deps;

  // Создание и правка – одно действие: сообщение есть – правится, нет или его удалили в чате –
  // отправляется заново. Повтор задания после сбоя не плодит дубли.
  const syncMessage: OutboxHandler = async (job) => {
    const lead = await findLead(db, idOf(job, 'leadId'));
    if (!lead) return;
    const message = leadMessage(lead, directory);
    if (lead.telegramMessageId !== null) {
      const edited = await telegram.editMessage(leadsChatId, lead.telegramMessageId, message);
      if (edited === 'ok') return;
    }
    const { messageId } = await telegram.sendMessage(leadsChatId, message);
    await saveTelegramMessageId(db, lead.id, messageId);
  };

  return {
    'telegram.lead_created': syncMessage,
    'telegram.lead_updated': syncMessage,
    // Статус успели поменять, пока задание ждало, – напоминать не о чем.
    async 'telegram.reminder'(job) {
      const lead = await findLead(db, idOf(job, 'leadId'));
      if (lead?.status !== 'new') return;
      await telegram.sendMessage(leadsChatId, reminderMessage(lead, directory), {
        replyTo: lead.telegramMessageId ?? undefined,
      });
    },
    async 'telegram.alert'(job) {
      const id = idOf(job, 'outboxId');
      const [dead] = await db
        .select({
          type: outbox.type,
          attempts: outbox.attempts,
          lastError: outbox.lastError,
          payload: outbox.payload,
        })
        .from(outbox)
        .where(eq(outbox.id, id));
      if (!dead) return;
      await telegram.sendMessage(
        deps.alertChatId,
        alertMessage({ id, ...dead, leadId: dead.payload.leadId }),
      );
    },
  };
}
