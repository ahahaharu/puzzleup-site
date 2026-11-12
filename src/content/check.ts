import type { z } from 'zod';

import { templateKeys } from '@/lib/template';

import { findPlaceholders } from './placeholder';
import {
  FAQ_TEMPLATE_KEYS,
  faqSchema,
  legalSchema,
  reviewsSchema,
  SITE_TEMPLATE_KEYS,
  siteSchema,
  situationsSchema,
  subjectsSchema,
  tutorSchema,
  type FaqItem,
  type LegalData,
  type Review,
  type Site,
  type Situation,
  type Subject,
  type TutorData,
} from './schemas';
import { checkText } from './text-rules';

/**
 * Проверка всего `content/`: схемы, связи между файлами (docs/data-model.md, «Перекрёстные
 * проверки»), правила текстов. Чистая функция: файлы читают загрузчик и `scripts/content-check.ts`.
 */

/** Файл контента: путь от корня репозитория и разобранные данные (frontmatter + `content` у MDX). */
export type SourceFile = { file: string; data: unknown };

export type RawContent = {
  tutors: readonly SourceFile[];
  legal: readonly SourceFile[];
  subjects: SourceFile;
  reviews: SourceFile;
  situations: SourceFile;
  faq: SourceFile;
  site: SourceFile;
};

export type Tutor = TutorData & { file: string };
export type LegalDoc = LegalData & { slug: string; file: string };

export type Content = {
  tutors: Tutor[];
  subjects: Subject[];
  reviews: Review[];
  situations: Situation[];
  faq: FaqItem[];
  site: Site;
  legal: LegalDoc[];
};

export type ContentIssue = { file: string; path: string; message: string };

export type CheckOptions = {
  /** Перед релизом: заглушки `[…]` и черновой объём «О себе» – ошибки. */
  strict?: boolean;
  /** Есть ли файл в `public/tutors/`. Без функции фото не проверяются. */
  photoExists?: (fileName: string) => boolean;
};

/** Страницы политик (ТЗ страницы репетитора, раздел 7) – файлы `content/legal/<slug>.mdx`. */
export const REQUIRED_LEGAL = ['privacy', 'cookies'] as const;

const ABOUT_LENGTH = { min: 600, max: 1200 };
const ABOUT_PARAGRAPHS = { min: 2, max: 4 };

export type ValidationResult =
  { ok: true; content: Content; issues: [] } | { ok: false; content: null; issues: ContentIssue[] };

export function validateContent(raw: RawContent, options: CheckOptions = {}): ValidationResult {
  const issues: ContentIssue[] = [];
  const report = (file: string, path: string, message: string) =>
    issues.push({ file, path, message });

  const content = parseAll(raw, report);
  checkStrings(raw, options, report);
  if (content) {
    checkLinks(content, options, report);
    if (options.strict) {
      checkReleaseReadiness(content, report);
    }
  }

  return content && issues.length === 0
    ? { ok: true, content, issues: [] }
    : { ok: false, content: null, issues };
}

/** Текст ошибки для сборки и консоли: по строке на нарушение. */
export function formatIssues(issues: readonly ContentIssue[]): string {
  return issues
    .map(({ file, path, message }) => `${file}${path ? ` › ${path}` : ''}: ${message}`)
    .join('\n');
}

type Report = (file: string, path: string, message: string) => void;

// --- Схемы ---

function parseAll(raw: RawContent, report: Report): Content | null {
  let failed = false;
  function parse<T extends z.ZodType>(schema: T, source: SourceFile): z.infer<T> | null {
    const result = schema.safeParse(source.data);
    if (result.success) {
      return result.data;
    }
    failed = true;
    for (const issue of result.error.issues) {
      report(source.file, issue.path.join('.'), issue.message);
    }
    return null;
  }

  const tutors = raw.tutors.flatMap((source) => {
    const data = parse(tutorSchema, source);
    return data ? [{ ...data, file: source.file }] : [];
  });
  const legal = raw.legal.flatMap((source) => {
    const data = parse(legalSchema, source);
    return data ? [{ ...data, slug: baseName(source.file), file: source.file }] : [];
  });
  const subjects = parse(subjectsSchema, raw.subjects);
  const reviews = parse(reviewsSchema, raw.reviews);
  const situations = parse(situationsSchema, raw.situations);
  const faq = parse(faqSchema, raw.faq);
  const site = parse(siteSchema, raw.site);

  if (failed || !subjects || !reviews || !situations || !faq || !site) {
    return null;
  }
  return { tutors, subjects, reviews, situations, faq, site, legal };
}

// --- Строки: формулировки, типографика, шаблоны, заглушки ---

function checkStrings(raw: RawContent, options: CheckOptions, report: Report) {
  const sources: [SourceFile, AllowedKeys][] = [
    ...raw.tutors.map((source): [SourceFile, AllowedKeys] => [source, noKeys]),
    ...raw.legal.map((source): [SourceFile, AllowedKeys] => [source, noKeys]),
    [raw.subjects, noKeys],
    [raw.reviews, noKeys],
    [raw.situations, noKeys],
    [raw.faq, (path) => (/^\d+\.answer$/.test(path) ? FAQ_TEMPLATE_KEYS : [])],
    [raw.site, (path) => SITE_TEMPLATE_KEYS[path] ?? []],
  ];

  for (const [source, allowedKeys] of sources) {
    walkStrings(source.data, '', (path, value) => {
      for (const violation of checkText(value)) {
        report(source.file, path, `${violation.message}: «${violation.match}»`);
      }
      // В MDX фигурные скобки – выражения JSX, а не шаблон.
      if (path !== 'content') {
        const allowed = allowedKeys(path);
        for (const key of templateKeys(value)) {
          if (!allowed.includes(key)) {
            report(source.file, path, `unknown template placeholder {${key}}`);
          }
        }
      }
      if (options.strict) {
        for (const placeholder of findPlaceholders(value)) {
          report(
            source.file,
            path,
            `placeholder ${shorten(placeholder)} must be replaced before release`,
          );
        }
      }
    });
  }
}

type AllowedKeys = (path: string) => readonly string[];

const noKeys: AllowedKeys = () => [];

function walkStrings(value: unknown, path: string, visit: (path: string, value: string) => void) {
  if (typeof value === 'string') {
    visit(path, value);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, join(path, String(index)), visit));
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      walkStrings(item, join(path, key), visit);
    }
  }
}

function join(path: string, key: string): string {
  return path ? `${path}.${key}` : key;
}

// --- Связи между файлами ---

function checkLinks(content: Content, options: CheckOptions, report: Report) {
  const { tutors, subjects, reviews, situations, faq, site, legal } = content;
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const tutorById = new Map(tutors.map((tutor) => [tutor.id, tutor]));

  reportDuplicates(subjects, (subject) => subject.id, 'content/subjects.json', report);
  reportDuplicates(reviews, (review) => review.id, 'content/reviews.json', report);
  reportDuplicates(situations, (situation) => situation.id, 'content/situations.json', report);
  reportDuplicates(faq, (item) => item.id, 'content/faq.json', report);

  const seenIds = new Map<string, string>();
  for (const tutor of tutors) {
    if (baseName(tutor.file) !== tutor.slug) {
      report(tutor.file, 'slug', `slug «${tutor.slug}» must match the file name`);
    }
    if (tutor.id !== `t-${tutor.slug}`) {
      report(tutor.file, 'id', `id must be «t-${tutor.slug}»`);
    }
    const sameId = seenIds.get(tutor.id);
    if (sameId) {
      report(tutor.file, 'id', `id «${tutor.id}» is already used in ${sameId}`);
    }
    seenIds.set(tutor.id, tutor.file);

    tutor.subjects.forEach((taught, index) => {
      const subject = subjectById.get(taught.id);
      if (!subject) {
        report(
          tutor.file,
          `subjects.${index}.id`,
          `subject «${taught.id}» is not in subjects.json`,
        );
      } else if (taught.from < subject.gradeFrom || taught.to > subject.gradeTo) {
        report(
          tutor.file,
          `subjects.${index}`,
          `grades ${taught.from}–${taught.to} are outside ${subject.id} ${subject.gradeFrom}–${subject.gradeTo}`,
        );
      }
    });

    if (tutor.goals.includes('ct') && !tutor.subjects.some((taught) => taught.to >= 10)) {
      report(tutor.file, 'goals', '`ct` is allowed only for a tutor with grades 10–11');
    }

    if (tutor.photo !== undefined && options.photoExists && !options.photoExists(tutor.photo)) {
      report(tutor.file, 'photo', `public/tutors/${tutor.photo} does not exist`);
    }
  }

  reviews.forEach((review, index) => {
    const tutor = tutorById.get(review.tutorId);
    if (!tutor) {
      report(
        'content/reviews.json',
        `${index}.tutorId`,
        `tutor «${review.tutorId}» does not exist`,
      );
    } else if (!tutor.subjects.some((taught) => taught.id === review.subject)) {
      report(
        'content/reviews.json',
        `${index}.subject`,
        `${tutor.id} does not teach «${review.subject}»`,
      );
    }
  });

  situations.forEach((situation, index) => {
    situation.tutors?.forEach((tutorId, position) => {
      const tutor = tutorById.get(tutorId);
      const path = `${index}.tutors.${position}`;
      if (!tutor) {
        report('content/situations.json', path, `tutor «${tutorId}» does not exist`);
      } else if (!tutor.goals.includes(situation.goal)) {
        report('content/situations.json', path, `${tutorId} has no goal «${situation.goal}»`);
      }
    });
  });

  const operator = tutorById.get(site.siteOperatorTutorId);
  if (!operator) {
    report(
      'content/site.json',
      'siteOperatorTutorId',
      `tutor «${site.siteOperatorTutorId}» does not exist`,
    );
  } else if (operator.archived) {
    report('content/site.json', 'siteOperatorTutorId', `tutor «${operator.id}» is archived`);
  }

  for (const slug of REQUIRED_LEGAL) {
    if (!legal.some((doc) => doc.slug === slug)) {
      report(`content/legal/${slug}.mdx`, '', 'file is missing');
    }
  }
}

function reportDuplicates<T>(
  items: readonly T[],
  key: (item: T) => string,
  file: string,
  report: Report,
) {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const value = key(item);
    if (seen.has(value)) {
      report(file, `${index}.id`, `id «${value}» is duplicated`);
    }
    seen.add(value);
  });
}

// --- Готовность к релизу (--strict) ---

function checkReleaseReadiness(content: Content, report: Report) {
  for (const tutor of content.tutors) {
    // Заглушки уже найдены в checkStrings; объём проверяется только у настоящего текста.
    if (findPlaceholders(tutor.content).length > 0) {
      continue;
    }
    const body = tutor.content.trim();
    const paragraphs = body.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).length;
    if (body.length < ABOUT_LENGTH.min || body.length > ABOUT_LENGTH.max) {
      report(
        tutor.file,
        'content',
        `«О себе» must be ${ABOUT_LENGTH.min}–${ABOUT_LENGTH.max} characters, got ${body.length}`,
      );
    }
    if (paragraphs < ABOUT_PARAGRAPHS.min || paragraphs > ABOUT_PARAGRAPHS.max) {
      report(
        tutor.file,
        'content',
        `«О себе» must have ${ABOUT_PARAGRAPHS.min}–${ABOUT_PARAGRAPHS.max} paragraphs, got ${paragraphs}`,
      );
    }
  }
}

function shorten(value: string): string {
  return value.length > 40 ? `${value.slice(0, 38)}…]` : value;
}

function baseName(file: string): string {
  return file.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
}
