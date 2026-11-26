/**
 * Счётчики из `site.json` (`analytics`). До релиза поля могут быть заглушками `[…]` – такой
 * счётчик считается ненастроенным: его скрипт не грузится и его адресов нет в CSP (ADR-056).
 * Модуль без зависимостей: его читает и next.config.ts.
 */

export type AnalyticsData = {
  umami?: { scriptUrl: string; websiteId: string } | undefined;
  metrika?: { counterId: number | string } | undefined;
};

export type Analytics = {
  umami?: { scriptUrl: string; websiteId: string };
  metrikaId?: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Только настроенные счётчики: схема пропускает либо настоящее значение, либо заглушку. */
export function resolveAnalytics(data: AnalyticsData | undefined): Analytics {
  const umami = data?.umami;
  const counterId = data?.metrika?.counterId;
  return {
    ...(umami && umami.scriptUrl.startsWith('https://') && UUID.test(umami.websiteId)
      ? { umami: { scriptUrl: umami.scriptUrl, websiteId: umami.websiteId } }
      : {}),
    ...(typeof counterId === 'number' ? { metrikaId: counterId } : {}),
  };
}

/** Адреса Метрики: скрипт `tag.js`, отправка хитов и пиксель – в том числе белорусский домен. */
export const METRIKA_ORIGINS = ['https://mc.yandex.ru', 'https://mc.yandex.by'] as const;
export const METRIKA_SCRIPT_ORIGINS = [...METRIKA_ORIGINS, 'https://yastatic.net'] as const;
export const METRIKA_SCRIPT_URL = 'https://mc.yandex.ru/metrika/tag.js';
