import type { ImageSize } from '@/lib/image-size';

// Кладка скриншотов на странице репетитора (ADR-071): колонки одной ширины, поэтому текст на всех
// снимках одного размера. Высоты известны заранее из размеров файлов, поэтому раскладка одна и та же
// на сервере и в браузере. CSS-колонки при нескольких снимках разной формы оставляют одну колонку
// вдвое длиннее, поэтому колонки считаются здесь: сначала самые высокие снимки, каждый – в самую
// короткую колонку (так колонки выходят ровнее всего), внутри колонки – порядок по дате.

/** Подпись и отступ под снимком – в долях ширины колонки. */
const CAPTION = 0.25;
/** Записка о пробном занятии встаёт, только если под короткой колонкой столько места (доли ширины). */
const NOTE = 0.6;

export type WallLayout = {
  /** Индексы снимков по колонкам, сверху вниз. */
  columns: number[][];
  /** Колонка, в которую встаёт записка; нет – нигде нет пустого места под неё. */
  noteColumn?: number | undefined;
  /** Высоты колонок в долях их ширины – по ним видно, выйдет ли кладка за предел высоты. */
  heights: number[];
};

/**
 * `visible` – сколько первых снимков видно до «Показать ещё»: раскладываются и ищут место записке
 * они, скрытые дописываются в короткие колонки следом – видимые от них не сдвигаются.
 */
export function wallLayout(
  sizes: readonly ImageSize[],
  { columns: count, visible = sizes.length }: { columns: number; visible?: number },
): WallLayout {
  const columns = Array.from({ length: count }, (): number[] => []);
  const heights = Array.from({ length: count }, () => 0);
  const heightOf = (index: number) => {
    const size = sizes[index];
    return size ? size.height / size.width + CAPTION : 0;
  };
  const place = (index: number) => {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest]?.push(index);
    heights[shortest] = (heights[shortest] ?? 0) + heightOf(index);
  };

  const shown = Math.min(visible, sizes.length);
  const indices = sizes.map((_, index) => index);
  indices
    .slice(0, shown)
    .toSorted((a, b) => heightOf(b) - heightOf(a))
    .forEach(place);
  const room = Math.max(...heights) - Math.min(...heights);
  const noteColumn = shown > 1 && room >= NOTE ? heights.indexOf(Math.min(...heights)) : undefined;
  indices.slice(shown).forEach(place);

  return {
    columns: columns.map((column) => column.toSorted((a, b) => a - b)),
    noteColumn,
    heights,
  };
}
