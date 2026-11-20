import type { Subject, Tutor } from '@/content';

// Классы репетитора одной строкой – блоки «Цены», «О сайте», «Отзывы» и ответ FAQ о классах
// (ТЗ главной, блоки 6–9): «Андрей · 5–9 класс», «Андрей – с 5–9 классом».

export type GradeRange = { from: number; to: number };

type GradesTutor = Pick<Tutor, 'subjects'>;
type GradesSubject = Pick<Subject, 'id' | 'status'>;

/**
 * Все классы репетитора по активным предметам: от наименьшего «от» до наибольшего «до».
 * Скрытый предмет на сайте не показывается (ТЗ главной, блок 4). Без активных предметов – `null`.
 */
export function tutorGrades(
  tutor: GradesTutor,
  subjects: readonly GradesSubject[],
): GradeRange | null {
  const active = tutor.subjects.filter(
    (item) => subjects.find((subject) => subject.id === item.id)?.status === 'active',
  );
  if (active.length === 0) return null;
  return {
    from: Math.min(...active.map((item) => item.from)),
    to: Math.max(...active.map((item) => item.to)),
  };
}

/** «5–9», «9»: диапазон не разрывается после тире (невидимая связка U+2060). */
export function gradesRange({ from, to }: GradeRange): string {
  return from === to ? String(from) : `${from}–⁠${to}`;
}
