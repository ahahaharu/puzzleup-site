import type { Subject, Tutor } from '@/content';
import { formatPrice, gradesLabel } from '@/features/tutors/card-data';
import { tutorGrades } from '@/features/tutors/grades';
import { CURRENCY } from '@/features/tutors/texts';
import { tutorLeadUrl, tutorPhotoUrl, tutorUrl } from '@/lib/urls';

// Карточки репетиторов в блоке «О сайте» – ТЗ главной, блок 9: фото, имя, классы, цена, кнопка
// записи и мессенджеры. При трёх и более репетиторах карточек нет, только кнопка «Выбрать репетитора».

/** Столько карточек ещё выводится; при большем числе репетиторов – одна кнопка. */
export const ABOUT_CARDS_LIMIT = 2;

export type AboutTutor = {
  slug: string;
  name: string;
  nameDative: string;
  photo?: string | undefined;
  /** «5–9 класс · 40 BYN». */
  meta: string;
  href: string;
  leadHref: string;
  telegram: string;
  viber: string;
};

type AboutSourceTutor = Pick<
  Tutor,
  'slug' | 'name' | 'nameDative' | 'photo' | 'subjects' | 'price' | 'telegram' | 'viber'
>;

/** `tutors` – неушедшие, по порядку вывода. Больше двух – пустой список. */
export function aboutTutors(
  tutors: readonly AboutSourceTutor[],
  subjects: readonly Pick<Subject, 'id' | 'status'>[],
): AboutTutor[] {
  if (tutors.length > ABOUT_CARDS_LIMIT) return [];
  return tutors.map((tutor) => {
    const grades = tutorGrades(tutor, subjects);
    const price = `${formatPrice(tutor.price)}\u00a0${CURRENCY}`;
    return {
      slug: tutor.slug,
      name: tutor.name,
      nameDative: tutor.nameDative,
      photo: tutor.photo === undefined ? undefined : tutorPhotoUrl(tutor.photo),
      meta: grades ? `${gradesLabel(grades.from, grades.to)} · ${price}` : price,
      href: tutorUrl(tutor.slug),
      leadHref: tutorLeadUrl(tutor.slug, { entry: 'about' }),
      telegram: tutor.telegram,
      viber: tutor.viber,
    };
  });
}
