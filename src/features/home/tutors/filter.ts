import { capitalize } from '@/lib/text';

// Фильтр-вкладки и раскладка блока «Репетиторы» – ТЗ главной, блок 5.

export type FilterTab = { id: string; label: string; count: number };

/** До стольких карточек во вкладке «Все» видно сразу, остальные – по «Показать всех». */
export const COLLAPSED_LIMIT = 6;

/**
 * Вкладки предметов: только по которым есть хотя бы один репетитор, с числом рядом. Выводятся,
 * только если предметов у репетиторов больше одного – иначе пустой список.
 * `subjects` – уже без скрытых, в порядке `subjects.json`.
 */
export function filterTabs(
  subjects: readonly { id: string; name: string }[],
  tutors: readonly { subjectIds: readonly string[] }[],
): FilterTab[] {
  const tabs = subjects
    .map((subject) => ({
      id: subject.id,
      label: capitalize(subject.name),
      count: tutors.filter((tutor) => tutor.subjectIds.includes(subject.id)).length,
    }))
    .filter((tab) => tab.count > 0);
  return tabs.length > 1 ? tabs : [];
}

/** Значение `?subject=` → выбранная вкладка; неизвестный предмет – «Все» (`null`). */
export function activeTab(param: string | null, tabs: readonly FilterTab[]): string | null {
  return tabs.some((tab) => tab.id === param) ? param : null;
}

/** Репетиторы выбранной вкладки; `null` – все. */
export function filterBySubject<T extends { subjectIds: readonly string[] }>(
  tutors: readonly T[],
  subject: string | null,
): T[] {
  return subject === null
    ? [...tutors]
    : tutors.filter((tutor) => tutor.subjectIds.includes(subject));
}

/**
 * Раскладка по числу видимых карточек (ТЗ: «Один или два репетитора», «Десктоп», «Телефон»):
 * `single` – одна широкая карточка, `pair` – две по центру, `grid` – сетка и лента на телефоне.
 */
export type TutorsLayout = 'single' | 'pair' | 'grid';

export function tutorsLayout(count: number): TutorsLayout {
  if (count <= 1) return 'single';
  if (count === 2) return 'pair';
  return 'grid';
}

/** Сколько карточек свёрнуто под «Показать всех»: только во вкладке «Все» и с 7 карточек. */
export function collapsedCount(count: number, subject: string | null, expanded: boolean): number {
  if (subject !== null || expanded || count <= COLLAPSED_LIMIT) return 0;
  return count - COLLAPSED_LIMIT;
}
