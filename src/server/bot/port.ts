import 'server-only';

/** Кнопка под сообщением: подпись и `callback_data` (до 64 байт). */
export type Button = { text: string; data: string };
export type Keyboard = readonly (readonly Button[])[];

/** Сообщение бота: HTML-разметка Telegram, значения уже экранированы (format.ts). */
export type OutgoingMessage = { html: string; keyboard?: Keyboard | undefined };

/** Результат правки: сообщения больше нет – его удалили в чате вручную. */
export type EditResult = 'ok' | 'not_found';

/**
 * Telegram за интерфейсом (docs/conventions.md, «Серверный код»): адаптер – telegram-api.ts,
 * в тестах – фейк. Ошибки API – `TelegramApiError` с кодом, без текста запроса: в нём ПД.
 */
export type TelegramPort = {
  sendMessage(
    chatId: number,
    message: OutgoingMessage,
    options?: { replyTo?: number | undefined },
  ): Promise<{ messageId: number }>;
  editMessage(chatId: number, messageId: number, message: OutgoingMessage): Promise<EditResult>;
  editKeyboard(chatId: number, messageId: number, keyboard: Keyboard): Promise<EditResult>;
  answerCallback(callbackId: string, text?: string): Promise<void>;
};

/** Ошибка Telegram API: код ответа (`403`, `429`) или `network`. Сообщение – только код. */
export class TelegramApiError extends Error {
  override readonly name = 'TelegramApiError';
  constructor(readonly code: string) {
    super(code);
  }
}
