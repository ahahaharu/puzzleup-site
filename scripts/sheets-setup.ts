// `pnpm sheets:setup`: готовит Google Таблицу окружения по шаблону (src/server/sheets/template.ts):
// листы, заголовки, формулы «Сводки» и «Недель», генератор ссылок, «Справочники» и «Инструкцию».
// Таблицу создаёт человек и открывает на редактирование почте сервисного аккаунта; скрипт
// запускается для каждого окружения с его переменными. Повторный запуск безопасен: данные
// «Заявок», «Ссылок» и «Расходов» не трогаются.
import { z } from 'zod';

import { getTutors } from '@/content';
import { EnvError, parseEnv } from '@/lib/env';
import { createSheetsClient } from '@/server/sheets/client';
import { SheetsApiError } from '@/server/sheets/port';
import { SHEET_TITLES, templateRequests } from '@/server/sheets/template';

let env;
try {
  env = parseEnv(process.env);
} catch (error) {
  if (!(error instanceof EnvError)) throw error;
  console.error(error.message);
  process.exit(1);
}
if (env.sheets === undefined) {
  console.error('GOOGLE_* variables are not set: see .env.example');
  process.exit(1);
}

const metaSchema = z.object({
  sheets: z.array(
    z.object({
      properties: z.object({ sheetId: z.number(), title: z.string() }),
      protectedRanges: z.array(z.object({ description: z.string().optional() })).optional(),
    }),
  ),
});

const client = createSheetsClient(env.sheets);
const id = encodeURIComponent(env.sheets.spreadsheetId);
try {
  const meta = await client.request(
    {
      path: id,
      query: { fields: 'sheets(properties(sheetId,title),protectedRanges(description))' },
    },
    metaSchema,
  );
  const requests = templateRequests(
    {
      sheets: meta.sheets.map((sheet) => ({
        ...sheet.properties,
        protections: (sheet.protectedRanges ?? []).flatMap((range) => range.description ?? []),
      })),
    },
    { siteUrl: env.SITE_URL, tutors: getTutors() },
  );
  await client.request(
    { method: 'POST', path: `${id}:batchUpdate`, body: { requests } },
    z.unknown(),
  );
  console.log(`Spreadsheet is ready: ${SHEET_TITLES.join(', ')}; links lead to ${env.SITE_URL}`);
} catch (error) {
  if (!(error instanceof SheetsApiError)) throw error;
  // 403 и 404 – Таблица не открыта сервисному аккаунту или неверный GOOGLE_SHEET_ID.
  const hint = ['403', '404'].includes(error.code)
    ? `: share the spreadsheet with ${env.sheets.clientEmail} as an editor`
    : '';
  console.error(`Google Sheets API error ${error.code}${hint}`);
  process.exit(1);
}
