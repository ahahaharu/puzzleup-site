import { execFileSync } from 'node:child_process';

/**
 * Дата последнего коммита файла или папки – `lastmod` в sitemap (ТЗ страницы репетитора,
 * раздел 6). Не время изменения файла: после `git clone` в CI и Docker оно равно времени сборки,
 * и поисковики перестали бы доверять `lastmod`. Без git (или для файла вне истории) – без даты
 * (ADR-055).
 */
export function gitLastModified(path: string): Date | undefined {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', path], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return iso ? new Date(iso) : undefined;
  } catch {
    return undefined;
  }
}
