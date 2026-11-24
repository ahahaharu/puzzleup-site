import { plural } from '@/lib/plural';
import { capitalize } from '@/lib/text';

// Тексты формы заявки дословно из ТЗ главной, блок 9 («Поля по порядку», «Проверка полей»,
// «Экран «Спасибо»») и ТЗ страницы репетитора, блок 6. Имя и падежи – из файла репетитора.

const NBSP = ' ';

// --- Поля ---

export const LABEL_NAME = 'Имя родителя';
export const LABEL_PHONE = 'Телефон';
export const LABEL_CONTACT = 'Как с вами связаться?';
export const LABEL_GRADE = 'Класс';
export const LABEL_SUBJECTS = 'Предмет';
export const LABEL_GOAL = 'Цель';
export const LABEL_CONTACT_TIME = 'Когда удобно связаться';
export const LABEL_COMMENT = 'Комментарий';
export const COMMENT_HINT = 'Не указывайте сведения о здоровье ребёнка';
export const DETAILS_TOGGLE = 'Добавить подробности (необязательно)';
export const SUBMIT = 'Записаться на пробное занятие';

/** Счётчик комментария – с 800 символов. */
export const commentCounter = (length: number, max: number) => `${length} / ${max}`;

/**
 * Подсказка о предмете, который в школе начинается позже выбранного класса (ТЗ главной, блок 9,
 * поле 5): «Физика в школе начинается с 7 класса. Если нужно раньше – обсудим на пробном занятии.»
 */
export const earlySubjectHint = (name: string, gradeFrom: number) =>
  `${capitalize(name)} в школе начинается с ${gradeFrom}${NBSP}класса. Если нужно раньше – обсудим на пробном занятии.`;

// --- Ошибки (ТЗ главной, блок 9, «Проверка полей») ---

export const ERRORS = {
  nameEmpty: 'Укажите, как к вам обращаться',
  nameInvalid: 'Имя может содержать только буквы, пробел и дефис',
  phoneEmpty: 'Укажите номер телефона',
  phoneIncomplete: 'Проверьте номер: +375 и 9 цифр, например +375 (29) 123-45-67',
  phoneUnknownCode: 'Укажите мобильный номер с кодом 25, 29, 33 или 44',
  contactEmpty: 'Выберите, где вам удобнее общаться',
  gradeEmpty: 'Выберите класс',
  subjectsEmpty: 'Выберите хотя бы один предмет',
  consentMissing: 'Без согласия репетиторы не смогут обработать заявку',
  commentTooLong: 'Комментарий – не длиннее 1000 символов',
} as const;

export const SERVER_ERROR =
  'Не удалось отправить заявку. Проверьте интернет и попробуйте ещё раз – или напишите репетитору в Telegram или Viber.';
export const RATE_LIMIT_ERROR =
  'Слишком много попыток подряд. Попробуйте через минуту или напишите репетитору в мессенджер.';

/** Объявление через `aria-live` при отправке с ошибками: «В форме 2 ошибки». */
export const errorCount = (count: number) =>
  `В форме ${count}${NBSP}${plural(count, ['ошибка', 'ошибки', 'ошибок'])}`;

// --- Экран «Спасибо» ---

export const THANKS_TITLE = 'Заявка принята!';
export const THANKS_AGAIN = 'Отправить ещё одну заявку';

type ThanksText = {
  name: string;
  contactMethod: 'telegram' | 'viber' | 'call';
  /** «9:00» – начало часов ответа. */
  from: string;
};

/** «Андрей скоро напишет вам в Telegram.»; при звонке – «Андрей скоро позвонит вам.» */
export function thanksDay({ name, contactMethod }: Omit<ThanksText, 'from'>): string {
  return contactMethod === 'call'
    ? `${name} скоро позвонит вам.`
    : `${name} скоро напишет вам в ${messenger(contactMethod)}.`;
}

/** «Сейчас Андрей не на связи – напишет вам в Telegram после 9:00.» */
export function thanksNight({ name, contactMethod, from }: ThanksText): string {
  const action =
    contactMethod === 'call' ? 'позвонит вам' : `напишет вам в ${messenger(contactMethod)}`;
  return `Сейчас ${name} не на связи – ${action} после ${from}.`;
}

const messenger = (method: 'telegram' | 'viber') => (method === 'telegram' ? 'Telegram' : 'Viber');
