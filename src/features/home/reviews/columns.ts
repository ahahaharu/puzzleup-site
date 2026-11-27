import type { Review, Subject, Tutor } from '@/content';
import { splitScreenshots, toReviewCard, type ReviewCardData } from '@/features/reviews/card-data';
import { screenshotsLabel } from '@/features/reviews/texts';
import { gradesLabel } from '@/features/tutors/card-data';
import { REVIEW_FORMS } from '@/features/tutors/texts';
import { pluralize } from '@/lib/plural';
import { aboutName, capitalize } from '@/lib/text';
import { tutorPhotoUrl, tutorUrl } from '@/lib/urls';

// Колонки блока «Отзывы» – ТЗ главной, блок 6: у каждого репетитора своя колонка с одним отзывом
// (или лентой его скриншотов, ADR-062) и ссылкой на все его отзывы. Общих отзывов «о сайте» нет.

export type ReviewColumn = {
  tutor: { slug: string; name: string; photo?: string | undefined; href: string };
  /** «Математика · 5–9 класс · 12 отзывов». */
  meta: string;
  /** Скриншоты переписки, новые сверху; есть – в колонке лента вместо карточки (ADR-062). */
  screenshots: (ReviewCardData & { screenshot: string })[];
  /** Имя ленты для дикторов: «Скриншоты отзывов об Андрее». */
  screenshotsLabel: string;
  /** Карточка – когда скриншотов нет. */
  review: ReviewCardData;
  /** «Все отзывы об Андрее». */
  allLabel: string;
  allHref: string;
};

type ReviewsTutor = Pick<
  Tutor,
  'id' | 'slug' | 'name' | 'namePrepositional' | 'photo' | 'subjects'
>;
type ReviewsSubject = Pick<Subject, 'id' | 'name' | 'status'>;

/**
 * Отзыв для главной: самый новый с `featured`, а если таких нет – самый новый (ADR-044).
 * `reviews` – уже только опубликованные.
 */
export function pickReview<T extends Pick<Review, 'date' | 'featured'>>(
  reviews: readonly T[],
): T | undefined {
  const newest = reviews.toSorted((a, b) => b.date.localeCompare(a.date));
  return newest.find((review) => review.featured) ?? newest[0];
}

/**
 * Колонка на каждого неушедшего репетитора (`tutors` – по порядку вывода) с опубликованными
 * отзывами; без отзывов – колонки нет.
 */
export function reviewColumns(
  reviews: readonly Review[],
  tutors: readonly ReviewsTutor[],
  subjects: readonly ReviewsSubject[],
): ReviewColumn[] {
  return tutors.flatMap((tutor) => {
    const own = reviews.filter((review) => review.tutorId === tutor.id);
    const review = pickReview(own);
    if (!review) return [];
    // Сверху стопки – тот же отзыв, что выбран для колонки, если он скриншотом; дальше – новые.
    const { screenshots } = splitScreenshots(
      own
        .toSorted((a, b) => b.date.localeCompare(a.date))
        .toSorted((a, b) => Number(b.id === review.id) - Number(a.id === review.id))
        .map((item) => toReviewCard(item, subjects)),
    );

    const lines = tutor.subjects.flatMap((item) => {
      const subject = subjects.find((candidate) => candidate.id === item.id);
      return subject?.status === 'active'
        ? [`${capitalize(subject.name)} · ${gradesLabel(item.from, item.to)}`]
        : [];
    });

    return [
      {
        tutor: {
          slug: tutor.slug,
          name: tutor.name,
          photo: tutor.photo === undefined ? undefined : tutorPhotoUrl(tutor.photo),
          href: tutorUrl(tutor.slug),
        },
        meta: [...lines, pluralize(own.length, REVIEW_FORMS)].join(' · '),
        screenshots,
        screenshotsLabel: screenshotsLabel(tutor.namePrepositional),
        review: toReviewCard(review, subjects),
        allLabel: `Все отзывы ${aboutName(tutor.namePrepositional)}`,
        allHref: tutorUrl(tutor.slug, 'reviews'),
      },
    ];
  });
}
