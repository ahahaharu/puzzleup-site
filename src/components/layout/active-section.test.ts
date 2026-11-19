import { describe, expect, it } from 'vitest';

import { currentSection } from './active-section';

const sections = (...tops: number[]) =>
  ['top', 'tutors', 'situations', 'how'].map((id, index) => ({ id, top: tops[index] ?? 0 }));

describe('currentSection', () => {
  it('picks the last section whose top reached the probe line', () => {
    expect(currentSection(sections(-900, -100, 72, 600), 73)).toBe('situations');
  });

  it('counts a section that starts exactly at the probe line', () => {
    expect(currentSection(sections(-900, 73, 700, 1400), 73)).toBe('tutors');
  });

  it('returns nothing above the first section', () => {
    expect(currentSection(sections(100, 900, 1600, 2300), 73)).toBeUndefined();
  });

  it('returns nothing without sections', () => {
    expect(currentSection([], 73)).toBeUndefined();
  });
});
