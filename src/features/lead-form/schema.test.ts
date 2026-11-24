import { parseWithZod } from '@conform-to/zod/v4';
import { describe, expect, it } from 'vitest';

import { leadSchema, type LeadFormOptions } from './schema';
import { ERRORS } from './texts';

const options: LeadFormOptions = {
  tutorId: 't-anna',
  grades: [5, 6, 7, 8, 9, 10, 11],
  subjects: ['math', 'physics'],
  goals: ['grades', 'exam9'],
};

// Только выдуманные данные (docs/conventions.md, «Тесты»).
const valid: Record<string, string | string[]> = {
  tutorId: 't-anna',
  parentName: 'Мария',
  phone: '+375 (29) 000-00-00',
  contactMethod: 'telegram',
  grade: '7',
  subjects: 'math',
  consent: 'on',
};

function formData(fields: Record<string, string | string[] | undefined>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const item of [value ?? []].flat()) data.append(key, item);
  }
  return data;
}

const parse = (fields: Record<string, string | string[] | undefined>) =>
  parseWithZod(formData(fields), { schema: leadSchema(options) });

function errors(fields: Record<string, string | string[] | undefined>) {
  const submission = parse(fields);
  return (submission.status === 'error' && submission.error) || {};
}

describe('leadSchema', () => {
  it('accepts a minimal valid lead and normalizes it', () => {
    const submission = parse(valid);
    expect(submission.status).toBe('success');
    if (submission.status !== 'success') return;
    expect(submission.value).toEqual({
      tutorId: 't-anna',
      parentName: 'Мария',
      phone: '+375290000000',
      contactMethod: 'telegram',
      grade: 7,
      subjects: ['math'],
      contactTime: [],
      consent: 'on',
      entry: 'direct',
    });
  });

  it('keeps optional fields, context and UTM', () => {
    const submission = parse({
      ...valid,
      subjects: ['math', 'physics'],
      goal: 'exam9',
      contactTime: ['morning', 'evening'],
      comment: '  Удобно после школы  ',
      entry: 'tutors',
      landing: '/tutors/anna',
      utm_source: 'instagram',
    });
    expect(submission.status === 'success' && submission.value).toMatchObject({
      subjects: ['math', 'physics'],
      goal: 'exam9',
      contactTime: ['morning', 'evening'],
      comment: 'Удобно после школы',
      entry: 'tutors',
      landing: '/tutors/anna',
      utm_source: 'instagram',
    });
  });

  it('shows the texts from the spec for empty required fields', () => {
    expect(errors({ tutorId: 't-anna' })).toEqual({
      parentName: [ERRORS.nameEmpty],
      phone: [ERRORS.phoneEmpty],
      contactMethod: [ERRORS.contactEmpty],
      grade: [ERRORS.gradeEmpty],
      subjects: [ERRORS.subjectsEmpty],
      consent: [ERRORS.consentMissing],
    });
  });

  it.each([
    ['Мария2', ERRORS.nameInvalid],
    ['Мария!', ERRORS.nameInvalid],
    ['- -', ERRORS.nameInvalid],
    ['   ', ERRORS.nameEmpty],
    ['М', ERRORS.nameEmpty],
    ['М'.repeat(61), ERRORS.nameEmpty],
  ])('rejects the name %j', (parentName, message) => {
    expect(errors({ ...valid, parentName }).parentName).toEqual([message]);
  });

  it('accepts names with a hyphen, a space and «ё»', () => {
    expect(parse({ ...valid, parentName: 'Анна-Мария Алёна' }).status).toBe('success');
  });

  it.each([
    ['+375 (29) 12', ERRORS.phoneIncomplete],
    ['+375 (17) 000-00-00', ERRORS.phoneUnknownCode],
  ])('rejects the phone %j', (phone, message) => {
    expect(errors({ ...valid, phone }).phone).toEqual([message]);
  });

  it('rejects a grade or subject the form does not offer', () => {
    expect(errors({ ...valid, grade: '4' }).grade).toEqual([ERRORS.gradeEmpty]);
    expect(errors({ ...valid, subjects: 'chemistry' })).toHaveProperty('subjects[0]', [
      ERRORS.subjectsEmpty,
    ]);
  });

  it('rejects a comment longer than 1000 characters', () => {
    expect(errors({ ...valid, comment: 'а'.repeat(1001) }).comment).toEqual([
      ERRORS.commentTooLong,
    ]);
    expect(parse({ ...valid, comment: 'а'.repeat(1000) }).status).toBe('success');
  });

  it('drops tampered optional values instead of failing', () => {
    const submission = parse({
      ...valid,
      goal: 'olymp',
      contactTime: ['night', 'day'],
      entry: 'somewhere',
      landing: 'https://example.com',
      utm_source: 'x'.repeat(201),
    });
    expect(submission.status).toBe('success');
    if (submission.status !== 'success') return;
    expect(submission.value.goal).toBeUndefined();
    expect(submission.value.contactTime).toEqual(['day']);
    expect(submission.value.entry).toBe('direct');
    expect(submission.value.landing).toBeUndefined();
    expect(submission.value.utm_source).toBeUndefined();
  });

  it('rejects a lead addressed to another tutor', () => {
    expect(errors({ ...valid, tutorId: 't-boris' })).toHaveProperty('tutorId');
  });
});
