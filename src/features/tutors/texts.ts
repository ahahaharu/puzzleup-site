// Подписи карточки репетитора – ТЗ главной, блок 5 «Карточка репетитора»; ТЗ страницы
// репетитора, раздел 5 (кнопка при статусе «Мест нет» в карточке на главной).

export const leadLabel = (nameDative: string) => `Записаться к ${nameDative}`;

export const WAITLIST_LABEL = 'В лист ожидания';

export const MORE_LABEL = 'Подробнее';

/** «40 BYN · 60 минут»: цена – из поля `price`, занятие всегда 60 минут (ТЗ страницы репетитора, раздел 2). */
export const CURRENCY = 'BYN';
export const LESSON_LENGTH = '60 минут';

export const REVIEW_FORMS = ['отзыв', 'отзыва', 'отзывов'] as const;
