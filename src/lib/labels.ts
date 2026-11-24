import type {
  ContactMethod,
  ContactTime,
  LeadSource,
  LeadStatus,
  ReferralChannel,
  RejectionReason,
} from './lead';

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

/** Статусы заявки – docs/data-model.md, раздел 2; кнопки бота и столбец M Таблицы. */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'новая',
  contacted: 'связался',
  no_answer: 'не дозвонились',
  trial_scheduled: 'пробное назначено',
  trial_done: 'пробное проведено',
  student: 'ученик',
  rejected: 'отказ',
  waitlist: 'лист ожидания',
};

/** «Способ обращения» – ТЗ главной, раздел 8, столбец G. */
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  form: 'форма',
  telegram: 'Telegram',
  viber: 'Viber',
  call: 'звонок',
  other: 'другое',
};

/** Причина отказа – ТЗ главной, раздел 8, столбец P. */
export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  expensive: 'дорого',
  schedule: 'не подошло время',
  chose_other: 'выбрали другого',
  no_response: 'не отвечает',
  other: 'другое',
};

/** «Откуда узнали» в `/add` – столбец I Таблицы у ручной заявки. */
export const REFERRAL_CHANNEL_LABELS: Record<ReferralChannel, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  telegram: 'Telegram',
  word_of_mouth: 'от знакомых',
  search: 'поиск',
  other: 'другое',
};
