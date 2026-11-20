import type { Review, Site, Subject, Tutor } from '@/content';
import { toReviewCard, type ReviewCardData } from '@/features/reviews/card-data';
import {
  countReviews,
  experienceLabel,
  experienceValue,
  formatPrice,
  gradesLabel,
  toTutorCardData,
  type TutorCardData,
} from '@/features/tutors/card-data';
import { gradesRange, tutorGrades, type GradeRange } from '@/features/tutors/grades';
import { sortByAvailability } from '@/features/tutors/sort';
import { leadLabel } from '@/features/tutors/texts';
import type { Availability } from '@/lib/availability';
import { GOAL_LABELS } from '@/lib/goal';
import { capitalize, joinWithAnd } from '@/lib/text';
import { shortTime } from '@/lib/time';
import { tutorLeadUrl, tutorPhotoUrl, tutorUrl } from '@/lib/urls';

import {
  alternativeLabel,
  archivedNotice,
  CHOOSE_TUTOR_CTA,
  formPrice,
  gradeHintText,
  moreLead,
  moreTitle,
  platformsLine,
  providerLine,
  reviewsTitle,
  schoolLine,
  startSteps,
  termsLine,
  tutorSubtitle,
  WAITLIST_CTA,
  waitlistNotice,
  type StartStep,
} from './texts';

// Данные страницы репетитора – ТЗ страницы репетитора, разделы 3–5. Чистые функции: страница
// и витрина /dev/tutor-page собирают из них блоки, тесты проверяют правила без раскладки.

/** Статус страницы: занятость из базы (пока – из MDX) или «ушёл». */
export type PageStatus = Availability | 'archived';

/** Не больше трёх карточек в блоке «Другие репетиторы» (раздел 4, блок 7). */
const MORE_LIMIT = 3;

type ActiveSubject = Pick<Subject, 'id' | 'name' | 'nameDativeWithPrep' | 'formula'> & {
  from: number;
  to: number;
};

/** Предметы репетитора, которые показываются на сайте, – в порядке его файла. */
export function activeSubjects(
  tutor: Pick<Tutor, 'subjects'>,
  subjects: readonly Subject[],
): ActiveSubject[] {
  return tutor.subjects.flatMap((item) => {
    const subject = subjects.find((candidate) => candidate.id === item.id);
    return subject?.status === 'active' ? [{ ...subject, from: item.from, to: item.to }] : [];
  });
}

export function pageStatus(tutor: Pick<Tutor, 'archived' | 'availability'>): PageStatus {
  // Статус занятости пока – начальное значение из MDX; из базы его подставит feature/availability.
  return tutor.archived ? 'archived' : tutor.availability;
}

/**
 * Другие репетиторы с общим активным предметом: без текущего и ушедших, по статусу, затем
 * по `order`, не больше трёх (раздел 4, блок 7).
 */
export function otherTutors<T extends Tutor>(
  current: Tutor,
  tutors: readonly T[],
  subjects: readonly Subject[],
): T[] {
  const own = new Set(activeSubjects(current, subjects).map((subject) => subject.id));
  const candidates = tutors.filter(
    (tutor) =>
      tutor.id !== current.id &&
      !tutor.archived &&
      activeSubjects(tutor, subjects).some((subject) => own.has(subject.id)),
  );
  return sortByAvailability(candidates).slice(0, MORE_LIMIT);
}

/** «по математике» – общие предметы текущего репетитора с другими, в порядке его файла. */
export function sharedSubjects(
  current: Tutor,
  others: readonly Tutor[],
  subjects: readonly Subject[],
): string {
  const theirs = new Set(
    others.flatMap((tutor) => activeSubjects(tutor, subjects).map((subject) => subject.id)),
  );
  return joinWithAnd(
    activeSubjects(current, subjects)
      .filter((subject) => theirs.has(subject.id))
      .map((subject) => subject.nameDativeWithPrep),
  );
}

// --- 1. Профиль ---

export type ProfileData = {
  slug: string;
  name: string;
  nameDative: string;
  status: PageStatus;
  /** Адрес исходника фото; без фото – инициал на kraft. */
  photo?: string | undefined;
  /** «репетитор по математике» – вторая строка H1. */
  subtitle: string;
  /** «Математика · 5–9 класс». */
  subjectLines: string[];
  /** «4 года». */
  experience: string;
  education: string;
  tagline: string;
  /** «40» – без валюты. */
  price: string;
  /** Пометка на полях – формула первого предмета репетитора (раздел 4, блок 1, «Десктоп»). */
  formula?: string | undefined;
  telegram: string;
  viber: string;
  reviewCount: number;
  /** «Услуги оказывает …» – у ушедшего строки нет. */
  provider?: string | undefined;
  /** Основная кнопка: подпись и адрес зависят от статуса (раздел 5). */
  cta: { label: string; href: string };
  /** «Ещё на сайте: Максим» – при статусе «Мест нет», если есть другой репетитор. */
  alternative?: { label: string; href: string } | undefined;
  /** Плашка ушедшего репетитора на всю ширину. */
  archivedNotice?: { text: string; link?: { label: string; href: string } } | undefined;
};

type ProfileContext = {
  subjects: readonly Subject[];
  /** Другие репетиторы по общим предметам – уже отобранные `otherTutors`. */
  others: readonly Tutor[];
  reviewCount: number;
  /** Текущий год – для стажа. */
  year: number;
};

export function profileData(tutor: Tutor, context: ProfileContext): ProfileData {
  const status = pageStatus(tutor);
  const active = activeSubjects(tutor, context.subjects);
  const alternative = context.others[0];

  const cta =
    status === 'archived'
      ? { label: CHOOSE_TUTOR_CTA, href: '/#tutors' }
      : status === 'full'
        ? { label: WAITLIST_CTA, href: tutorLeadUrl(tutor.slug, { entry: 'tutor_full' }) }
        : {
            label: leadLabel(tutor.nameDative),
            href: tutorLeadUrl(tutor.slug, { entry: 'tutor_profile' }),
          };

  return {
    slug: tutor.slug,
    name: tutor.name,
    nameDative: tutor.nameDative,
    status,
    photo: tutor.photo === undefined ? undefined : tutorPhotoUrl(tutor.photo),
    subtitle: tutorSubtitle(active.map((subject) => subject.nameDativeWithPrep)),
    subjectLines: active.map(
      (subject) => `${capitalize(subject.name)} · ${gradesLabel(subject.from, subject.to)}`,
    ),
    experience: experienceValue(tutor.teachingSince, context.year),
    education: tutor.education,
    tagline: tutor.tagline,
    price: formatPrice(tutor.price),
    formula: active[0]?.formula,
    telegram: tutor.telegram,
    viber: tutor.viber,
    reviewCount: context.reviewCount,
    provider: status === 'archived' ? undefined : providerLine(tutor.fullName, tutor.unp),
    cta,
    alternative:
      status === 'full' && alternative
        ? { label: alternativeLabel(alternative.name), href: tutorUrl(alternative.slug) }
        : undefined,
    archivedNotice:
      status === 'archived' ? archivedData(tutor, alternative, context.subjects) : undefined,
  };
}

function archivedData(
  tutor: Tutor,
  alternative: Tutor | undefined,
  subjects: readonly Subject[],
): ProfileData['archivedNotice'] {
  if (!alternative) return { text: archivedNotice(tutor.name).text };
  const notice = archivedNotice(tutor.name, {
    name: alternative.name,
    pronoun: alternative.pronoun,
    subjects: sharedSubjects(tutor, [alternative], subjects),
  });
  return {
    text: notice.text,
    link: { label: notice.link ?? '', href: tutorUrl(alternative.slug) },
  };
}

// --- 2. О себе ---

export type AboutData = { goals: string[]; platforms: string };

export function aboutData(
  tutor: Pick<Tutor, 'goals' | 'platforms'>,
  site: Pick<Site, 'defaultPlatforms'>,
): AboutData {
  return {
    goals: tutor.goals.map((goal) => GOAL_LABELS[goal]),
    platforms: platformsLine(tutor.platforms ?? site.defaultPlatforms),
  };
}

// --- 4. Отзывы ---

/** Опубликованные отзывы о репетиторе, новые сверху (раздел 4, блок 4). */
export function tutorReviews(
  tutor: Pick<Tutor, 'id'>,
  reviews: readonly Review[],
  subjects: readonly Subject[],
): ReviewCardData[] {
  return reviews
    .filter((review) => review.tutorId === tutor.id)
    .toSorted((a, b) => b.date.localeCompare(a.date))
    .map((review) => toReviewCard(review, subjects));
}

// --- 5. Как начать ---

export type HowToStartData = { steps: StartStep[]; terms: string; school: string };

export function howToStartData(
  tutor: Tutor,
  site: Pick<Site, 'responseHours' | 'defaultTerms' | 'defaultPlatforms'>,
): HowToStartData {
  const { from, to } = site.responseHours;
  return {
    steps: startSteps({
      name: tutor.name,
      nameDative: tutor.nameDative,
      pronoun: tutor.pronoun,
      hours: `с ${shortTime(from)} до ${shortTime(to)}`,
      price: formatPrice(tutor.price),
      platforms: tutor.platforms ?? site.defaultPlatforms,
    }),
    // Условия по умолчанию показываются как условия этого репетитора (раздел 2, `terms`).
    terms: termsLine(tutor.nameGenitive, tutor.terms ?? site.defaultTerms),
    school: schoolLine(tutor.name),
  };
}

// --- 6. Форма ---

export type LeadData = {
  name: string;
  nameDative: string;
  telegram: string;
  viber: string;
  /** «30 мин · 0 BYN». */
  price: string;
  /** Плашка над формой при статусе «Мест нет». */
  waitlist?: string | undefined;
};

export function leadData(
  tutor: Tutor,
  site: { prices: { trial: Pick<Site['prices']['trial'], 'price'> } },
): LeadData {
  return {
    name: tutor.name,
    nameDative: tutor.nameDative,
    telegram: tutor.telegram,
    viber: tutor.viber,
    price: formPrice(formatPrice(site.prices.trial.price)),
    waitlist:
      pageStatus(tutor) === 'full' ? waitlistNotice(tutor.name, tutor.nameGenitive) : undefined,
  };
}

// --- Подсказка о классе в форме (раздел 4, блок 6) ---

export type GradeHint = { text: string; link?: { label: string; href: string } };

/**
 * Подсказка под полем «Класс», если репетитор не занимается с выбранным классом: ссылка на форму
 * другого репетитора, который с ним занимается, с тем же классом. Подходящего нет – «можно обсудить
 * на пробном занятии». Класс репетитора – `null`.
 */
export function gradeHint(
  tutor: Tutor,
  grade: number,
  tutors: readonly Tutor[],
  subjects: readonly Subject[],
): GradeHint | null {
  const covers = (range: GradeRange | null) =>
    range !== null && grade >= range.from && grade <= range.to;
  const own = tutorGrades(tutor, subjects);
  if (!own || covers(own)) return null;
  const ownText = { range: gradesRange(own), single: own.from === own.to };

  const other = otherTutors(
    tutor,
    tutors.filter((candidate) => covers(tutorGrades(candidate, subjects))),
    subjects,
  )[0];
  const theirs = other ? tutorGrades(other, subjects) : null;
  if (!other || !theirs) return { text: gradeHintText(tutor.name, ownText, undefined, grade).text };

  // Классы другого репетитора, с которыми этот не занимается, – по ту сторону от выбранного.
  const range =
    grade > own.to
      ? { from: Math.max(theirs.from, own.to + 1), to: theirs.to }
      : { from: theirs.from, to: Math.min(theirs.to, own.from - 1) };
  const hint = gradeHintText(tutor.name, ownText, {
    name: other.name,
    pronoun: other.pronoun,
    range: gradesRange(range),
  });
  return {
    text: hint.text,
    link: {
      label: hint.link ?? '',
      href: tutorLeadUrl(other.slug, { entry: 'tutor_more', grade }),
    },
  };
}

// --- Страница целиком ---

export type OutsideData = { paragraphs: string[] };

export type MoreData = { title: string; lead: string; tutors: TutorCardData[] };

export type TutorPageData = {
  profile: ProfileData;
  about: AboutData;
  /** «Вне занятий»: хобби и личная деталь; пусто – блока нет. */
  outside: OutsideData;
  reviews: { title: string; items: ReviewCardData[] };
  /** «Как начать» и форма – только у того, кто принимает учеников. */
  how?: HowToStartData | undefined;
  lead?: LeadData | undefined;
  /** «Другие репетиторы»; нет общих предметов – блока нет. */
  more?: MoreData | undefined;
  /** «Мест нет» и ушедший: «Другие репетиторы» – сразу под профилем (раздел 5). */
  moreFirst: boolean;
};

type PageContext = {
  site: Pick<Site, 'responseHours' | 'defaultTerms' | 'defaultPlatforms'> & {
    prices: { trial: Pick<Site['prices']['trial'], 'price'> };
  };
  subjects: readonly Subject[];
  /** Все репетиторы, включая ушедших и текущего. */
  tutors: readonly Tutor[];
  /** Опубликованные отзывы обо всех репетиторах. */
  reviews: readonly Review[];
  year: number;
};

export function tutorPageData(tutor: Tutor, context: PageContext): TutorPageData {
  const { site, subjects, reviews, year } = context;
  const status = pageStatus(tutor);
  const others = otherTutors(tutor, context.tutors, subjects);
  const counts = countReviews(reviews);
  const own = tutorReviews(tutor, reviews, subjects);

  return {
    profile: profileData(tutor, { subjects, others, reviewCount: own.length, year }),
    about: aboutData(tutor, site),
    outside: { paragraphs: [tutor.hobby, tutor.personalNote].filter((text) => text !== undefined) },
    reviews: { title: reviewsTitle(tutor.namePrepositional, own.length), items: own },
    how: status === 'archived' ? undefined : howToStartData(tutor, site),
    lead: status === 'archived' ? undefined : leadData(tutor, site),
    more:
      others.length > 0
        ? {
            title: moreTitle(sharedSubjects(tutor, others, subjects)),
            lead: moreLead(others.length),
            tutors: others.map((other) =>
              toTutorCardData(other, {
                subjects,
                // Ушедших среди других нет: `otherTutors` их отбрасывает.
                availability: other.availability,
                reviewCount: counts.get(other.id) ?? 0,
                year,
              }),
            ),
          }
        : undefined,
    moreFirst: status === 'full' || status === 'archived',
  };
}

// --- Метатеги (раздел 6) ---

export function tutorMetadata(
  tutor: Tutor,
  subjects: readonly Subject[],
  year: number,
): { title: string; description: string; noindex: boolean } {
  const active = activeSubjects(tutor, subjects);
  const bySubjects = joinWithAnd(active.map((subject) => subject.nameDativeWithPrep));
  const grades = tutorGrades(tutor, subjects);
  // Без невидимой связки из gradesRange: заголовок и описание читают поисковики.
  const range =
    grades && (grades.from === grades.to ? `${grades.from}` : `${grades.from}–${grades.to}`);
  const who = [tutor.name, '–', 'репетитор', bySubjects].filter(Boolean).join(' ');

  return {
    title: `${who} онлайн${range ? `, ${range} класс` : ''} | PuzzleUp`,
    description:
      tutor.seoDescription ??
      `${who}${range ? ` для ${range} классов` : ''}. ${experienceLabel(tutor.teachingSince, year).replaceAll(' ', ' ')}. Онлайн, ${formatPrice(tutor.price)} BYN за 60 минут, пробное занятие бесплатно.`,
    noindex: tutor.archived,
  };
}
