import 'server-only';

/** Лист с заявками – docs/data-model.md, раздел 4. Остальные листы синхронизация не трогает. */
export const LEADS_SHEET = 'Заявки';

/** Значение ячейки. Пустая строка очищает ячейку. */
export type SheetCell = string | number;
export type SheetRow = readonly SheetCell[];

/**
 * Лист «Заявки» Google Таблицы за интерфейсом (docs/conventions.md, «Серверный код»): адаптер –
 * google-sheets.ts, в тестах – фейк. Строки нумеруются с 1, первая – заголовки. Ошибки –
 * `SheetsApiError` с кодом, без текста ответа.
 */
export type SheetsPort = {
  /** Столбец A сверху вниз, начиная с заголовка. */
  readKeys(signal?: AbortSignal): Promise<readonly unknown[]>;
  /** Перезаписать строки целиком, начиная со столбца A. */
  updateRows(
    rows: readonly { row: number; values: SheetRow }[],
    signal?: AbortSignal,
  ): Promise<void>;
  /** Дописать строку под последней заполненной. */
  appendRow(values: SheetRow, signal?: AbortSignal): Promise<void>;
};

/** Ошибка Google API: HTTP-код (`403`, `429`), `auth:<код>`, `network`, `timeout`, `bad_response`. */
export class SheetsApiError extends Error {
  override readonly name = 'SheetsApiError';
  constructor(readonly code: string) {
    super(code);
  }
}
