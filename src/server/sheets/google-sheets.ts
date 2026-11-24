import 'server-only';

import { z } from 'zod';

import type { SheetsClient } from './client';
import { LEADS_SHEET, type SheetsPort } from './port';
import { LAST_COLUMN } from './row';

/**
 * Адаптер `SheetsPort` на Sheets API v4. Значения пишутся как есть (`RAW`): строка из UTM,
 * начинающаяся с «=», остаётся текстом, а не становится формулой.
 */
export function createGoogleSheets(client: SheetsClient, spreadsheetId: string): SheetsPort {
  const id = encodeURIComponent(spreadsheetId);
  const range = (a1: string) => `'${LEADS_SHEET}'!${a1}`;
  const values = (a1: string) => `${id}/values/${encodeURIComponent(range(a1))}`;

  return {
    async readKeys(signal) {
      const data = await client.request(
        {
          path: values('A:A'),
          query: { majorDimension: 'COLUMNS', valueRenderOption: 'UNFORMATTED_VALUE' },
          signal,
        },
        // У пустого листа в ответе нет `values`.
        z.object({ values: z.array(z.array(z.unknown())).optional() }),
      );
      return data.values?.[0] ?? [];
    },
    async updateRows(rows, signal) {
      await client.request(
        {
          method: 'POST',
          path: `${id}/values:batchUpdate`,
          body: {
            valueInputOption: 'RAW',
            data: rows.map(({ row, values: cells }) => ({
              range: range(`A${row}:${LAST_COLUMN}${row}`),
              values: [cells],
            })),
          },
          signal,
        },
        z.unknown(),
      );
    },
    async appendRow(cells, signal) {
      await client.request(
        {
          method: 'POST',
          path: `${values(`A:${LAST_COLUMN}`)}:append`,
          query: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' },
          body: { values: [cells] },
          signal,
        },
        z.unknown(),
      );
    },
  };
}
