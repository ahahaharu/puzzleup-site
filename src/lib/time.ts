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
