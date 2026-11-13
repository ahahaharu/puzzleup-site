import 'server-only';

import { formatIssues, validateContent, type LegalDoc, type Tutor } from './check';
import { readContent } from './raw';

/**
 * Контент сайта для серверных компонентов. Проверяется один раз при загрузке модуля:
 * ошибка в `content/` роняет `next build` и показывается в `next dev` (ТЗ страницы репетитора,
 * раздел 2, «Проверка при сборке»). Фото и синтаксис MDX проверяет `pnpm content:check`.
 */

export type TutorEntry = Tutor & { mdx: string };
export type LegalEntry = LegalDoc & { mdx: string };

const { raw, mdx } = readContent();
const result = validateContent(raw);
if (!result.ok) {
  throw new Error(`Invalid content:\n${formatIssues(result.issues)}`);
}
const content = result.content;

function withMdx<T extends { file: string }>(doc: T): T & { mdx: string } {
  return { ...doc, mdx: mdx.get(doc.file) ?? '' };
}

const tutors: readonly TutorEntry[] = content.tutors.map(withMdx);
const legal: readonly LegalEntry[] = content.legal.map(withMdx);

export const getSite = () => content.site;
export const getSubjects = () => content.subjects;
/** Все репетиторы, включая ушедших (`archived`): их страницы остаются по старым адресам. */
export const getTutors = () => tutors;
export const getTutorBySlug = (slug: string) => tutors.find((tutor) => tutor.slug === slug);
/** Только отзывы с согласием автора на публикацию. */
export const getPublishedReviews = () => content.reviews.filter((review) => review.consent);
export const getSituations = () => content.situations;
export const getFaq = () => content.faq;
export const getLegal = (slug: string) => legal.find((doc) => doc.slug === slug);

export type { Content, LegalDoc, Tutor } from './check';
export type { FaqItem, Review, Site, Situation, Subject } from './schemas';
