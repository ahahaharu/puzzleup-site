/**
 * Контур детали-шага (макет ds/PuzzleStep): прямоугольник со скруглёнными углами,
 * у которого правая грань может нести выступ (`knob`), а левая – паз (`socket`) под выступ
 * предыдущей детали. Выступ – 20 % длины грани, высота – 14,4 % высоты детали.
 */

export type StepLeft = 'flat' | 'socket';
export type StepRight = 'flat' | 'knob';

const RADIUS = 12;

const round = (value: number) => Math.round(value * 10) / 10;

/** Высота выступа за правой гранью – столько места нужно оставить справа. */
export function knobDepth(height: number): number {
  return round(height * 0.144);
}

// Вертикальная грань от (x, y0) до (x, y1) с выпуклостью вправо: у правой грани это выступ,
// у левой – паз, вдавленный внутрь детали.
function edgeWithTab(x: number, y0: number, y1: number, height: number) {
  const dy = y1 - y0;
  const point = (t: number, depth: number) => `${round(x + height * depth)},${round(y0 + dy * t)}`;
  return (
    ` L${point(0.4, 0)}` +
    ` C${point(0.378, 0.067)} ${point(0.411, 0.144)} ${point(0.5, 0.144)}` +
    ` C${point(0.589, 0.144)} ${point(0.622, 0.067)} ${point(0.6, 0)}` +
    ` L${x},${y1}`
  );
}

export function puzzleStepPath(
  width: number,
  height: number,
  left: StepLeft,
  right: StepRight,
): string {
  const r = RADIUS;
  const rl = left === 'flat' ? r : 0;
  const rr = right === 'flat' ? r : 0;

  let d = `M${rl},0 L${width - rr},0`;
  if (rr) d += ` A${r},${r} 0 0 1 ${width},${r}`;
  d += right === 'knob' ? edgeWithTab(width, 0, height, height) : ` L${width},${height - rr}`;
  if (rr) d += ` A${r},${r} 0 0 1 ${width - r},${height}`;
  d += ` L${rl},${height}`;
  if (rl) d += ` A${r},${r} 0 0 1 0,${height - r}`;
  d += left === 'socket' ? edgeWithTab(0, height, 0, height) : ` L0,${rl}`;
  if (rl) d += ` A${r},${r} 0 0 1 ${r},0`;
  return `${d} Z`;
}
