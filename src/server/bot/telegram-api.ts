import 'server-only';

import { Api, GrammyError, HttpError } from 'grammy';
import type { InlineKeyboardMarkup } from 'grammy/types';

import {
  TelegramApiError,
  type EditResult,
  type Keyboard,
  type OutgoingMessage,
  type TelegramPort,
} from './port';

/**
 * Адаптер `TelegramPort` на клиенте grammY (`Api`). Ошибки grammY не выпускаются наружу:
 * в `GrammyError.payload` лежит текст сообщения с именем и телефоном, а ошибка доходит до логов.
 */
const REQUEST_TIMEOUT_S = 20;

export function createTelegramApi(token: string): TelegramPort {
  // Меньше тайм-аута обработчика outbox (30 с): запрос обрывается раньше, чем воркер сочтёт
  // попытку неудачной и отправит сообщение повторно.
  const api = new Api(token, { timeoutSeconds: REQUEST_TIMEOUT_S });
  return {
    async sendMessage(chatId, message, options = {}) {
      const sent = await call(() =>
        api.sendMessage(chatId, message.html, {
          ...messageOptions(message),
          ...(options.replyTo !== undefined && {
            reply_parameters: { message_id: options.replyTo, allow_sending_without_reply: true },
          }),
        }),
      );
      return { messageId: sent.message_id };
    },
    editMessage: (chatId, messageId, message) =>
      edit(() => api.editMessageText(chatId, messageId, message.html, messageOptions(message))),
    editKeyboard: (chatId, messageId, keyboard) =>
      edit(() => api.editMessageReplyMarkup(chatId, messageId, { reply_markup: markup(keyboard) })),
    async answerCallback(callbackId, text) {
      await call(() => api.answerCallbackQuery(callbackId, text === undefined ? {} : { text }));
    },
  };
}

function markup(keyboard: Keyboard = []): InlineKeyboardMarkup {
  return {
    inline_keyboard: keyboard.map((row) =>
      row.map((button) => ({ text: button.text, callback_data: button.data })),
    ),
  };
}

const messageOptions = (message: OutgoingMessage) => ({
  parse_mode: 'HTML' as const,
  link_preview_options: { is_disabled: true },
  reply_markup: markup(message.keyboard),
});

async function call<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof GrammyError) throw new TelegramApiError(String(error.error_code));
    if (error instanceof HttpError) throw new TelegramApiError('network');
    throw error;
  }
}

// Описания ошибок Telegram API – стабильные строки, по ним видно, что произошло с сообщением.
const NOT_MODIFIED = 'message is not modified';
const NOT_FOUND = /message to edit not found|message can't be edited/;

async function edit(request: () => Promise<unknown>): Promise<EditResult> {
  try {
    await request();
    return 'ok';
  } catch (error) {
    if (error instanceof GrammyError && error.error_code === 400) {
      // Тот же текст и те же кнопки – правка уже сделана (повтор задания).
      if (error.description.includes(NOT_MODIFIED)) return 'ok';
      if (NOT_FOUND.test(error.description)) return 'not_found';
    }
    return call(() => Promise.reject(error));
  }
}
