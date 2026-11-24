import 'server-only';

import { SheetsApiError, type SheetCell, type SheetsPort } from './port';

// Фейк листа для тестов синхронизации (docs/conventions.md, «Тесты»).

/** Лист в памяти: `rows[0]` – заголовки. Сеть не трогает. */
export function fakeSheets(options: { rows?: SheetCell[][]; fail?: boolean } = {}) {
  const rows: SheetCell[][] = options.rows ?? [['№ заявки']];
  const calls: string[] = [];
  const check = () => {
    if (options.fail) throw new SheetsApiError('503');
  };
  const port: SheetsPort = {
    async readKeys() {
      check();
      calls.push('readKeys');
      return rows.map((row) => row[0] ?? '');
    },
    async updateRows(updates) {
      check();
      calls.push(`updateRows:${updates.map((update) => update.row).join(',')}`);
      for (const { row, values } of updates) rows[row - 1] = [...values];
    },
    async appendRow(values) {
      check();
      calls.push('appendRow');
      rows.push([...values]);
    },
  };
  return { port, rows, calls };
}
