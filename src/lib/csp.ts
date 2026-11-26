import { METRIKA_ORIGINS, METRIKA_SCRIPT_ORIGINS, type Analytics } from './analytics';

/**
 * Content-Security-Policy всех ответов (docs/architecture.md, раздел 10; ADR-056). Страницы
 * статические, поэтому без nonce: Next встраивает данные страницы в `<script>`, и без
 * `'unsafe-inline'` они не выполнились бы. Внешние скрипты – только настроенных счётчиков.
 * Стили – `'unsafe-inline'`: Next и React пишут атрибуты `style`.
 */
export function contentSecurityPolicy({
  analytics,
  dev,
}: {
  analytics: Analytics;
  /** `next dev`: React нужен `eval`, обновлению модулей – WebSocket. */
  dev: boolean;
}): string {
  const umami = analytics.umami ? [new URL(analytics.umami.scriptUrl).origin] : [];
  const metrika = analytics.metrikaId === undefined ? [] : METRIKA_ORIGINS;
  const metrikaScripts = analytics.metrikaId === undefined ? [] : METRIKA_SCRIPT_ORIGINS;

  const directives: Record<string, readonly string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      ...(dev ? ["'unsafe-eval'"] : []),
      ...umami,
      ...metrikaScripts,
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', ...metrika],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...(dev ? ['ws:'] : []), ...umami, ...metrika],
    'frame-src': metrika.length > 0 ? metrika : ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${[...new Set(sources)].join(' ')}`)
    .join('; ');
}
