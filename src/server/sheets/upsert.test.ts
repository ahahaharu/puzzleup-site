import { describe, expect, it } from 'vitest';

import { fakeSheets } from './fixtures';
import { upsertRow } from './upsert';

const HEADER = ['№ заявки', 'Статус'];

describe('upsertRow', () => {
  it('appends a lead that is not in the sheet yet', async () => {
    const sheets = fakeSheets({ rows: [HEADER, [1001, 'новая']] });
    await upsertRow(sheets.port, [1002, 'новая']);
    expect(sheets.calls).toEqual(['readKeys', 'appendRow']);
    expect(sheets.rows).toEqual([HEADER, [1001, 'новая'], [1002, 'новая']]);
  });

  it('rewrites the row with the same number wherever it is', async () => {
    const sheets = fakeSheets({
      rows: [HEADER, [1003, 'новая'], [1001, 'новая'], [1002, 'новая']],
    });
    await upsertRow(sheets.port, [1001, 'ученик']);
    expect(sheets.calls).toEqual(['readKeys', 'updateRows:3']);
    expect(sheets.rows[2]).toEqual([1001, 'ученик']);
  });

  it('matches a number typed as text', async () => {
    const sheets = fakeSheets({ rows: [HEADER, [' 1001', 'новая']] });
    await upsertRow(sheets.port, [1001, 'отказ']);
    expect(sheets.calls).toEqual(['readKeys', 'updateRows:2']);
  });

  it('updates every duplicate of the number', async () => {
    const sheets = fakeSheets({ rows: [HEADER, [1001, 'новая'], [1002], [1001, 'новая']] });
    await upsertRow(sheets.port, [1001, 'связался']);
    expect(sheets.calls).toEqual(['readKeys', 'updateRows:2,4']);
  });

  it('never treats the header row as a lead', async () => {
    const sheets = fakeSheets({ rows: [['1001']] });
    await upsertRow(sheets.port, [1001, 'новая']);
    expect(sheets.calls).toEqual(['readKeys', 'appendRow']);
  });
});
