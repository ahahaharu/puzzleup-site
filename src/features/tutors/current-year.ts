import { cacheLife } from 'next/cache';

/**
 * Текущий год по Минску – для стажа в карточках. Страницы статичные, а время при пререндере без
 * кэша – ошибка Cache Components: значение кэшируется на сутки, и страница пересобирается сама.
 */
export async function currentYear(): Promise<number> {
  'use cache';
  cacheLife('days');
  const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Europe/Minsk' }).format(
    new Date(),
  );
  return Number(year);
}
