import { describe, expect, it } from 'vitest';

import { FIXTURE_ANNA, FIXTURE_IGOR, FIXTURE_SUBJECTS } from '@/features/tutor-page/fixtures';

import {
  faqPageJsonLd,
  personJsonLd,
  plainAnswer,
  tutorBreadcrumbJsonLd,
  tutorJobTitle,
} from './json-ld';
import { serializeJsonLd } from './JsonLd';

const SITE_URL = 'https://example.by';

describe('personJsonLd', () => {
  it('describes the tutor without an organization and without a photo', () => {
    expect(personJsonLd(FIXTURE_ANNA, FIXTURE_SUBJECTS, SITE_URL)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      givenName: 'Анна',
      jobTitle: 'Репетитор по математике',
      url: 'https://example.by/tutors/anna',
    });
  });

  it('adds the photo as an absolute url', () => {
    const tutor = { ...FIXTURE_ANNA, photo: 'anna.jpg' };
    expect(personJsonLd(tutor, FIXTURE_SUBJECTS, SITE_URL).image).toBe(
      'https://example.by/tutors/anna.jpg',
    );
  });
});

describe('tutorJobTitle', () => {
  it('lists active subjects only', () => {
    expect(tutorJobTitle(FIXTURE_IGOR, FIXTURE_SUBJECTS)).toBe(
      'Репетитор по математике и по физике',
    );
    const withHidden = {
      subjects: [...FIXTURE_IGOR.subjects, { id: 'chemistry', from: 7, to: 9 }],
    };
    expect(tutorJobTitle(withHidden, FIXTURE_SUBJECTS)).toBe('Репетитор по математике и по физике');
  });
});

describe('tutorBreadcrumbJsonLd', () => {
  it('repeats the visible breadcrumbs', () => {
    expect(tutorBreadcrumbJsonLd(FIXTURE_IGOR, SITE_URL).itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://example.by/' },
      { '@type': 'ListItem', position: 2, name: 'Репетиторы', item: 'https://example.by/#tutors' },
      { '@type': 'ListItem', position: 3, name: 'Игорь', item: 'https://example.by/tutors/igor' },
    ]);
  });
});

describe('faqPageJsonLd', () => {
  it('puts questions and plain-text answers', () => {
    const data = faqPageJsonLd([
      { id: 'a', question: 'Вопрос?', answer: 'Ответ **жирный**.\n\nСм. [политику](/privacy).' },
    ]);
    expect(data?.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Вопрос?',
        acceptedAnswer: { '@type': 'Answer', text: 'Ответ жирный.\n\nСм. политику.' },
      },
    ]);
  });

  it('is absent without questions', () => {
    expect(faqPageJsonLd([])).toBeUndefined();
  });
});

describe('plainAnswer', () => {
  it('keeps the text of an unsafe link', () => {
    expect(plainAnswer('[ссылка](javascript:void)')).toBe('ссылка');
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so content cannot close the script tag', () => {
    const json = serializeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      givenName: '</script><script>',
      jobTitle: 'Репетитор',
      url: 'https://example.by/tutors/x',
    });
    expect(json).not.toContain('<');
    expect(JSON.parse(json).givenName).toBe('</script><script>');
  });
});
