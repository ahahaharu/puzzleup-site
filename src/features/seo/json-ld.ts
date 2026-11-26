import { parseMarkdown } from '@/components/ui/Markdown';
import type { FaqItem, Subject, Tutor } from '@/content';
import { activeSubjects } from '@/features/tutor-page/page-data';
import { BREADCRUMB_PARENTS, tutorSubtitle } from '@/features/tutor-page/texts';
import { capitalize } from '@/lib/text';
import { tutorPhotoUrl, tutorUrl } from '@/lib/urls';

import { absoluteUrl } from './urls';

// Разметка schema.org – ТЗ страницы репетитора, раздел 6, и ТЗ главной, блок 8. Только `Person`,
// `BreadcrumbList` и `FAQPage`: PuzzleUp – не организация, поэтому нет `Organization`,
// `EducationalOrganization` и `worksFor`; отзывы и рейтинги в разметку не выводятся
// (типы проверяет `pnpm lint:copy`). Текст разметки собирается из тех же данных, что и страница.

const CONTEXT = 'https://schema.org';

export type PersonJsonLd = {
  '@context': typeof CONTEXT;
  '@type': 'Person';
  givenName: string;
  jobTitle: string;
  image?: string;
  url: string;
};

export type BreadcrumbListJsonLd = {
  '@context': typeof CONTEXT;
  '@type': 'BreadcrumbList';
  itemListElement: { '@type': 'ListItem'; position: number; name: string; item: string }[];
};

export type FaqPageJsonLd = {
  '@context': typeof CONTEXT;
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: { '@type': 'Answer'; text: string };
  }[];
};

export type JsonLdData = PersonJsonLd | BreadcrumbListJsonLd | FaqPageJsonLd;

type PersonTutor = Pick<Tutor, 'name' | 'slug' | 'photo' | 'subjects'>;

/** «Репетитор по математике» – вторая строка H1 с заглавной буквы. */
export function tutorJobTitle(
  tutor: Pick<Tutor, 'subjects'>,
  subjects: readonly Subject[],
): string {
  const active = activeSubjects(tutor, subjects);
  return capitalize(tutorSubtitle(active.map((subject) => subject.nameDativeWithPrep)));
}

export function personJsonLd(
  tutor: PersonTutor,
  subjects: readonly Subject[],
  siteUrl: string,
): PersonJsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'Person',
    givenName: tutor.name,
    jobTitle: tutorJobTitle(tutor, subjects),
    // Пока фото нет, на странице инициалы – картинки в разметке тоже нет.
    ...(tutor.photo ? { image: absoluteUrl(siteUrl, tutorPhotoUrl(tutor.photo)) } : {}),
    url: absoluteUrl(siteUrl, tutorUrl(tutor.slug)),
  };
}

/** «Главная / Репетиторы / Андрей» – как крошки над профилем. */
export function tutorBreadcrumbJsonLd(
  tutor: Pick<Tutor, 'name' | 'slug'>,
  siteUrl: string,
): BreadcrumbListJsonLd {
  const items = [
    ...BREADCRUMB_PARENTS.map((item) => ({ name: item.label, href: item.href })),
    { name: tutor.name, href: tutorUrl(tutor.slug) },
  ];
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(siteUrl, item.href),
    })),
  };
}

/** Ответ без разметки Markdown: абзацы через пустую строку, у ссылок остаётся текст. */
export function plainAnswer(answer: string): string {
  return parseMarkdown(answer)
    .map((paragraph) => paragraph.map((part) => part.text).join(''))
    .join('\n\n');
}

/** `items` – вопросы, которые выводит блок FAQ (`faqItems`), с подставленными значениями. */
export function faqPageJsonLd(items: readonly FaqItem[]): FaqPageJsonLd | undefined {
  // Блока без вопросов нет – нет и разметки.
  if (items.length === 0) return undefined;
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: plainAnswer(item.answer) },
    })),
  };
}
