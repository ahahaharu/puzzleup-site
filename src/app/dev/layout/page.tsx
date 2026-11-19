import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/SiteShell';
import { cn } from '@/lib/cn';

// Витрина каркаса страницы: шапка, меню, подвал и нижняя панель на блоках-заглушках с якорями
// главной. Как /dev/ui, есть только в `next dev` (ADR-027). Блоки главной появятся в фичах 2.x.

export const metadata: Metadata = {
  title: 'Каркас страницы',
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: 'top', title: 'Первый экран', alt: false },
  { id: 'tutors', title: 'Репетиторы', alt: true },
  { id: 'situations', title: 'Узнаёте ситуацию?', alt: false },
  { id: 'how', title: 'Как это работает', alt: true },
  { id: 'subjects', title: 'Предметы', alt: false },
  { id: 'reviews', title: 'Отзывы', alt: true },
  { id: 'prices', title: 'Цены', alt: false },
  { id: 'faq', title: 'Вопросы', alt: true },
  { id: 'about', title: 'О сайте', alt: false },
];

export default function LayoutShowcasePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <SiteShell home>
      {SECTIONS.map(({ id, title, alt }) => (
        <section
          key={id}
          id={id}
          aria-labelledby={`${id}-title`}
          className={cn('min-h-[90vh] py-14 lg:py-24', alt ? 'paper-page-alt' : 'paper-page')}
        >
          <div className="page-container">
            <h2 id={`${id}-title`} className="font-display text-h2 text-ink">
              {title}
            </h2>
            <p className="mt-4 text-ink-muted">{`#${id} – заглушка блока`}</p>
          </div>
        </section>
      ))}
    </SiteShell>
  );
}
