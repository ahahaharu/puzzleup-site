import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/SiteShell';
import { About } from '@/features/home/about/About';
import { FIXTURE_REVIEW_COLUMNS } from '@/features/home/reviews/fixtures';
import { Reviews } from '@/features/home/reviews/Reviews';
import type { SubjectCardData } from '@/features/home/subjects/cards';
import { Subjects } from '@/features/home/subjects/Subjects';

// Витрина блоков главной на выдуманных данных: отзывы (в контенте их пока нет), 2–5 предметов,
// «О сайте» на трёх репетиторах. Как /dev/ui, есть только в `next dev` (ADR-027).

export const metadata: Metadata = {
  title: 'Блоки главной',
  robots: { index: false, follow: false },
};

const PAPERS = ['cell', 'lined', 'mm', 'slanted', 'staff'] as const;
const NAMES = ['Математика', 'Физика', 'Химия', 'Информатика', 'Биология'];

const subjects = (count: number): SubjectCardData[] =>
  NAMES.slice(0, count).map((title, index) => ({
    id: `subject-${index + 1}`,
    title,
    grades: '5–11 класс',
    topics: ['Тема первая', 'тема вторая', 'тема третья', 'ЦТ и ЦЭ'],
    formula: 'x² − 5x + 6 = 0',
    paper: PAPERS[index % PAPERS.length] ?? 'cell',
    tutors: [
      { slug: 'example-1', name: 'Анна', grades: '5–9', href: '/tutors/example-1#lead' },
      { slug: 'example-2', name: 'Игорь', grades: '7–11', href: '/tutors/example-2#lead' },
    ],
    ctaLabel: `Выбрать репетитора по предмету ${index + 1}`,
    ctaHref: `/?subject=subject-${index + 1}#tutors`,
  }));

export default function SectionsShowcasePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <SiteShell home>
      <Reviews id="reviews-2" columns={FIXTURE_REVIEW_COLUMNS.slice(0, 2)} />
      <Reviews id="reviews-3" columns={FIXTURE_REVIEW_COLUMNS} />
      {[2, 3, 4, 5].map((count) => (
        <Subjects key={count} id={`subjects-${count}`} subjects={subjects(count)} />
      ))}
      {/* Три и более репетитора – вместо карточек одна кнопка. */}
      <About
        text="PuzzleUp – общий сайт независимых репетиторов. PuzzleUp не организация, не юрлицо и не ИП."
        tutors={[]}
      />
    </SiteShell>
  );
}
