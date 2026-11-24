import 'server-only';

import { cacheLife, cacheTag, revalidateTag } from 'next/cache';

import type { AvailabilityMap } from '@/lib/availability';
import { getDb, type Db } from '@/server/db/client';
import { errorCode } from '@/server/outbox/worker';

import { listAvailability } from './repository';

// Статус занятости на статических страницах (docs/architecture.md, раздел 4; ADR-053).

export const AVAILABILITY_TAG = 'availability';

/**
 * Статусы из `tutor_availability` для главной и страниц репетиторов. Кэш сбрасывает `/status`
 * и post-deploy ревалидация. Без базы – при сборке в CI и Docker или если она упала – пустой
 * ответ: страницы покажут начальные статусы из MDX и спросят базу снова через минуту.
 */
export async function getAvailability(): Promise<AvailabilityMap> {
  'use cache';
  cacheTag(AVAILABILITY_TAG);
  const statuses = await readAvailability(siteDb, (code) =>
    console.error(JSON.stringify({ scope: 'availability', event: 'read_failed', code })),
  );
  if (statuses === undefined) {
    cacheLife('minutes');
    return {};
  }
  cacheLife('max');
  return statuses;
}

/** База из окружения сайта; без `DATABASE_URL` – `undefined`, это не ошибка. */
async function siteDb(): Promise<Db | undefined> {
  const { env } = await import('@/server/env');
  return env.DATABASE_URL === undefined ? undefined : getDb();
}

/** Статусы из базы или `undefined`, если её нет или запрос упал (в лог – код ошибки). */
export async function readAvailability(
  db: () => Promise<Db | undefined>,
  log: (code: string) => void,
): Promise<AvailabilityMap | undefined> {
  try {
    const client = await db();
    return client === undefined ? undefined : await listAvailability(client);
  } catch (error) {
    log(errorCode(error));
    return undefined;
  }
}

/**
 * Сброс кэша статусов и страниц с ними. `updateTag` работает только в Server Actions, а сброс
 * зовут вебхук бота и эндпоинт ревалидации: `{ expire: 0 }` – следующий запрос получит
 * новый статус, а не старую страницу.
 */
export function invalidateAvailability(): void {
  revalidateTag(AVAILABILITY_TAG, { expire: 0 });
}
