import { describe, expect, it } from 'vitest';

import { dueReveals, isBelowFold, MAX_STAGGER_STEPS, reveal, STAGGER_MS } from './reveal';

const VIEWPORT = 800;
const box = (top: number, left = 0, height = 200) => ({ top, bottom: top + height, left });

describe('reveal', () => {
  it('marks a block with its kind, up by default', () => {
    expect(reveal()).toEqual({ 'data-reveal': 'up' });
    expect(reveal('paper')).toEqual({ 'data-reveal': 'paper' });
  });
});

describe('isBelowFold', () => {
  it('hides only what starts below the window', () => {
    expect(isBelowFold(box(VIEWPORT), VIEWPORT)).toBe(true);
    // Край блока уже виден – прятать нельзя, иначе он мигнёт.
    expect(isBelowFold(box(VIEWPORT - 1), VIEWPORT)).toBe(false);
    expect(isBelowFold(box(-300), VIEWPORT)).toBe(false);
  });
});

describe('dueReveals', () => {
  it('waits until the top of a block rises above the reveal line', () => {
    expect(dueReveals([{ item: 'a', box: box(720) }], VIEWPORT)).toEqual([]);
    expect(dueReveals([{ item: 'a', box: box(700) }], VIEWPORT)).toEqual([{ item: 'a', delay: 0 }]);
  });

  it('reveals a short block at the very end of the page once it is fully visible', () => {
    expect(dueReveals([{ item: 'a', box: box(740, 0, 40) }], VIEWPORT)).toEqual([
      { item: 'a', delay: 0 },
    ]);
  });

  it('staggers a row left to right, including cards scrolled out sideways', () => {
    const row = [
      { item: 'third', box: box(600, 900) },
      { item: 'first', box: box(600, 16) },
      { item: 'second', box: box(600, 330) },
    ];
    expect(dueReveals(row, VIEWPORT)).toEqual([
      { item: 'first', delay: 0 },
      { item: 'second', delay: STAGGER_MS },
      { item: 'third', delay: 2 * STAGGER_MS },
    ]);
  });

  it('caps the delay of a long batch', () => {
    const batch = Array.from({ length: 8 }, (_, index) => ({ item: index, box: box(index * 10) }));
    const delays = dueReveals(batch, VIEWPORT).map(({ delay }) => delay);
    expect(Math.max(...delays)).toBe(MAX_STAGGER_STEPS * STAGGER_MS);
  });

  it('shows blocks jumped past at once, without taking a stagger step', () => {
    const due = dueReveals(
      [
        { item: 'visible', box: box(100) },
        { item: 'passed', box: box(-1200) },
      ],
      VIEWPORT,
    );
    expect(due).toEqual([
      { item: 'passed', delay: 0 },
      { item: 'visible', delay: 0 },
    ]);
  });
});
