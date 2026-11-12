import { z } from 'zod';

/**
 * Заглушки контента – `[ФИО]`, `[номер]`: та же запись, что в макетах docs/design.
 * Обычная проверка их пропускает, `content:check --strict` (перед релизом) – нет
 * (docs/data-model.md, раздел 1).
 */

// Ссылка Markdown `[текст](адрес)` – не заглушка.
const PLACEHOLDER_IN_TEXT = /\[[^[\]\n]+\](?!\()/g;
const PLACEHOLDER_ONLY = /^\[[^[\]\n]+\]$/;

export const placeholderSchema = z.string().regex(PLACEHOLDER_ONLY);

/** Поле, которое до релиза может быть заглушкой: значение по схеме или `[…]`. */
export function orPlaceholder<T extends z.ZodType>(schema: T) {
  return z.union([placeholderSchema, schema]);
}

export function isPlaceholder(value: unknown): value is string {
  return typeof value === 'string' && PLACEHOLDER_ONLY.test(value);
}

/** Все заглушки в строке, в том числе внутри текста. */
export function findPlaceholders(text: string): string[] {
  return text.match(PLACEHOLDER_IN_TEXT) ?? [];
}
