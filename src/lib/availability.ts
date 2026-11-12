import { z } from 'zod';

/**
 * Статус занятости репетитора – docs/data-model.md, `Availability`; ТЗ страницы репетитора, раздел 5.
 * Единственный источник типа: схема контента (начальное значение) и база импортируют его отсюда.
 */
export const availabilitySchema = z.enum(['available', 'few', 'full']);

export type Availability = z.infer<typeof availabilitySchema>;
