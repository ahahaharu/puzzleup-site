import 'server-only';

import { createHash, timingSafeEqual } from 'node:crypto';

import { entrySchema, type Entry } from '@/lib/entry';
import { utmFromSearch, type Utm } from '@/lib/utm';

// Проверки запроса Server Action (docs/architecture.md, разделы 5 и 10).

type HeaderSource = Pick<Headers, 'get'>;

/**
 * IP посетителя для rate limit. `X-Forwarded-For` выставляет Caddy; последний адрес в списке –
 * тот, что добавил ближайший к приложению прокси, его не подделать из браузера.
 */
export function clientIp(headers: HeaderSource): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
}

// Сравнение хешей: одинаковая длина и время сравнения не выдают длину и начало секрета.
const digest = (value: string) => createHash('sha256').update(value).digest();

/** Секрет из заголовка совпадает с ожидаемым; нет заголовка – нет. */
export function secretMatches(received: string | null, secret: string): boolean {
  return received !== null && timingSafeEqual(digest(received), digest(secret));
}

/** Запрос пришёл со страницы этого же сайта: `Origin` совпадает с `SITE_URL`. */
export function isSameOrigin(headers: HeaderSource, siteUrl: string): boolean {
  const origin = headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}

/**
 * Контекст из адреса страницы с формой, если скрытые поля пусты: без JavaScript статическая
 * страница не подставляет `entry` и UTM из адреса, а `Referer` своего сайта приходит целиком.
 */
export function contextFromReferer(
  headers: HeaderSource,
  siteUrl: string,
): { entry?: Entry; utm: Utm } {
  const referer = headers.get('referer');
  if (!referer) return { utm: {} };
  try {
    const url = new URL(referer);
    if (url.origin !== new URL(siteUrl).origin) return { utm: {} };
    const entry = entrySchema.safeParse(url.searchParams.get('entry'));
    return {
      ...(entry.success ? { entry: entry.data } : {}),
      utm: utmFromSearch(url.searchParams),
    };
  } catch {
    return { utm: {} };
  }
}
