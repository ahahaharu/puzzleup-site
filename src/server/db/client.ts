import 'server-only';

import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema> & { $client: Pool };

/**
 * Клиент базы поверх пула `pg`. Доменный код получает `Db` параметром
 * (docs/conventions.md, «Серверный код»), тесты передают базу из Testcontainers.
 */
export function createDb(url: string): Db {
  return drizzle({ client: new Pool({ connectionString: url, max: 10 }), schema });
}

let shared: Db | undefined;

/** Общий клиент процесса для точек входа: Server Action, Route Handler, воркер. */
export async function getDb(): Promise<Db> {
  if (shared === undefined) {
    // Окружение читается здесь, а не при импорте: модуль импортируют и скрипты, и тесты.
    const { env } = await import('@/server/env');
    if (env.DATABASE_URL === undefined) {
      throw new Error('DATABASE_URL is not set: start Postgres with `pnpm db:up`');
    }
    shared = createDb(env.DATABASE_URL);
  }
  return shared;
}
