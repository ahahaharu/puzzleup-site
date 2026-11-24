// `pnpm cache:revalidate [адрес]`: шаг post-deploy (docs/architecture.md, раздел 9). Сборка
// идёт без базы, и страницы в образе – со статусами занятости из MDX; запрос к
// `POST /api/revalidate` сбрасывает их кэш, и следующий посетитель получит статусы из базы.
// Адрес по умолчанию – SITE_URL; на сервере можно передать внутренний, мимо basic auth staging.
import { EnvError, parseEnv } from '@/lib/env';
import { requestRevalidation } from '@/server/availability/revalidate';
import { errorCode } from '@/server/outbox/worker';

let env;
try {
  env = parseEnv(process.env);
} catch (error) {
  if (!(error instanceof EnvError)) throw error;
  console.error(error.message);
  process.exit(1);
}
if (env.INTERNAL_API_SECRET === undefined) {
  console.error('INTERNAL_API_SECRET is not set: see .env.example');
  process.exit(1);
}

const siteUrl = process.argv[2] ?? env.SITE_URL;
try {
  await requestRevalidation(siteUrl, env.INTERNAL_API_SECRET);
} catch (error) {
  // Код ответа или сетевая ошибка с кодом Node (`ECONNREFUSED`) – без тела ответа.
  const cause = error instanceof Error && error.cause !== undefined ? error.cause : error;
  console.error(
    error instanceof Error && cause === error
      ? error.message
      : `Revalidation failed: ${errorCode(cause)}`,
  );
  process.exit(1);
}
console.log(`Availability cache revalidated at ${siteUrl}`);
