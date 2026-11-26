import type { Subject, Tutor } from '@/content';

// Бейдж первого экрана – это H1 главной (ТЗ главной, блок 1, п. 1). Текст собирается из данных,
// чтобы новый предмет или репетитор попадал в заголовок без правки вёрстки.

/** До стольких предметов включительно они перечисляются, больше – «по N предметам». */
const LISTED_SUBJECTS_MAX = 3;
/** С этого числа репетиторов имён в бейдже нет. */
const NAMED_TUTORS_MAX = 2;

type BadgeSubject = Pick<Subject, 'status' | 'nameDativeWithPrep' | 'gradeFrom' | 'gradeTo'>;
type BadgeTutor = Pick<Tutor, 'name'>;

/** «A», «A и B», «A, B и C». */
function joinWithAnd(items: readonly string[]): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} и ${items.at(-1)}`;
}

/** «по физике» → «физике». */
const withoutPrep = (nameDativeWithPrep: string) => nameDativeWithPrep.replace(/^по\s+/, '');

/** Дательный падеж после «по»: «по 21 предмету», «по 5 предметам». */
function subjectsCount(count: number): string {
  const word = count % 10 === 1 && count % 100 !== 11 ? 'предмету' : 'предметам';
  return `по ${count} ${word}`;
}

function grades(subjects: readonly BadgeSubject[]): string {
  const from = Math.min(...subjects.map((subject) => subject.gradeFrom));
  const to = Math.max(...subjects.map((subject) => subject.gradeTo));
  return from === to ? `для ${from} класса` : `для ${from}–${to} классов`;
}

/**
 * «по математике и физике для 5–11 классов» – предметы и классы бейджа; пусто, если активных
 * предметов нет. Из этой же части собираются метатеги главной.
 */
export function subjectsAndGrades(subjects: readonly BadgeSubject[]): string {
  const active = subjects.filter((subject) => subject.status === 'active');
  if (active.length === 0) return '';
  const names =
    active.length > LISTED_SUBJECTS_MAX
      ? subjectsCount(active.length)
      : joinWithAnd(
          // Предлог один раз, как в ТЗ: «по математике и физике».
          active.map((subject, index) =>
            index === 0 ? subject.nameDativeWithPrep : withoutPrep(subject.nameDativeWithPrep),
          ),
        );
  return `${names} ${grades(active)}`;
}

/** «Онлайн-репетиторы по математике для 5–11 классов» – бейдж без имён. */
export function heroBadgeTitle(subjects: readonly BadgeSubject[], tutorCount: number): string {
  const who = tutorCount === 1 ? 'Онлайн-репетитор' : 'Онлайн-репетиторы';
  return [who, subjectsAndGrades(subjects)].filter(Boolean).join(' ');
}

/** Имена в бейдже: «Андрей и Максим»; при трёх и более репетиторах – пусто. */
export function badgeNames(tutors: readonly BadgeTutor[]): string {
  return tutors.length > NAMED_TUTORS_MAX ? '' : joinWithAnd(tutors.map((tutor) => tutor.name));
}

/**
 * «Онлайн-репетиторы по математике для 5–11 классов: Андрей и Максим».
 * `tutors` – уже отобранные для показа (без ушедших) и по порядку `order`.
 */
export function heroBadge(
  subjects: readonly BadgeSubject[],
  tutors: readonly BadgeTutor[],
): string {
  const title = heroBadgeTitle(subjects, tutors.length);
  const names = badgeNames(tutors);
  return names ? `${title}: ${names}` : title;
}
