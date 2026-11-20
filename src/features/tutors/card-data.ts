import type { Subject, Tutor } from '@/content';
import type { Availability } from '@/lib/availability';
import { pluralize } from '@/lib/plural';
import { capitalize } from '@/lib/text';
import { tutorPhotoUrl } from '@/lib/urls';

import { gradesRange } from './grades';

// Данные карточки репетитора – ТЗ главной, блок 5 «Карточка репетитора»; та же карточка стоит
// в блоке «Другие репетиторы» страницы репетитора (раздел 4, блок 7).

/** Карточка, готовая к выводу: все строки уже собраны из данных. */
export type TutorCardData = {
  id: string;
  slug: string;
  name: string;
  nameDative: string;
  namePrepositional: string;
  /** Адрес исходника фото; без фото – инициал на kraft. */
  photo?: string | undefined;
  availability: Availability;
  /** Активные предметы репетитора – для фильтра по предметам. */
  subjectIds: string[];
  /** «Математика · 5–9 класс» – строка на предмет. */
  subjectLines: string[];
  /** «Стаж 4 года · БГУ, механико-математический факультет». */
  credentials: string;
  tagline: string;
  /** «40» – без валюты: подпись «BYN · 60 минут» ставит карточка. */
  price: string;
  /** Опубликованные отзывы; 0 – строки нет. */
  reviewCount: number;
  telegram: string;
  viber: string;
};

type CardTutor = Pick<
  Tutor,
  | 'id'
  | 'slug'
  | 'name'
  | 'nameDative'
  | 'namePrepositional'
  | 'photo'
  | 'subjects'
  | 'education'
  | 'teachingSince'
  | 'tagline'
  | 'price'
  | 'telegram'
  | 'viber'
>;

type CardContext = {
  subjects: readonly Pick<Subject, 'id' | 'name' | 'status'>[];
  /** Текущий статус занятости: в MDX – только начальное значение (ТЗ страницы репетитора, раздел 5). */
  availability: Availability;
  reviewCount: number;
  /** Текущий год – для стажа. */
  year: number;
};

/** «5–9 класс», «9 класс»; диапазон и слово не разрываются (после тире – невидимая связка U+2060). */
export function gradesLabel(from: number, to: number): string {
  return `${gradesRange({ from, to })}\u00a0класс`;
}

/**
 * Стаж из года начала преподавания (ТЗ страницы репетитора, раздел 2, `teachingSince`): «4 года».
 * Пока год – заглушка, значение как в макете: «[N] лет».
 */
export function experienceValue(teachingSince: number | string, year: number): string {
  if (typeof teachingSince !== 'number') return '[N] лет';
  const years = year - teachingSince;
  if (years < 1) return 'меньше года';
  return pluralize(years, ['год', 'года', 'лет']);
}

/** «Стаж 4 года» – строка карточки. */
export function experienceLabel(teachingSince: number | string, year: number): string {
  return `Стаж ${experienceValue(teachingSince, year)}`;
}

const PRICE = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

/** 40 → «40», 37.5 → «37,5». */
export function formatPrice(price: number): string {
  return PRICE.format(price);
}

/** Число опубликованных отзывов по `tutorId`. */
export function countReviews(reviews: readonly { tutorId: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { tutorId } of reviews) counts.set(tutorId, (counts.get(tutorId) ?? 0) + 1);
  return counts;
}

export function toTutorCardData(tutor: CardTutor, context: CardContext): TutorCardData {
  // Скрытый предмет на сайте не показывается (ТЗ главной, блок 4) – ни в строке, ни в фильтре.
  const active = tutor.subjects.flatMap((item) => {
    const subject = context.subjects.find((candidate) => candidate.id === item.id);
    return subject?.status === 'active' ? [{ ...item, name: subject.name }] : [];
  });

  return {
    id: tutor.id,
    slug: tutor.slug,
    name: tutor.name,
    nameDative: tutor.nameDative,
    namePrepositional: tutor.namePrepositional,
    photo: tutor.photo === undefined ? undefined : tutorPhotoUrl(tutor.photo),
    availability: context.availability,
    subjectIds: active.map((item) => item.id),
    subjectLines: active.map(
      (item) => `${capitalize(item.name)} · ${gradesLabel(item.from, item.to)}`,
    ),
    credentials: [experienceLabel(tutor.teachingSince, context.year), tutor.education].join(' · '),
    tagline: tutor.tagline,
    price: formatPrice(tutor.price),
    reviewCount: context.reviewCount,
    telegram: tutor.telegram,
    viber: tutor.viber,
  };
}
