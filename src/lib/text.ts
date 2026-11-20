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
