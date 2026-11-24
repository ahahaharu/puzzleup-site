import 'server-only';

import { z } from 'zod';

import { goalSchema } from '@/lib/goal';
import { leadSourceSchema, referralChannelSchema } from '@/lib/lead';

import type { BotTutor } from '../directory';

/** Способ обращения ручной заявки: всё, кроме формы сайта. */
export const manualSourceSchema = leadSourceSchema.exclude(['form']);
export type ManualSource = z.infer<typeof manualSourceSchema>;

/** Шаги `/add` по порядку ТЗ главной, раздел 8: способ обращения, класс, предмет, цель, откуда узнали. */
export const addStepSchema = z.enum(['source', 'grade', 'subject', 'goal', 'referral']);
export type AddStep = z.infer<typeof addStepSchema>;

/** Ответы диалога `/add` – `bot_dialogs.data`. `messageId` – сообщение с вопросом и кнопками. */
export const addDraftSchema = z.object({
  messageId: z.number().int(),
  source: manualSourceSchema.optional(),
  grade: z.number().int().optional(),
  subject: z.string().optional(),
  // `null` – цель не указана.
  goal: goalSchema.nullable().optional(),
});
export type AddDraft = z.infer<typeof addDraftSchema>;

/** Кнопка «Не указана» у цели. */
export const NO_GOAL = 'none';

/** Варианты ответа на шаге: значение кнопки (`add:<шаг>:<значение>`). */
export function addOptions(step: AddStep, tutor: BotTutor, draft: AddDraft): readonly string[] {
  switch (step) {
    case 'source':
      return manualSourceSchema.options;
    case 'grade': {
      const grades = new Set<number>();
      for (const subject of tutor.subjects) {
        for (let grade = subject.from; grade <= subject.to; grade += 1) grades.add(grade);
      }
      return [...grades].sort((a, b) => a - b).map(String);
    }
    case 'subject':
      return subjectsFor(tutor, draft.grade);
    case 'goal':
      return [...tutor.goals, NO_GOAL];
    case 'referral':
      return referralChannelSchema.options;
  }
}

const subjectsFor = (tutor: BotTutor, grade: number | undefined) =>
  tutor.subjects
    .filter((subject) => grade !== undefined && subject.from <= grade && grade <= subject.to)
    .map((subject) => subject.id);

/** Следующий шаг после ответов `draft`; единственный предмет выбирается сам. */
export function nextStep(draft: AddDraft): AddStep {
  if (draft.source === undefined) return 'source';
  if (draft.grade === undefined) return 'grade';
  if (draft.subject === undefined) return 'subject';
  if (draft.goal === undefined) return 'goal';
  return 'referral';
}

/** Ответ на шаг: новый черновик или `undefined`, если такого варианта нет. */
export function applyAnswer(
  step: AddStep,
  tutor: BotTutor,
  draft: AddDraft,
  value: string,
): AddDraft | undefined {
  if (!addOptions(step, tutor, draft).includes(value)) return undefined;
  switch (step) {
    case 'source':
      return { ...draft, source: manualSourceSchema.parse(value) };
    case 'grade': {
      const grade = Number(value);
      const subjects = subjectsFor(tutor, grade);
      // Один предмет на этот класс – вопрос «Предмет?» не задаётся.
      return { ...draft, grade, ...(subjects.length === 1 && { subject: subjects[0] }) };
    }
    case 'subject':
      return { ...draft, subject: value };
    case 'goal':
      return { ...draft, goal: value === NO_GOAL ? null : goalSchema.parse(value) };
    case 'referral':
      return draft;
  }
}
