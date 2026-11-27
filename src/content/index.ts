import 'server-only';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { imageSize, type ImageSize } from '@/lib/image-size';

import {
  formatIssues,
  validateContent,
  type LEGAL_SLUGS,
  type LegalDoc,
  type Tutor,
} from './check';
import { readContent } from './raw';
import type { Review } from './schemas';

/**
 * Контент сайта для серверных компонентов. Проверяется один раз при загрузке модуля:
 * ошибка в `content/` роняет `next build` и показывается в `next dev` (ТЗ страницы репетитора,
 * раздел 2, «Проверка при сборке»). Фото и синтаксис MDX проверяет `pnpm content:check`.
 */

export type TutorEntry = Tutor & { mdx: string };
export type LegalEntry = LegalDoc & { mdx: string };
/** Отзыв с размером скриншота – по нему next/image резервирует место (ADR-071). */
export type PublishedReview = Review & { screenshotSize?: ImageSize | undefined };
/** Политики: `privacy` – всегда, `cookies` – только с Метрикой (ADR-057). */
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

const { raw, mdx } = readContent();
const result = validateContent(raw);
if (!result.ok) {
  throw new Error(`Invalid content:\n${formatIssues(result.issues)}`);
}
const content = result.content;

function withMdx<T extends { file: string }>(doc: T): T & { mdx: string } {
  return { ...doc, mdx: mdx.get(doc.file) ?? '' };
}

/** Нет файла (его ловит `content:check`) или формат не распознан – размера нет, рамка по умолчанию. */
function screenshotSize(fileName: string): ImageSize | undefined {
  try {
    return imageSize(readFileSync(resolve('public/reviews', fileName)));
  } catch {
    return undefined;
  }
}

const tutors: readonly TutorEntry[] = content.tutors.map(withMdx);
const publishedReviews: readonly PublishedReview[] = content.reviews
  .filter((review) => review.consent)
  .map((review) =>
    review.screenshot === undefined
      ? review
      : { ...review, screenshotSize: screenshotSize(review.screenshot) },
  );
const legal: readonly LegalEntry[] = content.legal.map(withMdx);

export const getSite = () => content.site;
export const getSubjects = () => content.subjects;
/** Все репетиторы, включая ушедших (`archived`): их страницы остаются по старым адресам. */
export const getTutors = () => tutors;
export const getTutorBySlug = (slug: string) => tutors.find((tutor) => tutor.slug === slug);
/** Только отзывы с согласием автора на публикацию. */
export const getPublishedReviews = () => publishedReviews;
export const getSituations = () => content.situations;
export const getFaq = () => content.faq;
export const getLegal = (slug: string) => legal.find((doc) => doc.slug === slug);

export { LEGAL_SLUGS } from './check';
export type { Content, LegalDoc, Tutor } from './check';
export type { FaqItem, Review, Site, Situation, Subject } from './schemas';
