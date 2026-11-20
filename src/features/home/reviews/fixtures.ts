import type { ReviewColumn } from './columns';

// Выдуманные колонки отзывов для компонентных тестов и витрины /dev/sections: настоящих отзывов
// в контенте пока нет.

const SHORT =
  'Ребёнок перестал бояться контрольных: репетитор нашёл, где тема перестала быть понятной.';

const LONG = Array.from(
  { length: 9 },
  () =>
    'На занятиях разбирали темы, которые в школе прошли быстро, и решали задачи своего уровня без спешки.',
).join(' ');

const DRAFTS = [
  ['Анна', 'Анне', 'о', LONG],
  ['Игорь', 'Игоре', 'об', SHORT],
  ['Вера', 'Вере', 'о', SHORT],
] as const;

export const FIXTURE_REVIEW_COLUMNS: ReviewColumn[] = DRAFTS.map(
  ([name, prepositional, about, text], index) => ({
    tutor: { slug: `example-${index + 1}`, name, href: `/tutors/example-${index + 1}` },
    meta: `Математика · 5–9 класс · ${index + 3} отзыва`,
    review: {
      id: `review-${index + 1}`,
      signature: 'Ольга, мама ученика 7 класса',
      subject: 'Математика',
      text,
      date: '12 октября 2026',
      dateTime: '2026-10-12',
    },
    allLabel: `Все отзывы ${about} ${prepositional}`,
    allHref: `/tutors/example-${index + 1}#reviews`,
  }),
);
