import { describe, expect, it } from 'vitest';

import { leadAnchor, telegramUrl, tutorLeadUrl, tutorUrl, viberUrl } from './urls';

describe('telegramUrl', () => {
  it.each([
    ['example_tutor', 'https://t.me/example_tutor'],
    ['@example_tutor', 'https://t.me/example_tutor'],
    ['  example_tutor  ', 'https://t.me/example_tutor'],
    ['https://t.me/example_tutor', 'https://t.me/example_tutor'],
    ['http://t.me/example_tutor/', 'https://t.me/example_tutor'],
    ['t.me/example_tutor?start=1', 'https://t.me/example_tutor'],
    ['https://telegram.me/example_tutor', 'https://t.me/example_tutor'],
  ])('%s → %s', (value, url) => {
    expect(telegramUrl(value)).toBe(url);
  });
});

describe('viberUrl', () => {
  it.each([
    ['+375 29 000-00-00', 'viber://chat?number=%2B375290000000'],
    ['375290000000', 'viber://chat?number=%2B375290000000'],
    ['+375 (29) 000-00-00', 'viber://chat?number=%2B375290000000'],
  ])('%s → %s', (phone, url) => {
    expect(viberUrl(phone)).toBe(url);
  });
});

describe('tutorUrl', () => {
  it('builds the tutor page path with an optional block anchor', () => {
    expect(tutorUrl('andrei')).toBe('/tutors/andrei');
    expect(tutorUrl('andrei', 'reviews')).toBe('/tutors/andrei#reviews');
  });
});

describe('tutorLeadUrl', () => {
  it('passes the entry point to the form', () => {
    expect(tutorLeadUrl('andrei', { entry: 'tutors' })).toBe('/tutors/andrei?entry=tutors#lead');
  });

  it('adds subject and goal when given', () => {
    expect(tutorLeadUrl('maxim', { entry: 'subjects', subject: 'math', goal: 'ct' })).toBe(
      '/tutors/maxim?entry=subjects&subject=math&goal=ct#lead',
    );
  });

  it('adds the grade when given', () => {
    expect(tutorLeadUrl('maxim', { entry: 'tutor_more', grade: 10 })).toBe(
      '/tutors/maxim?entry=tutor_more&grade=10#lead',
    );
  });
});

describe('leadAnchor', () => {
  it('links to the form of the same page with the entry point', () => {
    expect(leadAnchor('tutor_profile')).toBe('?entry=tutor_profile#lead');
  });
});
