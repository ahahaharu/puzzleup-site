// Тексты страницы 404 дословно из ТЗ страницы репетитора, раздел 7. Подписи интерфейса, а не
// контент: не зависят от данных.

export const NOT_FOUND_TITLE = 'Этой детали здесь нет';

export const NOT_FOUND_TEXT =
  'Страница не найдена – возможно, ссылка устарела. Начните с главной или сразу выберите репетитора.';

export const NOT_FOUND_HOME = 'На главную';

export const NOT_FOUND_CTA = 'Выбрать репетитора';

/** Блок репетиторов главной с `entry=404` – откуда пришёл родитель (ТЗ главной, раздел 8). */
export const NOT_FOUND_CTA_HREF = `/?${new URLSearchParams({ entry: '404' }).toString()}#tutors`;

export const NOT_FOUND_ILLUSTRATION_LABEL = 'Пазл из четырёх деталей, одной не хватает';
