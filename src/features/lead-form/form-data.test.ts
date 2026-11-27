import { describe, expect, it } from 'vitest';

import {
  FIXTURE_ANNA,
  FIXTURE_IGOR,
  FIXTURE_SITE,
  FIXTURE_SUBJECTS,
  FIXTURE_VERA,
} from '@/features/tutor-page/fixtures';

import { consentOperators, consentText, gradeHintKey, leadFormData } from './form-data';

const site = {
  responseHours: FIXTURE_SITE.responseHours,
  consent: {
    version: '2026-11-12',
    label: 'Согласен на обработку персональных данных',
    policyLinkLabel: 'политика',
    details: 'Операторы – репетиторы {operators}. Данные хранятся на сервере в Беларуси.',
  },
};
const tutors = [FIXTURE_ANNA, FIXTURE_IGOR, FIXTURE_VERA];
const context = { site, subjects: FIXTURE_SUBJECTS, tutors };

describe('leadFormData', () => {
  it('offers every school grade of the tutor subjects and preselects a single subject', () => {
    const data = leadFormData(FIXTURE_ANNA, context);
    expect(data.grades.map((grade) => grade.value)).toEqual([5, 6, 7, 8, 9, 10, 11]);
    expect(data.subjects).toEqual([{ value: 'math', label: 'Математика' }]);
    expect(data.defaultSubjects).toEqual(['math']);
    expect(data.options).toEqual({
      tutorId: 't-anna',
      grades: [5, 6, 7, 8, 9, 10, 11],
      subjects: ['math'],
      goals: ['grades', 'exam9'],
    });
    expect(data.landing).toBe('/tutors/anna');
    expect(data.responseFrom).toBe('9:00');
  });

  it('shows only the goals of the tutor', () => {
    expect(leadFormData(FIXTURE_ANNA, context).goals).toEqual([
      { value: 'grades', label: 'Подтянуть оценки' },
      { value: 'exam9', label: 'Экзамен после 9 класса' },
    ]);
  });

  it('does not preselect when the tutor has several subjects', () => {
    const data = leadFormData(FIXTURE_IGOR, context);
    expect(data.defaultSubjects).toEqual([]);
    expect(data.subjects.map((subject) => subject.value)).toEqual(['math', 'physics']);
  });

  it('precomputes the grade hint for grades the tutor does not teach', () => {
    const { gradeHints } = leadFormData(FIXTURE_ANNA, context);
    expect(gradeHints[gradeHintKey(7)]).toBeUndefined();
    expect(gradeHints[gradeHintKey(10)]?.link?.href).toBe(
      '/tutors/igor?entry=tutor_more&grade=10#lead',
    );
    expect(gradeHints[gradeHintKey(10, 'math')]?.link?.href).toBe(
      '/tutors/igor?entry=tutor_more&subject=math&grade=10#lead',
    );
  });

  it('hints that a subject starts later at school', () => {
    expect(leadFormData(FIXTURE_IGOR, context).earlySubjects).toEqual([
      {
        id: 'physics',
        gradeFrom: 7,
        hint: 'Физика в школе начинается с 7 класса. Если нужно раньше – обсудим на пробном занятии.',
      },
    ]);
    expect(leadFormData(FIXTURE_ANNA, context).earlySubjects).toEqual([]);
  });

  it('names every active tutor as an operator in the consent', () => {
    const { consent } = leadFormData(FIXTURE_ANNA, context);
    expect(consent.details).toBe(
      'Операторы – репетиторы Анна Примерова Анна Ивановна, УНП 000000000, Игорь Примерова Анна Ивановна, УНП 000000000, и Вера Примерова Анна Ивановна, УНП 000000000. Данные хранятся на сервере в Беларуси.',
    );
    expect(consentText(consent)).toBe(
      `Согласен на обработку персональных данных (политика). ${consent.details}`,
    );
  });

  it('keeps only the label when the site has no consent details', () => {
    const { details: _, ...bare } = site.consent;
    const { consent } = leadFormData(FIXTURE_ANNA, {
      ...context,
      site: { ...site, consent: bare },
    });
    expect(consent.details).toBeUndefined();
    expect(consentText(consent)).toBe('Согласен на обработку персональных данных (политика).');
  });
});

describe('consentOperators', () => {
  const tutor = (name: string) => ({ name, fullName: '[ФИО]', unp: '[номер]' });

  it('joins operators with «и» before the last one', () => {
    expect(consentOperators([tutor('Андрей')])).toBe('Андрей [ФИО], УНП [номер]');
    expect(consentOperators([tutor('Андрей'), tutor('Максим')])).toBe(
      'Андрей [ФИО], УНП [номер], и Максим [ФИО], УНП [номер]',
    );
  });
});
