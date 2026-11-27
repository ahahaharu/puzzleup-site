import { describe, expect, it } from 'vitest';

import {
  FIXTURE_ANNA,
  FIXTURE_IGOR,
  FIXTURE_SITE,
  FIXTURE_SUBJECTS,
  FIXTURE_VERA,
  fixtureReview,
  fixtureTutor,
} from './fixtures';
import {
  aboutData,
  gradeHint,
  howToStartData,
  leadData,
  otherTutors,
  profileData,
  sharedSubjects,
  tutorMetadata,
  tutorPageData,
  tutorReviews,
} from './page-data';

const SUBJECTS = FIXTURE_SUBJECTS;
const TUTORS = [FIXTURE_ANNA, FIXTURE_IGOR, FIXTURE_VERA];

function profile(tutor = FIXTURE_ANNA, others = otherTutors(tutor, TUTORS, SUBJECTS)) {
  return profileData(tutor, { subjects: SUBJECTS, others, reviewCount: 2, year: 2026 });
}

describe('otherTutors', () => {
  it('keeps tutors who share an active subject, without the current one', () => {
    expect(otherTutors(FIXTURE_ANNA, TUTORS, SUBJECTS).map((tutor) => tutor.slug)).toEqual([
      'igor',
    ]);
    expect(otherTutors(FIXTURE_IGOR, TUTORS, SUBJECTS).map((tutor) => tutor.slug)).toEqual([
      'anna',
      'vera',
    ]);
  });

  it('skips archived tutors and shared hidden subjects', () => {
    const archived = fixtureTutor('olga', { archived: true });
    const chemist = fixtureTutor('petr', { subjects: [{ id: 'chemistry', from: 7, to: 9 }] });
    const current = fixtureTutor('ilya', {
      subjects: [
        { id: 'math', from: 5, to: 9 },
        { id: 'chemistry', from: 7, to: 9 },
      ],
    });
    expect(otherTutors(current, [current, archived, chemist], SUBJECTS)).toEqual([]);
  });

  it('sorts by availability, then by order, and keeps at most three', () => {
    const tutors = [
      fixtureTutor('a', { availability: 'full', order: 1 }),
      fixtureTutor('b', { availability: 'few', order: 2 }),
      fixtureTutor('c', { availability: 'available', order: 4 }),
      fixtureTutor('d', { availability: 'available', order: 3 }),
    ];
    expect(otherTutors(FIXTURE_IGOR, tutors, SUBJECTS).map((tutor) => tutor.slug)).toEqual([
      'd',
      'c',
      'b',
    ]);
  });
});

describe('sharedSubjects', () => {
  it('lists the subjects the current tutor shares with the others', () => {
    expect(sharedSubjects(FIXTURE_IGOR, [FIXTURE_ANNA], SUBJECTS)).toBe('по математике');
    expect(sharedSubjects(FIXTURE_IGOR, [FIXTURE_ANNA, FIXTURE_VERA], SUBJECTS)).toBe(
      'по математике и по физике',
    );
  });
});

describe('profileData', () => {
  it('builds the heading, facts and the provider line', () => {
    const data = profile(FIXTURE_IGOR);
    expect(data.subtitle).toBe('репетитор по математике и по физике');
    expect(data.subjectLines).toEqual(['Математика · 5–⁠11 класс', 'Физика · 7–⁠11 класс']);
    expect(data.experience).toBe('6\u00a0лет');
    expect(data.formula).toBe('a² + b² = c²');
    expect(data.provider).toBe(
      'Услуги оказывает Примерова Анна Ивановна, плательщик налога на профессиональный доход, УНП 000000000. Оплата занятий – напрямую репетитору.',
    );
    expect(data.cta).toEqual({
      label: 'Записаться к Игорю',
      href: '?entry=tutor_profile#lead',
    });
    expect(data.alternative).toBeUndefined();
    expect(data.archivedNotice).toBeUndefined();
  });

  it('shows only active subjects; without them the subtitle is just «репетитор»', () => {
    const data = profile(fixtureTutor('x', { subjects: [{ id: 'chemistry', from: 7, to: 9 }] }));
    expect(data.subtitle).toBe('репетитор');
    expect(data.subjectLines).toEqual([]);
    expect(data.formula).toBeUndefined();
  });

  it('turns the button into the waitlist and offers another tutor when full', () => {
    const data = profile(fixtureTutor('anna', { availability: 'full' }));
    expect(data.status).toBe('full');
    expect(data.cta).toEqual({
      label: 'Встать в лист ожидания',
      href: '?entry=tutor_full#lead',
    });
    expect(data.alternative).toEqual({ label: 'Ещё на сайте: Игорь', href: '/tutors/igor' });
  });

  it('has no alternative button when nobody else teaches the subject', () => {
    expect(profile(fixtureTutor('anna', { availability: 'full' }), []).alternative).toBeUndefined();
  });

  it('points an archived page to the other tutor and drops the provider line', () => {
    const data = profile(fixtureTutor('anna', { archived: true }));
    expect(data.status).toBe('archived');
    expect(data.cta).toEqual({ label: 'Выбрать репетитора', href: '/#tutors' });
    expect(data.provider).toBeUndefined();
    expect(data.archivedNotice).toEqual({
      text: 'Анна больше не принимает новых учеников. По математике на сайте есть Игорь – ',
      link: { label: 'посмотрите его страницу', href: '/tutors/igor' },
    });
  });

  it('keeps only the first sentence of the archived notice without another tutor', () => {
    expect(profile(fixtureTutor('anna', { archived: true }), []).archivedNotice).toEqual({
      text: 'Анна больше не принимает новых учеников.',
    });
  });
});

describe('aboutData', () => {
  it('labels the goals and lists the default platforms', () => {
    expect(aboutData(FIXTURE_IGOR, FIXTURE_SITE)).toEqual({
      goals: ['Подтянуть оценки', 'Экзамен после 9\u00a0класса', 'ЦТ и ЦЭ'],
      platforms: 'Занятия – Google Meet и Miro',
    });
  });

  it('uses the tutor’s own platforms', () => {
    expect(aboutData({ ...FIXTURE_ANNA, platforms: ['Zoom'] }, FIXTURE_SITE).platforms).toBe(
      'Занятия – Zoom',
    );
  });
});

describe('tutorReviews', () => {
  it('keeps the tutor’s reviews, newest first', () => {
    const reviews = [
      fixtureReview('old', { date: '2026-09-01' }),
      fixtureReview('other', { tutorId: 't-igor' }),
      fixtureReview('new', { date: '2026-10-15' }),
    ];
    expect(tutorReviews(FIXTURE_ANNA, reviews, SUBJECTS).map((review) => review.id)).toEqual([
      'new',
      'old',
    ]);
  });
});

describe('howToStartData', () => {
  it('fills the steps from the tutor and site data', () => {
    const data = howToStartData(FIXTURE_IGOR, FIXTURE_SITE);
    expect(data.steps.map((step) => step.text)).toEqual([
      'Оставьте заявку или напишите Игорю в мессенджер – он ответит с 9:00 до 22:00.',
      '30 минут онлайн, бесплатно. Игорь познакомится с ребёнком и найдёт пробелы. Итог пришлёт сообщением.',
      '40 BYN за 60 минут, в Google Meet и Miro. Оплата – переводом напрямую репетитору.',
    ]);
    expect(data.terms).toBeUndefined();
  });

  it('uses the pronoun and the tutor’s own terms', () => {
    const data = howToStartData({ ...FIXTURE_ANNA, terms: 'свои условия' }, FIXTURE_SITE);
    expect(data.steps[0]?.text).toContain('– она ответит');
    expect(data.terms).toBe('Условия Анны: свои условия.');
    expect(howToStartData({ ...FIXTURE_ANNA, terms: 'с точкой.' }, FIXTURE_SITE).terms).toBe(
      'Условия Анны: с точкой.',
    );
  });
});

describe('leadData', () => {
  it('adds the waitlist notice only when the tutor is full', () => {
    expect(leadData(FIXTURE_ANNA, FIXTURE_SITE).waitlist).toBeUndefined();
    expect(leadData(FIXTURE_ANNA, FIXTURE_SITE).price).toBe('30 мин · 0 BYN');
    expect(leadData({ ...FIXTURE_ANNA, availability: 'full' }, FIXTURE_SITE).waitlist).toBe(
      'Сейчас у Анны нет свободного времени. Оставьте заявку в лист ожидания – Анна напишет, как только место освободится.',
    );
  });
});

describe('gradeHint', () => {
  it('stays silent for a grade the tutor teaches', () => {
    expect(gradeHint(FIXTURE_ANNA, 7, TUTORS, SUBJECTS)).toBeNull();
  });

  it('points to another tutor’s form with the same grade', () => {
    expect(gradeHint(FIXTURE_ANNA, 10, TUTORS, SUBJECTS)).toEqual({
      text: 'Анна занимается с 5–⁠9 классами. С 10–⁠11 классом работает Игорь – ',
      link: { label: 'его страница', href: '/tutors/igor?entry=tutor_more&grade=10#lead' },
    });
  });

  it('counts the other tutor’s grades below the tutor’s range', () => {
    const senior = fixtureTutor('senior', { subjects: [{ id: 'math', from: 8, to: 11 }] });
    expect(gradeHint(senior, 6, TUTORS, SUBJECTS)?.text).toBe(
      'Анна занимается с 8–⁠11 классами. С 5–⁠7 классом работает Анна – ',
    );
  });

  it('suggests the trial lesson when nobody teaches the grade', () => {
    expect(gradeHint(FIXTURE_ANNA, 10, [FIXTURE_ANNA, FIXTURE_VERA], SUBJECTS)).toEqual({
      text: 'Анна занимается с 5–⁠9 классами. 10 класс можно обсудить на пробном занятии.',
    });
  });

  it('compares the grades of the chosen subject only', () => {
    const mixed = fixtureTutor('mixed', {
      subjects: [
        { id: 'math', from: 5, to: 9 },
        { id: 'physics', from: 10, to: 11 },
      ],
    });
    const senior = fixtureTutor('senior', { subjects: [{ id: 'math', from: 10, to: 11 }] });
    expect(gradeHint(mixed, 10, [mixed, senior], SUBJECTS)).toBeNull();
    expect(gradeHint(mixed, 10, [mixed, senior], SUBJECTS, 'math')?.link?.href).toBe(
      '/tutors/senior?entry=tutor_more&subject=math&grade=10#lead',
    );
  });

  it('uses the singular for a single grade', () => {
    const ninth = fixtureTutor('ninth', { subjects: [{ id: 'math', from: 9, to: 9 }] });
    expect(gradeHint(ninth, 5, [ninth], SUBJECTS)?.text).toBe(
      'Анна занимается с 9 классом. 5 класс можно обсудить на пробном занятии.',
    );
  });
});

describe('tutorPageData', () => {
  const context = {
    site: FIXTURE_SITE,
    subjects: SUBJECTS,
    tutors: TUTORS,
    reviews: [fixtureReview('one'), fixtureReview('other', { tutorId: 't-igor' })],
    year: 2026,
  };

  it('keeps the regular order and fills every block', () => {
    const data = tutorPageData(FIXTURE_ANNA, context);
    expect(data.moreFirst).toBe(false);
    expect(data.reviews.title).toBe('Отзывы об Анне\u00a0·\u00a01');
    expect(data.outside.paragraphs).toEqual(['Собираю пазлы.', 'В школе не любила дроби.']);
    expect(data.how).toBeDefined();
    expect(data.lead?.waitlist).toBeUndefined();
    expect(data.more).toMatchObject({
      title: 'Ещё на сайте по математике',
      lead: 'Другой независимый репетитор – со своей ценой и условиями.',
    });
    expect(data.more?.tutors.map((tutor) => [tutor.slug, tutor.reviewCount])).toEqual([
      ['igor', 1],
    ]);
  });

  it('raises the other tutors under the profile when full', () => {
    const data = tutorPageData({ ...FIXTURE_ANNA, availability: 'full' }, context);
    expect(data.moreFirst).toBe(true);
    expect(data.lead?.waitlist).toBeDefined();
  });

  it('drops the steps and the form of an archived tutor', () => {
    const data = tutorPageData({ ...FIXTURE_ANNA, archived: true }, context);
    expect(data.moreFirst).toBe(true);
    expect(data.how).toBeUndefined();
    expect(data.lead).toBeUndefined();
  });

  it('has no other tutors block without a shared subject and no outside block without notes', () => {
    const data = tutorPageData(
      { ...FIXTURE_VERA, hobby: undefined, personalNote: undefined },
      { ...context, tutors: [FIXTURE_ANNA, FIXTURE_VERA] },
    );
    expect(data.more).toBeUndefined();
    expect(data.outside.paragraphs).toEqual([]);
  });
});

describe('tutorMetadata', () => {
  it('builds the title and description from the template', () => {
    expect(tutorMetadata(FIXTURE_IGOR, SUBJECTS, 2026)).toEqual({
      title: 'Игорь – репетитор по математике и по физике онлайн, 5–11 класс | PuzzleUp',
      description:
        'Игорь – репетитор по математике и по физике для 5–11 классов. Стаж 6 лет. Онлайн, 40 BYN за 60 минут, пробное занятие бесплатно.',
      noindex: false,
    });
  });

  it('prefers the own description and hides an archived tutor', () => {
    const meta = tutorMetadata(
      { ...FIXTURE_ANNA, seoDescription: 'Своё описание.', archived: true },
      SUBJECTS,
      2026,
    );
    expect(meta.description).toBe('Своё описание.');
    expect(meta.noindex).toBe(true);
  });
});
