/** Первая буква – заглавная: «математика» → «Математика». */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Перед гласным звуком – «об»: «об Андрее», «об Ольге». Е, Ё, Ю, Я начинаются со звука [й]: «о Яне».
const VOWEL_START = /^[аиоуыэ]/i;

/** «Андрее» → «об Андрее», «Максиме» → «о Максиме» (ТЗ главной, блок 6: «об Андрее →»). */
export function aboutName(namePrepositional: string): string {
  return `${VOWEL_START.test(namePrepositional) ? 'об' : 'о'} ${namePrepositional}`;
}

/** Перечисление через запятую и «и» перед последним: «Google Meet и Miro», «A, B и C». */
export function joinWithAnd(items: readonly string[]): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} и ${items.at(-1) ?? ''}`;
}
