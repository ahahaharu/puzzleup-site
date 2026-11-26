// Появление блоков при прокрутке – docs/design-system.md, раздел 7; ADR-063.
// Блок ниже первого экрана один раз поднимается и проявляется, когда доходит до нижней части окна.
// Здесь – решение «кого и с какой задержкой» и тайминг; скрипт – ScrollReveal, начальные кадры видов –
// `--reveal-from` в globals.css.

/**
 * Как блок появляется:
 * - `up` – поднимается на 24 px (заголовки, карточки, шаги);
 * - `paper` – лист «ложится» на страницу: с наклоном чуть больше своего;
 * - `message` – пузырь сообщения вырастает от угла отправителя;
 * - `piece` – деталь пазла пристыковывается выступом: на десктопе справа, на телефоне снизу.
 */
export type RevealKind = 'up' | 'paper' | 'message' | 'piece';

/** Атрибут блока, который появляется при прокрутке. */
export function reveal(kind: RevealKind = 'up') {
  return { 'data-reveal': kind } as const;
}

/** Длительность – верхняя граница ДС (раздел 7): блок крупнее кнопки, 600 мс читаются спокойно. */
export const REVEAL_DURATION_MS = 600;
/** Ease-out без «отскока»: быстро стартует и мягко садится на место. */
export const REVEAL_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** Линия появления – доля высоты окна: блок проявляется, когда его верх поднялся выше неё. */
export const REVEAL_LINE = 0.88;
/** Сдвиг соседей, проявившихся вместе: ряд карточек идёт волной слева направо. */
export const STAGGER_MS = 80;
/** Дальше задержка не растёт: длинный список не заставляет ждать. */
export const MAX_STAGGER_STEPS = 4;

export type RevealBox = { top: number; bottom: number; left: number };

/** Прятать можно только то, что ниже окна: видимое при загрузке не мигает. */
export function isBelowFold(box: RevealBox, viewportHeight: number) {
  return box.top >= viewportHeight;
}

/**
 * Блоки, которым пора появиться, и задержка каждого. Решает только высота: карточка ленты, ушедшая
 * вбок, появляется вместе с видимыми соседями, а не во время перелистывания. Короткий блок у самого
 * конца страницы до линии может не дойти – он появляется, когда виден целиком.
 */
export function dueReveals<T>(
  pending: readonly { item: T; box: RevealBox }[],
  viewportHeight: number,
): { item: T; delay: number }[] {
  const due = pending.filter(
    ({ box }) => box.top < viewportHeight * REVEAL_LINE || box.bottom <= viewportHeight,
  );
  // Проскроленное мимо (переход по якорю) появляется сразу – его всё равно не видно.
  const passed = due.filter(({ box }) => box.bottom <= 0);
  const visible = due
    .filter(({ box }) => box.bottom > 0)
    .sort((a, b) => a.box.top - b.box.top || a.box.left - b.box.left);

  return [
    ...passed.map(({ item }) => ({ item, delay: 0 })),
    ...visible.map(({ item }, index) => ({
      item,
      delay: Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS,
    })),
  ];
}
