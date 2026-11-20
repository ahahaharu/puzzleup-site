import type { Availability } from '@/lib/availability';

// Порядок репетиторов в списках – ТЗ главной, блок 5 «Порядок карточек»; ТЗ страницы репетитора,
// разделы 4 (блок 7) и 5: сначала «Есть свободное время», затем «Последние места», затем «Мест нет».

const RANK: Record<Availability, number> = { available: 0, few: 1, full: 2 };

/** По статусу занятости, внутри статуса – по `order`. Равные остаются в исходном порядке. */
export function sortByAvailability<T extends { availability: Availability; order: number }>(
  tutors: readonly T[],
): T[] {
  return tutors.toSorted(
    (a, b) => RANK[a.availability] - RANK[b.availability] || a.order - b.order,
  );
}
