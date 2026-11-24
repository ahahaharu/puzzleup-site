import 'server-only';

import { GOAL_LABELS } from '@/lib/goal';
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, REJECTION_REASON_LABELS } from '@/lib/labels';
import { MINSK_TZ } from '@/lib/time';
import type { BotDirectory } from '@/server/bot/directory';
import type { Lead } from '@/server/leads/domain';

import type { SheetRow } from './port';

/**
 * Заголовки листа «Заявки», столбцы A–Q – docs/data-model.md, раздел 4. Порядок не менять:
 * синхронизация пишет по номерам столбцов, а формулы листов «Сводка» и «Недели» – по буквам.
 */
export const LEAD_COLUMNS = [
  '№ заявки',
  'Дата и время',
  'Репетитор',
  'Класс',
  'Предмет',
  'Цель',
  'Способ обращения',
  'Откуда на сайте',
  'Канал',
  'Тип трафика',
  'Кампания',
  'Объявление',
  'Статус',
  'Дата пробного',
  'Дата «ученик»',
  'Причина отказа',
  'Изменено',
] as const;

/** Последний столбец листа – Q. */
export const LAST_COLUMN = String.fromCharCode('A'.charCodeAt(0) + LEAD_COLUMNS.length - 1);

/** Форматы чисел Таблицы: дата хранится числом дней, вид задаёт формат ячейки. */
export const DATE_TIME_FORMAT = { type: 'DATE_TIME', pattern: 'dd.mm.yyyy hh:mm' } as const;
export const DATE_FORMAT = { type: 'DATE', pattern: 'dd.mm.yyyy' } as const;

/** Формат по номеру столбца (с 0): B и Q – дата и время, N и O – дата. */
export const LEAD_COLUMN_FORMATS: Readonly<
  Record<number, typeof DATE_TIME_FORMAT | typeof DATE_FORMAT>
> = {
  1: DATE_TIME_FORMAT,
  13: DATE_FORMAT,
  14: DATE_FORMAT,
  16: DATE_TIME_FORMAT,
};

/** Имена репетиторов и названия предметов – из content/, как у бота. */
export type SheetsDirectory = Pick<BotDirectory, 'tutors' | 'subjects'>;

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
/** День 0 в Таблице – 30.12.1899, 1 января 1970 – день 25569. */
const UNIX_EPOCH_DAY = 25_569;

const minskMs = (date: Date) => {
  const epochMs = date.getTime();
  const zoned = Temporal.Instant.fromEpochMilliseconds(epochMs).toZonedDateTimeISO(MINSK_TZ);
  return epochMs + zoned.offsetNanoseconds / 1_000_000;
};

/**
 * Момент по Минску – числом дней, как Таблица хранит дату и время: так по столбцу считают
 * формулы «Недель». Вид `ДД.ММ.ГГГГ ЧЧ:ММ` задаёт формат столбца в шаблоне. Секунды отброшены.
 */
export function sheetsDateTime(date: Date): number {
  return Math.floor(minskMs(date) / MINUTE_MS) / (DAY_MS / MINUTE_MS) + UNIX_EPOCH_DAY;
}

/** День по Минску – целым числом, вид `ДД.ММ.ГГГГ`. */
export function sheetsDate(date: Date): number {
  return Math.floor(minskMs(date) / DAY_MS) + UNIX_EPOCH_DAY;
}

/**
 * Обезличенная строка заявки, столбцы A–Q (ADR-007): ни имени, ни телефона, ни комментария.
 * Канал (I) – `utm_source` как есть, у `/add` – код ответа «откуда узнали» (ADR-052).
 */
export function leadRow(lead: Lead, directory: SheetsDirectory): SheetRow {
  const tutor = directory.tutors.find((item) => item.id === lead.tutorId);
  return [
    lead.id,
    sheetsDateTime(lead.createdAt),
    tutor?.name ?? lead.tutorId,
    lead.grade,
    lead.subjects.map((id) => directory.subjects[id] ?? id).join(', '),
    // Неразрывный пробел нужен вёрстке сайта; в Таблице по подписи фильтруют и ищут.
    lead.goal === null ? '' : GOAL_LABELS[lead.goal].replaceAll(' ', ' '),
    LEAD_SOURCE_LABELS[lead.source],
    lead.entry ?? '',
    lead.utmSource ?? '',
    lead.utmMedium ?? '',
    lead.utmCampaign ?? '',
    lead.utmContent ?? '',
    LEAD_STATUS_LABELS[lead.status],
    lead.trialDoneAt === null ? '' : sheetsDate(lead.trialDoneAt),
    lead.studentAt === null ? '' : sheetsDate(lead.studentAt),
    lead.rejectionReason === null ? '' : REJECTION_REASON_LABELS[lead.rejectionReason],
    sheetsDateTime(lead.statusChangedAt),
  ];
}
