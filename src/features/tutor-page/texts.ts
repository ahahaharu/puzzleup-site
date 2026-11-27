import { aboutName, capitalize, joinWithAnd } from '@/lib/text';

// Тексты страницы репетитора дословно из ТЗ страницы репетитора, разделы 3–5. Имя, падежи
// и местоимение – из файла репетитора, часы ответа, платформы и условия – из `site.json`.
// Лиды «Других репетиторов» в ТЗ нет – из макета T-7-more (как лиды главной, ADR-044).

// Между числом и словом – неразрывный пробел.
const NBSP = ' ';

// --- Хлебные крошки (раздел 3) ---

export const BREADCRUMBS_LABEL = 'Хлебные крошки';
export const BREADCRUMB_HOME = 'Главная';
export const BREADCRUMB_TUTORS = 'Репетиторы';
/** Крошки до имени репетитора: «Репетиторы» ведёт в блок на главной. Их же повторяет JSON-LD. */
export const BREADCRUMB_PARENTS = [
  { label: BREADCRUMB_HOME, href: '/' },
  { label: BREADCRUMB_TUTORS, href: '/#tutors' },
] as const;

// --- 1. Профиль ---

/** Вторая строка H1: «репетитор по математике»; без активных предметов – «репетитор». */
export function tutorSubtitle(subjectsDativeWithPrep: readonly string[]): string {
  return subjectsDativeWithPrep.length > 0
    ? `репетитор ${joinWithAnd(subjectsDativeWithPrep)}`
    : 'репетитор';
}

export const FACT_EXPERIENCE = 'Стаж';
export const FACT_EDUCATION = 'Образование';

export const TRIAL_FREE = 'Пробное занятие – бесплатно';

export const WAITLIST_CTA = 'Встать в лист ожидания';
/** Короткая подпись в шапке телефона – часть полной. */
export const WAITLIST_SHORT = 'Лист ожидания';
export const CHOOSE_TUTOR_CTA = 'Выбрать репетитора';

export const alternativeLabel = (name: string) => `Ещё на сайте: ${name}`;

export const REVIEWS_LINK = 'Отзывы';

export function providerLine(fullName: string, unp: string): string {
  return `Услуги оказывает ${fullName}, плательщик налога на профессиональный доход, УНП ${unp}. Оплата занятий – напрямую репетитору.`;
}

/** «его» / «её» – о другом репетиторе: «посмотрите его страницу». */
export const possessive = (pronoun: 'он' | 'она') => (pronoun === 'он' ? 'его' : 'её');

/** Плашка ушедшего репетитора (раздел 5): первая фраза. */
export const archivedGone = (name: string) => `${name} больше не принимает новых учеников.`;

/** Плашка ушедшего с другим репетитором: ссылка на его страницу – в конце фразы. */
export function archivedWithAlternative(
  name: string,
  alternative: { name: string; pronoun: 'он' | 'она'; subjects: string },
): { text: string; link: string } {
  return {
    text: `${archivedGone(name)} ${capitalize(alternative.subjects)} на сайте есть ${alternative.name} – `,
    link: `посмотрите ${possessive(alternative.pronoun)} страницу`,
  };
}

// --- 2. О себе ---

export const ABOUT_TITLE = 'О себе';
export const HELPS_TITLE = 'С чем помогаю';
export const platformsLine = (platforms: readonly string[]) =>
  `Занятия – ${joinWithAnd(platforms)}`;

// --- 3. Вне занятий ---

export const OUTSIDE_TITLE = 'Вне занятий';

// --- 4. Отзывы ---

export const reviewsTitle = (namePrepositional: string, count: number) =>
  `Отзывы ${aboutName(namePrepositional)}\u00a0·\u00a0${count}`;
export const SHOW_MORE = 'Показать ещё';

// Записка о пробном занятии в пустом месте кладки скриншотов (ADR-071) – тот же смысл, что у шага
// «Пробное занятие» в «Как начать».
export const REVIEWS_NOTE_TITLE = 'Пробное занятие – бесплатно';
export const reviewsNoteText = (name: string) =>
  `30 минут онлайн. ${name} познакомится с ребёнком и найдёт пробелы.`;

// --- 5. Как начать ---

export const HOW_TITLE = 'Как начать';

export type StartStep = { title: string; text: string };

type StepsData = {
  name: string;
  nameDative: string;
  pronoun: 'он' | 'она';
  /** «с 9:00 до 22:00». */
  hours: string;
  /** «40» – без валюты. */
  price: string;
  platforms: readonly string[];
};

export function startSteps({
  name,
  nameDative,
  pronoun,
  hours,
  price,
  platforms,
}: StepsData): StartStep[] {
  return [
    {
      title: 'Заявка',
      text: `Оставьте заявку или напишите ${nameDative} в мессенджер – ${pronoun} ответит ${hours}.`,
    },
    {
      title: 'Пробное занятие',
      text: `30 минут онлайн, бесплатно. ${name} познакомится с ребёнком и найдёт пробелы. Итог пришлёт сообщением.`,
    },
    {
      title: 'Занятия',
      text: `${price}${NBSP}BYN за 60${NBSP}минут, в ${joinWithAnd(platforms)}. Оплата – переводом напрямую репетитору.`,
    },
  ];
}

/** Условия – самостоятельное предложение под шагами: точка в конце, если её нет. */
export const termsLine = (nameGenitive: string, terms: string) =>
  `Условия ${nameGenitive}: ${terms}${/[.!?]$/.test(terms) ? '' : '.'}`;

// --- 6. Форма (ТЗ главной, блок 9 «Раскладка»; ТЗ страницы репетитора, блок 6) ---

export const leadTitle = (nameDative: string) => `Записаться к ${nameDative}`;

export const leadPoints = (name: string) => [
  '30 минут онлайн',
  `${name} напишет в удобный мессенджер`,
  'Ни к чему не обязывает',
];

export const leadMessengers = (nameDative: string) =>
  `Не хотите заполнять форму? Напишите ${nameDative}`;

export const FORM_TITLE = 'Недостающая деталь\u00a0–\u00a0здесь';

/** «30 мин · 0 BYN» – цена пробного занятия из `site.json`. */
export const formPrice = (trialPrice: string) => `30${NBSP}мин · ${trialPrice}${NBSP}BYN`;

export const tutorChip = (name: string) => `Репетитор: ${name}`;

export function waitlistNotice(name: string, nameGenitive: string): string {
  return `Сейчас у ${nameGenitive} нет свободного времени. Оставьте заявку в лист ожидания – ${name} напишет, как только место освободится.`;
}

// --- 7. Другие репетиторы ---

/** «Ещё на сайте по математике». */
export const moreTitle = (subjectsDativeWithPrep: string) =>
  `Ещё на сайте ${subjectsDativeWithPrep}`;

export const moreLead = (count: number) =>
  count === 1
    ? 'Другой независимый репетитор – со своей ценой и условиями.'
    : 'Другие независимые репетиторы – у каждого своя цена и условия.';

export const ALL_TUTORS = 'Все репетиторы';

// --- Подсказка о классе в форме (блок 6) ---

/** «5–9 классами», «9 классом». */
const withGrades = (range: string, single: boolean) =>
  `${range}${NBSP}${single ? 'классом' : 'классами'}`;

type OwnGrades = { range: string; single: boolean };

const ownGradesSentence = (name: string, own: OwnGrades) =>
  `${name} занимается с ${withGrades(own.range, own.single)}.`;

/** Подходящего репетитора нет: «… 10 класс можно обсудить на пробном занятии». */
export const gradeHintTrial = (name: string, own: OwnGrades, grade: number) =>
  `${ownGradesSentence(name, own)} ${grade}${NBSP}класс можно обсудить на пробном занятии.`;

/** «… С 10–11 классом работает Максим – его страница»: ссылка – в конце фразы. */
export function gradeHintOther(
  name: string,
  own: OwnGrades,
  other: { name: string; pronoun: 'он' | 'она'; range: string },
): { text: string; link: string } {
  return {
    text: `${ownGradesSentence(name, own)} С ${other.range}${NBSP}классом работает ${other.name} – `,
    link: `${possessive(other.pronoun)} страница`,
  };
}
