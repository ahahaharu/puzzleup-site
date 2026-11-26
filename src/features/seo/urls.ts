/**
 * Полный адрес страницы на боевом сайте: `absoluteUrl('https://puzzle-up.by', '/tutors/andrei')`.
 * Адрес сайта – `site.url` из `content/site.json` (ADR-055).
 */
export function absoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, `${siteUrl}/`).toString();
}
