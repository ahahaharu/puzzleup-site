/**
 * Форма слова после числа: «1 отзыв», «2 отзыва», «5 отзывов». Формы – для 1, 2 и 5.
 * Дробные числа в текстах сайта не склоняются: цена выводится без слова после неё.
 */
export function plural(count: number, [one, few, many]: readonly [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Число и слово через неразрывный пробел: «12 отзывов». */
export function pluralize(count: number, forms: readonly [string, string, string]): string {
  return `${count}\u00a0${plural(count, forms)}`;
}
