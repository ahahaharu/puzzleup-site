// Подсветка пункта текущего блока в шапке – ТЗ главной, раздел 3.

export type SectionPosition = { id: string; top: number };

/**
 * Текущий блок – последний, чей верх уже дошёл до линии `probe` (низ шапки). Блоки – в порядке
 * документа, `top` – от верха окна. Выше первого блока текущего нет.
 */
export function currentSection(
  sections: readonly SectionPosition[],
  probe: number,
): string | undefined {
  let current: string | undefined;
  for (const section of sections) {
    if (section.top > probe) break;
    current = section.id;
  }
  return current;
}
