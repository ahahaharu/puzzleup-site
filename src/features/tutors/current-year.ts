import { cacheLife } from 'next/cache';

import { minskYear } from '@/lib/time';

/**
 * Текущий год по Минску – для стажа в карточках. Страницы статичные, а время при пререндере без
 * кэша – ошибка Cache Components: значение кэшируется на сутки, и страница пересобирается сама.
 */
export async function currentYear(): Promise<number> {
  'use cache';
  cacheLife('days');
  return minskYear(Date.now());
}
