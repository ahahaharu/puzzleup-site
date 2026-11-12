import { fileURLToPath } from 'node:url';

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Два проекта (docs/conventions.md, «Тесты»): юнит в Node и компоненты в настоящем Chromium.
// Компонентный тест – `*.browser.test.tsx` рядом с компонентом.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['**/*.int.test.ts', '**/*.browser.test.tsx', 'node_modules/**'],
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
