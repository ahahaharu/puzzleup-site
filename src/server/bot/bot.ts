import 'server-only';

import type { Availability } from '@/lib/availability';
import { findAvailability, setAvailability } from '@/server/availability/repository';
import { findLead } from '@/server/leads/repository';
import { changeStatus } from '@/server/leads/service';
import { errorCode } from '@/server/outbox/worker';

import { isAllowedChat, tutorOf } from './auth';
import { parseCallback, type Callback } from './callback';
import { answerAdd, startAdd } from './commands/add';
import type { BotDeps } from './deps';
import type { BotTutor } from './directory';
import {
  availabilityMessage,
  CALLBACK_TEXTS,
  helpMessage,
  reasonKeyboard,
  statusKeyboard,
} from './format';
import { commandOf, updateSchema, type Update } from './update';

/**
 * Апдейт из вебхука (docs/architecture.md, раздел 6). Бот отвечает только репетиторам из белого
 * списка и только в общем чате или в личке; остальное молча пропускается. Сообщение заявки
 * правит воркер по заданию `telegram.lead_updated`, здесь – только смена статуса в базе.
 * В лог – тип события и код ошибки, без текста сообщений.
 */
export async function handleUpdate(raw: unknown, deps: BotDeps): Promise<void> {
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    deps.log('bad_update', {});
    return;
  }
  const update = parsed.data;
  try {
    if (update.callback_query) await onCallback(update.callback_query, deps);
    else if (update.message) await onMessage(update.message, deps);
  } catch (error) {
    deps.log('update_failed', { updateId: update.update_id, code: errorCode(error) });
    if (update.callback_query) {
      await deps.telegram
        .answerCallback(update.callback_query.id, CALLBACK_TEXTS.failed)
        .catch(() => {});
    }
  }
}

async function onMessage(message: NonNullable<Update['message']>, deps: BotDeps) {
  const command = commandOf(message.text);
  if (command === undefined || message.from === undefined) return;
  const tutor = tutorOf(deps.access, deps.directory, message.from.id);
  if (!tutor || !isAllowedChat(deps.access, message.chat, message.from.id)) return;

  switch (command) {
    case 'add':
      await startAdd(deps, { chatId: message.chat.id, userId: message.from.id }, tutor);
      return;
    case 'status': {
      const current = (await findAvailability(deps.db, tutor.id)) ?? tutor.availability;
      await deps.telegram.sendMessage(message.chat.id, availabilityMessage(tutor, current));
      return;
    }
    case 'help':
    case 'start':
      await deps.telegram.sendMessage(message.chat.id, helpMessage(deps.directory));
      return;
    default:
      return;
  }
}

async function onCallback(query: NonNullable<Update['callback_query']>, deps: BotDeps) {
  const tutor = tutorOf(deps.access, deps.directory, query.from.id);
  const message = query.message;
  if (!tutor || !message || !isAllowedChat(deps.access, message.chat, query.from.id)) return;

  const callback = query.data === undefined ? undefined : parseCallback(query.data);
  const text =
    callback === undefined
      ? undefined
      : await dispatch(
          callback,
          { chatId: message.chat.id, messageId: message.message_id },
          tutor,
          query.from.id,
          deps,
        );
  await deps.telegram.answerCallback(query.id, text);
}

type Place = { chatId: number; messageId: number };

async function dispatch(
  callback: Callback,
  place: Place,
  tutor: BotTutor,
  userId: number,
  deps: BotDeps,
): Promise<string | undefined> {
  if (callback.kind === 'add') {
    return answerAdd(deps, { chatId: place.chatId, userId }, place.messageId, tutor, callback);
  }
  if (callback.kind === 'availability') {
    if (callback.tutorId !== tutor.id) return CALLBACK_TEXTS.foreignAvailability;
    return changeAvailability(deps, place, tutor, callback.status);
  }
  // Кнопки статусов есть только под сообщениями заявок в общем чате.
  if (place.chatId !== deps.access.leadsChatId) return undefined;

  switch (callback.kind) {
    case 'status':
      if (callback.status === 'rejected') return showReasons(callback.leadId, place, deps);
      return change(deps, { leadId: callback.leadId, status: callback.status, actor: tutor.id });
    case 'reason': {
      const text = await change(deps, {
        leadId: callback.leadId,
        status: 'rejected',
        reason: callback.reason,
        actor: tutor.id,
      });
      // Та же причина – правки сообщения из очереди не будет: кнопки статусов вернуть здесь.
      if (text === CALLBACK_TEXTS.unchanged('rejected')) {
        await deps.telegram.editKeyboard(
          place.chatId,
          place.messageId,
          statusKeyboard(callback.leadId, 'rejected'),
        );
      }
      return text;
    }
    case 'reject':
      return showReasons(callback.leadId, place, deps);
    case 'back': {
      const lead = await findLead(deps.db, callback.leadId);
      if (!lead) return CALLBACK_TEXTS.notFound;
      await deps.telegram.editKeyboard(
        place.chatId,
        place.messageId,
        statusKeyboard(lead.id, lead.status),
      );
      return undefined;
    }
  }
}

/**
 * Статус занятости из `/status`: запись в базу и сброс кэша страниц (ТЗ страницы репетитора,
 * раздел 5). Кэш сбрасывается и при том же статусе – так нажатие чинит и устаревшую страницу.
 * Не сбросился – статус всё равно записан, страницы спросят базу сами после следующего сброса.
 */
async function changeAvailability(
  deps: BotDeps,
  place: Place,
  tutor: BotTutor,
  status: Availability,
): Promise<string> {
  const result = await setAvailability(deps.db, {
    tutorId: tutor.id,
    status,
    by: tutor.id,
    at: new Date(deps.clock.now()),
  });
  await deps.invalidateAvailability().catch((error: unknown) => {
    deps.log('availability_invalidate_failed', { code: errorCode(error) });
  });
  await deps.telegram.editMessage(
    place.chatId,
    place.messageId,
    availabilityMessage(tutor, status),
  );
  return result === 'changed'
    ? CALLBACK_TEXTS.availabilityChanged(status)
    : CALLBACK_TEXTS.availabilityUnchanged(status);
}

async function showReasons(leadId: number, place: Place, deps: BotDeps) {
  if (!(await findLead(deps.db, leadId))) return CALLBACK_TEXTS.notFound;
  await deps.telegram.editKeyboard(place.chatId, place.messageId, reasonKeyboard(leadId));
  return CALLBACK_TEXTS.chooseReason;
}

async function change(deps: BotDeps, input: Parameters<typeof changeStatus>[2]) {
  const result = await changeStatus(deps.db, deps.clock, input);
  switch (result.kind) {
    case 'changed':
      return CALLBACK_TEXTS.changed(input.status);
    case 'unchanged':
      return CALLBACK_TEXTS.unchanged(input.status);
    case 'not_found':
      return CALLBACK_TEXTS.notFound;
  }
}
