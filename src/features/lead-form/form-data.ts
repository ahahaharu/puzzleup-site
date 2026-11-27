import { listedTutors } from '@/components/layout/texts';
import type { Site, Subject, Tutor } from '@/content';
import { activeSubjects, gradeHint, type GradeHint } from '@/features/tutor-page/page-data';
import { GOAL_LABELS, type Goal } from '@/lib/goal';
import { fillTemplate } from '@/lib/template';
import { capitalize } from '@/lib/text';
import { shortTime } from '@/lib/time';
import { tutorUrl } from '@/lib/urls';

import type { LeadFormOptions } from './schema';
import { earlySubjectHint } from './texts';

// Данные формы заявки из контента – ТЗ главной, блок 9 («Поля по порядку»); ТЗ страницы
// репетитора, блок 6. Собираются на сервере при сборке страницы и уходят в клиентский LeadForm
// простыми значениями: подсказки о классе посчитаны заранее для каждого класса и предмета.

export type Option<T extends string | number = string> = { value: T; label: string };

export type ConsentData = {
  /** «Согласен на обработку персональных данных». */
  label: string;
  /** «политика» – ссылка в скобках после подписи, открывается в новой вкладке. */
  policyLabel: string;
  policyHref: string;
  /** Мелкий текст под подписью: операторы, хранение, передача; нет в `site.json` – нет и его. */
  details?: string | undefined;
};

export type LeadFormData = {
  options: LeadFormOptions;
  tutor: { slug: string; name: string; nameDative: string; telegram: string; viber: string };
  grades: Option<number>[];
  subjects: Option[];
  goals: Option<Goal>[];
  /** Один предмет у репетитора – выбран заранее (ТЗ страницы репетитора, блок 6). */
  defaultSubjects: string[];
  /** Подсказки о классе: ключ – `gradeHintKey(grade, subjectId)`. */
  gradeHints: Record<string, GradeHint>;
  /** Предметы, которые в школе начинаются позже: подсказка при младшем классе. */
  earlySubjects: { id: string; gradeFrom: number; hint: string }[];
  consent: ConsentData;
  /** Путь страницы с формой – скрытое поле `landing` и адрес формы без JavaScript. */
  landing: string;
  /** Начало часов ответа – «9:00» в ночном тексте «Спасибо». */
  responseFrom: string;
};

/** Ключ подсказки о классе: по выбранному предмету или, если он не один, по всем. */
export const gradeHintKey = (grade: number, subjectId?: string) =>
  subjectId === undefined ? String(grade) : `${grade}:${subjectId}`;

/** «Андрей [ФИО], УНП [номер], и Максим [ФИО], УНП [номер]» – операторы в согласии. */
export function consentOperators(tutors: readonly Pick<Tutor, 'name' | 'fullName' | 'unp'>[]) {
  const items = tutors.map((tutor) => `${tutor.name} ${tutor.fullName}, УНП ${tutor.unp}`);
  return items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')}, и ${items.at(-1) ?? ''}`;
}

export function consentData(
  site: Pick<Site, 'consent'>,
  tutors: readonly Pick<Tutor, 'name' | 'fullName' | 'unp' | 'archived' | 'order'>[],
): ConsentData {
  return {
    label: site.consent.label,
    policyLabel: site.consent.policyLinkLabel,
    policyHref: '/privacy',
    details:
      site.consent.details === undefined
        ? undefined
        : fillTemplate(site.consent.details, {
            operators: consentOperators(listedTutors(tutors)),
          }),
  };
}

/** Текст согласия целиком – так, как его видит родитель; от него считается хеш в `consents`. */
export function consentText(consent: ConsentData): string {
  const text = `${consent.label} (${consent.policyLabel}).`;
  return consent.details === undefined ? text : `${text} ${consent.details}`;
}

type Context = {
  site: Pick<Site, 'consent' | 'responseHours'>;
  subjects: readonly Subject[];
  /** Все репетиторы, включая ушедших и текущего. */
  tutors: readonly Tutor[];
};

export function leadFormData(tutor: Tutor, { site, subjects, tutors }: Context): LeadFormData {
  const own = activeSubjects(tutor, subjects);
  // Чипы класса – все школьные классы предметов репетитора (у математики 5–11), а не только его:
  // другой класс – подсказка со ссылкой на другого репетитора (ТЗ главной, блок 9, поле 4).
  const school = own.flatMap((item) => {
    const subject = subjects.find((candidate) => candidate.id === item.id);
    return subject ? [subject] : [];
  });
  const from = Math.min(...school.map((subject) => subject.gradeFrom));
  const to = Math.max(...school.map((subject) => subject.gradeTo));
  const grades = school.length > 0 ? range(from, to) : [];

  const gradeHints: Record<string, GradeHint> = {};
  for (const grade of grades) {
    for (const subjectId of [undefined, ...own.map((subject) => subject.id)]) {
      const hint = gradeHint(tutor, grade, tutors, subjects, subjectId);
      if (hint) gradeHints[gradeHintKey(grade, subjectId)] = hint;
    }
  }

  return {
    options: {
      tutorId: tutor.id,
      grades,
      subjects: own.map((subject) => subject.id),
      goals: tutor.goals,
    },
    tutor: {
      slug: tutor.slug,
      name: tutor.name,
      nameDative: tutor.nameDative,
      telegram: tutor.telegram,
      viber: tutor.viber,
    },
    grades: grades.map((grade) => ({ value: grade, label: String(grade) })),
    subjects: own.map((subject) => ({ value: subject.id, label: capitalize(subject.name) })),
    goals: tutor.goals.map((goal) => ({ value: goal, label: GOAL_LABELS[goal] })),
    defaultSubjects: own.length === 1 ? own.map((subject) => subject.id) : [],
    gradeHints,
    earlySubjects: school
      .filter((subject) => subject.gradeFrom > from)
      .map((subject) => ({
        id: subject.id,
        gradeFrom: subject.gradeFrom,
        hint: earlySubjectHint(subject.name, subject.gradeFrom),
      })),
    consent: consentData(site, tutors),
    landing: tutorUrl(tutor.slug),
    responseFrom: shortTime(site.responseHours.from),
  };
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}
