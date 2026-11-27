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

/**
 * Атрибуты ссылки на Telegram: внешняя страница `t.me` – в новой вкладке, чтобы сайт остался
 * открытым (ТЗ главной, раздел 3). У Viber их нет: `viber://` сразу открывает приложение.
 */
export const TELEGRAM_LINK_PROPS = { target: '_blank', rel: 'noopener' } as const;

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
  /** Класс – из подсказки формы о классе другого репетитора (ТЗ страницы репетитора, блок 6). */
  grade?: number | undefined;
};

/**
 * Форма на странице репетитора с контекстом в адресе: `/tutors/andrei?entry=tutors#lead`
 * (ТЗ главной, раздел 3: параметры `subject`, `goal`, `entry`; репетитор задан самой страницей).
 */
export function tutorLeadUrl(slug: string, { entry, subject, goal, grade }: LeadContext): string {
  const params = new URLSearchParams({ entry });
  if (subject) params.set('subject', subject);
  if (goal) params.set('goal', goal);
  if (grade !== undefined) params.set('grade', String(grade));
  return `${tutorUrl(slug)}?${params.toString()}#lead`;
}

/**
 * Форма этой же страницы репетитора: `?entry=tutor_profile#lead`. Относительная ссылка – обычная
 * `<a>`, её обрабатывает `SamePageLinks` (src/components/layout).
 */
export function leadAnchor(entry: Entry): string {
  return `?${new URLSearchParams({ entry }).toString()}#lead`;
}

/** Исходник фото репетитора из `public/tutors/` – его размеры и форматы делает next/image. */
export function tutorPhotoUrl(fileName: string): string {
  return `/tutors/${encodeURIComponent(fileName)}`;
}

/** Исходник скриншота отзыва из `public/reviews/`. */
export function reviewScreenshotUrl(fileName: string): string {
  return `/reviews/${encodeURIComponent(fileName)}`;
}
