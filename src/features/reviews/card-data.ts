import type { Review, Subject } from '@/content';
import { capitalize } from '@/lib/text';
import { formatLongDate } from '@/lib/time';

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
    date: formatLongDate(review.date),
    dateTime: review.date,
  };
}
