import { describe, expect, it } from 'vitest';

import { knobDepth, puzzleStepPath, type StepLeft, type StepRight } from './puzzle-step-path';

// Эталон – алгоритм компонента PuzzleStep с холста (docs/design/ds/PuzzleStep.html), без изменений.
function canvasPath(w: number, h: number, left: StepLeft, right: StepRight) {
  const r = 12;
  const f = (n: number) => Math.round(n * 10) / 10;
  const edge = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    nx: number,
    ny: number,
    kind: number,
  ) => {
    const dx = bx - ax,
      dy = by - ay,
      k = kind * h;
    const P = (t: number, q: number) =>
      f(ax + dx * t + nx * k * q) + ',' + f(ay + dy * t + ny * k * q);
    return (
      ' L' +
      P(0.4, 0) +
      ' C' +
      P(0.378, 0.067) +
      ' ' +
      P(0.411, 0.144) +
      ' ' +
      P(0.5, 0.144) +
      ' C' +
      P(0.589, 0.144) +
      ' ' +
      P(0.622, 0.067) +
      ' ' +
      P(0.6, 0) +
      ' L' +
      bx +
      ',' +
      by
    );
  };
  const rl = left === 'flat' ? r : 0,
    rr = right === 'flat' ? r : 0;
  let d = 'M' + rl + ',0 L' + (w - rr) + ',0';
  if (rr) d += ' A' + r + ',' + r + ' 0 0 1 ' + w + ',' + r;
  if (right === 'knob') d += edge(w, 0, w, h, 1, 0, 1);
  else d += ' L' + w + ',' + (h - rr);
  if (rr) d += ' A' + r + ',' + r + ' 0 0 1 ' + (w - r) + ',' + h;
  d += ' L' + rl + ',' + h;
  if (rl) d += ' A' + r + ',' + r + ' 0 0 1 0,' + (h - r);
  if (left === 'socket') d += edge(0, h, 0, 0, -1, 0, -1);
  else d += ' L0,' + rl;
  if (rl) d += ' A' + r + ',' + r + ' 0 0 1 ' + r + ',0';
  return d + ' Z';
}

describe('puzzleStepPath', () => {
  const combos: Array<[StepLeft, StepRight]> = [
    ['flat', 'flat'],
    ['flat', 'knob'],
    ['socket', 'knob'],
    ['socket', 'flat'],
  ];

  it.each(combos)('matches the canvas outline for left=%s, right=%s', (left, right) => {
    expect(puzzleStepPath(280, 250, left, right)).toBe(canvasPath(280, 250, left, right));
    expect(puzzleStepPath(333, 187, left, right)).toBe(canvasPath(333, 187, left, right));
  });

  it('draws a plain rounded rectangle when both edges are flat', () => {
    expect(puzzleStepPath(100, 50, 'flat', 'flat')).toBe(
      'M12,0 L88,0 A12,12 0 0 1 100,12 L100,38 A12,12 0 0 1 88,50 L12,50 A12,12 0 0 1 0,38 L0,12 A12,12 0 0 1 12,0 Z',
    );
  });
});

describe('knobDepth', () => {
  it('is 14.4 % of the step height', () => {
    expect(knobDepth(250)).toBe(36);
  });
});
