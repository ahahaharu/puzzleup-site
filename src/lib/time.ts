/**
 * Время по Минску – часы ответа, напоминания, стаж (docs/architecture.md, раздел 3). Чистые функции:
 * момент передаётся снаружи, поэтому часы подменяются в тестах.
 */
export const MINSK_TZ = 'Europe/Minsk';

/** Год в Минске в момент `epochMs`: 31 декабря после 21:00 UTC там уже новый год. */
export function minskYear(epochMs: number): number {
  return Temporal.Instant.fromEpochMilliseconds(epochMs).toZonedDateTimeISO(MINSK_TZ).year;
}

/** «09:00» → «9:00»: часы в текстах сайта – без ведущего нуля. */
export function shortTime(time: string): string {
  return time.replace(/^0(?=\d:)/, '');
}

const LONG_DATE = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** «2026-10-12» → «12 октября 2026», без «г.»: даты отзывов и редакций политик. */
export function formatLongDate(isoDate: string): string {
  return LONG_DATE.formatToParts(new Date(`${isoDate}T00:00:00Z`))
    .filter((part) => part.type === 'day' || part.type === 'month' || part.type === 'year')
    .map((part) => part.value)
    .join(' ');
}

/** Часы для доменной логики: в тестах подменяются (docs/conventions.md, «Время»). */
export type Clock = { now(): number };

export const systemClock: Clock = { now: () => Date.now() };

const minutesOf = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Момент `epochMs` – в часах ответа по Минску: «09:00»–«22:00» из `site.json`, начало включительно,
 * конец – нет (ТЗ главной, блок 9, экран «Спасибо»: с 22:00 до 9:00 – ночной текст).
 */
export function isWithinHours(epochMs: number, hours: { from: string; to: string }): boolean {
  const time = Temporal.Instant.fromEpochMilliseconds(epochMs).toZonedDateTimeISO(MINSK_TZ);
  const now = time.hour * 60 + time.minute;
  return now >= minutesOf(hours.from) && now < minutesOf(hours.to);
}

const DATE_TIME = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: MINSK_TZ,
});

/** Момент по Минску – «24 ноября, 14:05»: время заявки и смены статуса в сообщениях бота. */
export function formatDateTime(epochMs: number): string {
  const parts = Object.fromEntries(
    DATE_TIME.formatToParts(epochMs).map((part) => [part.type, part.value]),
  );
  return `${parts.day} ${parts.month}, ${parts.hour}:${parts.minute}`;
}
