import { z } from 'zod';

/**
 * Цель занятий – docs/data-model.md, `Goal`; ТЗ главной, блоки 2 и 9 (поле «Цель»).
 * Общий тип для контента (`goals`, `situations[].goal`), формы, базы и бота.
 */
export const goalSchema = z.enum(['grades', 'exam9', 'ct', 'olymp']);

export type Goal = z.infer<typeof goalSchema>;
