// Сцепка карточек «Узнаёте ситуацию?» – макеты D-2-situations, M-2-situations: карточки стоят
// вплотную, у каждой выступ на правой грани (в соседа по строке) и на нижней (в карточку под ней).
// Последняя ячейка – тёмная карточка-призыв: она занимает остаток строки, поэтому сетка всегда
// прямоугольная, без пустых пазов.

export type Knobs = { right: boolean; bottom: boolean };

/**
 * Выступы карточки `index` из `count` ситуаций в сетке на `columns` колонок. Тёмная карточка стоит
 * последней (позиция `count`) и выступов не имеет.
 */
export function knobs(index: number, count: number, columns: number): Knobs {
  if (index >= count) return { right: false, bottom: false };
  const rows = Math.ceil((count + 1) / columns);
  const row = Math.floor(index / columns);
  const lastInRow = index % columns === columns - 1;
  return { right: !lastInRow, bottom: row < rows - 1 };
}

/** Сколько колонок занимает тёмная карточка: остаток своей строки. */
export function ctaSpan(count: number, columns: number): number {
  return columns - (count % columns);
}
