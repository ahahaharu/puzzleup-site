import 'server-only';

import type { SheetRow, SheetsPort } from './port';

/**
 * Строка по номеру заявки (столбец A): есть – перезаписать, нет – дописать (docs/architecture.md,
 * раздел 5). Строку ищут каждый раз: её могли сдвинуть сортировкой. Если строк с номером
 * несколько (два воркера дописали одновременно), обновляются все – данные не расходятся.
 */
export async function upsertRow(
  sheets: SheetsPort,
  values: SheetRow,
  signal?: AbortSignal,
): Promise<void> {
  const key = String(values[0]);
  const keys = await sheets.readKeys(signal);
  const rows = keys.flatMap((value, index) =>
    // Строка 1 – заголовки.
    index > 0 && String(value).trim() === key ? [{ row: index + 1, values }] : [],
  );
  if (rows.length === 0) await sheets.appendRow(values, signal);
  else await sheets.updateRows(rows, signal);
}
