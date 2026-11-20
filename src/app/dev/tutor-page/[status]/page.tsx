import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/SiteShell';
import type { Tutor } from '@/content';
import {
  FIXTURE_ANNA,
  FIXTURE_IGOR,
  FIXTURE_SITE,
  FIXTURE_SUBJECTS,
  FIXTURE_VERA,
  fixtureReview,
} from '@/features/tutor-page/fixtures';
import { tutorPageData } from '@/features/tutor-page/page-data';
import { TutorPage } from '@/features/tutor-page/TutorPage';

// Витрина страницы репетитора на выдуманных данных: статусы «Есть свободное время», «Последние
// места», «Мест нет» и ушедший, восемь отзывов («Показать ещё»), три других репетитора.
// Как /dev/ui, есть только в `next dev` (ADR-027).

export const metadata: Metadata = {
  title: 'Страница репетитора',
  robots: { index: false, follow: false },
};

const STATUSES = ['available', 'few', 'full', 'archived'] as const;

export function generateStaticParams() {
  return STATUSES.map((status) => ({ status }));
}

const REVIEWS = Array.from({ length: 8 }, (_, index) =>
  fixtureReview(`review-${index + 1}`, {
    date: `2026-10-${String(20 - index).padStart(2, '0')}`,
    text:
      index % 3 === 0
        ? 'Выдуманный длинный отзыв: как прошло пробное занятие, что изменилось за первые недели и как ребёнок стал увереннее решать задачи. '.repeat(
            3,
          )
        : 'Выдуманный короткий отзыв о занятиях.',
  }),
);

export default async function TutorPageShowcase({ params }: PageProps<'/dev/tutor-page/[status]'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const slug = (await params).status;
  const status = STATUSES.find((value) => value === slug);
  if (!status) notFound();

  const tutor: Tutor =
    status === 'archived'
      ? { ...FIXTURE_ANNA, archived: true }
      : { ...FIXTURE_ANNA, availability: status };
  const data = tutorPageData(tutor, {
    site: FIXTURE_SITE,
    subjects: FIXTURE_SUBJECTS,
    tutors: [
      tutor,
      FIXTURE_IGOR,
      FIXTURE_VERA,
      { ...FIXTURE_IGOR, id: 't-petr', slug: 'petr', name: 'Пётр', availability: 'few' },
    ],
    reviews: REVIEWS,
    year: 2026,
  });

  return (
    <SiteShell bottomBar={{ showAfter: 'top', hideWhenVisible: tutor.archived ? 'more' : 'lead' }}>
      <TutorPage
        data={data}
        aboutText={
          <>
            <p>Выдуманный первый абзац текста «О себе»: как репетитор пришёл в преподавание.</p>
            <p>
              Выдуманный второй абзац: как строятся занятия и что, если ребёнок боится предмета.
            </p>
          </>
        }
      />
    </SiteShell>
  );
}
