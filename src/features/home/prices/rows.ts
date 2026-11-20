import type { Subject, Tutor } from '@/content';
import { formatPrice } from '@/features/tutors/card-data';
import { gradesRange, tutorGrades } from '@/features/tutors/grades';
import { tutorUrl } from '@/lib/urls';

// Строки карточки «Занятие» – ТЗ главной, блок 7: на каждого репетитора своя цена из `price`.
// Единой цены сайта нет, даже если у репетиторов она одинаковая.

export type PriceRow = {
  slug: string;
  name: string;
  /** «5–9 класс»; без активных предметов – строки классов нет. */
  grades?: string | undefined;
  /** «40» – без валюты. */
  price: string;
  href: string;
};

type PricesTutor = Pick<Tutor, 'slug' | 'name' | 'subjects' | 'price'>;

/** `tutors` – неушедшие, по порядку вывода. */
export function priceRows(
  tutors: readonly PricesTutor[],
  subjects: readonly Pick<Subject, 'id' | 'status'>[],
): PriceRow[] {
  return tutors.map((tutor) => {
    const grades = tutorGrades(tutor, subjects);
    return {
      slug: tutor.slug,
      name: tutor.name,
      grades: grades ? `${gradesRange(grades)} класс` : undefined,
      price: formatPrice(tutor.price),
      href: tutorUrl(tutor.slug),
    };
  });
}
