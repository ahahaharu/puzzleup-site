import 'server-only';

import { resolve } from 'node:path';

import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { seedAvailability, type TutorAvailabilitySeed } from '@/server/availability/seed';

import { createDb } from './client';

export const MIGRATIONS_FOLDER = resolve('src/server/db/migrations');

/**
 * Миграции и начальный статус занятости – одна точка для `pnpm db:migrate` и тестов
 * с Testcontainers. Возвращает id репетиторов, которым статус записан впервые.
 */
export async function migrateDb(
  url: string,
  tutors: readonly TutorAvailabilitySeed[],
): Promise<string[]> {
  const db = createDb(url);
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    return await seedAvailability(db, tutors);
  } finally {
    await db.$client.end();
  }
}
