import type { Review, Site, Subject, Tutor } from '@/content';

// Выдуманные репетиторы, предметы и отзывы для тестов и витрины /dev/tutor-page: все статусы,
// несколько предметов и отзывов, которых в настоящем контенте пока нет (docs/conventions.md, «Тесты»).

export const FIXTURE_SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: 'математика',
    nameAccusative: 'математику',
    nameDativeWithPrep: 'по математике',
    gradeFrom: 5,
    gradeTo: 11,
    topics: ['Дроби', 'Уравнения', 'Функции', 'Геометрия'],
    formula: 'a² + b² = c²',
    paper: 'cell',
    status: 'active',
  },
  {
    id: 'physics',
    name: 'физика',
    nameAccusative: 'физику',
    nameDativeWithPrep: 'по физике',
    gradeFrom: 7,
    gradeTo: 11,
    topics: ['Механика', 'Оптика', 'Электричество', 'Тепло'],
    formula: 'F = ma',
    paper: 'mm',
    status: 'active',
  },
  {
    id: 'chemistry',
    name: 'химия',
    nameAccusative: 'химию',
    nameDativeWithPrep: 'по химии',
    gradeFrom: 7,
    gradeTo: 11,
    topics: ['Атомы', 'Реакции', 'Растворы', 'Органика'],
    formula: 'H₂O',
    paper: 'cell',
    status: 'hidden',
  },
];

export function fixtureTutor(slug: string, overrides: Partial<Tutor> = {}): Tutor {
  return {
    id: `t-${slug}`,
    slug,
    name: 'Анна',
    nameGenitive: 'Анны',
    nameDative: 'Анне',
    namePrepositional: 'Анне',
    pronoun: 'она',
    fullName: 'Примерова Анна Ивановна',
    unp: '000000000',
    subjects: [{ id: 'math', from: 5, to: 9 }],
    education: 'Выдуманный университет',
    teachingSince: 2020,
    tagline: 'Нахожу, где тема перестала быть понятной',
    goals: ['grades', 'exam9'],
    hobby: 'Собираю пазлы.',
    personalNote: 'В школе не любила дроби.',
    availability: 'available',
    archived: false,
    order: 10,
    price: 40,
    telegram: 'anna_example',
    viber: '+375 29 000-00-01',
    content: 'Первый абзац.\n\nВторой абзац.',
    file: `content/tutors/${slug}.mdx`,
    ...overrides,
  };
}

export const FIXTURE_ANNA = fixtureTutor('anna');

export const FIXTURE_IGOR = fixtureTutor('igor', {
  name: 'Игорь',
  nameGenitive: 'Игоря',
  nameDative: 'Игорю',
  namePrepositional: 'Игоре',
  pronoun: 'он',
  subjects: [
    { id: 'math', from: 5, to: 11 },
    { id: 'physics', from: 7, to: 11 },
  ],
  goals: ['grades', 'exam9', 'ct'],
  order: 20,
  telegram: 'igor_example',
  viber: '+375 29 000-00-02',
});

export const FIXTURE_VERA = fixtureTutor('vera', {
  name: 'Вера',
  nameGenitive: 'Веры',
  nameDative: 'Вере',
  namePrepositional: 'Вере',
  subjects: [{ id: 'physics', from: 7, to: 9 }],
  order: 30,
  telegram: 'vera_example',
  viber: '+375 29 000-00-03',
});

export const FIXTURE_SITE: Pick<Site, 'responseHours' | 'defaultPlatforms'> & {
  prices: { trial: Pick<Site['prices']['trial'], 'price'> };
} = {
  responseHours: { from: '09:00', to: '22:00', tz: 'Europe/Minsk' },
  defaultPlatforms: ['Google Meet', 'Miro'],
  prices: { trial: { price: 0 } },
};

export function fixtureReview(id: string, overrides: Partial<Review> = {}): Review {
  return {
    id,
    tutorId: 't-anna',
    author: 'Ольга',
    relation: 'мама ученика 7 класса',
    subject: 'math',
    text: 'Выдуманный отзыв о занятиях.',
    date: '2026-10-01',
    featured: false,
    consent: true,
    source: 'пример',
    ...overrides,
  };
}
