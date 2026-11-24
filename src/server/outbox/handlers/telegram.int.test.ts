import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestDb } from '../../../../tests/setup/db';
import { directory, fakeTelegram } from '../../bot/fixtures';
import type { Db } from '../../db/client';
import { leads, outbox } from '../../db/schema';
import { changeStatus, createLead } from '../../leads/service';
import type { OutboxJob } from '../worker';
import { telegramHandlers } from './telegram';

let db: Db;

beforeAll(async () => {
  ({ db } = await createTestDb());
});

const LEADS_CHAT = -100;
const ALERT_CHAT = 11;
const signal = new AbortController().signal;

function setup(options: Parameters<typeof fakeTelegram>[0] = {}) {
  const telegram = fakeTelegram(options);
  const handlers = telegramHandlers({
    db,
    telegram: telegram.port,
    directory,
    leadsChatId: LEADS_CHAT,
    alertChatId: ALERT_CHAT,
  });
  const run = async (type: OutboxJob['type'], payload: Record<string, number>) => {
    const handler = handlers[type];
    if (!handler) throw new Error(`no handler for ${type}`);
    await handler({ id: 1, type, payload, attempts: 1 }, signal);
  };
  return { telegram, run };
}

const newLead = async () =>
  (
    await createLead(db, {
      tutorId: 't-anna',
      parentName: 'Мария',
      phone: '+375290000000',
      contactMethod: 'viber',
      grade: 9,
      subjects: ['math'],
      contactTime: ['day'],
      entry: 'tutors',
      landingPath: '/',
      utm: {},
      initialAvailability: 'available',
      consent: { version: '2026-11-12', textSha256: 'a'.repeat(64) },
    })
  ).id;

const messageIdOf = async (id: number) =>
  (await db.select({ id: leads.telegramMessageId }).from(leads).where(eq(leads.id, id)))[0]?.id;

describe('telegram.lead_created and telegram.lead_updated', () => {
  it('sends the lead to the shared chat and remembers the message', async () => {
    const { telegram, run } = setup();
    const id = await newLead();
    await run('telegram.lead_created', { leadId: id });

    expect(telegram.calls).toEqual([
      expect.objectContaining({
        method: 'sendMessage',
        chatId: LEADS_CHAT,
        html: expect.stringContaining(`Заявка № ${id} → Анне`),
      }),
    ]);
    expect(await messageIdOf(id)).toBe(501);
  });

  it('edits the same message with the new status and who changed it', async () => {
    const { telegram, run } = setup();
    const id = await newLead();
    await run('telegram.lead_created', { leadId: id });
    await changeStatus(
      db,
      { now: () => Date.parse('2026-11-24T12:00:00Z') },
      {
        leadId: id,
        status: 'trial_scheduled',
        actor: 't-oleg',
      },
    );
    await run('telegram.lead_updated', { leadId: id });

    expect(telegram.calls[1]).toMatchObject({
      method: 'editMessage',
      chatId: LEADS_CHAT,
      messageId: 501,
      html: expect.stringContaining('Статус: <b>пробное назначено</b> – Олег, 24 ноября, 15:00'),
    });
  });

  it('sends a new message when the old one was deleted in the chat', async () => {
    const first = setup();
    const id = await newLead();
    await first.run('telegram.lead_created', { leadId: id });

    const { telegram, run } = setup({ editResult: 'not_found' });
    await run('telegram.lead_updated', { leadId: id });
    expect(telegram.calls.map((call) => call.method)).toEqual(['editMessage', 'sendMessage']);
    expect(await messageIdOf(id)).toBe(501);
  });

  it('skips a lead deleted by the retention period', async () => {
    const { telegram, run } = setup();
    await run('telegram.lead_updated', { leadId: 999_999 });
    expect(telegram.calls).toEqual([]);
  });

  it('fails the attempt when Telegram fails', async () => {
    const { run } = setup({ fail: true });
    const id = await newLead();
    await expect(run('telegram.lead_created', { leadId: id })).rejects.toMatchObject({
      name: 'TelegramApiError',
      code: '403',
    });
    expect(await messageIdOf(id)).toBeNull();
  });
});

describe('telegram.reminder', () => {
  it('replies to the lead message while the lead is still new', async () => {
    const { telegram, run } = setup();
    const id = await newLead();
    await run('telegram.lead_created', { leadId: id });
    await run('telegram.reminder', { leadId: id });

    expect(telegram.calls[1]).toEqual({
      method: 'sendMessage',
      chatId: LEADS_CHAT,
      html: `Заявка № ${id} → Анне: уже 2 часа в статусе «новая».`,
      keyboard: undefined,
      replyTo: 501,
    });
  });

  it('stays silent once the status has changed', async () => {
    const { telegram, run } = setup();
    const id = await newLead();
    await changeStatus(
      db,
      { now: () => Date.now() },
      { leadId: id, status: 'no_answer', actor: 't-anna' },
    );
    await run('telegram.reminder', { leadId: id });
    expect(telegram.calls).toEqual([]);
  });
});

describe('telegram.alert', () => {
  it('tells Andrei which job died, with codes only', async () => {
    const { telegram, run } = setup();
    const [dead] = await db
      .insert(outbox)
      .values({
        type: 'sheets.upsert',
        payload: { leadId: 1500 },
        status: 'dead',
        attempts: 10,
        lastError: 'TypeError',
      })
      .returning({ id: outbox.id });
    if (!dead) throw new Error('no row');
    await run('telegram.alert', { outboxId: dead.id });

    expect(telegram.calls).toEqual([
      expect.objectContaining({
        method: 'sendMessage',
        chatId: ALERT_CHAT,
        html: [
          '<b>Задание не выполнено</b>',
          `Outbox № ${dead.id}, sheets.upsert, попыток: 10.`,
          'Заявка № 1500.',
          'Код ошибки: TypeError',
        ].join('\n'),
      }),
    ]);
  });

  it('rejects a payload without the job id', async () => {
    const { run } = setup();
    await expect(run('telegram.alert', { leadId: 1 })).rejects.toMatchObject({
      code: 'bad_payload',
    });
  });
});
