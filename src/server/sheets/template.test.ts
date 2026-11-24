import { describe, expect, it } from 'vitest';

import { LEAD_COLUMNS } from './row';
import {
  LEADS_PROTECTION,
  SHEET_TITLES,
  templateRequests,
  type SpreadsheetMeta,
  type TemplateInput,
} from './template';

const input: TemplateInput = {
  siteUrl: 'https://dev.puzzle-up.by',
  tutors: [
    { name: 'Анна', slug: 'anna', archived: false },
    { name: 'Олег', slug: 'oleg', archived: true },
  ],
};
const NEW_SPREADSHEET: SpreadsheetMeta = {
  sheets: [{ sheetId: 0, title: 'Лист1', protections: [] }],
};

// Запросы – JSON Google API без своих типов: форму проверяют сами значения.
type Req = ReturnType<typeof JSON.parse>;
const of = (requests: Req[], kind: string) =>
  requests.filter((request) => kind in request).map((request) => request[kind]);

/** Значения ячеек, записанных в лист, строками. */
function written(requests: Req[], sheetId: number): (string | number | undefined)[][] {
  const update = of(requests, 'updateCells').find(
    (item) => item.start?.sheetId === sheetId && item.rows,
  );
  return (update?.rows ?? []).map((row: Req) =>
    row.values.map((value: Req) => {
      const entered = value.userEnteredValue;
      return entered?.stringValue ?? entered?.formulaValue ?? entered?.numberValue;
    }),
  );
}

function sheetIds(requests: Req[], meta: SpreadsheetMeta): Map<string, number> {
  const ids = new Map(meta.sheets.map((sheet) => [sheet.title, sheet.sheetId]));
  for (const update of of(requests, 'updateSheetProperties')) {
    if (update.fields === 'title') ids.set(update.properties.title, update.properties.sheetId);
  }
  for (const add of of(requests, 'addSheet')) ids.set(add.properties.title, add.properties.sheetId);
  return ids;
}

describe('templateRequests', () => {
  it('turns «Лист1» of a new spreadsheet into «Заявки» and adds the other sheets in order', () => {
    const requests = templateRequests(NEW_SPREADSHEET, input);
    expect(of(requests, 'updateSheetProperties')[0]).toEqual({
      properties: { sheetId: 0, title: 'Заявки' },
      fields: 'title',
    });
    expect(
      of(requests, 'addSheet').map((add) => [add.properties.title, add.properties.index]),
    ).toEqual(SHEET_TITLES.slice(1).map((title, index) => [title, index + 1]));
  });

  it('sets Minsk time zone and Russian locale', () => {
    expect(of(templateRequests(NEW_SPREADSHEET, input), 'updateSpreadsheetProperties')).toEqual([
      { properties: { locale: 'ru_RU', timeZone: 'Europe/Minsk' }, fields: 'locale,timeZone' },
    ]);
  });

  it('writes headers A–Q to «Заявки» without touching the rows below', () => {
    const requests = templateRequests(NEW_SPREADSHEET, input);
    expect(written(requests, 0)).toEqual([[...LEAD_COLUMNS]]);
    const cleared = of(requests, 'updateCells').filter((item) => item.range);
    const ids = sheetIds(requests, NEW_SPREADSHEET);
    expect(cleared.map((item) => item.range.sheetId).sort()).toEqual(
      ['Сводка', 'Недели', 'Справочники', 'Инструкция'].map((title) => ids.get(title)).sort(),
    );
  });

  it('formats dates in «Заявки» as Minsk date and time', () => {
    const formats = of(templateRequests(NEW_SPREADSHEET, input), 'repeatCell').filter(
      (item) => item.range.sheetId === 0,
    );
    expect(
      formats.map((item) => [
        item.range.startColumnIndex,
        item.cell.userEnteredFormat.numberFormat.pattern,
      ]),
    ).toEqual([
      [1, 'dd.mm.yyyy hh:mm'],
      [16, 'dd.mm.yyyy hh:mm'],
      [13, 'dd.mm.yyyy'],
      [14, 'dd.mm.yyyy'],
    ]);
  });

  it('keeps existing sheets and protects «Заявки» only once', () => {
    const meta: SpreadsheetMeta = {
      sheets: SHEET_TITLES.map((title, index) => ({
        sheetId: 10 + index,
        title,
        protections: title === 'Заявки' ? [LEADS_PROTECTION] : [],
      })),
    };
    const requests = templateRequests(meta, input);
    expect(of(requests, 'addSheet')).toEqual([]);
    expect(of(requests, 'addProtectedRange')).toEqual([]);
    expect(of(templateRequests(NEW_SPREADSHEET, input), 'addProtectedRange')).toEqual([
      {
        protectedRange: { range: { sheetId: 0 }, description: LEADS_PROTECTION, warningOnly: true },
      },
    ]);
  });

  it('leaves foreign sheets alone', () => {
    const meta: SpreadsheetMeta = { sheets: [{ sheetId: 5, title: 'Черновик', protections: [] }] };
    const requests = templateRequests(meta, input);
    expect(
      of(requests, 'updateSheetProperties').some((item) => item.properties.sheetId === 5),
    ).toBe(false);
    expect(sheetIds(requests, meta).get('Заявки')).toBe(6);
  });

  it('lists the home page and pages of active tutors for the link generator', () => {
    const requests = templateRequests(NEW_SPREADSHEET, input);
    const lists = written(requests, sheetIds(requests, NEW_SPREADSHEET).get('Справочники') ?? -1);
    const pages = lists.map((row) => row[9]).filter(Boolean);
    expect(pages).toEqual([
      'Страница',
      'https://dev.puzzle-up.by/',
      'https://dev.puzzle-up.by/tutors/anna',
    ]);
  });

  it('builds UTM links with all five parameters', () => {
    const requests = templateRequests(NEW_SPREADSHEET, input);
    const [header] = written(requests, sheetIds(requests, NEW_SPREADSHEET).get('Ссылки') ?? -1);
    const formula = String(header?.[5]);
    for (const param of ['?utm_source=', '&utm_medium=', '&utm_campaign=', '&utm_content=']) {
      expect(formula).toContain(`"${param}"`);
    }
  });

  it('references only template sheets in formulas, with balanced brackets and quotes', () => {
    const requests = templateRequests(NEW_SPREADSHEET, input);
    const formulas = of(requests, 'updateCells')
      .flatMap((item) => item.rows ?? [])
      .flatMap((row: Req) => row.values)
      .map((value: Req) => value.userEnteredValue?.formulaValue)
      .filter((formula): formula is string => typeof formula === 'string');
    expect(formulas.length).toBeGreaterThan(10);
    for (const formula of formulas) {
      for (const [, title] of formula.matchAll(/'([^']+)'!/g)) {
        expect(SHEET_TITLES).toContain(title);
      }
      expect(formula.split('"').length % 2, formula).toBe(1);
      const outside = formula.replaceAll(/"[^"]*"/g, '');
      expect(outside.split('(').length, formula).toBe(outside.split(')').length);
      expect(outside.split('{').length, formula).toBe(outside.split('}').length);
    }
  });
});
