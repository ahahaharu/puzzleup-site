/** @type {import('prettier').Config & import('@ianvs/prettier-plugin-sort-imports').PluginConfig & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  // prettier-plugin-tailwindcss должен стоять последним.
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  importOrder: ['<BUILTIN_MODULES>', '', '<THIRD_PARTY_MODULES>', '', '^@/(.*)$', '', '^[./]'],
  importOrderTypeScriptVersion: '6.0.0',
  tailwindStylesheet: './src/styles/globals.css',
};

export default config;
