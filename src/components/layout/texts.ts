import type { Site, Tutor } from '@/content';
import { fillTemplate } from '@/lib/template';
import { shortTime } from '@/lib/time';

// Тексты подвала и меню, собранные из данных: ТЗ главной, блоки 0 и 10; docs/data-model.md, `site.json`.

type TutorRequisites = Pick<Tutor, 'id' | 'fullName' | 'unp'>;

/**
 * Реквизиты и копирайт подвала. Список – все неушедшие репетиторы по порядку: новый репетитор
 * на НПД попадает в подвал без правки шаблона.
 */
export function footerTexts(
  site: Pick<Site, 'footer' | 'siteOperatorTutorId'>,
  tutors: readonly TutorRequisites[],
) {
  const operator = tutors.find((tutor) => tutor.id === site.siteOperatorTutorId);
  if (!operator) {
    throw new Error(`Site operator ${site.siteOperatorTutorId} is not an active tutor`);
  }

  return {
    requisites: fillTemplate(site.footer.requisites, {
      tutorsRequisites: tutors.map((tutor) => `${tutor.fullName}, УНП ${tutor.unp}`).join('; '),
      siteOperatorFullName: operator.fullName,
    }),
    copyright: fillTemplate(site.footer.copyright, {
      tutorsFullNames: tutors.map((tutor) => tutor.fullName).join(', '),
    }),
  };
}

/** Строка под мессенджерами в мобильном меню. */
export function responseHoursLine({ from, to }: Site['responseHours']): string {
  return `Каждый репетитор отвечает сам, обычно с ${shortTime(from)} до ${shortTime(to)}`;
}

/** Репетиторы в меню и подвале: без ушедших (docs/data-model.md, `archived`), по `order`. */
export function listedTutors<T extends Pick<Tutor, 'archived' | 'order'>>(
  tutors: readonly T[],
): T[] {
  return tutors.filter((tutor) => !tutor.archived).toSorted((a, b) => a.order - b.order);
}
