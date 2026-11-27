import type { Review, Subject } from '@/content';
import { capitalize } from '@/lib/text';
import { formatLongDate } from '@/lib/time';
import { reviewScreenshotUrl } from '@/lib/urls';

// Данные карточки отзыва – ТЗ главной, блок 6 «Карточка отзыва»; та же карточка стоит на странице
// репетитора.

export type ReviewCardData = {
  id: string;
  /** «Ольга, мама ученика 7 класса», без имени – «Мама ученика 7 класса». */
  signature: string;
  /** «Математика». */
  subject: string;
  /** У скриншота – расшифровка для дикторов, на экране её нет. */
  text: string;
  /** Адрес скриншота переписки; есть – отзыв стоит в ленте скриншотов, а не карточкой. */
  screenshot?: string | undefined;
  /** «12 октября 2026» и дата для `<time>`. */
  date: string;
  dateTime: string;
};

/** Отзывы со скриншотом – для ленты, остальные – карточками. Порядок сохраняется. */
export function splitScreenshots(reviews: readonly ReviewCardData[]) {
  const screenshots = reviews.filter(
    (review): review is ReviewCardData & { screenshot: string } => review.screenshot !== undefined,
  );
  const cards = reviews.filter((review) => review.screenshot === undefined);
  return { screenshots, cards };
}

export function toReviewCard(
  review: Review,
  subjects: readonly Pick<Subject, 'id' | 'name'>[],
): ReviewCardData {
  const subject = subjects.find((candidate) => candidate.id === review.subject);
  return {
    id: review.id,
    signature:
      review.author === undefined
        ? capitalize(review.relation)
        : `${review.author}, ${review.relation}`,
    subject: capitalize(subject?.name ?? review.subject),
    text: review.text,
    screenshot:
      review.screenshot === undefined ? undefined : reviewScreenshotUrl(review.screenshot),
    date: formatLongDate(review.date),
    dateTime: review.date,
  };
}
