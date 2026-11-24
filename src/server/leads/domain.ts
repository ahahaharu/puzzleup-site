import 'server-only';

import type { Availability } from '@/lib/availability';
import type { Entry } from '@/lib/entry';
import type { Goal } from '@/lib/goal';
import type { ContactMethod, ContactTime, LeadStatus } from '@/lib/lead';
import type { Utm } from '@/lib/utm';

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
