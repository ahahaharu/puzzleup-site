import { describe, expect, it } from 'vitest';

import { activeTab, collapsedCount, filterBySubject, filterTabs, tutorsLayout } from './filter';
import { shownAnnouncement } from './texts';

const SUBJECTS = [
  { id: 'math', name: 'математика' },
  { id: 'physics', name: 'физика' },
  { id: 'chemistry', name: 'химия' },
];

const tutor = (id: string, subjectIds: string[]) => ({ id, subjectIds });

describe('filterTabs', () => {
  it('shows a tab per subject that has tutors, with the count', () => {
    const tabs = filterTabs(SUBJECTS, [tutor('a', ['math']), tutor('b', ['math', 'physics'])]);
    expect(tabs).toEqual([
      { id: 'math', label: 'Математика', count: 2 },
      { id: 'physics', label: 'Физика', count: 1 },
    ]);
  });

  it('shows no tabs while tutors teach a single subject', () => {
    expect(filterTabs(SUBJECTS, [tutor('a', ['math']), tutor('b', ['math'])])).toEqual([]);
    expect(filterTabs(SUBJECTS, [])).toEqual([]);
  });
});

describe('activeTab', () => {
  const tabs = filterTabs(SUBJECTS, [tutor('a', ['math']), tutor('b', ['physics'])]);

  it('selects a known subject', () => {
    expect(activeTab('physics', tabs)).toBe('physics');
  });

  it.each([null, '', 'chemistry', 'unknown'])('falls back to all for %j', (param) => {
    expect(activeTab(param, tabs)).toBeNull();
  });
});

describe('filterBySubject', () => {
  const tutors = [tutor('a', ['math']), tutor('b', ['physics']), tutor('c', ['math', 'physics'])];

  it('keeps everyone for all and the sort order for a subject', () => {
    expect(filterBySubject(tutors, null).map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(filterBySubject(tutors, 'physics').map((item) => item.id)).toEqual(['b', 'c']);
  });
});

describe('tutorsLayout', () => {
  it.each([
    [1, 'single'],
    [2, 'pair'],
    [3, 'grid'],
    [7, 'grid'],
  ] as const)('%i → %s', (count, layout) => {
    expect(tutorsLayout(count)).toBe(layout);
  });
});

describe('collapsedCount', () => {
  it('hides everything after the sixth card on the all tab', () => {
    expect(collapsedCount(9, null, false)).toBe(3);
  });

  it('collapses nothing up to six cards, on a subject tab or once expanded', () => {
    expect(collapsedCount(6, null, false)).toBe(0);
    expect(collapsedCount(9, 'math', false)).toBe(0);
    expect(collapsedCount(9, null, true)).toBe(0);
  });
});

describe('shownAnnouncement', () => {
  it.each([
    [1, 'Показан 1 репетитор'],
    [2, 'Показаны 2 репетитора'],
    [5, 'Показано 5 репетиторов'],
    [21, 'Показан 21 репетитор'],
  ])('%i → %s', (count, text) => {
    expect(shownAnnouncement(count)).toBe(text);
  });
});
