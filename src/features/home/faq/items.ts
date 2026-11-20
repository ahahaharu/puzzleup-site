import type { FaqItem, Subject, Tutor } from '@/content';
import { gradesRange, tutorGrades } from '@/features/tutors/grades';
import { fillTemplate } from '@/lib/template';

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

/** Вопросы с подставленными значениями шаблонов (FAQ_TEMPLATE_KEYS). */
export function faqItems(
  faq: readonly FaqItem[],
  tutors: readonly FaqTutor[],
  subjects: readonly Pick<Subject, 'id' | 'status'>[],
): FaqItem[] {
  const values = { tutorsGrades: tutorsGradesText(tutors, subjects) };
  return faq.map((item) => ({ ...item, answer: fillTemplate(item.answer, values) }));
}
