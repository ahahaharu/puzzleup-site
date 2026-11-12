import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig, globalIgnores } from 'eslint/config';

// Границы слоёв – docs/architecture.md, раздел 3. Ловит и алиас `@/server/…`,
// и относительный путь `../server/…`, поднимающийся до src/.
const layerImports = (forbidden) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          regex: `^(@/|(\\.\\./)+)(${forbidden.join('|')})(/|$)`,
          message: `This layer must not import from src/{${forbidden.join(',')}} (docs/architecture.md, section 3).`,
        },
      ],
    },
  ],
});

export default defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    'docs/**',
  ]),
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Полный recommended-набор jsx-a11y; сам плагин уже подключён в eslint-config-next.
    files: ['**/*.{js,jsx,mjs,ts,tsx}'],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // `as` – только с eslint-disable и комментарием-обоснованием (docs/conventions.md, «Код»).
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    },
  },
  {
    files: ['src/lib/**'],
    rules: layerImports(['app', 'components', 'features', 'server', 'content']),
  },
  {
    files: ['src/server/**'],
    rules: layerImports(['app', 'components', 'features']),
  },
]);
