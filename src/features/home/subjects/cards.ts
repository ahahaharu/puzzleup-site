import type { Subject, Tutor } from '@/content';
import { filterTabs } from '@/features/home/tutors/filter';
import { gradesLabel } from '@/features/tutors/card-data';
import { gradesRange } from '@/features/tutors/grades';
import { capitalize } from '@/lib/text';
import { tutorLeadUrl } from '@/lib/urls';

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
  /** «Ведут:» – имя, классы по этому предмету («5–9») и форма репетитора с этим предметом. */
  tutors: { slug: string; name: string; grades: string; href: string }[];
  /** «Выбрать репетитора по математике». */
  ctaLabel: string;
  ctaHref: string;
};

type SubjectsTutor = Pick<Tutor, 'slug' | 'name' | 'subjects'>;

/**
 * Активные предметы, которые кто-то ведёт; `tutors` – неушедшие, по порядку вывода. Имя в строке
 * «Ведут:» ведёт на форму репетитора с предметом (ТЗ главной, раздел 3, «Андрей →»). Кнопка
 * включает фильтр блока «Репетиторы» по предмету (`?subject=`), если у предмета есть вкладка.
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
  // То же правило, что у вкладок блока «Репетиторы»: кнопка не включает фильтр, которого нет.
  const tabs = filterTabs(
    cards.map(({ subject }) => subject),
    tutors.map((tutor) => ({ subjectIds: tutor.subjects.map((item) => item.id) })),
  );
  const filtered = new Set(tabs.map((tab) => tab.id));

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
      grades: gradesRange(item),
      href: tutorLeadUrl(tutor.slug, { entry: 'subjects', subject: subject.id }),
    })),
    ctaLabel: `Выбрать репетитора ${subject.nameDativeWithPrep}`,
    ctaHref: filtered.has(subject.id)
      ? `/?subject=${encodeURIComponent(subject.id)}#tutors`
      : '#tutors',
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
