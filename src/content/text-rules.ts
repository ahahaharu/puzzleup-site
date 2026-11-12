/**
 * Правила формулировок и типографики – ТЗ главной, раздел 1; CLAUDE.md, «Тексты сайта».
 * Сайт не говорит от лица организации и не обещает результат.
 */

// `\b` не знает кириллицу: граница слова – соседний символ не буква и не цифра.
const START = '(?<![\\p{L}\\p{N}])';
const END = '(?![\\p{L}\\p{N}])';

function word(pattern: string): RegExp {
  return new RegExp(`${START}${pattern}${END}`, 'giu');
}

// Формы перечислены явно: корень с любым окончанием задел бы обычные слова –
// «нашёл», «централизованное тестирование», «подберу» (первое лицо репетитора).
function forms(stem: string, endings: readonly string[]): RegExp {
  return word(`${stem}(?:${endings.join('|')})`);
}

const NOUN = ['', 'а', 'е', 'у', 'ом', 'ой', 'ы', 'и', 'ов', 'ам', 'ами', 'ах'];

type Rule = { pattern: RegExp; message: string };

const NOT_ORGANIZATION = 'PuzzleUp is not an organization';
const NO_GUARANTEES = 'no guarantees of results';

const WORDING: readonly Rule[] = [
  { pattern: word('мы'), message: 'the site never speaks as «мы»' },
  {
    pattern: forms('наш', ['', 'а', 'е', 'и', 'его', 'ей', 'ему', 'им', 'ими', 'ем', 'у', 'их']),
    message: 'the site never speaks as «наш»',
  },
  {
    pattern: word('(?:находим|разбираем|решаем)'),
    message: 'use an impersonal form or the tutor’s first person',
  },
  { pattern: forms('команд', NOUN), message: NOT_ORGANIZATION },
  { pattern: forms('центр', NOUN), message: NOT_ORGANIZATION },
  // Только сама «школа»: «учится в школе», «справка из школы» – обязательные тексты ТЗ.
  { pattern: word('школа'), message: NOT_ORGANIZATION },
  {
    pattern: forms('компани', ['я', 'и', 'ю', 'ей', 'ям', 'ями', 'ях', 'й']),
    message: NOT_ORGANIZATION,
  },
  { pattern: /©\s*PuzzleUp/giu, message: NOT_ORGANIZATION },
  {
    pattern: forms('подбер', ['ём', 'ем', 'ёт', 'ет']),
    message: 'parents choose a tutor themselves',
  },
  { pattern: word('гарантир\\p{L}*'), message: NO_GUARANTEES },
  { pattern: word('с\\s+первого\\s+раза'), message: NO_GUARANTEES },
  { pattern: word('педагог\\p{L}*'), message: 'forbidden word' },
  { pattern: word('опытн\\p{L}*\\s+преподавател\\p{L}*'), message: 'forbidden phrase' },
];

const TYPOGRAPHY: readonly Rule[] = [
  // Дефис между словами вместо тире. Дефис в начале строки – список Markdown.
  { pattern: /(?<=\S)[ \t]+-[ \t]+/g, message: 'hyphen used as a dash, use «–» (en dash)' },
  { pattern: /—/g, message: 'em dash, use «–» (en dash)' },
  { pattern: /"/g, message: 'straight quotes, use «»' },
];

export type TextViolation = { kind: 'wording' | 'typography'; match: string; message: string };

function apply(
  kind: TextViolation['kind'],
  rules: readonly Rule[],
  value: string,
): TextViolation[] {
  return rules.flatMap(({ pattern, message }) =>
    Array.from(value.matchAll(pattern), (match) => ({ kind, match: match[0], message })),
  );
}

export function checkText(value: string): TextViolation[] {
  return [...apply('wording', WORDING, value), ...apply('typography', TYPOGRAPHY, value)];
}
