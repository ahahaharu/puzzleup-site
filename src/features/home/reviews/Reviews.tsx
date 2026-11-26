import Link from 'next/link';

import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { SectionHead } from '@/components/ui/SectionHead';
import { ReviewCard } from '@/features/reviews/ReviewCard';
import { ScreenshotCarousel } from '@/features/reviews/ScreenshotCarousel';
import { cn } from '@/lib/cn';
import { reveal } from '@/lib/reveal';

import type { ReviewColumn } from './columns';
import { REVIEWS_LEAD, REVIEWS_TITLE } from './texts';

// Блок «Отзывы» – ТЗ главной, блок 6; макеты D-6-reviews, M-6-reviews. Колонка на репетитора:
// шапка, один отзыв (есть скриншоты – их лента, ADR-062) и ссылка на все. Строки колонок – общая сетка (subgrid), поэтому карточки
// в одном ряду одной высоты. Телефон – колонки одна под другой, без ленты.

type ReviewsProps = {
  /** Якорь блока; другой – только на витрине /dev/sections, где блоков несколько. */
  id?: string;
  columns: readonly ReviewColumn[];
};

export function Reviews({ columns, id = 'reviews' }: ReviewsProps) {
  // Нет отзывов ни у кого – блока нет (пункт навигации прячет SiteShell).
  if (columns.length === 0) return null;

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="paper-section">
      <div className="page-container py-14 lg:py-24">
        <SectionHead id={`${id}-title`} title={REVIEWS_TITLE} lead={REVIEWS_LEAD} />
        <ul
          className={cn(
            'mt-7 grid gap-x-6 gap-y-5 md:grid-cols-2 lg:mt-10 lg:gap-x-12',
            columns.length >= 3 && 'lg:grid-cols-3',
          )}
        >
          {columns.map((column) => (
            <li
              key={column.tutor.slug}
              {...reveal()}
              className="row-span-3 grid min-w-0 grid-rows-subgrid max-md:not-first:mt-5"
            >
              <div className="flex items-center gap-3.5">
                <Avatar name={column.tutor.name} photo={column.tutor.photo} size={48} />
                <div className="flex min-w-0 flex-col gap-0.5">
                  {/* Имя в шапке колонки – Unbounded 500, 20 px: макет D-6 / M-6. */}
                  <h3 className="font-display text-[1.25rem] leading-tight font-medium text-ink">
                    {/* Зона нажатия растянута по высоте до 44 px, строка не выше заголовка. */}
                    <Link
                      href={column.tutor.href}
                      className="relative no-underline after:absolute after:inset-x-0 after:-inset-y-3 hover:underline"
                    >
                      {column.tutor.name}
                    </Link>
                  </h3>
                  <p className="text-small text-ink-muted">{column.meta}</p>
                </div>
              </div>
              {column.screenshots.length > 0 ? (
                <ScreenshotCarousel reviews={column.screenshots} label={column.screenshotsLabel} />
              ) : (
                <ReviewCard review={column.review} />
              )}
              <Link
                href={column.allHref}
                className="inline-flex min-h-11 items-center gap-2 self-start text-field font-semibold text-ink no-underline hover:underline"
              >
                {column.allLabel}
                <Icon name="arrow-right" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
