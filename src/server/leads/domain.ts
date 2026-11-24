import 'server-only';

import type { Availability } from '@/lib/availability';
import type { Entry } from '@/lib/entry';
import type { Goal } from '@/lib/goal';
import type {
  ContactMethod,
  ContactTime,
  LeadSource,
  LeadStatus,
  ReferralChannel,
  RejectionReason,
} from '@/lib/lead';
import type { Utm } from '@/lib/utm';
import type { leads } from '@/server/db/schema';

/**
 * Заявка с сайта после проверки схемой формы – вход `createLead` (docs/architecture.md,
 * раздел 5). Телефон уже в E.164. Поля с ПД: `parentName`, `phone`, `comment`.
 */
export type NewFormLead = {
  tutorId: string;
  parentName: string;
  phone: string;
  contactMethod: ContactMethod;
  grade: number;
  subjects: readonly string[];
  goal?: Goal | undefined;
  contactTime: readonly ContactTime[];
  comment?: string | undefined;
  entry: Entry;
  landingPath: string;
  utm: Utm;
  /** Статус из MDX – на случай, если в `tutor_availability` ещё нет строки репетитора. */
  initialAvailability: Availability;
  consent: { version: string; textSha256: string };
};

export type CreatedLead = { id: number; status: LeadStatus };

/** «Мест нет» – заявка сразу в лист ожидания (ТЗ страницы репетитора, раздел 5). */
export function initialStatus(availability: Availability): LeadStatus {
  return availability === 'full' ? 'waitlist' : 'new';
}

/** «Мест нет» – лист ожидания; иначе родитель уже на связи: он сам написал или позвонил. */
export function manualInitialStatus(availability: Availability): LeadStatus {
  return availability === 'full' ? 'waitlist' : 'contacted';
}

/**
 * Заявка, пришедшая напрямую в мессенджер или по звонку, – диалог `/add` (ТЗ главной, раздел 8).
 * Имени и контакта нет. «Откуда узнали» хранится в `utm_source`.
 */
export type NewManualLead = {
  tutorId: string;
  source: Exclude<LeadSource, 'form'>;
  grade: number;
  subject: string;
  goal?: Goal | undefined;
  referral: ReferralChannel;
  initialAvailability: Availability;
};

/** Смена статуса кнопкой бота: `actor` – tutorId того, кто нажал. Отказ – только с причиной. */
export type StatusChange = { leadId: number; actor: string } & (
  { status: Exclude<LeadStatus, 'rejected'> } | { status: 'rejected'; reason: RejectionReason }
);

export type StatusChangeResult =
  | { kind: 'changed' }
  /** Тот же статус и та же причина – повторное нажатие или повторная доставка апдейта. */
  | { kind: 'unchanged' }
  /** Заявки нет: удалена по сроку хранения. */
  | { kind: 'not_found' };

/** Заявка целиком – для сообщения в общем чате. Содержит ПД. */
export type Lead = typeof leads.$inferSelect;
