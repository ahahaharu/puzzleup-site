import { z } from 'zod';

/**
 * Статус занятости репетитора – docs/data-model.md, `Availability`; ТЗ страницы репетитора, раздел 5.
 * Единственный источник типа: схема контента (начальное значение) и база импортируют его отсюда.
 */
export const availabilitySchema = z.enum(['available', 'few', 'full']);

export type Availability = z.infer<typeof availabilitySchema>;

/** tutorId → текущий статус из базы. Репетитора без строки нет: у него статус из MDX. */
export type AvailabilityMap = Readonly<Partial<Record<string, Availability>>>;

/** Текущие статусы поверх начальных из MDX – дальше страницы считают всё как раньше. */
export function withAvailability<T extends { id: string; availability: Availability }>(
  tutors: readonly T[],
  statuses: AvailabilityMap,
): T[] {
  return tutors.map((tutor) => ({
    ...tutor,
    availability: statuses[tutor.id] ?? tutor.availability,
  }));
}
