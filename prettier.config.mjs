/** @type {import('prettier').Config & import('@ianvs/prettier-plugin-sort-imports').PluginConfig} */
const config = {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: ['<BUILTIN_MODULES>', '', '<THIRD_PARTY_MODULES>', '', '^@/(.*)$', '', '^[./]'],
  importOrderTypeScriptVersion: '6.0.0',
};

export default config;
