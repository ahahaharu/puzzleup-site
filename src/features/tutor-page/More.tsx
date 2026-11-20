import Link from 'next/link';

import { Icon } from '@/components/ui/Icon';
import { SectionHead } from '@/components/ui/SectionHead';
import { TutorCard } from '@/features/tutors/TutorCard';
import { cn } from '@/lib/cn';

import type { MoreData } from './page-data';
import { ALL_TUTORS } from './texts';

// Блок 7 «Другие репетиторы» – ТЗ страницы репетитора, раздел 4, блок 7; макеты T-7-more, TM-7-more.
// Карточки – те же, что на главной. Одна – в широкой раскладке; две – по 6 колонок, как на главной
// (ADR-043); три – три колонки от 1024 px (две от 768). На телефоне – горизонтальная лента.

export function More({ more }: { more: MoreData }) {
  const single = more.tutors.length === 1;

  return (
    <section id="more" aria-labelledby="more-title" className="paper-page">
      <div className="page-container py-14 lg:py-24">
        <SectionHead id="more-title" title={more.title} lead={more.lead} />
        <ul
          className={cn(
            // relative – чтобы скрытые подписи (sr-only) карточек обрезались лентой, а не растягивали страницу.
            'relative mt-6 lg:mt-10',
            single
              ? 'max-w-160'
              : '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0',
            more.tutors.length >= 3 && 'lg:grid-cols-3',
          )}
        >
          {more.tutors.map((tutor, index) => (
            <li
              key={tutor.id}
              className={cn('min-w-0', !single && 'w-[85%] flex-none snap-start md:w-auto')}
            >
              <TutorCard tutor={tutor} tilt={index % 2 === 0 ? 1.2 : -1.2} entry="tutor_more" />
            </li>
          ))}
        </ul>
        <Link
          href="/#tutors"
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-field font-semibold text-ink no-underline hover:underline lg:mt-7"
        >
          {ALL_TUTORS}
          <Icon name="arrow-right" size={18} />
        </Link>
      </div>
    </section>
  );
}
