import { aboutName } from '@/lib/text';

// Подписи карточки отзыва – ТЗ главной, блок 6 «Карточка отзыва». «Свернуть» в ТЗ нет: кнопка
// остаётся после раскрытия, чтобы `aria-expanded` было у чего читать (ADR-044).

export const READ_MORE = 'Читать полностью';

export const READ_LESS = 'Свернуть';

// Скриншоты отзывов (ADR-062, ADR-071).

/** Имя снимка – расшифровка переписки: текст на картинке иначе недоступен дикторам и поиску. */
export const screenshotAlt = (text: string) => `Скриншот переписки: ${text}`;

/** «Скриншоты отзывов об Андрее» – имя списка снимков для дикторов. */
export const screenshotsLabel = (namePrepositional: string) =>
  `Скриншоты отзывов ${aboutName(namePrepositional)}`;

/** Кладка на странице репетитора – как у текстовых отзывов. */
export const SCREENSHOTS_MORE = 'Показать ещё';
export const SCREENSHOT_CLOSE = 'Закрыть';
