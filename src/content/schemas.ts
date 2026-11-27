import { z } from 'zod';

import { availabilitySchema } from '@/lib/availability';
import { goalSchema } from '@/lib/goal';

import { orPlaceholder } from './placeholder';

/**
 * Схемы файлов `content/` – docs/data-model.md, раздел 1; поля – ТЗ главной («Источники данных»)
 * и ТЗ страницы репетитора, раздел 2. Объекты строгие: опечатка в имени поля – ошибка, а не
 * молча пропавшее значение. Связи между файлами проверяет `check.ts`.
 */

const text = z.string().trim().min(1);
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Latin lowercase letters, digits and hyphens');
const grade = z.int().min(1).max(11);
const isoDate = z.iso.date();

/** Бумаги ДС – те же, что `SheetKind` у `Sheet` (docs/design-system.md, раздел 4). */
export const paperSchema = z.enum(['cell', 'mm', 'lined', 'slanted', 'staff', 'margin', 'plain']);

function uniqueItems<T>(items: readonly T[]): boolean {
  return new Set(items).size === items.length;
}

// --- tutors/*.mdx ---

// Ник Telegram – 5–32 символа: латиница, цифры, «_», начинается с буквы.
const TELEGRAM_NICK = '[A-Za-z][A-Za-z0-9_]{4,31}';
const telegram = z
  .string()
  .regex(
    new RegExp(`^(?:${TELEGRAM_NICK}|https://t\\.me/${TELEGRAM_NICK})$`),
    'Telegram nick without @ or a https://t.me/ link',
  );
// Номер с кодом страны в любом написании: «+375 29 000-00-00».
const viber = z
  .string()
  .regex(/^\+[\d\s()-]+$/, 'Phone number starting with +')
  .refine((value) => /^\d{10,15}$/.test(value.replace(/\D/g, '')), '10–15 digits');

const tutorSubject = z
  .strictObject({ id: slug, from: grade, to: grade })
  .refine((subject) => subject.from <= subject.to, '`from` must not exceed `to`');

export const tutorSchema = z.strictObject({
  id: z.string().regex(/^t-[a-z0-9]+(?:-[a-z0-9]+)*$/, '`t-<slug>`'),
  slug,
  name: text,
  /** «Условия Андрея», «Сейчас у Андрея нет свободного времени». */
  nameGenitive: text,
  nameDative: text,
  namePrepositional: text,
  /** «он ответит», «посмотрите его страницу» – «Как начать», плашка ушедшего, подсказка о классе. */
  pronoun: z.enum(['он', 'она']),
  fullName: orPlaceholder(text),
  // УНП физлица – две латинские буквы и 7 цифр, организации и ИП – 9 цифр (ADR-066). Без кавычек
  // YAML прочитает цифровой УНП числом – просим строку, а не молча приводим.
  unp: orPlaceholder(
    z.string().regex(/^(?:\d{9}|[A-Z]{2}\d{7})$/),
    "UNP must be a quoted string: 2 Latin capital letters and 7 digits ('AB1234567') or 9 digits",
  ),
  photo: z
    .string()
    // Только JPEG и PNG: OG-картинку рисует `next/og`, а он не читает WebP и AVIF (ADR-055).
    .regex(/^[\w-]+\.(?:jpe?g|png)$/i, 'JPEG or PNG file name in public/tutors/')
    .optional(),
  subjects: z
    .array(tutorSubject)
    .min(1)
    .refine((items) => uniqueItems(items.map((item) => item.id)), 'Subjects must be unique'),
  education: orPlaceholder(text),
  teachingSince: orPlaceholder(z.int().min(1950).max(2100)),
  tagline: text.max(90),
  goals: z.array(goalSchema).min(1).refine(uniqueItems, 'Goals must be unique'),
  hobby: text.optional(),
  personalNote: text.optional(),
  availability: availabilitySchema,
  archived: z.boolean(),
  order: z.int(),
  price: z.number().positive(),
  telegram: orPlaceholder(telegram),
  viber: orPlaceholder(viber),
  terms: text.optional(),
  platforms: z.array(text).min(1).optional(),
  seoDescription: text.optional(),
  /** Текст «О себе» – тело MDX. */
  content: z.string(),
});

export type TutorData = z.infer<typeof tutorSchema>;

// --- subjects.json ---

export const subjectSchema = z
  .strictObject({
    id: slug,
    name: text,
    nameAccusative: text,
    nameDativeWithPrep: text,
    gradeFrom: grade,
    gradeTo: grade,
    topics: z.array(text).min(4).max(6),
    formula: text,
    paper: paperSchema,
    status: z.enum(['active', 'hidden']),
  })
  .refine(
    (subject) => subject.gradeFrom <= subject.gradeTo,
    '`gradeFrom` must not exceed `gradeTo`',
  );

export const subjectsSchema = z.array(subjectSchema).min(1);

export type Subject = z.infer<typeof subjectSchema>;

// --- reviews.json ---

export const reviewSchema = z.strictObject({
  id: slug,
  tutorId: z.string(),
  /** Имя без фамилии; без него подпись – только `relation`: «Мама ученика 7 класса» (ADR-069). */
  author: text.optional(),
  relation: text,
  subject: slug,
  /** Текст отзыва; у скриншота – расшифровка переписки: на экране её нет, её читают дикторы. */
  text,
  /** Скриншот отзыва из мессенджера – файл в `public/reviews/`; без него отзыв – карточка с текстом. */
  screenshot: z
    .string()
    .regex(/^[\w-]+\.(?:jpe?g|png|webp)$/i, 'JPEG, PNG or WebP file name in public/reviews/')
    .optional(),
  date: isoDate,
  featured: z.boolean(),
  consent: z.boolean(),
  source: text,
});

export const reviewsSchema = z.array(reviewSchema);

export type Review = z.infer<typeof reviewSchema>;

// --- situations.json ---

export const situationSchema = z.strictObject({
  id: slug,
  title: text,
  text,
  goal: goalSchema,
  /** Без поля – все репетиторы, у кого есть эта цель. */
  tutors: z.array(z.string()).min(1).refine(uniqueItems, 'Tutors must be unique').optional(),
});

export const situationsSchema = z.array(situationSchema);

export type Situation = z.infer<typeof situationSchema>;

// --- faq.json ---

export const faqItemSchema = z.strictObject({
  id: slug,
  question: text,
  /** Простой Markdown; плейсхолдеры `{key}` собираются из данных (FAQ_TEMPLATE_KEYS). */
  answer: text,
});

export const faqSchema = z.array(faqItemSchema);

export type FaqItem = z.infer<typeof faqItemSchema>;

// --- site.json ---

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, '`HH:MM`');

export const siteSchema = z.strictObject({
  name: text,
  /**
   * Боевой адрес сайта без `/` в конце – canonical, sitemap, `og:image` и JSON-LD. Не `SITE_URL`:
   * страницы статические, а копия на staging тоже должна ссылаться на боевой сайт (ADR-055).
   */
  url: z.url({ protocol: /^https$/ }).regex(/[^/]$/, 'Without a trailing slash'),
  slogan: text,
  /** Текст блока «О сайте» (ТЗ главной, блок 9). */
  about: text,
  footer: z.strictObject({
    tagline: text,
    /** Реквизиты этапа 1, список репетиторов собирается из `tutors/*.mdx` (ТЗ главной, блок 10). */
    requisites: text,
    copyright: text,
  }),
  /** Часы ответа на заявки, время – по Минску. */
  responseHours: z
    .strictObject({ from: time, to: time, tz: z.literal('Europe/Minsk') })
    .refine((hours) => hours.from < hours.to, '`from` must be earlier than `to`'),
  /** Платформы занятий для репетитора без своего поля `platforms`. */
  defaultPlatforms: z.array(text).min(1),
  prices: z.strictObject({
    trial: z.strictObject({ title: text, price: z.number().min(0), caption: text }),
    lesson: z.strictObject({ title: text, caption: text }),
    paymentNote: text,
    offerNote: text,
  }),
  consent: z.strictObject({
    /** Версия текста согласия, сохраняется с заявкой (`consents.consent_version`). */
    version: isoDate,
    label: text,
    policyLinkLabel: text,
    /** Мелкий текст под подписью; без него – только подпись со ссылкой на политику (ADR-068). */
    details: text.optional(),
  }),
  /**
   * Счётчики (ТЗ главной, «Глобальные элементы»): Umami без cookie считает всегда, Яндекс Метрика –
   * только после «Принять» в cookie-баннере. Без `metrika` баннера нет: спрашивать не о чем.
   * Работают только на боевом адресе `url` (ADR-056).
   */
  analytics: z
    .strictObject({
      umami: z
        .strictObject({
          scriptUrl: orPlaceholder(z.url({ protocol: /^https$/ })),
          websiteId: orPlaceholder(z.uuid()),
        })
        .optional(),
      metrika: z.strictObject({ counterId: orPlaceholder(z.int().positive()) }).optional(),
    })
    .optional(),
  /**
   * Cookie-баннер: «{text} Подробнее – в {policyLinkLabel}.», ссылка – на `/cookies`. Показывается
   * только с `analytics.metrika`; тогда обязателен и `legal/cookies.mdx`.
   */
  cookieBanner: z.strictObject({ text, policyLinkLabel: text }),
  /** Кто технически ведёт сайт – строка «Сайт ведёт» в подвале. */
  siteOperatorTutorId: z.string(),
  /**
   * Пример итога пробного занятия в блоке «Как это работает» (ТЗ главной, блок 3): сообщение
   * репетитора `tutorId`. Подписи «Уверенно», «Подтянуть», «Начнём с» – в компоненте.
   */
  trialExample: z
    .strictObject({
      tutorId: z.string(),
      intro: text,
      strong: text,
      improve: text,
      startWith: text,
      offer: text,
    })
    .optional(),
});

export type Site = z.infer<typeof siteSchema>;

// --- legal/*.mdx ---

export const legalSchema = z.strictObject({
  title: text,
  /** Дата редакции: «Действует с …». */
  effectiveDate: orPlaceholder(isoDate),
  content: z.string(),
});

export type LegalData = z.infer<typeof legalSchema>;

// --- Плейсхолдеры шаблонов (src/lib/template.ts) ---

export const FAQ_TEMPLATE_KEYS = ['tutorsGrades'] as const;

/** Шаблоны `site.json`: путь поля → допустимые ключи. В остальных полях плейсхолдеров нет. */
export const SITE_TEMPLATE_KEYS: Readonly<Record<string, readonly string[]>> = {
  'footer.requisites': ['tutorsRequisites', 'siteOperatorFullName'],
  'footer.copyright': ['tutorsFullNames'],
  'consent.details': ['operators'],
};
