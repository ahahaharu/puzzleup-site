import 'server-only';

import { z } from 'zod';

import type { SheetsClient } from './client';
import { LEADS_SHEET, SheetsApiError, type SheetRow, type SheetsPort } from './port';
import { LEAD_COLUMN_FORMATS } from './row';

/** Ячейки строки с явным форматом: строка не зависит от оформления соседних. */
function rowData(values: SheetRow) {
  return {
    values: values.map((value, index) => {
      const numberFormat = LEAD_COLUMN_FORMATS[index];
      return {
        // Текст – всегда `stringValue`: метка `=…` из адреса остаётся текстом, а не формулой.
        ...(typeof value === 'number'
          ? { userEnteredValue: { numberValue: value } }
          : value !== '' && { userEnteredValue: { stringValue: value } }),
        userEnteredFormat: {
          textFormat: { bold: false },
          ...(numberFormat && { numberFormat }),
        },
      };
    }),
  };
}

// Значение и формат ячейки, остальное оформление (цвет статуса – условное) не трогается.
const CELL_FIELDS =
  'userEnteredValue,userEnteredFormat.numberFormat,userEnteredFormat.textFormat.bold';

/**
 * Адаптер `SheetsPort` на Sheets API v4. Номера строк читаются через `values`, а пишутся
 * ячейки через `batchUpdate` – с форматом даты в каждой: дописанная строка иначе берёт
 * оформление строки выше (заголовка) и показывает дату числом.
 */
export function createGoogleSheets(client: SheetsClient, spreadsheetId: string): SheetsPort {
  const id = encodeURIComponent(spreadsheetId);
  let sheetId: number | undefined;

  async function leadsSheetId(signal?: AbortSignal): Promise<number> {
    if (sheetId !== undefined) return sheetId;
    const data = await client.request(
      { path: id, query: { fields: 'sheets.properties(sheetId,title)' }, signal },
      z.object({
        sheets: z.array(
          z.object({ properties: z.object({ sheetId: z.number(), title: z.string() }) }),
        ),
      }),
    );
    const found = data.sheets.find((sheet) => sheet.properties.title === LEADS_SHEET);
    if (!found) throw new SheetsApiError('no_leads_sheet');
    sheetId = found.properties.sheetId;
    return sheetId;
  }

  async function batchUpdate(requests: (sheetId: number) => object[], signal?: AbortSignal) {
    try {
      const target = await leadsSheetId(signal);
      await client.request(
        { method: 'POST', path: `${id}:batchUpdate`, body: { requests: requests(target) }, signal },
        z.unknown(),
      );
    } catch (error) {
      // Лист могли удалить и создать заново – в следующей попытке id прочитается снова.
      sheetId = undefined;
      throw error;
    }
  }

  return {
    async readKeys(signal) {
      const data = await client.request(
        {
          path: `${id}/values/${encodeURIComponent(`'${LEADS_SHEET}'!A:A`)}`,
          query: { majorDimension: 'COLUMNS', valueRenderOption: 'UNFORMATTED_VALUE' },
          signal,
        },
        // У пустого листа в ответе нет `values`.
        z.object({ values: z.array(z.array(z.unknown())).optional() }),
      );
      return data.values?.[0] ?? [];
    },
    updateRows: (rows, signal) =>
      batchUpdate(
        (target) =>
          rows.map(({ row, values }) => ({
            updateCells: {
              start: { sheetId: target, rowIndex: row - 1, columnIndex: 0 },
              rows: [rowData(values)],
              fields: CELL_FIELDS,
            },
          })),
        signal,
      ),
    appendRow: (values, signal) =>
      batchUpdate(
        (target) => [
          { appendCells: { sheetId: target, rows: [rowData(values)], fields: CELL_FIELDS } },
        ],
        signal,
      ),
  };
}
