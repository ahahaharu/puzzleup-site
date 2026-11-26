import { aboutName } from '@/lib/text';

// Подписи карточки отзыва – ТЗ главной, блок 6 «Карточка отзыва». «Свернуть» в ТЗ нет: кнопка
// остаётся после раскрытия, чтобы `aria-expanded` было у чего читать (ADR-044).

export const READ_MORE = 'Читать полностью';

export const READ_LESS = 'Свернуть';

// Лента скриншотов отзывов (ADR-062). Подписи – только для дикторов: на экране стрелки и снимки.

/** Имя снимка – расшифровка переписки: текст на картинке иначе недоступен дикторам и поиску. */
export const screenshotAlt = (text: string) => `Скриншот переписки: ${text}`;

/** «Скриншоты отзывов об Андрее» – имя ленты. */
export const screenshotsLabel = (namePrepositional: string) =>
  `Скриншоты отзывов ${aboutName(namePrepositional)}`;

export const SCREENSHOTS_PREV = 'Предыдущие отзывы';
export const SCREENSHOTS_NEXT = 'Следующие отзывы';
export const SCREENSHOT_CLOSE = 'Закрыть';
