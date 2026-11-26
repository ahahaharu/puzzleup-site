// Метатеги главной: в ТЗ их нет, тексты утверждены владельцем в плане 4.1 (ADR-055). Предметы,
// классы и имена – те же, что в бейдже H1 (ТЗ главной, блок 1, п. 1).

const SUFFIX = ' | PuzzleUp';
// Между числом и словом в картинке – неразрывный пробел. В метатегах – обычный: их читают
// поисковики, как и в `tutorMetadata`.
const NBSP = '\u00a0';

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

/** Строка OG-картинки репетитора из макета P-og: «5–9 классы · онлайн», «7 класс · онлайн». */
export function tutorOgNote(grades: { from: number; to: number } | null): string {
  if (!grades) return 'онлайн';
  const label =
    grades.from === grades.to
      ? `${grades.from}${NBSP}класс`
      : `${grades.from}–${grades.to}${NBSP}классы`;
  return `${label} · онлайн`;
}
