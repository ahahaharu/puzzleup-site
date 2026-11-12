// Запуск production-сборки так же, как в Docker: standalone-сервер не содержит
// статику и public, их нужно положить рядом (https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
import { cpSync, existsSync } from 'node:fs';

const standalone = '.next/standalone';

if (!existsSync(`${standalone}/server.js`)) {
  console.error('No standalone build found. Run `pnpm build` first.');
  process.exit(1);
}

cpSync('.next/static', `${standalone}/.next/static`, { recursive: true });
if (existsSync('public')) {
  cpSync('public', `${standalone}/public`, { recursive: true });
}

await import(`../${standalone}/server.js`);
