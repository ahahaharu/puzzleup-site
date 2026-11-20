import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/SiteShell';
import { Tutors } from '@/features/home/tutors/Tutors';
import { FIXTURE_SUBJECTS, FIXTURE_TUTORS } from '@/features/tutors/fixtures';
import { sortByAvailability } from '@/features/tutors/sort';

// Витрина блока «Репетиторы» на выдуманных репетиторах: раскладки на 1, 2, 3 и 7 карточек, все
// статусы, вкладки предметов. Как /dev/ui, есть только в `next dev` (ADR-027).

export const metadata: Metadata = {
  title: 'Блок «Репетиторы»',
  robots: { index: false, follow: false },
};

const sorted = (count: number) =>
  sortByAvailability(FIXTURE_TUTORS.slice(0, count).map((tutor, order) => ({ ...tutor, order })));

const CASES = [1, 2, 3, 7];

export default function TutorsShowcasePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <SiteShell home>
      {CASES.map((count) => (
        <Tutors
          key={count}
          id={`tutors-${count}`}
          tutors={sorted(count)}
          // Одному и двум репетиторам вкладки не нужны – как на сайте при одном предмете.
          subjects={count < 3 ? FIXTURE_SUBJECTS.slice(0, 1) : FIXTURE_SUBJECTS}
        />
      ))}
    </SiteShell>
  );
}
