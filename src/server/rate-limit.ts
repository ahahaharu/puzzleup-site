import 'server-only';

/**
 * Ограничение частоты заявок (docs/architecture.md, раздел 5): 5 заявок за 10 минут с одного IP.
 * Адаптер – память процесса: инстанс один на окружение. Со вторым инстансом нужен адаптер
 * на Postgres (docs/decisions.md, «Открыто»). IP живёт только в памяти и не логируется.
 */
export type RateLimiter = {
  /** Засчитывает попытку; `false` – лимит исчерпан, попытка не засчитана. */
  hit(key: string, now: number): boolean;
};

export type RateLimitOptions = { limit: number; windowMs: number };

export const LEAD_RATE_LIMIT: RateLimitOptions = { limit: 5, windowMs: 10 * 60 * 1000 };

/** Больше ключей – чистка устаревших, чтобы память не росла от разовых посетителей. */
const PRUNE_AT = 10_000;

export function createMemoryRateLimiter({ limit, windowMs }: RateLimitOptions): RateLimiter {
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    for (const [key, times] of hits) {
      if (times.every((time) => time <= now - windowMs)) hits.delete(key);
    }
  }

  return {
    hit(key, now) {
      if (hits.size > PRUNE_AT) prune(now);
      const recent = (hits.get(key) ?? []).filter((time) => time > now - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}
