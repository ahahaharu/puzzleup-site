import type { Availability } from '@/lib/availability';

import { experienceLabel, type TutorCardData } from './card-data';

// Выдуманные репетиторы для компонентных тестов и витрины /dev/tutors: раскладки на 1, 2, 3 и 7+
// карточек, все статусы и несколько предметов, которых в настоящем контенте пока нет.

type Draft = [name: string, dative: string, prepositional: string, availability: Availability];

const DRAFTS: Draft[] = [
  ['Анна', 'Анне', 'Анне', 'available'],
  ['Игорь', 'Игорю', 'Игоре', 'few'],
  ['Вера', 'Вере', 'Вере', 'full'],
  ['Ольга', 'Ольге', 'Ольге', 'available'],
  ['Пётр', 'Петру', 'Петре', 'available'],
  ['Илья', 'Илье', 'Илье', 'few'],
  ['Марина', 'Марине', 'Марине', 'available'],
];

const SUBJECTS: Array<Pick<TutorCardData, 'subjectIds' | 'subjectLines'>> = [
  { subjectIds: ['math'], subjectLines: ['Математика · 5–9 класс'] },
  {
    subjectIds: ['math', 'physics'],
    subjectLines: ['Математика · 5–11 класс', 'Физика · 7–11 класс'],
  },
  { subjectIds: ['physics'], subjectLines: ['Физика · 7–9 класс'] },
];

export const FIXTURE_TUTORS: TutorCardData[] = DRAFTS.map(
  ([name, nameDative, namePrepositional, availability], index) => ({
    id: `t-example-${index + 1}`,
    slug: `example-${index + 1}`,
    name,
    nameDative,
    namePrepositional,
    availability,
    ...SUBJECTS[index % SUBJECTS.length]!,
    credentials: `${experienceLabel(2024 - index, 2026)} · Учреждение образования`,
    tagline: 'Нахожу, где тема перестала быть понятной, и возвращаюсь к этому месту',
    price: '40',
    reviewCount: index % 3 === 0 ? 0 : index + 10,
    telegram: `example_tutor_${index + 1}`,
    viber: `+375 29 000-00-0${index + 1}`,
  }),
);

/** Предметы для вкладок фильтра в тех же фикстурах. */
export const FIXTURE_SUBJECTS = [
  { id: 'math', name: 'математика' },
  { id: 'physics', name: 'физика' },
];
