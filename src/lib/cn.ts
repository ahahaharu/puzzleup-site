/** Склеивает классы, пропуская пустые значения: `cn('a', ok && 'b', undefined)`. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
