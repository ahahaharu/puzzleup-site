import { z } from 'zod';

/**
 * Перечисления заявки – docs/data-model.md, раздел 2. Общие для формы, базы и бота:
 * из этих же схем собираются `pgEnum` в src/server/db/schema. Поля формы – ТЗ главной, блок 9.
 */

/** Поле формы «Как с вами связаться?», один выбор. */
export const contactMethodSchema = z.enum(['telegram', 'viber', 'call']);
export type ContactMethod = z.infer<typeof contactMethodSchema>;

/** Поле формы «Когда удобно связаться», несколько. */
export const contactTimeSchema = z.enum(['morning', 'day', 'evening', 'any']);
export type ContactTime = z.infer<typeof contactTimeSchema>;

/** «Способ обращения»: `form` – заявка с сайта, остальные – ручные через `/add`. */
export const leadSourceSchema = z.enum(['form', 'telegram', 'viber', 'call', 'other']);
export type LeadSource = z.infer<typeof leadSourceSchema>;

/** Статус заявки – ТЗ главной, раздел 8; меняется кнопками бота. */
export const leadStatusSchema = z.enum([
  'new',
  'contacted',
  'no_answer',
  'trial_scheduled',
  'trial_done',
  'student',
  'rejected',
  'waitlist',
]);
export type LeadStatus = z.infer<typeof leadStatusSchema>;

/** Причина отказа – спрашивает бот при статусе `rejected`. */
export const rejectionReasonSchema = z.enum([
  'expensive',
  'schedule',
  'chose_other',
  'no_response',
  'other',
]);
export type RejectionReason = z.infer<typeof rejectionReasonSchema>;

/** «Откуда узнали» в `/add`; хранится в `utm_source` ручной заявки. */
export const referralChannelSchema = z.enum([
  'instagram',
  'tiktok',
  'telegram',
  'word_of_mouth',
  'search',
  'other',
]);
export type ReferralChannel = z.infer<typeof referralChannelSchema>;
