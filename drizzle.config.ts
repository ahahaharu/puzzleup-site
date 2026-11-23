import { defineConfig } from 'drizzle-kit';

// Генерация миграций из схемы: `pnpm db:generate` (базы не требует). Применяет миграции
// `pnpm db:migrate` – scripts/db-migrate.ts, без drizzle-kit (docs/architecture.md, раздел 9).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema/index.ts',
  out: './src/server/db/migrations',
  strict: true,
  verbose: true,
});
