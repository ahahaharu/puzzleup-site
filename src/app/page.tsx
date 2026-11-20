import { SiteShell } from '@/components/layout/SiteShell';
import { listedTutors } from '@/components/layout/texts';
import { getPublishedReviews, getSite, getSituations, getSubjects, getTutors } from '@/content';
import { Hero } from '@/features/home/hero/Hero';
import { heroBadge } from '@/features/home/hero/hero-badge';
import { situationCards } from '@/features/home/situations/cards';
import { Situations } from '@/features/home/situations/Situations';
import { Tutors } from '@/features/home/tutors/Tutors';
import { countReviews, toTutorCardData } from '@/features/tutors/card-data';
import { currentYear } from '@/features/tutors/current-year';
import { sortByAvailability } from '@/features/tutors/sort';

export default async function HomePage() {
  const site = getSite();
  const subjects = getSubjects();
  const tutors = listedTutors(getTutors());
  const reviews = countReviews(getPublishedReviews());
  const year = await currentYear();

  // Статус занятости пока – начальное значение из MDX; из базы его подставит feature/availability.
  const cards = sortByAvailability(tutors).map((tutor) =>
    toTutorCardData(tutor, {
      subjects,
      availability: tutor.availability,
      reviewCount: reviews.get(tutor.id) ?? 0,
      year,
    }),
  );

  return (
    <SiteShell home>
      <Hero badge={heroBadge(subjects, tutors)} slogan={site.slogan} />
      <Tutors tutors={cards} subjects={subjects.filter((subject) => subject.status === 'active')} />
      <Situations cards={situationCards(getSituations(), tutors)} />
    </SiteShell>
  );
}
