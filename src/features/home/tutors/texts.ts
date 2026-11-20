import { plural } from '@/lib/plural';

// Тексты блока «Репетиторы» – ТЗ главной, блок 5. Подписи интерфейса, не контент: не зависят ни от
// предметов, ни от числа репетиторов.

export const TUTORS_TITLE = 'Репетиторы';

export const TUTORS_LEAD =
  'Выберите, к кому записаться. Каждый репетитор работает сам – со своими учениками, ценой и условиями.';

export const ALL_TAB = 'Все';

/** Подпись группы вкладок для дикторов. */
export const TABS_LABEL = 'Предмет';

/** Подпись ленты для дикторов – из ТЗ. */
export const LIST_LABEL = 'Репетиторы';

export const SHOW_ALL = 'Показать всех';

/** Объявление для дикторов после смены вкладки: «Показаны 2 репетитора» (ADR-043). */
export function shownAnnouncement(count: number): string {
  const verb = plural(count, ['Показан', 'Показаны', 'Показано']);
  return `${verb} ${count} ${plural(count, ['репетитор', 'репетитора', 'репетиторов'])}`;
}
