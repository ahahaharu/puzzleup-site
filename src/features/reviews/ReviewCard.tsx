import type { ReviewCardData } from './card-data';
import { ReviewText } from './ReviewText';

// Карточка отзыва – ТЗ главной, блок 6 «Карточка отзыва»; макеты D-6-reviews, M-6-reviews. Лист
// «в линейку»: фон card и линии через 32 px. Ссылки на репетитора в карточке нет – он назван рядом.

// Линии – токен focus 20 %, как в макете; шаг совпадает с межстрочным текста.
const LINED =
  'bg-card bg-[repeating-linear-gradient(transparent_0_31px,color-mix(in_srgb,var(--color-focus)_20%,transparent)_31px_32px)]';

export function ReviewCard({ review }: { review: ReviewCardData }) {
  return (
    <figure
      className={`flex h-full flex-col gap-3 rounded-card border border-ink/12 p-6 shadow-paper ${LINED}`}
    >
      {/* Кавычка Spectral 64 px – ТЗ, «Карточка отзыва»; межстрочный 0,7 – из макета. */}
      <span aria-hidden="true" className="h-8.5 font-hand text-[4rem] leading-[0.7] text-accent">
        «
      </span>
      <blockquote className="grow">
        <ReviewText text={review.text} />
      </blockquote>
      <figcaption className="flex flex-col items-start gap-1.5 pt-1">
        <span className="text-small font-semibold text-ink">{review.signature}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="rounded-full bg-kraft px-3 py-1 text-caption font-medium text-ink">
            {review.subject}
          </span>
          <time dateTime={review.dateTime} className="text-caption text-ink-muted">
            {review.date}
          </time>
        </span>
      </figcaption>
    </figure>
  );
}
