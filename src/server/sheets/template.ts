import 'server-only';

import { ENTRIES, type Entry } from '@/lib/entry';
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  REFERRAL_CHANNEL_LABELS,
  REJECTION_REASON_LABELS,
} from '@/lib/labels';
import { leadStatusSchema, referralChannelSchema, type LeadStatus } from '@/lib/lead';
import { MINSK_TZ } from '@/lib/time';

import { LEADS_SHEET } from './port';
import { DATE_FORMAT, DATE_TIME_FORMAT, LAST_COLUMN, LEAD_COLUMNS } from './row';

// Шаблон Таблицы (docs/data-model.md, раздел 4; ADR-052): запросы `spreadsheets.batchUpdate`,
// которые `pnpm sheets:setup` отправляет в существующую Таблицу. Повторный запуск безопасен:
// «Заявки», «Ссылки» и «Расходы» получают только заголовки и форматы, данные в них не трогаются;
// «Сводка», «Недели», «Справочники» и «Инструкция» пересоздаются целиком.

const SUMMARY = 'Сводка';
const WEEKS = 'Недели';
const LINKS = 'Ссылки';
const COSTS = 'Расходы';
const LISTS = 'Справочники';
const GUIDE = 'Инструкция';

/** Порядок листов слева направо. */
export const SHEET_TITLES = [LEADS_SHEET, SUMMARY, WEEKS, LINKS, COSTS, LISTS, GUIDE] as const;
const GENERATED: readonly string[] = [SUMMARY, WEEKS, LISTS, GUIDE];

/** Метка защиты листа «Заявки»: по ней повторный запуск не добавляет вторую. */
export const LEADS_PROTECTION = 'puzzleup:leads';

/** Листы Таблицы до запуска: из `spreadsheets.get`. */
export type SpreadsheetMeta = {
  sheets: readonly {
    sheetId: number;
    title: string;
    protections: readonly string[];
    /** Сколько правил условного форматирования на листе. */
    conditionalRules: number;
  }[];
};

/** Страницы сайта для генератора ссылок: главная и страницы неушедших репетиторов. */
export type TemplateInput = {
  siteUrl: string;
  tutors: readonly { name: string; slug: string; archived: boolean }[];
};

type Value = string | number;
type Request = Record<string, unknown>;

// Строки в формулах собираются через `text()`: кавычки формулы не попадают в тексты с кириллицей,
// которые проверяет `pnpm lint:copy`.
const text = (value: string) => `"${value}"`;
const sheet = (title: string) => `'${title}'`;
const leads = (column: string) => `${sheet(LEADS_SHEET)}!${column}2:${column}`;
const costs = (column: string) => `${sheet(COSTS)}!${column}2:${column}`;
const NO_LABEL = '(без метки)';

/** Где на сайте стоит кнопка с этим `entry` (ТЗ главной, раздел 8; ADR-049). */
const ENTRY_PLACES: Record<Entry, string> = {
  hero: 'первый экран главной',
  header: 'кнопка в шапке',
  bottom_bar: 'нижняя панель на телефоне',
  tutors: 'блок «Репетиторы» на главной',
  situations: 'блок «Узнаёте ситуацию?»',
  subjects: 'блок «Предметы»',
  prices: 'блок «Цены»',
  faq: 'блок «Частые вопросы»',
  about: 'блок «О сайте»',
  tutor_profile: 'кнопка в профиле репетитора',
  tutor_more: 'блок «Другие репетиторы»',
  tutor_full: 'кнопка «Встать в лист ожидания»',
  '404': 'страница 404',
  direct: 'прямой заход на страницу репетитора, без кнопки сайта',
};

/** Подсказки для utm_medium; список не закрытый, в «Ссылках» можно вписать свой. */
const MEDIUMS: readonly (readonly [string, string])[] = [
  ['cpc', 'платная реклама'],
  ['social', 'пост или сторис без оплаты'],
  ['bio', 'ссылка в профиле'],
  ['referral', 'ссылка на другом сайте'],
];

const GUIDE_LINES = [
  'Как устроена Таблица',
  '«Заявки» – обезличенная копия заявок с сайта и из /add. Строку дописывает и обновляет сайт после каждой новой заявки и смены статуса, а находит её по номеру в столбце A.',
  'Цвет статуса в «Заявках» показывает, на каком шаге заявка: жёлтый – новая, ждёт ответа, зелёный – ученик, серый – отказ.',
  'Имени, телефона и комментария родителя здесь нет. Не вписывайте их вручную: Таблица хранится на серверах Google.',
  'В «Заявках» не меняйте порядок столбцов и не правьте ячейки – при следующей смене статуса строка перезапишется. Сортировать и фильтровать можно.',
  'Даты – по Минску. Столбцы N и O – первый переход в статус «пробное проведено» и «ученик», Q – последняя смена статуса.',
  `«Канал» – метка utm_source из ссылки, у заявки из /add – ответ на вопрос «откуда узнали». Коды – в «Справочниках». ${NO_LABEL} в «Сводке» – заход без UTM-меток.`,
  'Через 6 месяцев после последней смены статуса заявка удаляется из базы сайта, а строка здесь остаётся для статистики.',
  '«Сводка» и «Недели» считаются формулами из «Заявок» и «Расходов», править их не нужно.',
  '«Ссылки» – генератор ссылок для рекламы. Выберите страницу, канал и тип трафика, при желании впишите кампанию и объявление – готовая ссылка появится в последнем столбце. Канал и тип трафика – латиницей строчными буквами, как в «Справочниках»: по ним считается «Сводка».',
  '«Расходы» заполняются вручную: дата, канал – тот же, что utm_source в ссылке, кампания и сумма. По ним считается цена заявки и ученика.',
  '«Сводка», «Недели», «Справочники» и «Инструкция» пересоздаются скриптом pnpm sheets:setup – правки в этих листах пропадут. В «Заявках», «Ссылках» и «Расходах» он обновляет только заголовки и оформление.',
];

function cell(value: Value) {
  if (typeof value === 'number') return { userEnteredValue: { numberValue: value } };
  if (value === '') return {};
  return {
    userEnteredValue: value.startsWith('=') ? { formulaValue: value } : { stringValue: value },
  };
}

/** Значения с A1. Пустая строка очищает ячейку. Оформление – отдельными запросами. */
function write(sheetId: number, rows: readonly (readonly Value[])[]): Request {
  return {
    updateCells: {
      start: { sheetId, rowIndex: 0, columnIndex: 0 },
      rows: rows.map((row) => ({ values: row.map(cell) })),
      fields: 'userEnteredValue',
    },
  };
}

const columnIndex = (letter: string) => letter.charCodeAt(0) - 'A'.charCodeAt(0);

/** Столбец без строки заголовков. */
const column = (sheetId: number, letter: string) => ({
  sheetId,
  startRowIndex: 1,
  startColumnIndex: columnIndex(letter),
  endColumnIndex: columnIndex(letter) + 1,
});

/** Прямоугольник: строки с 0 (`end` не включается, без него – до конца), столбцы `A:F`. */
function area(sheetId: number, rows: readonly [number, number?], columns: string) {
  const [from = 'A', to = from] = columns.split(':');
  return {
    sheetId,
    startRowIndex: rows[0],
    ...(rows[1] !== undefined && { endRowIndex: rows[1] }),
    startColumnIndex: columnIndex(from),
    endColumnIndex: columnIndex(to) + 1,
  };
}

const MONEY = { type: 'NUMBER', pattern: '0.00' };
const PERCENT = { type: 'PERCENT', pattern: '0%' };

function format(sheetId: number, letters: string, numberFormat: object): Request[] {
  return [...letters].map((letter) => ({
    repeatCell: {
      range: column(sheetId, letter),
      cell: { userEnteredFormat: { numberFormat } },
      fields: 'userEnteredFormat.numberFormat',
    },
  }));
}

// Цвета – из палитры сайта (src/styles/globals.css): чернила, бумага, крафт.
const rgb = (hex: string) => ({
  red: Number.parseInt(hex.slice(1, 3), 16) / 255,
  green: Number.parseInt(hex.slice(3, 5), 16) / 255,
  blue: Number.parseInt(hex.slice(5, 7), 16) / 255,
});
const INK = '#1d2340';
const WHITE = '#ffffff';
const PAPER_ALT = '#efeae0';

function paint(range: object, userEnteredFormat: object): Request {
  return {
    repeatCell: {
      range,
      cell: { userEnteredFormat },
      fields: `userEnteredFormat(${Object.keys(userEnteredFormat).join(',')})`,
    },
  };
}

/** Строка заголовков: тёмная, белый жирный текст, перенос слов. */
const header = (sheetId: number, columns: string) =>
  paint(area(sheetId, [0, 1], columns), {
    backgroundColor: rgb(INK),
    textFormat: { bold: true, foregroundColor: rgb(WHITE) },
    verticalAlignment: 'MIDDLE',
    wrapStrategy: 'WRAP',
  });

/** Строка «Всего» под заголовком. */
const total = (sheetId: number, columns: string) =>
  paint(area(sheetId, [1, 2], columns), {
    backgroundColor: rgb(PAPER_ALT),
    textFormat: { bold: true },
  });

/** Цвет статуса: фон и текст. «Новая» ждёт ответа – самая заметная, отказ – приглушён. */
const STATUS_COLORS: Record<LeadStatus, readonly [string, string]> = {
  new: ['#fde3a7', '#5c4300'],
  contacted: ['#dce8fb', '#1d3a70'],
  no_answer: ['#fbd9c9', '#7a2e12'],
  trial_scheduled: ['#e6ddf7', '#3e2a6e'],
  trial_done: ['#c9def6', '#123a66'],
  student: ['#cdebd9', '#1c5236'],
  rejected: ['#ebe9e4', '#5f6170'],
  waitlist: ['#f1ead6', '#5a4a1f'],
};

function statusColors(range: object): Request[] {
  return leadStatusSchema.options.map((status, index) => {
    const [background, foreground] = STATUS_COLORS[status];
    return {
      addConditionalFormatRule: {
        index,
        rule: {
          ranges: [range],
          booleanRule: {
            condition: {
              type: 'TEXT_EQ',
              values: [{ userEnteredValue: LEAD_STATUS_LABELS[status] }],
            },
            format: {
              backgroundColor: rgb(background),
              textFormat: { foregroundColor: rgb(foreground), bold: status === 'student' },
            },
          },
        },
      },
    };
  });
}

/** Выпадающий список из столбца «Справочников»; своё значение тоже можно вписать. */
function dropdown(sheetId: number, letter: string, listColumn: string): Request {
  return {
    setDataValidation: {
      range: column(sheetId, letter),
      rule: {
        condition: {
          type: 'ONE_OF_RANGE',
          values: [{ userEnteredValue: `=${sheet(LISTS)}!$${listColumn}$2:$${listColumn}` }],
        },
        strict: false,
        showCustomUi: true,
      },
    },
  };
}

const freezeHeader = (sheetId: number): Request => ({
  updateSheetProperties: {
    properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
    fields: 'gridProperties.frozenRowCount',
  },
});

const dimension = (
  sheetId: number,
  kind: 'ROWS' | 'COLUMNS',
  index: number,
  pixelSize: number,
) => ({
  updateDimensionProperties: {
    range: { sheetId, dimension: kind, startIndex: index, endIndex: index + 1 },
    properties: { pixelSize },
    fields: 'pixelSize',
  },
});

/** Ширина столбцов в пикселях и высота строки заголовков. */
function sizes(sheetId: number, widths: Readonly<Record<string, number>>): Request[] {
  return [
    dimension(sheetId, 'ROWS', 0, 40),
    ...Object.entries(widths).map(([letter, pixels]) =>
      dimension(sheetId, 'COLUMNS', columnIndex(letter), pixels),
    ),
  ];
}

/** Столбцы разной длины → строки, недостающее – пустые ячейки. */
function table(columns: readonly (readonly Value[])[]): Value[][] {
  const height = Math.max(...columns.map((values) => values.length));
  return Array.from({ length: height }, (_, row) => columns.map((values) => values[row] ?? ''));
}

function listsRows(input: TemplateInput): Value[][] {
  const channels = referralChannelSchema.options;
  const pages = [
    { url: `${input.siteUrl}/`, title: 'главная' },
    ...input.tutors
      .filter((tutor) => !tutor.archived)
      .map((tutor) => ({ url: `${input.siteUrl}/tutors/${tutor.slug}`, title: tutor.name })),
  ];
  return table([
    ['Статус', ...Object.values(LEAD_STATUS_LABELS)],
    ['Причина отказа', ...Object.values(REJECTION_REASON_LABELS)],
    ['Способ обращения', ...Object.values(LEAD_SOURCE_LABELS)],
    ['Откуда на сайте', ...ENTRIES],
    ['Где это', ...ENTRIES.map((entry) => ENTRY_PLACES[entry])],
    ['Канал', ...channels],
    ['Что значит', ...channels.map((channel) => REFERRAL_CHANNEL_LABELS[channel])],
    ['Тип трафика', ...MEDIUMS.map(([medium]) => medium)],
    ['Что значит', ...MEDIUMS.map(([, meaning]) => meaning)],
    ['Страница', ...pages.map((page) => page.url)],
    ['Чья', ...pages.map((page) => page.title)],
  ]);
}

const empty = text('');
const rejected = text(LEAD_STATUS_LABELS.rejected);

/** QUERY без строки заголовков; пока заявок нет, вместо #N/A – пусто. */
const query = (data: string, select: string) => `=IFNA(QUERY(${data},${text(select)},0),${empty})`;

/** Сводка за всё время: по репетиторам, каналам, статусам и причинам отказа – рядом, слева направо. */
function summaryRows(): Value[][] {
  const data = `${sheet(LEADS_SHEET)}!A2:${LAST_COLUMN}`;
  const byTutor = query(
    data,
    "select C, count(A), count(N), count(O) where A is not null group by C label C '', count(A) '', count(N) '', count(O) ''",
  );
  // Пустой канал – заход без UTM-меток: подписывается, чтобы строка не выглядела потерянной.
  const byChannel = query(
    `ARRAYFORMULA({${leads('A')},IF(${leads('I')}=${empty},${text(NO_LABEL)},${leads('I')}),${leads('N')},${leads('O')}})`,
    "select Col2, count(Col1), count(Col3), count(Col4) where Col1 is not null group by Col2 label Col2 '', count(Col1) '', count(Col3) '', count(Col4) ''",
  );
  const byStatus = query(
    data,
    "select M, count(A) where A is not null group by M label M '', count(A) ''",
  );
  const byReason = query(
    data,
    "select P, count(A) where A is not null and P <> '' group by P label P '', count(A) ''",
  );
  return [
    [
      'Репетитор',
      'Заявок',
      'Пробных проведено',
      'Учеников',
      'Отказов',
      'Заявка → ученик',
      '',
      'Канал',
      'Заявок',
      'Пробных проведено',
      'Учеников',
      'Расходы, BYN',
      'За заявку, BYN',
      'За ученика, BYN',
      '',
      'Статус',
      'Заявок',
      '',
      'Причина отказа',
      'Заявок',
    ],
    [
      'Всего',
      `=COUNT(${leads('A')})`,
      `=COUNT(${leads('N')})`,
      `=COUNT(${leads('O')})`,
      `=COUNTIF(${leads('M')},${rejected})`,
      `=IF(B2=0,${empty},D2/B2)`,
      '',
      'Всего',
      '=B2',
      '=C2',
      '=D2',
      `=SUM(${costs('D')})`,
      `=IF(I2=0,${empty},L2/I2)`,
      `=IF(K2=0,${empty},L2/K2)`,
      '',
      'Всего',
      '=B2',
      '',
      'Всего',
      '=E2',
    ],
    [
      byTutor,
      '',
      '',
      '',
      `=ARRAYFORMULA(IF(A3:A=${empty},${empty},COUNTIFS(${leads('C')},A3:A,${leads('M')},${rejected})))`,
      `=ARRAYFORMULA(IF(A3:A=${empty},${empty},D3:D/B3:B))`,
      '',
      byChannel,
      '',
      '',
      '',
      `=ARRAYFORMULA(IF(H3:H=${empty},${empty},SUMIF(${costs('B')},H3:H,${costs('D')})))`,
      `=ARRAYFORMULA(IF(H3:H=${empty},${empty},IF(L3:L=0,${empty},L3:L/I3:I)))`,
      `=ARRAYFORMULA(IF(H3:H=${empty},${empty},IF((L3:L=0)+(K3:K=0),${empty},L3:L/K3:K)))`,
      '',
      byStatus,
      '',
      '',
      byReason,
    ],
  ];
}

/** По неделям с понедельника, свежая – сверху: заявки по дате заявки, пробные и ученики – по своим датам. */
function weeksRows(): Value[][] {
  const inWeek = (range: string) => `${range},${text('>=')}&A2:A,${range},${text('<')}&(A2:A+7)`;
  const perWeek = (formula: string) => `=ARRAYFORMULA(IF(A2:A=${empty},${empty},${formula}))`;
  return [
    ['Неделя с', 'Заявок', 'Пробных проведено', 'Учеников', 'Расходы, BYN', 'За заявку, BYN'],
    [
      `=LET(first,MIN(${leads('B')}),monday,TODAY()-WEEKDAY(TODAY(),2)+1,IF(COUNT(${leads('B')})=0,${empty},SEQUENCE(INT((monday-(INT(first)-WEEKDAY(first,2)+1))/7)+1,1,monday,-7)))`,
      perWeek(`COUNTIFS(${inWeek(leads('B'))})`),
      perWeek(`COUNTIFS(${inWeek(leads('N'))})`),
      perWeek(`COUNTIFS(${inWeek(leads('O'))})`),
      perWeek(`SUMIFS(${costs('D')},${inWeek(costs('A'))})`),
      perWeek(`IF(B2:B=0,${empty},E2:E/B2:B)`),
    ],
  ];
}

const LINK_HEADERS = [
  'Страница',
  'Канал (utm_source)',
  'Тип трафика (utm_medium)',
  'Кампания (utm_campaign)',
  'Объявление (utm_content)',
];

/** Ссылка собирается формулой в заголовке: строки ниже заполняют люди, setup их не трогает. */
function linkFormula(): string {
  const param = (name: string, letter: string) =>
    `IF(${letter}2:${letter}=${empty},${empty},${text(`&${name}=`)}&ENCODEURL(${letter}2:${letter}))`;
  return `={${text('Ссылка')};ARRAYFORMULA(IF((A2:A=${empty})+(B2:B=${empty})+(C2:C=${empty}),${empty},A2:A&${text('?utm_source=')}&ENCODEURL(B2:B)&${text('&utm_medium=')}&ENCODEURL(C2:C)&${param('utm_campaign', 'D')}&${param('utm_content', 'E')}))}`;
}

/**
 * API разбирает формулы по языку, который был у Таблицы до вызова `batchUpdate`: в русском
 * аргументы разделяет «;», а смена языка внутри того же вызова на разбор не влияет. Поэтому
 * язык переключается отдельными вызовами: английский – до шаблона, русский (даты, числа
 * с запятой) – после. Формулы Таблица хранит независимо от языка и показывает их по-русски.
 */
export const PREPARE_REQUESTS: readonly Request[] = [
  { updateSpreadsheetProperties: { properties: { locale: 'en_US' }, fields: 'locale' } },
];

export const FINAL_REQUESTS: readonly Request[] = [
  {
    // Часовой пояс – для TODAY() в «Неделях».
    updateSpreadsheetProperties: {
      properties: { locale: 'ru_RU', timeZone: MINSK_TZ },
      fields: 'locale,timeZone',
    },
  },
];

/**
 * Запросы `batchUpdate` (после `PREPARE_REQUESTS`): недостающие листы, их порядок, содержимое
 * и оформление. Единственный лист новой Таблицы («Лист1») становится «Заявками».
 */
export function templateRequests(meta: SpreadsheetMeta, input: TemplateInput): Request[] {
  const requests: Request[] = [];
  const ids = new Map(meta.sheets.map((item) => [item.title, item.sheetId]));
  const [only] = meta.sheets;
  if (
    !ids.has(LEADS_SHEET) &&
    meta.sheets.length === 1 &&
    only &&
    /^(Лист|Sheet)1$/.test(only.title)
  ) {
    requests.push({
      updateSheetProperties: {
        properties: { sheetId: only.sheetId, title: LEADS_SHEET },
        fields: 'title',
      },
    });
    ids.delete(only.title);
    ids.set(LEADS_SHEET, only.sheetId);
  }
  let nextId = Math.max(0, ...meta.sheets.map((item) => item.sheetId)) + 1;
  SHEET_TITLES.forEach((title, index) => {
    const existing = ids.get(title);
    if (existing === undefined) {
      ids.set(title, nextId);
      requests.push({ addSheet: { properties: { sheetId: nextId, title, index } } });
      nextId += 1;
    } else {
      requests.push({
        updateSheetProperties: { properties: { sheetId: existing, index }, fields: 'index' },
      });
    }
  });
  const id = (title: (typeof SHEET_TITLES)[number]) => ids.get(title) ?? -1;

  for (const title of GENERATED) {
    requests.push({
      updateCells: {
        range: { sheetId: ids.get(title) },
        fields: 'userEnteredValue,userEnteredFormat',
      },
    });
  }
  // Цвета статусов пересоздаются: удаляются прежние правила условного форматирования.
  for (const item of meta.sheets) {
    const title = [...ids].find(([, sheetId]) => sheetId === item.sheetId)?.[0];
    if (title !== LEADS_SHEET && title !== SUMMARY) continue;
    for (let rule = 0; rule < item.conditionalRules; rule += 1) {
      requests.push({ deleteConditionalFormatRule: { sheetId: item.sheetId, index: 0 } });
    }
  }

  const leadsId = id(LEADS_SHEET);
  requests.push(
    write(leadsId, [LEAD_COLUMNS]),
    header(leadsId, `A:${LAST_COLUMN}`),
    // Строки, дописанные до исправления, взяли жирный шрифт заголовка.
    paint(area(leadsId, [1], `A:${LAST_COLUMN}`), { textFormat: { bold: false } }),
    paint(area(leadsId, [1], 'D'), { horizontalAlignment: 'CENTER' }),
    freezeHeader(leadsId),
    ...format(leadsId, 'BQ', DATE_TIME_FORMAT),
    ...format(leadsId, 'NO', DATE_FORMAT),
    ...statusColors(area(leadsId, [1], 'M')),
    ...sizes(leadsId, {
      A: 80,
      B: 130,
      C: 110,
      D: 60,
      E: 130,
      F: 170,
      G: 120,
      H: 120,
      I: 120,
      J: 110,
      K: 130,
      L: 130,
      M: 150,
      N: 110,
      O: 110,
      P: 150,
      Q: 130,
    }),
  );
  const leadsSheet = meta.sheets.find((item) => item.sheetId === leadsId);
  if (!leadsSheet?.protections.includes(LEADS_PROTECTION)) {
    // Только предупреждение: сервисный аккаунт пишет, а человек видит, что лист заполняет сайт.
    requests.push({
      addProtectedRange: {
        protectedRange: {
          range: { sheetId: leadsId },
          description: LEADS_PROTECTION,
          warningOnly: true,
        },
      },
    });
  }

  const summaryId = id(SUMMARY);
  const blocks = ['A:F', 'H:N', 'P:Q', 'S:T'];
  requests.push(
    write(summaryId, summaryRows()),
    ...blocks.flatMap((columns) => [header(summaryId, columns), total(summaryId, columns)]),
    freezeHeader(summaryId),
    ...format(summaryId, 'F', PERCENT),
    ...format(summaryId, 'LMN', MONEY),
    ...statusColors(area(summaryId, [2], 'P')),
    ...sizes(summaryId, {
      A: 130,
      B: 80,
      C: 100,
      D: 90,
      E: 80,
      F: 100,
      G: 24,
      H: 130,
      I: 80,
      J: 100,
      K: 90,
      L: 100,
      M: 100,
      N: 100,
      O: 24,
      P: 150,
      Q: 80,
      R: 24,
      S: 150,
      T: 80,
    }),
  );

  const weeksId = id(WEEKS);
  requests.push(
    write(weeksId, weeksRows()),
    header(weeksId, 'A:F'),
    freezeHeader(weeksId),
    ...format(weeksId, 'A', DATE_FORMAT),
    ...format(weeksId, 'EF', MONEY),
    ...sizes(weeksId, { A: 110, B: 90, C: 110, D: 100, E: 110, F: 110 }),
  );

  const linksId = id(LINKS);
  requests.push(
    write(linksId, [[...LINK_HEADERS, linkFormula()]]),
    header(linksId, 'A:F'),
    freezeHeader(linksId),
    dropdown(linksId, 'A', 'J'),
    dropdown(linksId, 'B', 'F'),
    dropdown(linksId, 'C', 'H'),
    ...sizes(linksId, { A: 300, B: 150, C: 150, D: 170, E: 170, F: 620 }),
  );

  const costsId = id(COSTS);
  requests.push(
    write(costsId, [
      ['Дата', 'Канал (utm_source)', 'Кампания (utm_campaign)', 'Сумма, BYN', 'Комментарий'],
    ]),
    header(costsId, 'A:E'),
    freezeHeader(costsId),
    ...format(costsId, 'A', DATE_FORMAT),
    ...format(costsId, 'D', MONEY),
    dropdown(costsId, 'B', 'F'),
    ...sizes(costsId, { A: 110, B: 150, C: 170, D: 110, E: 320 }),
  );

  const listsId = id(LISTS);
  requests.push(
    write(listsId, listsRows(input)),
    header(listsId, 'A:K'),
    freezeHeader(listsId),
    ...sizes(listsId, {
      A: 150,
      B: 140,
      C: 140,
      D: 120,
      E: 280,
      F: 120,
      G: 120,
      H: 100,
      I: 200,
      J: 300,
      K: 110,
    }),
  );

  const guideId = id(GUIDE);
  requests.push(
    write(
      guideId,
      GUIDE_LINES.map((line) => [line]),
    ),
    header(guideId, 'A'),
    paint(area(guideId, [1], 'A'), { wrapStrategy: 'WRAP', verticalAlignment: 'TOP' }),
    ...sizes(guideId, { A: 760 }),
  );

  return requests;
}
