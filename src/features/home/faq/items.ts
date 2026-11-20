import type { FaqItem, Subject, Tutor } from '@/content';
import { gradesRange, tutorGrades } from '@/features/tutors/grades';
import { fillTemplate, templateKeys } from '@/lib/template';

// Вопросы FAQ – ТЗ главной, блок 8; docs/data-model.md, `faq.json`. Ответ о классах собирается
// из данных: новый репетитор попадает в него без правки текста.

type FaqTutor = Pick<Tutor, 'name' | 'subjects'>;

/** «Андрей – с 5–9 классом, Максим – с 5–11 классом»; `tutors` – неушедшие, по порядку вывода. */
export function tutorsGradesText(
  tutors: readonly FaqTutor[],
  subjects: readonly Pick<Subject, 'id' | 'status'>[],
): string {
  return tutors
    .flatMap((tutor) => {
      const grades = tutorGrades(tutor, subjects);
      return grades ? [`${tutor.name} – с ${gradesRange(grades)} классом`] : [];
    })
    .join(', ');
}

/**
 * Вопросы с подставленными значениями шаблонов (FAQ_TEMPLATE_KEYS). Вопрос, чей шаблон собрался
 * пустым (ни у кого нет активных предметов), не выводится – иначе ответом была бы одна точка.
 */
export function faqItems(
  faq: readonly FaqItem[],
  tutors: readonly FaqTutor[],
  subjects: readonly Pick<Subject, 'id' | 'status'>[],
): FaqItem[] {
  const values: Record<string, string> = { tutorsGrades: tutorsGradesText(tutors, subjects) };
  return faq.flatMap((item) => {
    const empty = templateKeys(item.answer).some((key) => values[key] === '');
    return empty ? [] : [{ ...item, answer: fillTemplate(item.answer, values) }];
  });
}
