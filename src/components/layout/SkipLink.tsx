// Ссылка «к содержанию» – первая при переходе по Tab, видна только в фокусе (WCAG 2.4.1).

export const MAIN_ID = 'main';

export function SkipLink() {
  return (
    <a
      href={`#${MAIN_ID}`}
      className="sr-only rounded-button bg-ink px-5 text-button text-paper no-underline focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-12 focus:items-center"
    >
      Перейти к содержанию
    </a>
  );
}
