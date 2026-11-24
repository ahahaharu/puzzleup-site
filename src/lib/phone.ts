/**
 * Телефон родителя – ТЗ главной, блок 9, поле 2: маска +375 (XX) XXX-XX-XX, мобильные коды
 * 25, 29, 33, 44. В базе – E.164 (docs/data-model.md, `leads.phone`). Чистые функции: маску
 * применяет поле формы, проверку – общая схема формы на клиенте и сервере.
 */

export const BY_MOBILE_CODES = ['25', '29', '33', '44'] as const;

/** Национальная часть номера: код оператора и семь цифр. */
const NATIONAL_LENGTH = 9;

// Префиксы перед национальной частью: +375, 8 0XX, 0XX. Национальная часть начинается с кода
// 25/29/33/44, поэтому с этих цифр она начаться не может.
const PREFIX = /^(?:375|80|8|0)/;

/** Цифры, набранные до национальной части: код страны или междугородний префикс. */
function prefixLength(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  // Поле с маской начинается с «+375»: дальше – только национальная часть, если её не вставили
  // целиком ещё раз. Без маски (вставка, автозаполнение, форма без JS) префикс отрезается, только
  // когда цифр больше девяти: иначе первая набранная «8» пропадала бы.
  const country = raw.trimStart().startsWith('+375') ? 3 : 0;
  const rest = digits.slice(country);
  return country + (rest.length > NATIONAL_LENGTH ? (PREFIX.exec(rest)?.[0].length ?? 0) : 0);
}

/** Цифры номера без кода страны и междугороднего префикса; лишние цифры в конце отбрасываются. */
export function nationalDigits(value: string): string {
  return value.replace(/\D/g, '').slice(prefixLength(value)).slice(0, NATIONAL_LENGTH);
}

/**
 * «+375 (29) 123-45-67» по мере набора. Разделитель появляется только перед следующей цифрой,
 * поэтому стирание с конца не упирается в скобку или дефис.
 */
export function formatPhone(national: string): string {
  if (national === '') return '';
  const code = national.slice(0, 2);
  const groups = [national.slice(2, 5), national.slice(5, 7), national.slice(7, 9)];
  let result = `+375 (${code}`;
  if (groups[0]) result += `) ${groups[0]}`;
  if (groups[1]) result += `-${groups[1]}`;
  if (groups[2]) result += `-${groups[2]}`;
  return result;
}

/** Позиция в отформатированном номере сразу после `count`-й национальной цифры. */
export function caretAfterDigit(formatted: string, count: number): number {
  if (count <= 0) return Math.min(formatted.length, '+375 ('.length);
  // Цифры 375 – код страны, а не набранные.
  let seen = -3;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted.charAt(index))) {
      seen += 1;
      if (seen === count) return index + 1;
    }
  }
  return formatted.length;
}

/**
 * Маска при вводе: новое значение поля и место каретки. Каретка остаётся после той же
 * набранной цифры, поэтому правка в середине номера не уводит её в конец.
 */
export function maskPhoneInput(raw: string, caret: number): { value: string; caret: number } {
  const national = nationalDigits(raw);
  const value = formatPhone(national);
  const before = raw.slice(0, caret).replace(/\D/g, '').length - prefixLength(raw);
  return { value, caret: caretAfterDigit(value, Math.min(before, national.length)) };
}

export type PhoneProblem = 'empty' | 'incomplete' | 'unknown_code';

export type PhoneResult = { ok: true; e164: string } | { ok: false; problem: PhoneProblem };

/** Номер в любом написании → E.164 `+375291234567` или причина ошибки. */
export function parsePhone(value: string): PhoneResult {
  const digits = value.replace(/\D/g, '');
  if (digits === '') return { ok: false, problem: 'empty' };
  const national = digits.slice(prefixLength(value));
  if (national.length !== NATIONAL_LENGTH) return { ok: false, problem: 'incomplete' };
  if (!BY_MOBILE_CODES.some((code) => national.startsWith(code))) {
    return { ok: false, problem: 'unknown_code' };
  }
  return { ok: true, e164: `+375${national}` };
}
