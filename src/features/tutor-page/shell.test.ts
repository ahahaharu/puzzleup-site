import { describe, expect, it } from 'vitest';

import { FIXTURE_ANNA } from './fixtures';
import { tutorShell } from './shell';

describe('tutorShell', () => {
  it('books this tutor from the header and the bottom bar with their own entry points', () => {
    expect(tutorShell(FIXTURE_ANNA)).toEqual({
      cta: { label: 'Записаться к Анне', short: 'Записаться', href: '?entry=header#lead' },
      bottomBar: {
        cta: { label: 'Записаться к Анне', short: 'Записаться', href: '?entry=bottom_bar#lead' },
        telegram: { value: 'anna_example', nameDative: 'Анне' },
        showAfter: 'top',
        hideWhenVisible: 'lead',
      },
    });
  });

  it('offers the waitlist when the tutor is full', () => {
    const shell = tutorShell({ ...FIXTURE_ANNA, availability: 'full' });
    expect(shell.cta).toEqual({
      label: 'Встать в лист ожидания',
      short: 'Лист ожидания',
      href: '?entry=header#lead',
    });
  });

  it('keeps the default «Выбрать репетитора» for an archived tutor', () => {
    expect(tutorShell({ ...FIXTURE_ANNA, archived: true })).toEqual({
      bottomBar: { showAfter: 'top', hideWhenVisible: 'more' },
    });
  });
});
