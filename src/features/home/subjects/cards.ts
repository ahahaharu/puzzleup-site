import type { Subject, Tutor } from '@/content';
import { gradesLabel } from '@/features/tutors/card-data';
import { capitalize } from '@/lib/text';
import { tutorUrl } from '@/lib/urls';

// Карточки блока «Предметы» – ТЗ главной, блок 4. Блок строится из `subjects.json` и сам
// подстраивается под число предметов.

export type SubjectCardData = {
  id: string;
  /** «Математика». */
  title: string;
  /** «5–11 класс». */
  grades: string;
  /** Темы, первая – с заглавной: «Дроби и проценты», «уравнения и неравенства». */
  topics: string[];
  formula: string;
  paper: Subject['paper'];
  /** «Ведут:» – имя, классы по этому предмету и страница репетитора. */
  tutors: { slug: string; name: string; grades: string; href: string }[];
  /** «Выбрать репетитора по математике». */
  ctaLabel: string;
  ctaHref: string;
};

type SubjectsTutor = Pick<Tutor, 'slug' | 'name' | 'subjects'>;

/**
 * Активные предметы, которые кто-то ведёт; `tutors` – неушедшие, по порядку вывода. Кнопка
 * включает фильтр блока «Репетиторы» по предмету (`?subject=`), если вкладки фильтра есть –
 * то есть предметов с репетиторами больше одного.
 */
export function subjectCards(
  subjects: readonly Subject[],
  tutors: readonly SubjectsTutor[],
): SubjectCardData[] {
  const cards = subjects
    .filter((subject) => subject.status === 'active')
    .map((subject) => ({
      subject,
      teaching: tutors.flatMap((tutor) => {
        const item = tutor.subjects.find((candidate) => candidate.id === subject.id);
        return item ? [{ tutor, item }] : [];
      }),
    }))
    .filter(({ teaching }) => teaching.length > 0);
  const filter = cards.length > 1;

  return cards.map(({ subject, teaching }) => ({
    id: subject.id,
    title: capitalize(subject.name),
    grades: gradesLabel(subject.gradeFrom, subject.gradeTo),
    topics: subject.topics.map((topic, index) => (index === 0 ? capitalize(topic) : topic)),
    formula: subject.formula,
    paper: subject.paper,
    tutors: teaching.map(({ tutor, item }) => ({
      slug: tutor.slug,
      name: tutor.name,
      grades: gradesLabel(item.from, item.to),
      href: tutorUrl(tutor.slug),
    })),
    ctaLabel: `Выбрать репетитора ${subject.nameDativeWithPrep}`,
    ctaHref: filter ? `/?subject=${encodeURIComponent(subject.id)}#tutors` : '#tutors',
  }));
}

/**
 * Колонок на десктопе (ТЗ, «Раскладка»): 1 – одна широкая карточка, 2 – две, 3 – в ряд, 4 – 2 × 2,
 * 5 и больше – по три в ряд.
 */
export function subjectColumns(count: number): 1 | 2 | 3 {
  if (count <= 1) return 1;
  if (count === 2 || count === 4) return 2;
  return 3;
}
