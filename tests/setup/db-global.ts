import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';

import { migrateDb } from '@/server/db/migrate';

declare module 'vitest' {
  export interface ProvidedContext {
    /** Строка подключения к служебной базе `postgres` контейнера – для CREATE DATABASE. */
    pgAdminUrl: string;
    /** Имя базы-шаблона с применёнными миграциями. */
    pgTemplate: string;
  }
}

const TEMPLATE = 'puzzleup_template';

let container: StartedPostgreSqlContainer | undefined;

/**
 * Один Postgres на прогон интеграционных тестов: миграции применяются один раз в базу-шаблон,
 * каждый тестовый файл получает свою копию (tests/setup/db.ts). Образ – тот же, что в
 * docker/compose.dev.yml.
 */
export async function setup(project: TestProject) {
  container = await new PostgreSqlContainer('postgres:18.7-alpine').withDatabase(TEMPLATE).start();
  // Без репетиторов: статус занятости каждый тест заполняет сам.
  await migrateDb(container.getConnectionUri(), []);

  const admin = new URL(container.getConnectionUri());
  admin.pathname = '/postgres';
  project.provide('pgAdminUrl', admin.toString());
  project.provide('pgTemplate', TEMPLATE);
}

export async function teardown() {
  await container?.stop();
}
