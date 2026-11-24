import { describe, expect, it } from 'vitest';

import { directory, formLead, manualLead } from '../bot/fixtures';
import { LAST_COLUMN, LEAD_COLUMNS, leadRow, sheetsDate, sheetsDateTime } from './row';

// 24.11.2026 – день 46350 в Таблице; 01.01.2027 – день 46388.
const NOV_24 = 46_350;
const JAN_1 = 46_388;
const at = (hours: number, minutes: number) => (hours * 60 + minutes) / 1440;

describe('LEAD_COLUMNS', () => {
  it('keeps columns A–Q in the order of docs/data-model.md', () => {
    expect(LEAD_COLUMNS).toHaveLength(17);
    expect(LAST_COLUMN).toBe('Q');
    expect(LEAD_COLUMNS[0]).toBe('№ заявки');
    expect(LEAD_COLUMNS[8]).toBe('Канал');
    expect(LEAD_COLUMNS[12]).toBe('Статус');
    expect(LEAD_COLUMNS[16]).toBe('Изменено');
  });
});

describe('sheetsDateTime and sheetsDate', () => {
  it('counts days from 30.12.1899 in Minsk time, without seconds', () => {
    expect(sheetsDateTime(new Date('2026-11-24T11:05:59Z'))).toBeCloseTo(NOV_24 + at(14, 5), 9);
  });

  it('moves late UTC evening to the next Minsk day', () => {
    expect(sheetsDate(new Date('2026-12-31T21:30:00Z'))).toBe(JAN_1);
    expect(sheetsDateTime(new Date('2026-12-31T21:30:00Z'))).toBeCloseTo(JAN_1 + at(0, 30), 9);
  });

  it('drops the time from a date', () => {
    expect(sheetsDate(new Date('2026-11-24T20:59:00Z'))).toBe(NOV_24);
  });
});

describe('leadRow', () => {
  it('maps a form lead to columns A–Q', () => {
    const row = leadRow(formLead({ subjects: ['math', 'physics'], goal: 'exam9' }), directory);
    expect(row).toHaveLength(LEAD_COLUMNS.length);
    expect(row.map((cell) => (typeof cell === 'number' ? Number(cell.toFixed(6)) : cell))).toEqual([
      1024,
      Number((NOV_24 + at(14, 5)).toFixed(6)),
      'Анна',
      7,
      'математика, физика',
      'Экзамен после 9 класса',
      'форма',
      'tutor_profile',
      'instagram',
      'cpc',
      'winter',
      '',
      'новая',
      '',
      '',
      '',
      Number((NOV_24 + at(14, 5)).toFixed(6)),
    ]);
  });

  it('never copies the name, the phone or the comment', () => {
    const lead = formLead({ parentName: 'Мария', phone: '+375290000000', comment: 'Дроби' });
    const cells = leadRow(lead, directory).map(String);
    for (const value of ['Мария', '+375290000000', '375290000000', 'Дроби']) {
      expect(cells.join('|')).not.toContain(value);
    }
  });

  it('fills trial, student, rejection and change dates', () => {
    const row = leadRow(
      formLead({
        status: 'rejected',
        rejectionReason: 'chose_other',
        trialDoneAt: new Date('2026-11-25T10:00:00Z'),
        studentAt: new Date('2026-12-31T21:30:00Z'),
        statusChangedAt: new Date('2027-01-01T06:00:00Z'),
      }),
      directory,
    );
    expect(row.slice(12, 16)).toEqual(['отказ', NOV_24 + 1, JAN_1, 'выбрали другого']);
    expect(row[16]).toBeCloseTo(JAN_1 + at(9, 0), 9);
  });

  it('maps a manual lead: source, referral channel and empty site fields', () => {
    const row = leadRow(manualLead(), directory);
    expect(row.slice(2, 13)).toEqual([
      'Олег',
      8,
      'математика',
      '',
      'Viber',
      '',
      'word_of_mouth',
      '',
      '',
      '',
      'связался',
    ]);
  });

  it('falls back to ids for a tutor or a subject missing from content', () => {
    const row = leadRow(formLead({ tutorId: 't-gone', subjects: ['chemistry'] }), directory);
    expect(row.slice(2, 5)).toEqual(['t-gone', 7, 'chemistry']);
  });
});
