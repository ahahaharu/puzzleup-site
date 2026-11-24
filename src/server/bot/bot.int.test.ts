import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestDb } from '../../../tests/setup/db';
import type { Db } from '../db/client';
import { botDialogs, leads, outbox, tutorAvailability } from '../db/schema';
import { createLead } from '../leads/service';
import { handleUpdate } from './bot';
import { callbackData } from './callback';
import type { BotDeps } from './deps';
import { directory, fakeTelegram, type FakeCall } from './fixtures';
import { CALLBACK_TEXTS } from './format';
import type { Keyboard } from './port';

let db: Db;

beforeAll(async () => {
  ({ db } = await createTestDb());
});

// Выдуманные ID: 11 – Анна, 22 – Олег, 33 – посторонний; -100 – общий чат.
const ANNA = 11;
const OLEG = 22;
const STRANGER = 33;
const LEADS_CHAT = -100;

let now = Date.parse('2026-11-24T12:00:00Z');
let telegram: ReturnType<typeof fakeTelegram>;
let logs: { event: string; fields: Record<string, string | number> }[];
let deps: BotDeps;
let invalidations: number;

beforeEach(() => {
  telegram = fakeTelegram();
  logs = [];
  invalidations = 0;
  deps = {
    db,
    clock: { now: () => now },
    telegram: telegram.port,
    access: { leadsChatId: LEADS_CHAT, tutors: { [ANNA]: 't-anna', [OLEG]: 't-oleg' } },
    directory,
    log: (event, fields) => logs.push({ event, fields }),
    invalidateAvailability: async () => {
      invalidations += 1;
    },
  };
});

let updateId = 1;
const groupChat = { id: LEADS_CHAT, type: 'supergroup' };
const privateChat = (userId: number) => ({ id: userId, type: 'private' });

const message = (from: number, text: string, chat = groupChat) => ({
  update_id: updateId++,
  message: { message_id: 1, chat, from: { id: from }, text },
});

const press = (from: number, data: string, messageId = 700, chat = groupChat) => ({
  update_id: updateId++,
  callback_query: {
    id: `cb${updateId}`,
    from: { id: from },
    data,
    message: { message_id: messageId, chat },
  },
});

const toast = (calls: FakeCall[]) =>
  calls.findLast((call) => call.method === 'answerCallback')?.text;

const newLead = async () =>
  (
    await createLead(db, {
      tutorId: 't-anna',
      parentName: 'Мария',
      phone: '+375290000000',
      contactMethod: 'call',
      grade: 7,
      subjects: ['math'],
      contactTime: [],
      entry: 'hero',
      landingPath: '/',
      utm: {},
      initialAvailability: 'available',
      consent: { version: '2026-11-12', textSha256: 'a'.repeat(64) },
    })
  ).id;

const leadRow = async (id: number) => (await db.select().from(leads).where(eq(leads.id, id)))[0];

describe('access', () => {
  it('ignores users outside the whitelist and chats other than the shared one', async () => {
    const id = await newLead();
    await handleUpdate(message(STRANGER, '/help', privateChat(STRANGER)), deps);
    await handleUpdate(message(ANNA, '/help', { id: -999, type: 'group' }), deps);
    await handleUpdate(message(ANNA, '/help', privateChat(OLEG)), deps);
    await handleUpdate(press(STRANGER, callbackData.status(id, 'contacted')), deps);

    expect(telegram.calls).toEqual([]);
    expect((await leadRow(id))?.status).toBe('new');
  });

  it('ignores status buttons outside the shared chat', async () => {
    const id = await newLead();
    await handleUpdate(
      press(ANNA, callbackData.status(id, 'contacted'), 1, privateChat(ANNA)),
      deps,
    );
    expect((await leadRow(id))?.status).toBe('new');
    expect(telegram.calls).toEqual([{ method: 'answerCallback', callbackId: expect.any(String) }]);
  });

  it('logs a malformed update without its content', async () => {
    await handleUpdate({ message: { text: 'Мария, +375290000000' } }, deps);
    expect(logs).toEqual([{ event: 'bad_update', fields: {} }]);
  });
});

describe('commands', () => {
  it.each([
    ['/help', groupChat],
    ['/help@puzzleup_bot', groupChat],
    ['/start', privateChat(OLEG)],
  ])('answers %s with the command list', async (text, chat) => {
    await handleUpdate(message(OLEG, text, chat), deps);
    expect(telegram.calls).toEqual([
      expect.objectContaining({
        method: 'sendMessage',
        chatId: chat.id,
        html: expect.stringContaining('/add'),
      }),
    ]);
  });

  it('ignores plain text and unknown commands', async () => {
    await handleUpdate(message(ANNA, 'привет'), deps);
    await handleUpdate(message(ANNA, '/stats'), deps);
    expect(telegram.calls).toEqual([]);
  });
});

describe('status buttons', () => {
  it('changes the status, remembers who pressed and queues the message edit', async () => {
    const id = await newLead();
    await handleUpdate(press(OLEG, callbackData.status(id, 'contacted')), deps);

    expect(await leadRow(id)).toMatchObject({ status: 'contacted', statusChangedBy: 't-oleg' });
    expect(toast(telegram.calls)).toBe('Статус: связался');
    const jobs = await db
      .select({ type: outbox.type })
      .from(outbox)
      .where(eq(outbox.payload, { leadId: id }));
    expect(jobs.map((job) => job.type)).toContain('telegram.lead_updated');

    await handleUpdate(press(OLEG, callbackData.status(id, 'contacted')), deps);
    expect(toast(telegram.calls)).toBe('Статус уже «связался»');
  });

  it('asks the rejection reason, then stores it', async () => {
    const id = await newLead();
    await handleUpdate(press(ANNA, callbackData.reject(id)), deps);
    expect(telegram.calls[0]).toMatchObject({
      method: 'editKeyboard',
      chatId: LEADS_CHAT,
      messageId: 700,
    });
    expect(JSON.stringify(telegram.calls[0])).toContain(callbackData.reason(id, 'expensive'));
    expect(toast(telegram.calls)).toBe(CALLBACK_TEXTS.chooseReason);
    expect((await leadRow(id))?.status).toBe('new');

    await handleUpdate(press(ANNA, callbackData.reason(id, 'expensive')), deps);
    expect(await leadRow(id)).toMatchObject({ status: 'rejected', rejectionReason: 'expensive' });
  });

  it('brings the status buttons back on «Назад» and on the same reason', async () => {
    const id = await newLead();
    await handleUpdate(press(ANNA, callbackData.back(id)), deps);
    await handleUpdate(press(ANNA, callbackData.reason(id, 'other')), deps);
    telegram.calls.length = 0;
    await handleUpdate(press(ANNA, callbackData.reason(id, 'other')), deps);

    expect(telegram.calls[0]).toMatchObject({ method: 'editKeyboard' });
    expect(JSON.stringify(telegram.calls[0])).toContain('✓ Отказ');
  });

  it('tells that a deleted lead is gone', async () => {
    await handleUpdate(press(ANNA, callbackData.status(999_999, 'contacted')), deps);
    expect(toast(telegram.calls)).toBe(CALLBACK_TEXTS.notFound);
  });

  it('logs the error code and answers the button when Telegram fails', async () => {
    telegram = fakeTelegram({ fail: true });
    deps.telegram = telegram.port;
    const id = await newLead();
    await handleUpdate(press(ANNA, callbackData.reject(id)), deps);

    expect(logs).toEqual([
      {
        event: 'update_failed',
        fields: { updateId: expect.any(Number), code: 'TelegramApiError:403' },
      },
    ]);
    expect(toast(telegram.calls)).toBe(CALLBACK_TEXTS.failed);
  });
});

describe('/add', () => {
  const lastSent = () => telegram.calls.findLast((call) => call.method === 'sendMessage');
  const start = async (userId: number, chat = groupChat) => {
    await handleUpdate(message(userId, '/add', chat), deps);
    const sent = lastSent();
    if (!sent) throw new Error('no prompt');
    return 500 + telegram.calls.filter((call) => call.method === 'sendMessage').length;
  };

  it('walks through the questions and adds a lead without contacts', async () => {
    const prompt = await start(OLEG, privateChat(OLEG));
    expect(lastSent()?.html).toContain('Как обратился родитель?');
    const chat = privateChat(OLEG);
    for (const [step, value] of [
      ['source', 'viber'],
      ['grade', '8'],
      ['goal', 'exam9'],
      ['referral', 'instagram'],
    ] as const) {
      await handleUpdate(press(OLEG, callbackData.add(step, value), prompt, chat), deps);
    }
    // Повторная доставка последнего нажатия не создаёт вторую заявку.
    await handleUpdate(press(OLEG, callbackData.add('referral', 'instagram'), prompt, chat), deps);

    const added = await db.select().from(leads).where(eq(leads.tutorId, 't-oleg'));
    expect(added).toEqual([
      expect.objectContaining({
        source: 'viber',
        grade: 8,
        subjects: ['math'],
        goal: 'exam9',
        utmSource: 'instagram',
        parentName: null,
        phone: null,
        status: 'contacted',
        statusChangedBy: 't-oleg',
      }),
    ]);
    const edits = telegram.calls.filter((call) => call.method === 'editMessage');
    expect(edits.map((edit) => edit.html.split('\n').at(-1))).toEqual([
      'Класс?',
      'Цель?',
      'Откуда узнали о репетиторе?',
      expect.stringContaining(`Заявка № ${added[0]?.id} → Олегу</b> добавлена`),
    ]);
    expect(await db.select().from(botDialogs)).toEqual([]);
  });

  it('ignores a button of a step that has passed', async () => {
    const prompt = await start(ANNA);
    await handleUpdate(press(ANNA, callbackData.add('source', 'call'), prompt), deps);
    await handleUpdate(press(ANNA, callbackData.add('source', 'viber'), prompt), deps);
    const [dialog] = await db.select().from(botDialogs);
    expect(dialog).toMatchObject({ step: 'grade', data: { source: 'call' } });
    await handleUpdate(press(ANNA, callbackData.add('cancel', 'yes'), prompt), deps);
  });

  it('keeps the dialog to its author', async () => {
    const prompt = await start(ANNA);
    await handleUpdate(press(OLEG, callbackData.add('source', 'call'), prompt), deps);
    expect(toast(telegram.calls)).toBe(CALLBACK_TEXTS.foreignDialog);
    expect((await db.select().from(botDialogs))[0]?.step).toBe('source');
    await handleUpdate(press(ANNA, callbackData.add('cancel', 'yes'), prompt), deps);
  });

  it('cancels', async () => {
    const prompt = await start(ANNA);
    await handleUpdate(press(ANNA, callbackData.add('cancel', 'yes'), prompt), deps);
    expect(telegram.calls.at(-2)).toMatchObject({
      method: 'editMessage',
      html: 'Добавление заявки отменено.',
    });
    expect(await db.select().from(botDialogs)).toEqual([]);
  });

  it('expires after 30 minutes and after a new /add', async () => {
    const first = await start(ANNA);
    const second = await start(ANNA);
    await handleUpdate(press(ANNA, callbackData.add('source', 'call'), first), deps);
    expect(toast(telegram.calls)).toBe(CALLBACK_TEXTS.expiredDialog);

    now += 30 * 60_000;
    await handleUpdate(press(ANNA, callbackData.add('source', 'call'), second), deps);
    expect(toast(telegram.calls)).toBe(CALLBACK_TEXTS.expiredDialog);
    expect(await db.select().from(botDialogs)).toEqual([]);
  });
});

describe('/status', () => {
  const sent = () => telegram.calls.findLast((call) => call.method === 'sendMessage');
  const edited = () => telegram.calls.findLast((call) => call.method === 'editMessage');
  const checked = (keyboard: Keyboard | undefined) =>
    keyboard?.flat().find((button) => button.text.startsWith('✓'))?.text;
  const stored = async (tutorId: string) =>
    (await db.select().from(tutorAvailability).where(eq(tutorAvailability.tutorId, tutorId)))[0];

  it('shows the initial status from MDX while the table has no row', async () => {
    await handleUpdate(message(ANNA, '/status', privateChat(ANNA)), deps);
    expect(sent()).toMatchObject({ chatId: ANNA, html: expect.stringContaining('Анна') });
    expect(sent()?.html).toContain('Сейчас на сайте: «Есть свободное время».');
    expect(checked(sent()?.keyboard)).toBe('✓ Есть свободное время');
  });

  it('stores the chosen status, refreshes the site and the message', async () => {
    await handleUpdate(press(ANNA, callbackData.availability('t-anna', 'full'), 501), deps);

    expect(await stored('t-anna')).toMatchObject({ status: 'full', updatedBy: 't-anna' });
    expect(invalidations).toBe(1);
    expect(edited()).toMatchObject({ chatId: LEADS_CHAT, messageId: 501 });
    expect(edited()?.html).toContain('Сейчас на сайте: «Мест нет».');
    expect(checked(edited()?.keyboard)).toBe('✓ Мест нет');
    expect(toast(telegram.calls)).toBe(CALLBACK_TEXTS.availabilityChanged('full'));

    // Следующая заявка к Анне – в лист ожидания.
    const id = await newLead();
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    expect(lead).toMatchObject({ status: 'waitlist', availabilityAtSubmit: 'full' });

    await handleUpdate(message(ANNA, '/status'), deps);
    expect(checked(sent()?.keyboard)).toBe('✓ Мест нет');
  });

  it('refreshes the site again on the same status', async () => {
    const before = await stored('t-anna');
    now += 60_000;
    await handleUpdate(press(ANNA, callbackData.availability('t-anna', 'full'), 501), deps);
    expect(toast(telegram.calls)).toBe(CALLBACK_TEXTS.availabilityUnchanged('full'));
    expect(invalidations).toBe(1);
    expect((await stored('t-anna'))?.updatedAt).toEqual(before?.updatedAt);
  });

  it('keeps the status of another tutor', async () => {
    await handleUpdate(press(OLEG, callbackData.availability('t-anna', 'available'), 501), deps);
    expect(toast(telegram.calls)).toBe(CALLBACK_TEXTS.foreignAvailability);
    expect((await stored('t-anna'))?.status).toBe('full');
    expect(invalidations).toBe(0);
    expect(edited()).toBeUndefined();
  });

  it('stores the status even when the site cache is not refreshed', async () => {
    deps.invalidateAvailability = async () => {
      throw Object.assign(new Error('fetch failed'), { code: 'ECONNREFUSED' });
    };
    await handleUpdate(press(OLEG, callbackData.availability('t-oleg', 'few'), 502), deps);
    expect((await stored('t-oleg'))?.status).toBe('few');
    expect(logs).toEqual([
      { event: 'availability_invalidate_failed', fields: { code: 'Error:ECONNREFUSED' } },
    ]);
    expect(toast(telegram.calls)).toBe(CALLBACK_TEXTS.availabilityChanged('few'));
  });
});
