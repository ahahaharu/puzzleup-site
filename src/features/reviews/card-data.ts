import type { Review, Subject } from '@/content';
import { capitalize } from '@/lib/text';

// Данные карточки отзыва – ТЗ главной, блок 6 «Карточка отзыва»; та же карточка стоит на странице
// репетитора.

export type ReviewCardData = {
  id: string;
  /** «Ольга, мама ученика 7 класса». */
  signature: string;
  /** «Математика». */
  subject: string;
  text: string;
  /** «12 октября 2026» и дата для `<time>`. */
  date: string;
  dateTime: string;
};

const DATE = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** «2026-10-12» → «12 октября 2026», без «г.». */
export function formatReviewDate(isoDate: string): string {
  return DATE.formatToParts(new Date(`${isoDate}T00:00:00Z`))
    .filter((part) => part.type === 'day' || part.type === 'month' || part.type === 'year')
    .map((part) => part.value)
    .join(' ');
}

export function toReviewCard(
  review: Review,
  subjects: readonly Pick<Subject, 'id' | 'name'>[],
): ReviewCardData {
  const subject = subjects.find((candidate) => candidate.id === review.subject);
  return {
    id: review.id,
    signature: `${review.author}, ${review.relation}`,
    subject: capitalize(subject?.name ?? review.subject),
    text: review.text,
    date: formatReviewDate(review.date),
    dateTime: review.date,
  };
}
