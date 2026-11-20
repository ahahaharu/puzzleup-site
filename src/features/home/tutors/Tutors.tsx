import { Suspense } from 'react';

import { SectionHead } from '@/components/ui/SectionHead';
import type { TutorCardData } from '@/features/tutors/card-data';
import { TutorCard } from '@/features/tutors/TutorCard';

import { filterTabs } from './filter';
import { TUTORS_LEAD, TUTORS_TITLE } from './texts';
import { TutorsBrowser } from './TutorsBrowser';
import { TutorsView, type TutorItem } from './TutorsView';

// Блок «Репетиторы» – ТЗ главной, блок 5; макеты D-5-tutors, M-5-tutors. Главное действие страницы:
// выбрать репетитора и перейти к записи к нему. Карточки строит сервер, клиент только фильтрует.

type TutorsProps = {
  /** Неушедшие репетиторы, уже по статусу и `order`. */
  tutors: readonly TutorCardData[];
  /** Активные предметы в порядке `subjects.json` – для вкладок. */
  subjects: readonly { id: string; name: string }[];
  /** Якорь блока; другой – только на витрине /dev/tutors, где блоков несколько. */
  id?: string;
};

export function Tutors({ tutors, subjects, id = 'tutors' }: TutorsProps) {
  // Блок без данных не выводится.
  if (tutors.length === 0) return null;

  const tabs = filterTabs(subjects, tutors);
  const items: TutorItem[] = tutors.map((tutor, index) => ({
    id: tutor.id,
    subjectIds: tutor.subjectIds,
    // Соседние фото наклонены в разные стороны, как в макете.
    card: <TutorCard tutor={tutor} tilt={index % 2 === 0 ? -1.5 : 1.2} />,
  }));

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="paper-page-alt">
      <div className="page-container py-14 lg:py-24">
        <SectionHead id={`${id}-title`} title={TUTORS_TITLE} lead={TUTORS_LEAD} />
        <Suspense
          fallback={
            <TutorsView items={items} tabs={tabs} subject={null} expanded={false} fallback />
          }
        >
          <TutorsBrowser items={items} tabs={tabs} />
        </Suspense>
      </div>
    </section>
  );
}
