import type { Situation, Tutor } from '@/content';
import type { Goal } from '@/lib/goal';
import { tutorLeadUrl } from '@/lib/urls';

// Карточки «Узнаёте ситуацию?» – ТЗ главной, блок 2; docs/data-model.md, `situations.json`.

export type SituationTutor = { slug: string; name: string; href: string };

export type SituationCard = {
  id: string;
  /** «01» – по порядку видимых карточек. */
  number: string;
  title: string;
  text: string;
  goal: Goal;
  tutors: SituationTutor[];
};

type SituationsTutor = Pick<Tutor, 'id' | 'slug' | 'name' | 'goals'>;

/**
 * Кто работает с ситуацией: репетиторы из поля `tutors`, без него – все, у кого есть её цель
 * (ADR-036). `tutors` – неушедшие, по порядку вывода. Карточка без репетиторов не выводится.
 */
export function situationCards(
  situations: readonly Situation[],
  tutors: readonly SituationsTutor[],
): SituationCard[] {
  return situations
    .map((situation) => {
      const chosen = situation.tutors
        ? situation.tutors.flatMap((id) => tutors.filter((tutor) => tutor.id === id))
        : tutors.filter((tutor) => tutor.goals.includes(situation.goal));
      return {
        id: situation.id,
        title: situation.title,
        text: situation.text,
        goal: situation.goal,
        tutors: chosen.map((tutor) => ({
          slug: tutor.slug,
          name: tutor.name,
          href: tutorLeadUrl(tutor.slug, { entry: 'situations', goal: situation.goal }),
        })),
      };
    })
    .filter((card) => card.tutors.length > 0)
    .map((card, index) => ({ ...card, number: String(index + 1).padStart(2, '0') }));
}
