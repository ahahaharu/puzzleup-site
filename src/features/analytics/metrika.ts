import { METRIKA_SCRIPT_URL } from '@/lib/analytics';

// Яндекс Метрика – только после «Принять» (ТЗ главной, «Глобальные элементы»). Код счётчика –
// тот же, что в стандартном фрагменте Метрики, но без встроенного `<script>`: очередь `ym`
// и `tag.js` подключаются из бандла (ADR-056).

type Ym = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number };

declare global {
  interface Window {
    ym?: Ym;
  }
}

/**
 * Вебвизор выключен: он записывает ввод в полях, а в форме заявки – имя и телефон. Карта кликов,
 * внешние ссылки и точный показатель отказов персональных данных не передают.
 */
export const METRIKA_OPTIONS = {
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: false,
} as const;

/** Очередь вызовов до загрузки `tag.js`: он заберёт их из `ym.a`. */
function ym(): Ym {
  if (window.ym) return window.ym;
  const queue: Ym = Object.assign(
    (...args: unknown[]) => {
      (queue.a ??= []).push(args);
    },
    { l: Date.now() },
  );
  window.ym = queue;
  return queue;
}

export function loadMetrika(counterId: number) {
  if (document.querySelector(`script[src="${METRIKA_SCRIPT_URL}"]`)) return;
  ym()(counterId, 'init', METRIKA_OPTIONS);
  const script = document.createElement('script');
  script.async = true;
  script.src = METRIKA_SCRIPT_URL;
  document.head.append(script);
}

/** Переход внутри сайта без перезагрузки: Метрика сама видит только первую загрузку. */
export function metrikaHit(counterId: number, url: string, referer: string) {
  window.ym?.(counterId, 'hit', url, { referer });
}

/**
 * Отзыв согласия: cookie и записи Метрики `_ym…` удаляются, страница перезагружается –
 * загруженный `tag.js` иначе продолжил бы работать. Cookie Метрика ставит на домен сайта
 * с точкой, поэтому удаляются все варианты домена.
 */
export function forgetMetrika() {
  clearMetrikaData();
  window.location.reload();
}

export function clearMetrikaData() {
  const parts = window.location.hostname.split('.');
  const domains = [''];
  for (let index = 0; index < parts.length - 1; index += 1) {
    const domain = parts.slice(index).join('.');
    domains.push(`; domain=${domain}`, `; domain=.${domain}`);
  }
  for (const cookie of document.cookie.split('; ')) {
    const name = cookie.split('=')[0] ?? '';
    if (!name.startsWith('_ym')) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; max-age=0; path=/${domain}`;
    }
  }
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('_ym')) window.localStorage.removeItem(key);
    }
  } catch {
    // Без доступа к хранилищу записей Метрики там тоже нет.
  }
}
