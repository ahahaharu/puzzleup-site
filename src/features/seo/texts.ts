// Метатеги главной: в ТЗ их нет, тексты утверждены владельцем в плане 4.1 (ADR-055). Предметы,
// классы и имена – те же, что в бейдже H1 (ТЗ главной, блок 1, п. 1).

const SUFFIX = ' | PuzzleUp';

/** «Онлайн-репетиторы по математике для 5–11 классов | PuzzleUp». */
export function homeTitle(badgeTitle: string): string {
  return `${badgeTitle}${SUFFIX}`;
}

/**
 * «Общий сайт независимых репетиторов по математике для 5–11 классов: Андрей и Максим. Занятия
 * онлайн, пробное – 30 минут, бесплатно.» Без имён при трёх и более репетиторах.
 */
export function homeDescription(subjectsAndGrades: string, names: string): string {
  const who = ['Общий сайт независимых репетиторов', subjectsAndGrades].filter(Boolean).join(' ');
  return `${who}${names ? `: ${names}` : ''}. Занятия онлайн, пробное – 30 минут, бесплатно.`;
}
