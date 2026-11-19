import { describe, expect, it } from 'vitest';

import { footerTexts, listedTutors, responseHoursLine } from './texts';

// Шаблоны – как в content/site.json.
const SITE = {
  siteOperatorTutorId: 't-andrei',
  footer: {
    tagline: 'Общий сайт независимых репетиторов',
    requisites:
      'PuzzleUp – общий сайт независимых репетиторов. Услуги оказывает каждый репетитор самостоятельно как плательщик налога на профессиональный доход: {tutorsRequisites}. Не является организацией, юридическим лицом или ИП. Сайт ведёт {siteOperatorFullName}. Оплата занятий – напрямую репетитору.',
    copyright: '© 2026 {tutorsFullNames}',
  },
};

const ANDREI = { id: 't-andrei', fullName: 'Андреев Андрей Андреевич', unp: '111111111' };
const MAXIM = { id: 't-maxim', fullName: 'Максимов Максим Максимович', unp: '222222222' };
const IVAN = { id: 't-ivan', fullName: 'Иванов Иван Иванович', unp: '333333333' };

describe('footerTexts', () => {
  it('lists every tutor with UNP and names the site operator', () => {
    const { requisites, copyright } = footerTexts(SITE, [ANDREI, MAXIM]);

    expect(requisites).toBe(
      'PuzzleUp – общий сайт независимых репетиторов. Услуги оказывает каждый репетитор самостоятельно как плательщик налога на профессиональный доход: Андреев Андрей Андреевич, УНП 111111111; Максимов Максим Максимович, УНП 222222222. Не является организацией, юридическим лицом или ИП. Сайт ведёт Андреев Андрей Андреевич. Оплата занятий – напрямую репетитору.',
    );
    expect(copyright).toBe('© 2026 Андреев Андрей Андреевич, Максимов Максим Максимович');
  });

  it('adds a new tutor without changing the template', () => {
    const { requisites, copyright } = footerTexts(SITE, [ANDREI, MAXIM, IVAN]);

    expect(requisites).toContain(
      'Максимов Максим Максимович, УНП 222222222; Иванов Иван Иванович, УНП 333333333.',
    );
    expect(copyright).toBe(
      '© 2026 Андреев Андрей Андреевич, Максимов Максим Максимович, Иванов Иван Иванович',
    );
  });

  it('works with a single tutor', () => {
    expect(footerTexts(SITE, [ANDREI]).copyright).toBe('© 2026 Андреев Андрей Андреевич');
  });

  it('fails when the site operator is not among active tutors', () => {
    expect(() => footerTexts(SITE, [MAXIM])).toThrow(/t-andrei/);
  });
});

describe('responseHoursLine', () => {
  it('drops the leading zero of the hour', () => {
    expect(responseHoursLine({ from: '09:00', to: '22:00', tz: 'Europe/Minsk' })).toBe(
      'Каждый репетитор отвечает сам, обычно с 9:00 до 22:00',
    );
  });
});

describe('listedTutors', () => {
  it('drops archived tutors and sorts the rest by order', () => {
    const tutors = [
      { id: 't-maxim', archived: false, order: 20 },
      { id: 't-gone', archived: true, order: 5 },
      { id: 't-andrei', archived: false, order: 10 },
    ];

    expect(listedTutors(tutors).map((tutor) => tutor.id)).toEqual(['t-andrei', 't-maxim']);
  });
});
