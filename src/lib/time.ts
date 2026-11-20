/**
 * Время по Минску – часы ответа, напоминания, стаж (docs/architecture.md, раздел 3). Чистые функции:
 * момент передаётся снаружи, поэтому часы подменяются в тестах.
 */
export const MINSK_TZ = 'Europe/Minsk';

/** Год в Минске в момент `epochMs`: 31 декабря после 21:00 UTC там уже новый год. */
export function minskYear(epochMs: number): number {
  return Temporal.Instant.fromEpochMilliseconds(epochMs).toZonedDateTimeISO(MINSK_TZ).year;
}
