import type { ReviewCardData } from '@/features/reviews/card-data';
import { ReviewCard } from '@/features/reviews/ReviewCard';

import { ReviewsList } from './ReviewsList';

// Блок 4 «Отзывы» – ТЗ страницы репетитора, раздел 4, блок 4; макет T-4-reviews, TM-4-reviews.
// Карточки – те же, что на главной, без ссылки на репетитора. Все отзывы – в разметке.

type TutorReviewsProps = { title: string; reviews: readonly ReviewCardData[] };

export function TutorReviews({ title, reviews }: TutorReviewsProps) {
  // Пока опубликованных отзывов нет, блока нет (раздел 3).
  if (reviews.length === 0) return null;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="paper-section">
      <div className="page-container py-14 lg:py-24">
        <h2 id="reviews-title" className="font-display text-h2 text-ink">
          {title}
        </h2>
        <ReviewsList count={reviews.length}>
          {reviews.map((review) => (
            <li key={review.id} className="min-w-0 scroll-mt-24 focus:outline-none">
              <ReviewCard review={review} />
            </li>
          ))}
        </ReviewsList>
      </div>
    </section>
  );
}
