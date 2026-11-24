import type { ContactMethod, ContactTime } from './lead';

/**
 * Подписи значений заявки на русском – docs/data-model.md, раздел 2. Подписи целей – `GOAL_LABELS`
 * в goal.ts (их же показывает «С чем помогаю»). Тексты чипов – ТЗ главной, блок 9, поля 3 и 7.
 */

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  telegram: 'Telegram',
  viber: 'Viber',
  call: 'Звонок',
};

export const CONTACT_TIME_LABELS: Record<ContactTime, string> = {
  morning: 'Утром',
  day: 'Днём',
  evening: 'Вечером',
  any: 'В любое время',
};
