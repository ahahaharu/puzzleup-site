import type { Entry } from './entry';
import type { Goal } from './goal';

/**
 * Сборка ссылок: личные чаты репетитора (docs/data-model.md: поля `telegram` и `viber`)
 * и страницы репетиторов. Формат значений проверяет схема контента.
 */

const TELEGRAM_LINK = /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(.+)$/i;

/** Ник без @, `@ник` или ссылка t.me → `https://t.me/<ник>`. */
export function telegramUrl(value: string): string {
  const trimmed = value.trim();
  const fromLink = TELEGRAM_LINK.exec(trimmed)?.[1];
  const nick = (fromLink ?? trimmed).replace(/^@/, '').replace(/[/?#].*$/, '');
  return `https://t.me/${encodeURIComponent(nick)}`;
}

/** Номер в любом написании (`+375 29 000-00-00`) → `viber://chat?number=%2B375290000000`. */
export function viberUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `viber://chat?number=${encodeURIComponent(`+${digits}`)}`;
}

/** Страница репетитора: `/tutors/andrei`. */
export function tutorUrl(slug: string, hash?: 'reviews' | 'lead'): string {
  const path = `/tutors/${encodeURIComponent(slug)}`;
  return hash ? `${path}#${hash}` : path;
}

type LeadContext = {
  entry: Entry;
  subject?: string | undefined;
  goal?: Goal | undefined;
};

/**
 * Форма на странице репетитора с контекстом в адресе: `/tutors/andrei?entry=tutors#lead`
 * (ТЗ главной, раздел 3: параметры `subject`, `goal`, `entry`; репетитор задан самой страницей).
 */
export function tutorLeadUrl(slug: string, { entry, subject, goal }: LeadContext): string {
  const params = new URLSearchParams({ entry });
  if (subject) params.set('subject', subject);
  if (goal) params.set('goal', goal);
  return `${tutorUrl(slug)}?${params.toString()}#lead`;
}
