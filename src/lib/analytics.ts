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

/**
 * Только настроенные счётчики. Проверки упрощены и лишь отделяют настоящее значение от заглушки:
 * полную проверку делает `siteSchema` в `content:check`, а этот модуль читает и next.config.ts,
 * который запускается и без неё (`next dev`) – битый адрес не должен ронять сервер.
 */
export function resolveAnalytics(data: AnalyticsData | undefined): Analytics {
  const umami = data?.umami;
  const counterId = data?.metrika?.counterId;
  return {
    ...(umami &&
    umami.scriptUrl.startsWith('https://') &&
    URL.canParse(umami.scriptUrl) &&
    UUID.test(umami.websiteId)
      ? { umami: { scriptUrl: umami.scriptUrl, websiteId: umami.websiteId } }
      : {}),
    ...(typeof counterId === 'number' ? { metrikaId: counterId } : {}),
  };
}

/** Адреса Метрики: скрипт `tag.js`, отправка хитов и пиксель – в том числе белорусский домен. */
export const METRIKA_ORIGINS = ['https://mc.yandex.ru', 'https://mc.yandex.by'] as const;
export const METRIKA_SCRIPT_ORIGINS = [...METRIKA_ORIGINS, 'https://yastatic.net'] as const;
export const METRIKA_SCRIPT_URL = 'https://mc.yandex.ru/metrika/tag.js';

/**
 * Cookie-баннер и «Настройки cookie» – когда сайт настроен на Метрику, в том числе с заглушкой
 * номера: так баннер виден до релиза, а релиз с заглушкой не пропустит `content:check --strict`.
 * Загрузится ли Метрика на этом адресе, баннер не решает (ADR-056).
 */
export function hasCookieBanner(data: AnalyticsData | undefined): boolean {
  return data?.metrika !== undefined;
}
