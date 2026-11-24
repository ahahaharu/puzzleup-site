import { createVerify, generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createSheetsClient } from './client';
import { createGoogleSheets } from './google-sheets';
import { SheetsApiError } from './port';

// Ключ создаётся на время теста: в репозитории нет ни одного ключа.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const credentials = {
  clientEmail: 'sync@fake-project.iam.gserviceaccount.com',
  privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
};
const SHEET_ID = '1FakeSheetIdFakeSheetIdFakeSheetId01';
const NOW = Date.parse('2026-11-24T12:00:00Z');

type Call = { url: string; method: string; headers: Headers; body: string };

function fakeFetch(respond: (call: Call) => Response | Promise<Response> = () => ok({})) {
  const calls: Call[] = [];
  let tokens = 0;
  const fetchFn: typeof fetch = async (input, init = {}) => {
    const call = {
      url: String(input),
      method: init.method ?? 'GET',
      headers: new Headers(init.headers),
      body: init.body === undefined || init.body === null ? '' : String(init.body),
    };
    calls.push(call);
    if (call.url === 'https://oauth2.googleapis.com/token') {
      tokens += 1;
      return ok({ access_token: `token-${tokens}`, expires_in: 3600 });
    }
    return respond(call);
  };
  return { fetchFn, calls, apiCalls: () => calls.filter((call) => !call.url.includes('oauth2')) };
}

const ok = (body: unknown) => Response.json(body);

function setup(respond?: Parameters<typeof fakeFetch>[0]) {
  const fake = fakeFetch(respond);
  let now = NOW;
  const client = createSheetsClient(credentials, { fetch: fake.fetchFn, now: () => now });
  return {
    ...fake,
    client,
    sheets: createGoogleSheets(client, SHEET_ID),
    advance: (ms: number) => (now += ms),
  };
}

describe('createSheetsClient', () => {
  it('exchanges a JWT signed with the service account key for a token', async () => {
    const { client, calls } = setup();
    await client.request({ path: 'x' }, z.unknown());

    const exchange = new URLSearchParams(calls[0]?.body);
    expect(exchange.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    const [header = '', claims = '', signature = ''] = exchange.get('assertion')?.split('.') ?? [];
    const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString());
    expect(decode(header)).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(decode(claims)).toEqual({
      iss: credentials.clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: NOW / 1000,
      exp: NOW / 1000 + 3600,
    });
    const verified = createVerify('RSA-SHA256')
      .update(`${header}.${claims}`)
      .verify(publicKey, Buffer.from(signature, 'base64url'));
    expect(verified).toBe(true);
    expect(calls[1]?.headers.get('authorization')).toBe('Bearer token-1');
  });

  it('reuses the token until five minutes before it expires', async () => {
    const { client, calls, advance } = setup();
    await client.request({ path: 'x' }, z.unknown());
    advance(54 * 60_000);
    await client.request({ path: 'x' }, z.unknown());
    expect(calls.at(-1)?.headers.get('authorization')).toBe('Bearer token-1');
    advance(2 * 60_000);
    await client.request({ path: 'x' }, z.unknown());
    expect(calls.at(-1)?.headers.get('authorization')).toBe('Bearer token-2');
  });

  it('drops a token the API rejected', async () => {
    let status = 401;
    const { client, calls } = setup(() => new Response('{}', { status }));
    await expect(client.request({ path: 'x' }, z.unknown())).rejects.toThrow(
      new SheetsApiError('401'),
    );
    status = 200;
    await client.request({ path: 'x' }, z.unknown());
    expect(calls.at(-1)?.headers.get('authorization')).toBe('Bearer token-2');
  });

  it('reports only the status code, not the response body', async () => {
    const { client } = setup(
      () => new Response('{"error":{"message":"Range 1024 not found"}}', { status: 400 }),
    );
    const error = await client
      .request({ path: 'x' }, z.unknown())
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SheetsApiError);
    expect(error).toMatchObject({ code: '400', message: '400' });
  });

  it('reports a failed token exchange as auth error', async () => {
    const fetchFn: typeof fetch = async () =>
      new Response('{"error":"invalid_grant"}', { status: 400 });
    const client = createSheetsClient(credentials, { fetch: fetchFn });
    await expect(client.request({ path: 'x' }, z.unknown())).rejects.toMatchObject({
      code: 'auth:400',
    });
  });

  it.each([
    ['network', new TypeError('fetch failed')],
    ['timeout', new DOMException('The operation timed out.', 'TimeoutError')],
  ])('maps a %s failure to its code', async (code, thrown) => {
    const { client } = setup(() => Promise.reject(thrown));
    await expect(client.request({ path: 'x' }, z.unknown())).rejects.toMatchObject({ code });
  });

  it('rejects a broken key on creation', () => {
    expect(() => createSheetsClient({ ...credentials, privateKey: 'PRIVATE KEY' })).toThrow();
  });
});

describe('createGoogleSheets', () => {
  const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
  const META = {
    sheets: [
      { properties: { sheetId: 0, title: 'Сводка' } },
      { properties: { sheetId: 7, title: 'Заявки' } },
    ],
  };
  // Ответы API по адресу: метаданные Таблицы, столбец A, запись.
  const google =
    (keys: unknown[] = []) =>
    (call: Call) =>
      call.url.includes('fields=')
        ? ok(META)
        : call.url.includes('/values/')
          ? ok({ values: [keys] })
          : ok({});
  const body = (call: Call | undefined) => JSON.parse(call?.body ?? '');

  it('reads column A of «Заявки» as raw values', async () => {
    const { sheets, apiCalls } = setup(google(['№ заявки', 1001, 1002]));
    expect(await sheets.readKeys()).toEqual(['№ заявки', 1001, 1002]);
    expect(apiCalls()[0]?.url).toBe(
      `${sheetUrl}/values/${encodeURIComponent("'Заявки'!A:A")}?majorDimension=COLUMNS&valueRenderOption=UNFORMATTED_VALUE`,
    );
  });

  it('reads an empty sheet as no keys', async () => {
    const { sheets } = setup(() => ok({ range: "'Заявки'!A1:A1000" }));
    expect(await sheets.readKeys()).toEqual([]);
  });

  it('appends cells with date formats, text never as a formula', async () => {
    const { sheets, apiCalls } = setup(google());
    const row: (string | number)[] = Array.from({ length: 17 }, (_, index) =>
      index === 1 || index === 13 ? 46350.5 : '',
    );
    row[0] = 1002;
    row[8] = '=IMPORTXML("x")';
    await sheets.appendRow(row);

    const [meta, write] = apiCalls();
    expect(new URL(meta?.url ?? '').searchParams.get('fields')).toBe(
      'sheets.properties(sheetId,title)',
    );
    expect(write?.url).toBe(`${sheetUrl}:batchUpdate`);
    const [request] = body(write).requests;
    expect(request.appendCells.sheetId).toBe(7);
    expect(request.appendCells.fields).toBe(
      'userEnteredValue,userEnteredFormat.numberFormat,userEnteredFormat.textFormat.bold',
    );
    const cells = request.appendCells.rows[0].values;
    expect(cells[0]).toEqual({
      userEnteredValue: { numberValue: 1002 },
      userEnteredFormat: { textFormat: { bold: false } },
    });
    expect(cells[1].userEnteredFormat.numberFormat).toEqual({
      type: 'DATE_TIME',
      pattern: 'dd.mm.yyyy hh:mm',
    });
    expect(cells[13].userEnteredFormat.numberFormat).toEqual({
      type: 'DATE',
      pattern: 'dd.mm.yyyy',
    });
    expect(cells[8].userEnteredValue).toEqual({ stringValue: '=IMPORTXML("x")' });
    // Пустое значение очищает ячейку.
    expect(cells[2]).not.toHaveProperty('userEnteredValue');
  });

  it('rewrites rows in place and reads the sheet id once', async () => {
    const { sheets, apiCalls } = setup(google());
    await sheets.updateRows([
      { row: 3, values: [1001, 'новая'] },
      { row: 7, values: [1001, 'новая'] },
    ]);
    await sheets.updateRows([{ row: 3, values: [1001, 'ученик'] }]);

    const calls = apiCalls();
    expect(calls.filter((call) => call.url.includes('fields='))).toHaveLength(1);
    const starts = body(calls[1]).requests.map(
      (request: { updateCells: { start: unknown } }) => request.updateCells.start,
    );
    expect(starts).toEqual([
      { sheetId: 7, rowIndex: 2, columnIndex: 0 },
      { sheetId: 7, rowIndex: 6, columnIndex: 0 },
    ]);
  });

  it('reads the sheet id again after a failed write', async () => {
    let fail = true;
    const { sheets, apiCalls } = setup((call) =>
      call.url.includes('fields=') ? ok(META) : fail ? new Response('{}', { status: 500 }) : ok({}),
    );
    await expect(sheets.appendRow([1])).rejects.toMatchObject({ code: '500' });
    fail = false;
    await sheets.appendRow([1]);
    expect(apiCalls().filter((call) => call.url.includes('fields='))).toHaveLength(2);
  });

  it('fails with a code when «Заявки» is missing', async () => {
    const { sheets } = setup(() =>
      ok({ sheets: [{ properties: { sheetId: 0, title: 'Лист1' } }] }),
    );
    await expect(sheets.appendRow([1])).rejects.toMatchObject({ code: 'no_leads_sheet' });
  });
});
