/**
 * Разделы длинного текста – оглавление и якоря политик (ТЗ страницы репетитора, раздел 7:
 * «Заголовки разделов H2 с якорями. На раздел можно дать ссылку, например на «Права субъекта»»).
 */

export type Heading = { id: string; title: string };

// Транслитерация для адресов: «Права субъекта» → `prava-subekta`. Русские и белорусские буквы.
// prettier-ignore
const LATIN: Readonly<Record<string, string>> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  і: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ў: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
};

/** Номер раздела в начале заголовка: «4. », «4.1 ». */
const SECTION_NUMBER = /^\d+(?:\.\d+)*\.?\s+/;

/** Якорь заголовка: без номера раздела, латиницей, через дефис. «4. Права субъекта» → `prava-subekta`. */
export function anchorId(title: string): string {
  return Array.from(title.replace(SECTION_NUMBER, '').toLowerCase(), (char) => LATIN[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const H2 = /^##[ \t]+(.+?)[ \t#]*$/;
const FENCE = /^(?:```|~~~)/;

/** Заголовки второго уровня Markdown по порядку; строки внутри блоков кода пропускаются. */
export function markdownHeadings(source: string): Heading[] {
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    const title = inFence ? undefined : H2.exec(line)?.[1];
    if (title) headings.push({ id: anchorId(title), title });
  }
  return headings;
}
