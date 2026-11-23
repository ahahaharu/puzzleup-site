// `pnpm db:migrate`: применяет миграции src/server/db/migrations и заполняет начальный статус
// занятости новых репетиторов из content/ (docs/data-model.md, `tutor_availability`).
// Идемпотентен: деплой запускает его перед каждым стартом (docs/architecture.md, раздел 9).
import { resolve } from 'node:path';

import { createBuilder } from '@content-collections/core';

import { migrateDb } from '@/server/db/migrate';

const url = process.env.DATABASE_URL;
if (url === undefined || url === '') {
  console.error('DATABASE_URL is not set: see .env.example, local Postgres – `pnpm db:up`');
  process.exit(1);
}

// Загрузчик контента читает сгенерированный модуль Content Collections – собираем его заранее.
await (await createBuilder(resolve('content-collections.ts'))).build();
const { getTutors } = await import('@/content');

const seeded = await migrateDb(url, getTutors());
console.log(
  seeded.length > 0 ? `Migrated; availability seeded for ${seeded.join(', ')}` : 'Migrated',
);
