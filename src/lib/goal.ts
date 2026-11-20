import { z } from 'zod';

/**
 * Цель занятий – docs/data-model.md, `Goal`; ТЗ главной, блоки 2 и 9 (поле «Цель»).
 * Общий тип для контента (`goals`, `situations[].goal`), формы, базы и бота.
 */
export const goalSchema = z.enum(['grades', 'exam9', 'ct', 'olymp']);

export type Goal = z.infer<typeof goalSchema>;

/** Подписи целей – ТЗ главной, блок 9, поле «Цель»; те же чипы – «С чем помогаю» на странице репетитора. */
export const GOAL_LABELS: Record<Goal, string> = {
  grades: 'Подтянуть оценки',
  exam9: 'Экзамен после 9\u00a0класса',
  ct: 'ЦТ и ЦЭ',
  olymp: 'Олимпиады',
};
