import { splitScreenshots, type ReviewCardData } from '@/features/reviews/card-data';
import { ReviewCard } from '@/features/reviews/ReviewCard';
import { Screenshots, type WallNote } from '@/features/reviews/Screenshots';
import { reveal } from '@/lib/reveal';

import { ReviewsList } from './ReviewsList';

// Блок 4 «Отзывы» – ТЗ страницы репетитора, раздел 4, блок 4; макет T-4-reviews, TM-4-reviews.
// Сверху – лента скриншотов из мессенджеров (ADR-062), под ней карточки текстовых отзывов – те же,
// что на главной, без ссылки на репетитора. Все отзывы – в разметке.

type TutorReviewsProps = {
  title: string;
  /** Имя ленты скриншотов для дикторов. */
  label: string;
  reviews: readonly ReviewCardData[];
  /** Записка о пробном занятии в пустом месте кладки скриншотов. */
  note?: WallNote | undefined;
};

export function TutorReviews({ title, label, reviews, note }: TutorReviewsProps) {
  // Пока опубликованных отзывов нет, блока нет (раздел 3).
  if (reviews.length === 0) return null;
  const { screenshots, cards } = splitScreenshots(reviews);

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="paper-section">
      <div className="page-container py-14 lg:py-24">
        <h2 id="reviews-title" {...reveal()} className="font-display text-h2 text-ink">
          {title}
        </h2>
        {screenshots.length > 0 && (
          <div {...reveal()} className="mt-7 lg:mt-10">
            <Screenshots reviews={screenshots} label={label} layout="wall" note={note} />
          </div>
        )}
        {cards.length > 0 && (
          <ReviewsList count={cards.length}>
            {cards.map((review) => (
              <li key={review.id} {...reveal()} className="min-w-0 scroll-mt-24 focus:outline-none">
                <ReviewCard review={review} />
              </li>
            ))}
          </ReviewsList>
        )}
      </div>
    </section>
  );
}
