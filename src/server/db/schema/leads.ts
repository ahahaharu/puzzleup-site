import 'server-only';

import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import {
  availabilityEnum,
  contactMethodEnum,
  contactTimeEnum,
  entryEnum,
  goalEnum,
  leadSourceEnum,
  leadStatusEnum,
  rejectionReasonEnum,
} from './enums';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

/**
 * Заявки – docs/data-model.md, раздел 3. `parent_name`, `phone`, `comment` – персональные данные:
 * не попадают в логи, ошибки, outbox и Таблицу (CLAUDE.md).
 */
export const leads = pgTable(
  'leads',
  {
    // Номер заявки «№ 1024» и ключ строки в Таблице: начинается с 1001, чтобы не выглядеть первой.
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1001 }),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    // id репетитора из content/ (`t-…`); внешнего ключа нет – репетиторы живут в репозитории.
    tutorId: text('tutor_id').notNull(),
    source: leadSourceEnum('source').notNull(),
    parentName: text('parent_name'),
    // E.164: +375291234567.
    phone: text('phone'),
    contactMethod: contactMethodEnum('contact_method'),
    grade: smallint('grade').notNull(),
    subjects: text('subjects').array().notNull(),
    goal: goalEnum('goal'),
    contactTime: contactTimeEnum('contact_time')
      .array()
      .notNull()
      .default(sql`'{}'`),
    comment: text('comment'),
    // У ручной заявки (`/add`) пусто: она пришла не с сайта (ADR-048).
    entry: entryEnum('entry'),
    landingPath: text('landing_path'),
    // У `/add` в `utm_source` – ReferralChannel.
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmTerm: text('utm_term'),
    utmContent: text('utm_content'),
    availabilityAtSubmit: availabilityEnum('availability_at_submit'),
    status: leadStatusEnum('status').notNull().default('new'),
    // От него считается срок хранения.
    statusChangedAt: timestamptz('status_changed_at').notNull().defaultNow(),
    statusChangedBy: text('status_changed_by'),
    rejectionReason: rejectionReasonEnum('rejection_reason'),
    trialDoneAt: timestamptz('trial_done_at'),
    studentAt: timestamptz('student_at'),
    telegramMessageId: bigint('telegram_message_id', { mode: 'number' }),
    reminderSentAt: timestamptz('reminder_sent_at'),
  },
  (t) => [
    index('leads_status_created_at_idx').on(t.status, t.createdAt),
    index('leads_status_changed_at_idx').on(t.statusChangedAt),
    // Последний рубеж: настоящие правила – в Zod-схеме формы и диалоге `/add`.
    check(
      'leads_form_fields_check',
      sql`${t.source} <> 'form' OR (${t.parentName} IS NOT NULL AND ${t.phone} IS NOT NULL AND ${t.contactMethod} IS NOT NULL AND ${t.entry} IS NOT NULL AND ${t.landingPath} IS NOT NULL)`,
    ),
    check('leads_phone_check', sql`${t.phone} ~ '^\\+[1-9][0-9]{7,14}$'`),
    // Школьные классы; диапазон конкретного предмета проверяет форма по subjects.json.
    check('leads_grade_check', sql`${t.grade} BETWEEN 1 AND 11`),
    check('leads_subjects_check', sql`cardinality(${t.subjects}) > 0`),
    check('leads_comment_check', sql`char_length(${t.comment}) <= 1000`),
  ],
);

/** Факт согласия на обработку ПД. IP и user agent не храним. */
export const consents = pgTable(
  'consents',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    leadId: bigint('lead_id', { mode: 'number' })
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    givenAt: timestamptz('given_at').notNull().defaultNow(),
    // `site.json` → consent.version, дата редакции YYYY-MM-DD.
    consentVersion: text('consent_version').notNull(),
    consentTextSha256: text('consent_text_sha256').notNull(),
  },
  (t) => [
    index('consents_lead_id_idx').on(t.leadId),
    check('consents_sha256_check', sql`${t.consentTextSha256} ~ '^[0-9a-f]{64}$'`),
  ],
);

export const leadEventTypeEnum = pgEnum('lead_event_type', ['created', 'status_changed']);

/** Журнал изменений заявки для аудита. */
export const leadEvents = pgTable(
  'lead_events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    leadId: bigint('lead_id', { mode: 'number' })
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    at: timestamptz('at').notNull().defaultNow(),
    type: leadEventTypeEnum('type').notNull(),
    fromStatus: leadStatusEnum('from_status'),
    toStatus: leadStatusEnum('to_status').notNull(),
    // tutorId или `system`.
    actor: text('actor').notNull(),
  },
  (t) => [index('lead_events_lead_id_idx').on(t.leadId)],
);
