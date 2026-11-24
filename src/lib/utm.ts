/**
 * UTM-метки – ТЗ главной, раздел 8: запоминаются при первом заходе в sessionStorage и
 * подставляются в скрытые поля формы на любой странице. Без JavaScript меток нет – это допустимо.
 * Метки – не персональные данные, поэтому их можно хранить в браузере (CLAUDE.md).
 */

export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

/** Длина значения метки: столбцы Таблицы, а не тексты кампаний на страницу. */
export const UTM_MAX_LENGTH = 200;

const STORAGE_KEY = 'puzzleup:utm';

/** Метки из адреса; пустые и слишком длинные отбрасываются. */
export function utmFromSearch(search: string | URLSearchParams): Utm {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value && value.length <= UTM_MAX_LENGTH) utm[key] = value;
  }
  return utm;
}

const isEmpty = (utm: Utm) => Object.keys(utm).length === 0;

type SessionStore = Pick<Storage, 'getItem' | 'setItem'>;

function read(storage: SessionStore): Utm {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) return {};
    return utmFromSearch(
      new URLSearchParams(
        Object.entries(parsed).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
      ),
    );
  } catch {
    return {};
  }
}

/**
 * Метки первого захода в сессии: сохранённые раньше не перезаписываются. Нет меток в хранилище –
 * сохраняются метки текущего адреса. Хранилище может быть недоступно (приватный режим) – тогда
 * работают только метки адреса.
 */
export function rememberUtm(search: string, storage: SessionStore | undefined): Utm {
  const current = utmFromSearch(search);
  if (!storage) return current;
  const saved = read(storage);
  if (!isEmpty(saved)) return saved;
  if (!isEmpty(current)) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Хранилище переполнено или запрещено – метки остаются только на этой странице.
    }
  }
  return current;
}
