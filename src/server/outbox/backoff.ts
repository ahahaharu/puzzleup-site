import 'server-only';

/** Попыток на задание: после десятой неудачной оно становится `dead` (docs/architecture.md, раздел 5). */
export const MAX_ATTEMPTS = 10;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// 10 с, 30 с, 1 мин, 5 мин, 15 мин, 1 ч и дальше по часу.
const DELAYS_MS = [10 * SECOND, 30 * SECOND, MINUTE, 5 * MINUTE, 15 * MINUTE, HOUR];

/** Пауза перед следующей попыткой после `attempts` неудачных (1 – после первой). */
export function backoffMs(attempts: number): number {
  return DELAYS_MS[Math.min(Math.max(attempts, 1), DELAYS_MS.length) - 1] ?? HOUR;
}
