/**
 * Телефон родителя – ТЗ главной, блок 9, поле 2: маска +375 (XX) XXX-XX-XX, мобильные коды
 * 25, 29, 33, 44. В базе – E.164 (docs/data-model.md, `leads.phone`). Чистые функции: маску
 * применяет поле формы, проверку – общая схема формы на клиенте и сервере.
 */

export const BY_MOBILE_CODES = ['25', '29', '33', '44'] as const;

/** Национальная часть номера: код оператора и семь цифр. */
const NATIONAL_LENGTH = 9;

/** Начало номера в поле с маской: его подставляет фокус в пустом поле. */
export const PHONE_PREFIX = '+375 (';

// Национальная часть начинается с кода 25/29/33/44, поэтому с «375», «80» или «0» она начаться не
// может: такие цифры в начале – код страны или междугородний префикс. Они отбрасываются, сколько бы
// раз ни встретились: «+375» из маски и «+375», набранное следом по привычке, или номер, вставленный
// целиком.
const PREFIX = /^(?:375|80|0)/;

/** Цифры номера без префиксов и число отброшенных цифр. */
function splitPrefix(value: string): { prefix: number; rest: string } {
  let rest = value.replace(/\D/g, '');
  let prefix = 0;
  for (let match = PREFIX.exec(rest); match; match = PREFIX.exec(rest)) {
    prefix += match[0].length;
    rest = rest.slice(match[0].length);
  }
  return { prefix, rest };
}

/** Цифры номера без кода страны и междугороднего префикса; лишние цифры в конце отбрасываются. */
export function nationalDigits(value: string): string {
  return splitPrefix(value).rest.slice(0, NATIONAL_LENGTH);
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
  const { prefix, rest } = splitPrefix(raw);
  const national = rest.slice(0, NATIONAL_LENGTH);
  if (national === '') {
    // Цифр номера ещё нет. Начало маски стирается посимвольно; набранное «+375» или «80» становится
    // началом маски, а не первыми цифрами номера.
    const value = PHONE_PREFIX.startsWith(raw) ? raw : /[\d+]/.test(raw) ? PHONE_PREFIX : '';
    return { value, caret: value.length };
  }
  const value = formatPhone(national);
  const before = raw.slice(0, caret).replace(/\D/g, '').length - prefix;
  return { value, caret: caretAfterDigit(value, Math.min(before, national.length)) };
}

export type PhoneProblem = 'empty' | 'incomplete' | 'unknown_code';

export type PhoneResult = { ok: true; e164: string } | { ok: false; problem: PhoneProblem };

/** Номер в любом написании → E.164 `+375291234567` или причина ошибки. */
export function parsePhone(value: string): PhoneResult {
  // Только «+375» или «8 0» – номер не начат.
  const national = splitPrefix(value).rest;
  if (national === '') return { ok: false, problem: 'empty' };
  if (national.length !== NATIONAL_LENGTH) return { ok: false, problem: 'incomplete' };
  if (!BY_MOBILE_CODES.some((code) => national.startsWith(code))) {
    return { ok: false, problem: 'unknown_code' };
  }
  return { ok: true, e164: `+375${national}` };
}
