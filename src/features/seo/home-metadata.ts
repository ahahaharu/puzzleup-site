import type { Subject, Tutor } from '@/content';
import { badgeNames, heroBadgeTitle, subjectsAndGrades } from '@/features/home/hero/hero-badge';

import { homeDescription, homeTitle } from './texts';

/** `tutors` – неушедшие, по порядку `order` (как в бейдже). */
export function homeMetadata(
  subjects: readonly Subject[],
  tutors: readonly Pick<Tutor, 'name'>[],
): { title: string; description: string } {
  return {
    title: homeTitle(heroBadgeTitle(subjects, tutors.length)),
    description: homeDescription(subjectsAndGrades(subjects), badgeNames(tutors)),
  };
}
