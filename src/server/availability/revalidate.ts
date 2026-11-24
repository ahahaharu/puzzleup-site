import 'server-only';

import { secretMatches } from '@/server/http';

// Внутренний эндпоинт ревалидации `POST /api/revalidate` (docs/architecture.md, разделы 4 и 9).
// Сбрасывает только кэш статусов занятости: чужой запрос с секретом ничего другого не сделает.

export const REVALIDATE_PATH = '/api/revalidate';

const bearer = (headers: Pick<Headers, 'get'>) =>
  /^Bearer (.+)$/.exec(headers.get('authorization') ?? '')?.[1] ?? null;

/** Без `INTERNAL_API_SECRET` – 404, чужой запрос – 401, иначе сброс кэша и 204. */
export function handleRevalidate(
  request: Request,
  secret: string | undefined,
  invalidate: () => void,
): Response {
  if (secret === undefined) return new Response(null, { status: 404 });
  if (!secretMatches(bearer(request.headers), secret)) return new Response(null, { status: 401 });
  invalidate();
  return new Response(null, { status: 204 });
}

/**
 * Попросить сайт сбросить кэш статусов – из процесса вне Next.js: шаг post-deploy
 * (`pnpm cache:revalidate`) и `pnpm bot:poll`. Ошибка – с кодом ответа, без тела.
 */
export async function requestRevalidation(
  siteUrl: string,
  secret: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const response = await fetcher(new URL(REVALIDATE_PATH, siteUrl), {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Revalidation failed: HTTP ${response.status}`);
}
