import { describe, expect, it } from 'vitest';

import { aboutTutors } from './cards';

const SUBJECTS = [{ id: 'math', status: 'active' }] as const;

const tutor = (slug: string, name: string, nameDative: string) => ({
  slug,
  name,
  nameDative,
  subjects: [{ id: 'math', from: 5, to: 9 }],
  price: 40,
  telegram: `${slug}_tutor`,
  viber: '+375 29 000-00-00',
});

describe('aboutTutors', () => {
  it('builds a card per tutor with a sign-up link from the block', () => {
    const [card] = aboutTutors([tutor('andrei', 'Андрей', 'Андрею')], SUBJECTS);
    expect(card).toEqual({
      slug: 'andrei',
      name: 'Андрей',
      nameDative: 'Андрею',
      photo: undefined,
      meta: '5–⁠9 класс · 40 BYN',
      href: '/tutors/andrei',
      leadHref: '/tutors/andrei?entry=about#lead',
      telegram: 'andrei_tutor',
      viber: '+375 29 000-00-00',
    });
  });

  it('shows no cards from three tutors on', () => {
    const tutors = [
      tutor('andrei', 'Андрей', 'Андрею'),
      tutor('maxim', 'Максим', 'Максиму'),
      tutor('anna', 'Анна', 'Анне'),
    ];
    expect(aboutTutors(tutors.slice(0, 2), SUBJECTS)).toHaveLength(2);
    expect(aboutTutors(tutors, SUBJECTS)).toEqual([]);
  });
});
