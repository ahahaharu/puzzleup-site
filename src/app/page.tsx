import { SiteShell } from '@/components/layout/SiteShell';
import { listedTutors } from '@/components/layout/texts';
import {
  getFaq,
  getPublishedReviews,
  getSite,
  getSituations,
  getSubjects,
  getTutors,
  type Site,
  type Tutor,
} from '@/content';
import { About } from '@/features/home/about/About';
import { aboutTutors } from '@/features/home/about/cards';
import { Faq } from '@/features/home/faq/Faq';
import { faqItems } from '@/features/home/faq/items';
import { Hero } from '@/features/home/hero/Hero';
import { heroBadge } from '@/features/home/hero/hero-badge';
import { How } from '@/features/home/how/How';
import { howSteps } from '@/features/home/how/texts';
import { Prices } from '@/features/home/prices/Prices';
import { priceRows } from '@/features/home/prices/rows';
import { situationCards } from '@/features/home/situations/cards';
import { Situations } from '@/features/home/situations/Situations';
import { subjectCards } from '@/features/home/subjects/cards';
import { Subjects } from '@/features/home/subjects/Subjects';
import { Tutors } from '@/features/home/tutors/Tutors';
import { countReviews, toTutorCardData } from '@/features/tutors/card-data';
import { currentYear } from '@/features/tutors/current-year';
import { sortByAvailability } from '@/features/tutors/sort';

/** Пример итога пробного занятия – только пока его репетитор на сайте (docs/data-model.md). */
function trialExample(example: Site['trialExample'], tutors: readonly Tutor[]) {
  const tutor = example && tutors.find((candidate) => candidate.id === example.tutorId);
  return example && tutor ? { ...example, name: tutor.name } : undefined;
}

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
      <How
        steps={howSteps({ responseHours: site.responseHours, platforms: site.defaultPlatforms })}
        example={trialExample(site.trialExample, tutors)}
      />
      <Subjects subjects={subjectCards(subjects, tutors)} />
      <Prices prices={site.prices} rows={priceRows(tutors, subjects)} />
      <Faq items={faqItems(getFaq(), tutors, subjects)} />
      <About text={site.about} tutors={aboutTutors(tutors, subjects)} />
    </SiteShell>
  );
}
