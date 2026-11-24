import { fileURLToPath } from 'node:url';

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Вне Next модуль `server-only` бросает исключение; пустая версия – та, что Next берёт для
// серверного кода (условие react-server). Юнит-тесты src/server идут в Node без Next.
const SERVER_ONLY_EMPTY = fileURLToPath(
  new URL('./node_modules/server-only/empty.js', import.meta.url),
);

// Проекты (docs/conventions.md, «Тесты»): юнит в Node, компоненты в настоящем Chromium,
// интеграционные с Postgres в Testcontainers (`pnpm test:int`, нужен Docker).
// Компонентный тест – `*.browser.test.tsx`, интеграционный – `*.int.test.ts` рядом с кодом.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'content-collections': fileURLToPath(
        new URL('./.content-collections/generated', import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        resolve: { alias: { 'server-only': SERVER_ONLY_EMPTY } },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['**/*.int.test.ts', '**/*.browser.test.tsx', 'node_modules/**'],
          globalSetup: ['./tests/setup/content.ts'],
        },
      },
      {
        extends: true,
        resolve: { alias: { 'server-only': SERVER_ONLY_EMPTY } },
        test: {
          name: 'int',
          environment: 'node',
          include: ['src/**/*.int.test.ts'],
          globalSetup: ['./tests/setup/db-global.ts'],
          // Первый запуск скачивает образ Postgres.
          hookTimeout: 120_000,
        },
      },
      {
        extends: true,
        // next/link читает process.env.__NEXT_*, которого в браузере нет; пустой объект – значения по умолчанию.
        define: { 'process.env': '{}' },
        resolve: {
          alias: {
            'next/image': fileURLToPath(new URL('./tests/setup/next-image.tsx', import.meta.url)),
          },
        },
        // Зависимости собираются заранее: иначе Vite находит их посреди прогона, перезагружает
        // страницу тестов и роняет уже запущенные файлы – на CI кэша нет, так было бы каждый раз.
        optimizeDeps: {
          include: [
            'next/dist/shared/lib/image-external',
            'next/link',
            'react',
            'react/jsx-dev-runtime',
            'react-dom/client',
            'vitest-browser-react',
          ],
        },
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.tsx'],
          setupFiles: ['./tests/setup/browser.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            // Ширина телефона из ДС: компоненты проверяются в мобильной раскладке.
            viewport: { width: 360, height: 740 },
          },
        },
      },
    ],
  },
});
