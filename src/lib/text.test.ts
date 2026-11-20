import { describe, expect, it } from 'vitest';

import { aboutName, capitalize, joinWithAnd } from './text';

describe('capitalize', () => {
  it('uppercases only the first letter', () => {
    expect(capitalize('математика')).toBe('Математика');
    expect(capitalize('')).toBe('');
  });
});

describe('aboutName', () => {
  it.each([
    ['Андрее', 'об Андрее'],
    ['Ольге', 'об Ольге'],
    ['Игоре', 'об Игоре'],
    ['Максиме', 'о Максиме'],
    ['Яне', 'о Яне'],
    ['Евгении', 'о Евгении'],
  ])('%s → %s', (name, phrase) => {
    expect(aboutName(name)).toBe(phrase);
  });
});

describe('joinWithAnd', () => {
  it('joins the last item with «и»', () => {
    expect(joinWithAnd([])).toBe('');
    expect(joinWithAnd(['Miro'])).toBe('Miro');
    expect(joinWithAnd(['Google Meet', 'Miro'])).toBe('Google Meet и Miro');
    expect(joinWithAnd(['Zoom', 'Google Meet', 'Miro'])).toBe('Zoom, Google Meet и Miro');
  });
});
