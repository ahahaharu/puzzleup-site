// Пункты навигации шапки, мобильного меню и подвала – ТЗ главной, раздел 3 и блоки 0, 10.

export type NavLink = { id: string; label: string; href: string };

/** Что есть на главной: пункт блока без данных не выводится – блока на странице нет. */
export type NavData = { hasSubjects: boolean; hasReviews: boolean };

type NavSource = {
  subjects: readonly { id: string; status: 'active' | 'hidden' }[];
  /** Неушедшие репетиторы. */
  tutors: readonly { id: string; subjects: readonly { id: string }[] }[];
  /** Опубликованные отзывы. */
  reviews: readonly { tutorId: string }[];
};

/**
 * Те же правила, что у блоков главной: «Предметы» – активный предмет, который кто-то ведёт,
 * «Отзывы» – опубликованный отзыв неушедшего репетитора (ТЗ главной, блоки 4 и 6).
 */
export function navData({ subjects, tutors, reviews }: NavSource): NavData {
  return {
    hasSubjects: subjects.some(
      (subject) =>
        subject.status === 'active' &&
        tutors.some((tutor) => tutor.subjects.some((item) => item.id === subject.id)),
    ),
    hasReviews: reviews.some((review) => tutors.some((tutor) => tutor.id === review.tutorId)),
  };
}

const ITEMS = [
  { id: 'tutors', label: 'Репетиторы' },
  { id: 'how', label: 'Как это работает' },
  { id: 'subjects', label: 'Предметы', when: 'hasSubjects' },
  { id: 'reviews', label: 'Отзывы', when: 'hasReviews' },
  { id: 'prices', label: 'Цены' },
] as const satisfies ReadonlyArray<{ id: string; label: string; when?: keyof NavData }>;

/**
 * На главной пункты – якоря блоков (`#prices`), на остальных страницах – главная с якорем
 * (`/#prices`).
 */
export function navLinks(data: NavData, { onHome }: { onHome: boolean }): NavLink[] {
  return ITEMS.filter((item) => !('when' in item) || data[item.when]).map(({ id, label }) => ({
    id,
    label,
    href: onHome ? `#${id}` : `/#${id}`,
  }));
}
