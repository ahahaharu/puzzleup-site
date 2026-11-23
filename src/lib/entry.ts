import { z } from 'zod';

/**
 * Откуда на сайте пришёл родитель – docs/data-model.md, `Entry`; ТЗ главной, раздел 8
 * («Значения entry – фиксированный список»). Параметр `entry` в адресе формы, столбец H Таблицы.
 */
export const ENTRIES = [
  'hero',
  'header',
  'bottom_bar',
  'tutors',
  'situations',
  'subjects',
  'prices',
  'faq',
  'about',
  'tutor_profile',
  'tutor_more',
  'tutor_full',
  '404',
  'direct',
] as const;

export const entrySchema = z.enum(ENTRIES);

export type Entry = z.infer<typeof entrySchema>;
