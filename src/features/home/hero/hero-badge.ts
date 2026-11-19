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
 * «Онлайн-репетиторы по математике для 5–11 классов: Андрей и Максим».
 * `tutors` – уже отобранные для показа (без ушедших) и по порядку `order`.
 */
export function heroBadge(
  subjects: readonly BadgeSubject[],
  tutors: readonly BadgeTutor[],
): string {
  const active = subjects.filter((subject) => subject.status === 'active');
  const who = tutors.length === 1 ? 'Онлайн-репетитор' : 'Онлайн-репетиторы';

  const parts = [who];
  if (active.length > 0) {
    parts.push(
      active.length > LISTED_SUBJECTS_MAX
        ? subjectsCount(active.length)
        : joinWithAnd(active.map((subject) => subject.nameDativeWithPrep)),
      grades(active),
    );
  }

  const title = parts.join(' ');
  if (tutors.length === 0 || tutors.length > NAMED_TUTORS_MAX) return title;
  return `${title}: ${joinWithAnd(tutors.map((tutor) => tutor.name))}`;
}
