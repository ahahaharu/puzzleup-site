import 'server-only';

import type { Lead } from '@/server/leads/domain';

import type { BotDirectory } from './directory';
import { TelegramApiError, type EditResult, type Keyboard, type TelegramPort } from './port';

// Выдуманные данные для тестов бота (docs/conventions.md, «Тесты»).

export const directory: BotDirectory = {
  tutors: [
    {
      id: 't-anna',
      name: 'Анна',
      nameDative: 'Анне',
      archived: false,
      availability: 'available',
      subjects: [
        { id: 'math', from: 5, to: 11 },
        { id: 'physics', from: 7, to: 11 },
      ],
      goals: ['grades', 'ct'],
    },
    {
      id: 't-oleg',
      name: 'Олег',
      nameDative: 'Олегу',
      archived: false,
      availability: 'available',
      subjects: [{ id: 'math', from: 5, to: 9 }],
      goals: ['grades', 'exam9'],
    },
  ],
  subjects: { math: 'математика', physics: 'физика' },
  responseHours: { from: '09:00', to: '22:00' },
};

const CREATED = new Date('2026-11-24T11:05:00Z');

export function formLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 1024,
    createdAt: CREATED,
    tutorId: 't-anna',
    source: 'form',
    parentName: 'Мария',
    phone: '+375290000000',
    contactMethod: 'telegram',
    grade: 7,
    subjects: ['math'],
    goal: 'grades',
    contactTime: ['evening', 'morning'],
    comment: 'Сложно с дробями',
    entry: 'tutor_profile',
    landingPath: '/tutors/anna',
    utmSource: 'instagram',
    utmMedium: 'cpc',
    utmCampaign: 'winter',
    utmTerm: null,
    utmContent: null,
    availabilityAtSubmit: 'available',
    status: 'new',
    statusChangedAt: CREATED,
    statusChangedBy: 'system',
    rejectionReason: null,
    trialDoneAt: null,
    studentAt: null,
    telegramMessageId: null,
    reminderSentAt: null,
    ...overrides,
  };
}

export function manualLead(overrides: Partial<Lead> = {}): Lead {
  return formLead({
    id: 1030,
    tutorId: 't-oleg',
    source: 'viber',
    parentName: null,
    phone: null,
    contactMethod: null,
    contactTime: [],
    comment: null,
    entry: null,
    landingPath: null,
    goal: null,
    grade: 8,
    utmSource: 'word_of_mouth',
    utmMedium: null,
    utmCampaign: null,
    status: 'contacted',
    statusChangedBy: 't-oleg',
    ...overrides,
  });
}

export type FakeCall =
  | {
      method: 'sendMessage';
      chatId: number;
      html: string;
      keyboard?: Keyboard | undefined;
      replyTo?: number | undefined;
    }
  | {
      method: 'editMessage';
      chatId: number;
      messageId: number;
      html: string;
      keyboard?: Keyboard | undefined;
    }
  | { method: 'editKeyboard'; chatId: number; messageId: number; keyboard: Keyboard }
  | { method: 'answerCallback'; callbackId: string; text?: string | undefined };

/** Фейк `TelegramPort`: запоминает вызовы, номера сообщений – с 500. Сеть не трогает. */
export function fakeTelegram(options: { editResult?: EditResult; fail?: boolean } = {}) {
  const calls: FakeCall[] = [];
  let nextMessageId = 500;
  const check = () => {
    if (options.fail) throw new TelegramApiError('403');
  };
  const port: TelegramPort = {
    async sendMessage(chatId, message, { replyTo } = {}) {
      check();
      calls.push({
        method: 'sendMessage',
        chatId,
        html: message.html,
        keyboard: message.keyboard,
        replyTo,
      });
      nextMessageId += 1;
      return { messageId: nextMessageId };
    },
    async editMessage(chatId, messageId, message) {
      check();
      calls.push({
        method: 'editMessage',
        chatId,
        messageId,
        html: message.html,
        keyboard: message.keyboard,
      });
      return options.editResult ?? 'ok';
    },
    async editKeyboard(chatId, messageId, keyboard) {
      check();
      calls.push({ method: 'editKeyboard', chatId, messageId, keyboard });
      return options.editResult ?? 'ok';
    },
    async answerCallback(callbackId, text) {
      calls.push({ method: 'answerCallback', callbackId, text });
    },
  };
  return { port, calls };
}
