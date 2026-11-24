import { describe, expect, it } from 'vitest';

import { directory, formLead, manualLead } from './fixtures';
import {
  addDoneMessage,
  addPrompt,
  alertMessage,
  availabilityMessage,
  BOT_COMMANDS,
  CALLBACK_TEXTS,
  escapeHtml,
  helpMessage,
  leadMessage,
  reasonKeyboard,
  reminderMessage,
  statusKeyboard,
} from './format';

const [anna, oleg] = directory.tutors;
if (!anna || !oleg) throw new Error('fixtures');

describe('escapeHtml', () => {
  it('escapes Telegram HTML markup', () => {
    expect(escapeHtml('<b>Мария & Ко</b>')).toBe('&lt;b&gt;Мария &amp; Ко&lt;/b&gt;');
  });
});

describe('leadMessage', () => {
  it('shows a form lead with the parent data and where it came from', () => {
    expect(leadMessage(formLead(), directory).html).toMatchInlineSnapshot(`
      "<b>Заявка № 1024 → Анне</b>
      Статус: <b>новая</b>

      Имя: Мария
      Телефон: +375290000000
      Связаться: Telegram, утром, вечером
      Класс: 7
      Предмет: математика
      Цель: Подтянуть оценки
      Комментарий: Сложно с дробями

      Откуда на сайте: tutor_profile, /tutors/anna
      UTM: instagram / cpc / winter
      Создана: 24 ноября, 14:05"
    `);
  });

  it('marks a lead that came while the tutor was full', () => {
    const message = leadMessage(
      formLead({ availabilityAtSubmit: 'full', status: 'waitlist' }),
      directory,
    );
    expect(message.html.split('\n').slice(0, 2)).toMatchInlineSnapshot(`
      [
        "<b>Заявка № 1024 → Анне</b> · лист ожидания",
        "Статус: <b>лист ожидания</b>",
      ]
    `);
  });

  it('names the tutor who changed the status, the time and the rejection reason', () => {
    const lead = formLead({
      status: 'rejected',
      rejectionReason: 'schedule',
      statusChangedBy: 't-oleg',
      statusChangedAt: new Date('2026-11-24T12:10:00Z'),
    });
    expect(leadMessage(lead, directory).html.split('\n').slice(0, 3)).toMatchInlineSnapshot(`
      [
        "<b>Заявка № 1024 → Анне</b>",
        "Статус: <b>отказ</b> – Олег, 24 ноября, 15:10",
        "Причина отказа: не подошло время",
      ]
    `);
  });

  it('shows a manual lead without contacts, with the source and the referral', () => {
    expect(leadMessage(manualLead(), directory).html).toMatchInlineSnapshot(`
      "<b>Заявка № 1030 → Олегу</b>
      Статус: <b>связался</b> – Олег, 24 ноября, 14:05

      Класс: 8
      Предмет: математика

      Способ обращения: Viber
      Откуда узнали: от знакомых
      Создана: 24 ноября, 14:05"
    `);
  });

  it('escapes what the parent typed', () => {
    const html = leadMessage(
      formLead({ parentName: '<i>Мария</i>', comment: 'a & b', utmCampaign: '<x>' }),
      directory,
    ).html;
    expect(html).toContain('Имя: &lt;i&gt;Мария&lt;/i&gt;');
    expect(html).toContain('Комментарий: a &amp; b');
    expect(html).toContain('UTM: instagram / cpc / &lt;x&gt;');
  });
});

describe('keyboards', () => {
  it('lists every status, marks the current one and asks a reason for a rejection', () => {
    expect(statusKeyboard(1024, 'contacted')).toMatchInlineSnapshot(`
      [
        [
          {
            "data": "st:1024:new",
            "text": "Новая",
          },
          {
            "data": "st:1024:contacted",
            "text": "✓ Связался",
          },
        ],
        [
          {
            "data": "st:1024:no_answer",
            "text": "Не дозвонились",
          },
          {
            "data": "st:1024:trial_scheduled",
            "text": "Пробное назначено",
          },
        ],
        [
          {
            "data": "st:1024:trial_done",
            "text": "Пробное проведено",
          },
          {
            "data": "st:1024:student",
            "text": "Ученик",
          },
        ],
        [
          {
            "data": "rj:1024",
            "text": "Отказ",
          },
          {
            "data": "st:1024:waitlist",
            "text": "Лист ожидания",
          },
        ],
      ]
    `);
  });

  it('offers rejection reasons and a way back', () => {
    expect(reasonKeyboard(1024)).toMatchInlineSnapshot(`
      [
        [
          {
            "data": "rr:1024:expensive",
            "text": "Дорого",
          },
          {
            "data": "rr:1024:schedule",
            "text": "Не подошло время",
          },
        ],
        [
          {
            "data": "rr:1024:chose_other",
            "text": "Выбрали другого",
          },
          {
            "data": "rr:1024:no_response",
            "text": "Не отвечает",
          },
        ],
        [
          {
            "data": "rr:1024:other",
            "text": "Другое",
          },
        ],
        [
          {
            "data": "bk:1024",
            "text": "← Назад",
          },
        ],
      ]
    `);
  });
});

describe('service messages', () => {
  it('reminds about a new lead', () => {
    expect(reminderMessage(formLead(), directory).html).toMatchInlineSnapshot(
      `"Заявка № 1024 → Анне: уже 2 часа в статусе «новая»."`,
    );
  });

  it('alerts about a dead job with codes only', () => {
    expect(
      alertMessage({
        id: 57,
        type: 'telegram.lead_created',
        attempts: 10,
        lastError: 'TelegramApiError:403',
        leadId: 1024,
      }).html,
    ).toMatchInlineSnapshot(`
      "<b>Задание не выполнено</b>
      Outbox № 57, telegram.lead_created, попыток: 10.
      Заявка № 1024.
      Код ошибки: TelegramApiError:403"
    `);
  });

  it('lists the commands', () => {
    expect(helpMessage(directory).html).toMatchInlineSnapshot(`
      "<b>Что умеет бот</b>
      /add – добавить заявку, которая пришла напрямую: в Telegram, Viber или по звонку. Бот спросит способ обращения, класс, предмет, цель и откуда узнали. Имя и контакт не нужны.
      /status – статус занятости на сайте: «Есть свободное время», «Последние места» или «Мест нет». Новый статус виден на сайте через несколько секунд.
      /help – эта подсказка.

      Статус заявки меняется кнопками под её сообщением в общем чате. Если заявка 2 часа остаётся в статусе «новая», бот напомнит о ней – с 9:00 до 22:00 по Минску."
    `);
  });
});

describe('/status', () => {
  it('shows the current status of the tutor with buttons for all three', () => {
    expect(availabilityMessage(anna, 'few')).toMatchInlineSnapshot(`
      {
        "html": "<b>Статус занятости – Анна</b>
      Сейчас на сайте: «Последние места».

      При «Мест нет» на странице – кнопка «Встать в лист ожидания», а новые заявки приходят со статусом «лист ожидания».",
        "keyboard": [
          [
            {
              "data": "av:t-anna:available",
              "text": "Есть свободное время",
            },
          ],
          [
            {
              "data": "av:t-anna:few",
              "text": "✓ Последние места",
            },
          ],
          [
            {
              "data": "av:t-anna:full",
              "text": "Мест нет",
            },
          ],
        ],
      }
    `);
  });

  it('answers the button', () => {
    expect(CALLBACK_TEXTS.availabilityChanged('full')).toMatchInlineSnapshot(
      `"Статус: «Мест нет». Сайт обновится через несколько секунд"`,
    );
    expect(CALLBACK_TEXTS.availabilityUnchanged('available')).toMatchInlineSnapshot(
      `"Статус уже «Есть свободное время»"`,
    );
  });

  it('is in the command menu', () => {
    expect(BOT_COMMANDS.map((item) => item.command)).toEqual(['add', 'status', 'help']);
  });
});

describe('/add', () => {
  it('asks the first question with a cancel button', () => {
    expect(addPrompt('source', anna, { messageId: 1 }, directory)).toMatchInlineSnapshot(`
      {
        "html": "<b>Новая заявка → Анне</b>

      Как обратился родитель?",
        "keyboard": [
          [
            {
              "data": "add:source:telegram",
              "text": "Telegram",
            },
            {
              "data": "add:source:viber",
              "text": "Viber",
            },
          ],
          [
            {
              "data": "add:source:call",
              "text": "Звонок",
            },
            {
              "data": "add:source:other",
              "text": "Другое",
            },
          ],
          [
            {
              "data": "add:cancel:yes",
              "text": "Отмена",
            },
          ],
        ],
      }
    `);
  });

  it('shows the answers so far and the grades of the tutor', () => {
    expect(addPrompt('grade', oleg, { messageId: 1, source: 'call' }, directory))
      .toMatchInlineSnapshot(`
      {
        "html": "<b>Новая заявка → Олегу</b>
      Способ обращения: звонок

      Класс?",
        "keyboard": [
          [
            {
              "data": "add:grade:5",
              "text": "5",
            },
            {
              "data": "add:grade:6",
              "text": "6",
            },
            {
              "data": "add:grade:7",
              "text": "7",
            },
            {
              "data": "add:grade:8",
              "text": "8",
            },
          ],
          [
            {
              "data": "add:grade:9",
              "text": "9",
            },
          ],
          [
            {
              "data": "add:cancel:yes",
              "text": "Отмена",
            },
          ],
        ],
      }
    `);
  });

  it('offers the goals of the tutor and «Не указана»', () => {
    const draft = { messageId: 1, source: 'telegram', grade: 10, subject: 'physics' } as const;
    expect(addPrompt('goal', anna, draft, directory).keyboard).toMatchInlineSnapshot(`
      [
        [
          {
            "data": "add:goal:grades",
            "text": "Подтянуть оценки",
          },
          {
            "data": "add:goal:ct",
            "text": "ЦТ и ЦЭ",
          },
        ],
        [
          {
            "data": "add:goal:none",
            "text": "Не указана",
          },
        ],
        [
          {
            "data": "add:cancel:yes",
            "text": "Отмена",
          },
        ],
      ]
    `);
  });

  it('confirms the added lead', () => {
    expect(addDoneMessage(1030, oleg, 'contacted').html).toMatchInlineSnapshot(
      `"<b>Заявка № 1030 → Олегу</b> добавлена со статусом «связался». Сообщение с кнопками статусов – в общем чате."`,
    );
  });
});
