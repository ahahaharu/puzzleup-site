// Выдуманные данные для компонентных тестов каркаса.

import { navLinks } from './nav';

export const LINKS = navLinks({ hasSubjects: true, hasReviews: true }, { onHome: true });

export const CTA = { label: 'Выбрать репетитора', short: 'Выбрать', href: '#tutors' };

export const TUTORS = [
  {
    slug: 'andrei',
    name: 'Андрей',
    nameDative: 'Андрею',
    telegram: 'example_andrei',
    viber: '+375 29 000-00-01',
  },
  {
    slug: 'maxim',
    name: 'Максим',
    nameDative: 'Максиму',
    telegram: 'example_maxim',
    viber: '+375 29 000-00-02',
  },
];

export const HOURS_LINE = 'Каждый репетитор отвечает сам, обычно с 9:00 до 22:00';
