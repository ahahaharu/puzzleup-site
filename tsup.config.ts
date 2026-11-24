import { defineConfig } from 'tsup';

// Сборка воркера в один файл `dist/worker.js` (docs/architecture.md, раздел 9): в образе рядом
// со standalone-выводом Next, у которого нет полного node_modules, поэтому зависимости
// вшиваются в бандл.
export default defineConfig({
  entry: { worker: 'worker/index.ts' },
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node26',
  bundle: true,
  noExternal: [/.*/],
  // Необязательный нативный драйвер pg: без него pg работает на чистом JS.
  external: ['pg-native'],
  splitting: false,
  sourcemap: true,
  clean: true,
  // CJS-зависимости (pg) вызывают `require` встроенных модулей – в ESM-бандле его нет.
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  esbuildOptions(options) {
    // Как у Next для серверного кода: `server-only` становится пустым модулем.
    options.conditions = ['react-server'];
  },
});
