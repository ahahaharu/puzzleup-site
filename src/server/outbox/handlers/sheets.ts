import 'server-only';

import type { Db } from '@/server/db/client';
import { findLead } from '@/server/leads/repository';
import type { SheetsPort } from '@/server/sheets/port';
import { leadRow, type SheetsDirectory } from '@/server/sheets/row';
import { upsertRow } from '@/server/sheets/upsert';

import { OutboxJobError, type OutboxHandlers } from '../worker';

export type SheetsHandlersDeps = { db: Db; sheets: SheetsPort; directory: SheetsDirectory };

/**
 * `sheets.upsert` (docs/architecture.md, раздел 5): строка заявки читается из базы в момент
 * выполнения, поэтому в Таблицу попадает последний статус, даже если задания шли не по порядку.
 * Заявки, удалённой по сроку хранения, нет – строка в Таблице остаётся как была.
 */
export function sheetsHandlers({ db, sheets, directory }: SheetsHandlersDeps): OutboxHandlers {
  return {
    async 'sheets.upsert'(job, signal) {
      const id = job.payload.leadId;
      if (typeof id !== 'number') throw new OutboxJobError('bad_payload');
      const lead = await findLead(db, id);
      if (!lead) return;
      await upsertRow(sheets, leadRow(lead, directory), signal);
    },
  };
}
