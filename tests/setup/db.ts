import { randomUUID } from 'node:crypto';

import { Client } from 'pg';
import { afterAll, inject } from 'vitest';

import { createDb, type Db } from '@/server/db/client';

/**
 * Своя база для тестового файла – копия шаблона с миграциями (tests/setup/db-global.ts).
 * Файлы идут параллельно и не мешают друг другу; база удаляется после файла.
 */
export async function createTestDb(): Promise<{ db: Db; url: string }> {
  const name = `test_${randomUUID().replaceAll('-', '')}`;
  await withAdmin((admin) =>
    admin.query(`CREATE DATABASE "${name}" TEMPLATE "${inject('pgTemplate')}"`),
  );
  const url = new URL(inject('pgAdminUrl'));
  url.pathname = `/${name}`;
  const db = createDb(url.toString());

  afterAll(async () => {
    await db.$client.end();
    await withAdmin((admin) => admin.query(`DROP DATABASE "${name}" WITH (FORCE)`));
  });

  return { db, url: url.toString() };
}

async function withAdmin<T>(run: (admin: Client) => Promise<T>): Promise<T> {
  const admin = new Client({ connectionString: inject('pgAdminUrl') });
  await admin.connect();
  try {
    return await run(admin);
  } finally {
    await admin.end();
  }
}
