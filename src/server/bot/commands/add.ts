import 'server-only';

import { referralChannelSchema } from '@/lib/lead';
import { createManualLead } from '@/server/leads/service';

import type { BotDeps } from '../deps';
import {
  advanceDialog,
  endDialog,
  findDialog,
  findDialogByMessage,
  startDialog,
  type DialogKey,
} from '../dialogs';
import type { BotTutor } from '../directory';
import { ADD_CANCELLED, addDoneMessage, addPrompt, CALLBACK_TEXTS } from '../format';
import { addDraftSchema, addStepSchema, applyAnswer, nextStep, type AddDraft } from './add-draft';

// `/add` – заявка, пришедшая напрямую в мессенджер или по звонку (ТЗ главной, раздел 8;
// docs/architecture.md, раздел 6). Один вопрос – одно сообщение бота, которое правится на
// каждом шаге. Состояние – в `bot_dialogs`, без памяти процесса.

const KIND = 'add';

export async function startAdd(deps: BotDeps, key: DialogKey, tutor: BotTutor) {
  const draft: AddDraft = { messageId: 0 };
  const step = nextStep(draft);
  const { messageId } = await deps.telegram.sendMessage(
    key.chatId,
    addPrompt(step, tutor, draft, deps.directory),
  );
  await startDialog(deps.db, {
    ...key,
    kind: KIND,
    step,
    data: { ...draft, messageId },
    now: deps.clock.now(),
  });
}

/** Нажатие кнопки диалога. Возвращает текст всплывающей подсказки (пустая – без текста). */
export async function answerAdd(
  deps: BotDeps,
  key: DialogKey,
  messageId: number,
  tutor: BotTutor,
  answer: { step: string; value: string },
): Promise<string | undefined> {
  const dialog = await findDialog(deps.db, key);
  const draft = addDraftSchema.safeParse(dialog?.data);
  if (dialog?.kind !== KIND || !draft.success || draft.data.messageId !== messageId) {
    const foreign = await findDialogByMessage(deps.db, key.chatId, messageId);
    if (foreign !== undefined && foreign.userId !== key.userId) return CALLBACK_TEXTS.foreignDialog;
    await deps.telegram.editKeyboard(key.chatId, messageId, []);
    return CALLBACK_TEXTS.expiredDialog;
  }

  if (dialog.expiresAt.getTime() <= deps.clock.now()) {
    await endDialog(deps.db, key);
    await deps.telegram.editKeyboard(key.chatId, messageId, []);
    return CALLBACK_TEXTS.expiredDialog;
  }

  if (answer.step === 'cancel') {
    if (await endDialog(deps.db, key)) {
      await deps.telegram.editMessage(key.chatId, messageId, ADD_CANCELLED);
    }
    return undefined;
  }

  const step = addStepSchema.safeParse(answer.step);
  // Кнопка прошлого шага: двойное нажатие или повторная доставка апдейта.
  if (!step.success || step.data !== dialog.step) return undefined;

  if (step.data === 'referral') {
    return finish(deps, key, messageId, tutor, draft.data, answer.value);
  }

  const next = applyAnswer(step.data, tutor, draft.data, answer.value);
  if (next === undefined) return undefined;
  const to = nextStep(next);
  const advanced = await advanceDialog(deps.db, key, {
    from: step.data,
    to,
    data: next,
    now: deps.clock.now(),
  });
  if (advanced) {
    await deps.telegram.editMessage(
      key.chatId,
      messageId,
      addPrompt(to, tutor, next, deps.directory),
    );
  }
  return undefined;
}

async function finish(
  deps: BotDeps,
  key: DialogKey,
  messageId: number,
  tutor: BotTutor,
  draft: AddDraft,
  value: string,
) {
  const referral = referralChannelSchema.safeParse(value);
  const { source, grade, subject, goal } = draft;
  if (!referral.success || source === undefined || grade === undefined || subject === undefined) {
    return undefined;
  }
  // Диалог удаляется до записи: из двух одновременных доставок заявку создаст одна.
  if (!(await endDialog(deps.db, key, 'referral'))) return undefined;

  const created = await createManualLead(deps.db, deps.clock, {
    tutorId: tutor.id,
    source,
    grade,
    subject,
    goal: goal ?? undefined,
    referral: referral.data,
    initialAvailability: tutor.availability,
  });
  await deps.telegram.editMessage(
    key.chatId,
    messageId,
    addDoneMessage(created.id, tutor, created.status),
  );
  return undefined;
}
