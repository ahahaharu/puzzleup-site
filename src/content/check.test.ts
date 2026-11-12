import { describe, expect, it } from 'vitest';

import { validateContent, type RawContent, type SourceFile } from './check';

// Только выдуманные данные (docs/conventions.md, «Тесты»).
const ABOUT = [
  'Первый абзац о том, как я строю занятия.',
  'Второй абзац о том, что делаю, если ребёнок боится.',
]
  .map((paragraph) => paragraph.padEnd(320, ' и ещё немного текста'))
  .join('\n\n');

function tutorData(slug: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: `t-${slug}`,
    slug,
    name: 'Мария',
    nameDative: 'Марии',
    namePrepositional: 'Марии',
    fullName: 'Иванова Мария Петровна',
    unp: '000000000',
    subjects: [{ id: 'math', from: 5, to: 11 }],
    education: 'Выдуманный университет',
    teachingSince: 2020,
    tagline: 'Объясняю на примерах',
    goals: ['grades', 'ct'],
    availability: 'available',
    archived: false,
    order: 10,
    price: 40,
    telegram: 'maria_example',
    viber: '+375 29 000-00-00',
    content: ABOUT,
    ...overrides,
  };
}

function tutor(slug: string, overrides: Record<string, unknown> = {}): SourceFile {
  return { file: `content/tutors/${slug}.mdx`, data: tutorData(slug, overrides) };
}

function raw(overrides: Partial<RawContent> = {}): RawContent {
  const file = (name: string, data: unknown): SourceFile => ({
    file: `content/${name}.json`,
    data,
  });
  const site = {
    name: 'PuzzleUp',
    slogan: 'Всё сложится.',
    disclosure: 'PuzzleUp – общий сайт независимых репетиторов.',
    about: 'Текст о сайте.',
    footer: {
      tagline: 'Общий сайт независимых репетиторов',
      requisites: 'Услуги оказывает: {tutorsRequisites}. Сайт ведёт {siteOperatorFullName}.',
      copyright: '© 2026 {tutorsFullNames}',
    },
    responseHours: { from: '09:00', to: '22:00', tz: 'Europe/Minsk' },
    defaultTerms: 'условия',
    defaultPlatforms: ['Google Meet'],
    prices: {
      trial: { title: 'Пробное занятие', price: 0, caption: '30 минут' },
      lesson: { title: 'Занятие', caption: '60 минут' },
      paymentNote: 'Оплата напрямую.',
      offerNote: 'Не оферта',
    },
    consent: {
      version: '2026-01-01',
      label: 'Согласен',
      policyLinkLabel: 'политика',
      details: 'Операторы – {operators}.',
    },
    siteOperatorTutorId: 't-maria',
  };
  const legal = (slug: string): SourceFile => ({
    file: `content/legal/${slug}.mdx`,
    data: { title: 'Политика', effectiveDate: '2026-01-01', content: 'Текст.' },
  });
  return {
    tutors: [tutor('maria')],
    legal: [legal('privacy'), legal('cookies')],
    subjects: file('subjects', [
      {
        id: 'math',
        name: 'математика',
        nameAccusative: 'математику',
        nameDativeWithPrep: 'по математике',
        gradeFrom: 5,
        gradeTo: 11,
        topics: ['дроби', 'уравнения', 'функции', 'геометрия'],
        formula: 'x² = 4',
        paper: 'cell',
        status: 'active',
      },
    ]),
    reviews: file('reviews', [
      {
        id: 'r-1',
        tutorId: 't-maria',
        author: 'Ольга',
        relation: 'мама ученика 7 класса',
        subject: 'math',
        text: 'Отзыв.',
        date: '2026-01-01',
        featured: true,
        consent: true,
        source: 'Telegram',
      },
    ]),
    situations: file('situations', [
      { id: 'ct', title: 'ЦТ', text: 'Повторение.', goal: 'ct', tutors: ['t-maria'] },
    ]),
    faq: file('faq', [{ id: 'grades', question: 'Классы?', answer: '{tutorsGrades}.' }]),
    site: file('site', site),
    ...overrides,
  };
}

const messages = (content: RawContent, strict = false) =>
  validateContent(content, { strict }).issues.map(
    (issue) => `${issue.file} › ${issue.path}: ${issue.message}`,
  );

describe('validateContent', () => {
  it('accepts valid content, in strict mode too', () => {
    const result = validateContent(raw(), { strict: true, photoExists: () => true });
    expect(result.issues).toEqual([]);
    expect(result.ok && result.content.tutors[0]?.slug).toBe('maria');
  });

  it('reports a missing required field with file and path', () => {
    const { name: _name, ...data } = tutorData('maria');
    expect(messages(raw({ tutors: [{ file: 'content/tutors/maria.mdx', data }] }))).toEqual([
      'content/tutors/maria.mdx › name: Invalid input: expected string, received undefined',
    ]);
  });

  it('rejects unknown fields instead of dropping them', () => {
    expect(messages(raw({ tutors: [tutor('maria', { fulName: 'опечатка' })] }))[0]).toContain(
      'fulName',
    );
  });

  it('rejects duplicated slugs and ids', () => {
    const copy = { file: 'content/tutors/maria-2.mdx', data: tutorData('maria') };
    expect(messages(raw({ tutors: [tutor('maria'), copy] }))).toEqual([
      'content/tutors/maria-2.mdx › slug: slug «maria» must match the file name',
      'content/tutors/maria-2.mdx › id: id «t-maria» is already used in content/tutors/maria.mdx',
    ]);
  });

  // id постоянный, а slug можно сменить (с редиректом) – после этого они расходятся.
  it('keeps id independent of slug', () => {
    const renamed = { ...raw(), tutors: [tutor('maria-m', { id: 't-maria' })] };
    expect(messages(renamed)).toEqual([]);
  });

  it('requires an existing site operator', () => {
    const site = raw().site;
    const data = { ...Object(site.data), siteOperatorTutorId: 't-anna' };
    expect(messages(raw({ site: { ...site, data } }))).toEqual([
      'content/site.json › siteOperatorTutorId: tutor «t-anna» does not exist',
    ]);
  });

  it('rejects response hours that end before they start', () => {
    const site = raw().site;
    const data = {
      ...Object(site.data),
      responseHours: { from: '22:00', to: '09:00', tz: 'Europe/Minsk' },
    };
    expect(messages(raw({ site: { ...site, data } }))).toEqual([
      'content/site.json › responseHours: `from` must be earlier than `to`',
    ]);
  });

  it('rejects a subject whose grades are reversed', () => {
    const subjects = raw().subjects;
    const [math] = Object(subjects.data);
    const data = [{ ...math, gradeFrom: 11, gradeTo: 5 }];
    expect(messages(raw({ subjects: { ...subjects, data } }))).toEqual([
      'content/subjects.json › 0: `gradeFrom` must not exceed `gradeTo`',
    ]);
  });

  it('asks to quote the UNP so that YAML keeps it a string', () => {
    expect(messages(raw({ tutors: [tutor('maria', { unp: 123456789 })] }))).toEqual([
      "content/tutors/maria.mdx › unp: UNP must be a quoted string of 9 digits: '123456789'",
    ]);
  });

  it('accepts a Telegram nick only without @', () => {
    expect(
      messages(raw({ tutors: [tutor('maria', { telegram: '@maria_example' })] }))[0],
    ).toContain('telegram');
    expect(
      messages(raw({ tutors: [tutor('maria', { telegram: 'https://t.me/maria_example' })] })),
    ).toEqual([]);
  });

  it('rejects placeholders in JSON files in strict mode', () => {
    const faq = [{ id: 'q', question: 'Вопрос?', answer: 'Ответ [черновик].' }];
    expect(messages(raw({ faq: { file: 'content/faq.json', data: faq } }), true)).toEqual([
      'content/faq.json › 0.answer: placeholder [черновик] must be replaced before release',
    ]);
  });

  it('rejects a subject that is not in subjects.json', () => {
    expect(
      messages(
        raw({ tutors: [tutor('maria', { subjects: [{ id: 'chemistry', from: 7, to: 9 }] })] }),
      ),
    ).toContain(
      'content/tutors/maria.mdx › subjects.0.id: subject «chemistry» is not in subjects.json',
    );
  });

  it('rejects grades outside the subject range', () => {
    expect(
      messages(raw({ tutors: [tutor('maria', { subjects: [{ id: 'math', from: 3, to: 9 }] })] })),
    ).toContain('content/tutors/maria.mdx › subjects.0: grades 3–9 are outside math 5–11');
  });

  it('allows `ct` only for a tutor with grades 10–11', () => {
    const issues = messages(
      raw({
        tutors: [tutor('maria', { subjects: [{ id: 'math', from: 5, to: 9 }] })],
        situations: { file: 'content/situations.json', data: [] },
      }),
    );
    expect(issues).toEqual([
      'content/tutors/maria.mdx › goals: `ct` is allowed only for a tutor with grades 10–11',
    ]);
  });

  it('checks that the photo file exists', () => {
    const content = raw({ tutors: [tutor('maria', { photo: 'maria.jpg' })] });
    expect(validateContent(content, { photoExists: () => false }).issues).toEqual([
      {
        file: 'content/tutors/maria.mdx',
        path: 'photo',
        message: 'public/tutors/maria.jpg does not exist',
      },
    ]);
    expect(validateContent(content, { photoExists: (name) => name === 'maria.jpg' }).ok).toBe(true);
  });

  it('rejects a review of an unknown tutor or of a subject the tutor does not teach', () => {
    const review = (tutorId: string, subject: string) => ({
      id: `r-${tutorId}-${subject}`,
      tutorId,
      author: 'Ольга',
      relation: 'мама',
      subject,
      text: 'Отзыв.',
      date: '2026-01-01',
      featured: false,
      consent: true,
      source: 'Telegram',
    });
    expect(
      messages(
        raw({
          reviews: {
            file: 'content/reviews.json',
            data: [review('t-anna', 'math'), review('t-maria', 'physics')],
          },
        }),
      ),
    ).toEqual([
      'content/reviews.json › 0.tutorId: tutor «t-anna» does not exist',
      'content/reviews.json › 1.subject: t-maria does not teach «physics»',
    ]);
  });

  it('rejects situations that name an unknown tutor or one without the goal', () => {
    const situations = [
      { id: 'a', title: 'А', text: 'Текст.', goal: 'grades', tutors: ['t-anna'] },
      { id: 'b', title: 'Б', text: 'Текст.', goal: 'olymp', tutors: ['t-maria'] },
    ];
    expect(
      messages(raw({ situations: { file: 'content/situations.json', data: situations } })),
    ).toEqual([
      'content/situations.json › 0.tutors.0: tutor «t-anna» does not exist',
      'content/situations.json › 1.tutors.0: t-maria has no goal «olymp»',
    ]);
  });

  it('rejects duplicated ids in JSON files', () => {
    const faq = [
      { id: 'same', question: 'Вопрос?', answer: 'Ответ.' },
      { id: 'same', question: 'Ещё?', answer: 'Ответ.' },
    ];
    expect(messages(raw({ faq: { file: 'content/faq.json', data: faq } }))).toEqual([
      'content/faq.json › 1.id: id «same» is duplicated',
    ]);
  });

  it('requires an existing, active site operator', () => {
    expect(messages(raw({ tutors: [tutor('maria', { archived: true })] }))).toEqual([
      'content/site.json › siteOperatorTutorId: tutor «t-maria» is archived',
    ]);
  });

  it('requires both policy files', () => {
    expect(messages(raw({ legal: [] }))).toEqual([
      'content/legal/privacy.mdx › : file is missing',
      'content/legal/cookies.mdx › : file is missing',
    ]);
  });

  it('allows only known template placeholders', () => {
    const faq = [{ id: 'q', question: 'Вопрос {tutorsGrades}?', answer: '{tutorsGrade}.' }];
    expect(messages(raw({ faq: { file: 'content/faq.json', data: faq } }))).toEqual([
      'content/faq.json › 0.question: unknown template placeholder {tutorsGrades}',
      'content/faq.json › 0.answer: unknown template placeholder {tutorsGrade}',
    ]);
  });

  it('applies wording and typography rules to every string, including MDX bodies', () => {
    const issues = messages(
      raw({ tutors: [tutor('maria', { tagline: 'Мы объясняем', content: `${ABOUT} - конец` })] }),
    );
    expect(issues).toEqual([
      'content/tutors/maria.mdx › tagline: the site never speaks as «мы»: «Мы»',
      'content/tutors/maria.mdx › content: hyphen used as a dash, use «–» (en dash): « - »',
    ]);
  });

  it('allows placeholders by default and rejects them in strict mode', () => {
    const stub = raw({
      tutors: [tutor('maria', { fullName: '[Фамилия Имя Отчество]', teachingSince: '[год]' })],
    });
    expect(validateContent(stub).ok).toBe(true);
    expect(messages(stub, true)).toEqual([
      'content/tutors/maria.mdx › fullName: placeholder [Фамилия Имя Отчество] must be replaced before release',
      'content/tutors/maria.mdx › teachingSince: placeholder [год] must be replaced before release',
    ]);
  });

  it('checks the length and paragraphs of «О себе» in strict mode only', () => {
    const short = raw({ tutors: [tutor('maria', { content: 'Один короткий абзац.' })] });
    expect(validateContent(short).ok).toBe(true);
    expect(messages(short, true)).toEqual([
      'content/tutors/maria.mdx › content: «О себе» must be 600–1200 characters, got 20',
      'content/tutors/maria.mdx › content: «О себе» must have 2–4 paragraphs, got 1',
    ]);
  });
});
