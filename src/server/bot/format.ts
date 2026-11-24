import 'server-only';

import { GOAL_LABELS, goalSchema } from '@/lib/goal';
import {
  CONTACT_METHOD_LABELS,
  CONTACT_TIME_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  REFERRAL_CHANNEL_LABELS,
  REJECTION_REASON_LABELS,
} from '@/lib/labels';
import {
  contactTimeSchema,
  leadStatusSchema,
  referralChannelSchema,
  rejectionReasonSchema,
  type LeadStatus,
} from '@/lib/lead';
import { pluralize } from '@/lib/plural';
import { capitalize } from '@/lib/text';
import { formatDateTime, shortTime } from '@/lib/time';
import type { Lead } from '@/server/leads/domain';

import { callbackData } from './callback';
import {
  addOptions,
  manualSourceSchema,
  NO_GOAL,
  type AddDraft,
  type AddStep,
} from './commands/add-draft';
import { findTutor, type BotDirectory, type BotTutor } from './directory';
import type { Button, Keyboard, OutgoingMessage } from './port';

// Тексты сообщений бота (docs/architecture.md, раздел 6). Разметка – HTML Telegram: всё, что
// пришло от родителя или из адреса (имя, комментарий, UTM), экранируется.

export function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const line = (label: string, value: string | null | undefined) =>
  value === null || value === undefined || value === '' ? [] : [`${label}: ${escapeHtml(value)}`];

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** «Андрею» – кому адресована заявка; неизвестный id показывается как есть. */
const dative = (directory: BotDirectory, tutorId: string) =>
  findTutor(directory, tutorId)?.nameDative ?? tutorId;

const nameOf = (directory: BotDirectory, tutorId: string) =>
  findTutor(directory, tutorId)?.name ?? tutorId;

const subjectNames = (directory: BotDirectory, ids: readonly string[]) =>
  ids.map((id) => directory.subjects[id] ?? id).join(', ');

/** Заголовок: «Заявка № 1024 → Андрею», у пришедшей при «Мест нет» – пометка «лист ожидания». */
function leadTitle(lead: Lead, directory: BotDirectory) {
  const waitlist = lead.availabilityAtSubmit === 'full' ? ' · лист ожидания' : '';
  return `<b>Заявка № ${lead.id} → ${escapeHtml(dative(directory, lead.tutorId))}</b>${waitlist}`;
}

function statusLine(lead: Lead, directory: BotDirectory) {
  const status = `Статус: <b>${LEAD_STATUS_LABELS[lead.status]}</b>`;
  const by = lead.statusChangedBy;
  if (by === null || by === 'system') return status;
  const who = escapeHtml(nameOf(directory, by));
  return `${status} – ${who}, ${formatDateTime(lead.statusChangedAt.getTime())}`;
}

function contactLine(lead: Lead) {
  if (lead.contactMethod === null) return [];
  // В порядке чипов формы, а не выбора.
  const times = contactTimeSchema.options
    .filter((time) => lead.contactTime.includes(time))
    .map((time) => lower(CONTACT_TIME_LABELS[time]));
  return line('Связаться', [CONTACT_METHOD_LABELS[lead.contactMethod], ...times].join(', '));
}

function utmLine(lead: Lead) {
  const utm = [
    lead.utmSource,
    lead.utmMedium,
    lead.utmCampaign,
    lead.utmContent,
    lead.utmTerm,
  ].filter((value) => value !== null);
  return line('UTM', utm.join(' / '));
}

/**
 * Сообщение заявки в общем чате: кому адресована, статус и кто его поменял, данные родителя
 * (только здесь – в чат на двоих, ТЗ главной, раздел 8), откуда пришла. Под ним – кнопки статусов.
 */
export function leadMessage(lead: Lead, directory: BotDirectory): OutgoingMessage {
  const reason =
    lead.status === 'rejected' && lead.rejectionReason !== null
      ? line('Причина отказа', REJECTION_REASON_LABELS[lead.rejectionReason])
      : [];
  const goal = lead.goal === null ? [] : line('Цель', GOAL_LABELS[lead.goal]);
  const origin =
    lead.source === 'form'
      ? [
          ...line('Откуда на сайте', [lead.entry, lead.landingPath].filter(Boolean).join(', ')),
          ...utmLine(lead),
        ]
      : [
          ...line('Способ обращения', LEAD_SOURCE_LABELS[lead.source]),
          ...line('Откуда узнали', referralLabel(lead.utmSource)),
        ];

  const blocks = [
    [leadTitle(lead, directory), statusLine(lead, directory), ...reason],
    [
      ...line('Имя', lead.parentName),
      ...line('Телефон', lead.phone),
      ...contactLine(lead),
      ...line('Класс', String(lead.grade)),
      ...line('Предмет', subjectNames(directory, lead.subjects)),
      ...goal,
      ...line('Комментарий', lead.comment),
    ],
    [...origin, ...line('Создана', formatDateTime(lead.createdAt.getTime()))],
  ];
  return {
    html: blocks.map((block) => block.join('\n')).join('\n\n'),
    keyboard: statusKeyboard(lead.id, lead.status),
  };
}

function referralLabel(value: string | null) {
  const channel = referralChannelSchema.safeParse(value);
  return channel.success ? REFERRAL_CHANNEL_LABELS[channel.data] : value;
}

const rows = (buttons: readonly Button[], size = 2): Keyboard => {
  const result: Button[][] = [];
  for (let index = 0; index < buttons.length; index += size) {
    result.push(buttons.slice(index, index + size));
  }
  return result;
};

/** Все статусы по порядку, текущий отмечен «✓». «Отказ» сначала спрашивает причину. */
export function statusKeyboard(leadId: number, current: LeadStatus): Keyboard {
  return rows(
    leadStatusSchema.options.map((status) => ({
      text: `${status === current ? '✓ ' : ''}${capitalize(LEAD_STATUS_LABELS[status])}`,
      data:
        status === 'rejected' ? callbackData.reject(leadId) : callbackData.status(leadId, status),
    })),
  );
}

/** Причины отказа вместо кнопок статусов – ТЗ главной, раздел 8, столбец P. */
export function reasonKeyboard(leadId: number): Keyboard {
  return [
    ...rows(
      rejectionReasonSchema.options.map((reason) => ({
        text: capitalize(REJECTION_REASON_LABELS[reason]),
        data: callbackData.reason(leadId, reason),
      })),
    ),
    [{ text: '← Назад', data: callbackData.back(leadId) }],
  ];
}

/** Ответы на нажатие кнопки – всплывающая подсказка у того, кто нажал. */
export const CALLBACK_TEXTS = {
  changed: (status: LeadStatus) => `Статус: ${LEAD_STATUS_LABELS[status]}`,
  unchanged: (status: LeadStatus) => `Статус уже «${LEAD_STATUS_LABELS[status]}»`,
  notFound: 'Заявки нет: удалена по сроку хранения',
  chooseReason: 'Выберите причину отказа',
  foreignDialog: 'Эти кнопки – диалог другого репетитора',
  expiredDialog: 'Диалог устарел – начните заново: /add',
  failed: 'Не получилось. Попробуйте ещё раз',
} as const;

/** Через сколько часов в статусе «новая» бот напоминает о заявке – ТЗ главной, раздел 8. */
export const REMINDER_AFTER_HOURS = 2;

const reminderAfter = () => pluralize(REMINDER_AFTER_HOURS, ['час', 'часа', 'часов']);

/** Напоминание в общем чате – ответом на сообщение заявки. */
export function reminderMessage(lead: Lead, directory: BotDirectory): OutgoingMessage {
  return {
    html: `Заявка № ${lead.id} → ${escapeHtml(dative(directory, lead.tutorId))}: уже ${reminderAfter()} в статусе «${LEAD_STATUS_LABELS.new}».`,
  };
}

/** Предупреждение Андрею: задание outbox ушло в `dead`. Только тип, номера и код ошибки. */
export function alertMessage(job: {
  id: number;
  type: string;
  attempts: number;
  lastError: string | null;
  leadId?: number | undefined;
}): OutgoingMessage {
  return {
    html: [
      '<b>Задание не выполнено</b>',
      `Outbox № ${job.id}, ${job.type}, попыток: ${job.attempts}.`,
      ...(job.leadId === undefined ? [] : [`Заявка № ${job.leadId}.`]),
      ...line('Код ошибки', job.lastError),
    ].join('\n'),
  };
}

/** `/help` и `/start`: что умеет бот. */
export function helpMessage(directory: BotDirectory): OutgoingMessage {
  const { from, to } = directory.responseHours;
  return {
    html: [
      '<b>Что умеет бот</b>',
      '/add – добавить заявку, которая пришла напрямую: в Telegram, Viber или по звонку. Бот спросит способ обращения, класс, предмет, цель и откуда узнали. Имя и контакт не нужны.',
      '/help – эта подсказка.',
      '',
      `Статус заявки меняется кнопками под её сообщением в общем чате. Если заявка ${reminderAfter()} остаётся в статусе «${LEAD_STATUS_LABELS.new}», бот напомнит о ней – с ${shortTime(from)} до ${shortTime(to)} по Минску.`,
    ].join('\n'),
  };
}

const ADD_QUESTIONS: Record<AddStep, string> = {
  source: 'Как обратился родитель?',
  grade: 'Класс?',
  subject: 'Предмет?',
  goal: 'Цель?',
  referral: 'Откуда узнали о репетиторе?',
};

const addOptionLabel = (step: AddStep, value: string, directory: BotDirectory) =>
  capitalize(addOptionText(step, value, directory));

function addOptionText(step: AddStep, value: string, directory: BotDirectory) {
  switch (step) {
    case 'source':
      return LEAD_SOURCE_LABELS[manualSourceSchema.parse(value)];
    case 'grade':
      return value;
    case 'subject':
      return directory.subjects[value] ?? value;
    case 'goal':
      return value === NO_GOAL ? 'Не указана' : GOAL_LABELS[goalSchema.parse(value)];
    case 'referral':
      return REFERRAL_CHANNEL_LABELS[referralChannelSchema.parse(value)];
  }
}

const CANCEL: Button = { text: 'Отмена', data: callbackData.add('cancel', 'yes') };

function addSummary(tutor: BotTutor, draft: AddDraft, directory: BotDirectory) {
  return [
    `<b>Новая заявка → ${escapeHtml(tutor.nameDative)}</b>`,
    ...(draft.source === undefined
      ? []
      : line('Способ обращения', LEAD_SOURCE_LABELS[draft.source])),
    ...line('Класс', draft.grade === undefined ? undefined : String(draft.grade)),
    ...line(
      'Предмет',
      draft.subject === undefined ? undefined : subjectNames(directory, [draft.subject]),
    ),
    ...(draft.goal === undefined
      ? []
      : line('Цель', draft.goal === null ? 'не указана' : GOAL_LABELS[draft.goal])),
  ];
}

/** Вопрос шага `/add` с ответами кнопками; выше – уже выбранное. */
export function addPrompt(
  step: AddStep,
  tutor: BotTutor,
  draft: AddDraft,
  directory: BotDirectory,
): OutgoingMessage {
  const options = addOptions(step, tutor, draft).map((value) => ({
    text: addOptionLabel(step, value, directory),
    data: callbackData.add(step, value),
  }));
  return {
    html: [...addSummary(tutor, draft, directory), '', ADD_QUESTIONS[step]].join('\n'),
    keyboard: [...rows(options, step === 'grade' ? 4 : 2), [CANCEL]],
  };
}

export function addDoneMessage(
  leadId: number,
  tutor: BotTutor,
  status: LeadStatus,
): OutgoingMessage {
  return {
    html: `<b>Заявка № ${leadId} → ${escapeHtml(tutor.nameDative)}</b> добавлена со статусом «${LEAD_STATUS_LABELS[status]}». Сообщение с кнопками статусов – в общем чате.`,
  };
}

export const ADD_CANCELLED: OutgoingMessage = { html: 'Добавление заявки отменено.' };
