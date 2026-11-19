import type { Site, Tutor } from '@/content';
import { fillTemplate } from '@/lib/template';

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

/** «09:00» → «9:00». */
const hour = (time: string) => time.replace(/^0(?=\d:)/, '');

/** Строка под мессенджерами в мобильном меню. */
export function responseHoursLine({ from, to }: Site['responseHours']): string {
  return `Каждый репетитор отвечает сам, обычно с ${hour(from)} до ${hour(to)}`;
}
