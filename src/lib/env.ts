import { z } from 'zod';

/**
 * Схема переменных окружения – чистая, без чтения process.env.
 * Экземпляр для приложения – src/server/env.ts, проверка при старте – src/instrumentation.ts.
 * Новая переменная добавляется сюда в той фиче, где она впервые нужна
 * (список – docs/architecture.md, раздел 8).
 */
const chatId = z.string().regex(/^-?\d{1,20}$/, 'must be a Telegram chat id');

/** `{"123456789":"t-andrei"}`: Telegram ID репетитора → его `id` из content/tutors. */
const tutorsSchema = z
  .string()
  .transform((value, ctx) => {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed;
    } catch {
      ctx.addIssue({ code: 'custom', message: 'must be JSON' });
      return z.NEVER;
    }
  })
  .pipe(
    z
      .record(
        // Ключ – числовой Telegram ID, не ник: ник можно сменить.
        z.string().regex(/^\d{1,20}$/),
        z.string().regex(/^t-[a-z0-9-]+$/, 'values must be tutor ids'),
      )
      .refine((tutors) => Object.keys(tutors).length > 0, 'must list at least one tutor'),
  );

/**
 * Ключ сервисного аккаунта Google в base64 (файл JSON из Google Cloud). Нужны только почта
 * аккаунта и закрытый ключ; остальные поля файла не читаются.
 */
const serviceAccountSchema = z
  .string()
  .transform((value, ctx) => {
    try {
      const parsed: unknown = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
      return parsed;
    } catch {
      ctx.addIssue({ code: 'custom', message: 'must be base64 of the service account JSON key' });
      return z.NEVER;
    }
  })
  .pipe(
    z.object(
      {
        client_email: z.email('must have client_email'),
        private_key: z.string().includes('PRIVATE KEY', { message: 'must have private_key' }),
      },
      'must be base64 of the service account JSON key',
    ),
  );

const TELEGRAM_KEYS = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'TELEGRAM_LEADS_CHAT_ID',
  'TELEGRAM_ALERT_CHAT_ID',
  'TELEGRAM_TUTORS',
] as const;

const GOOGLE_KEYS = ['GOOGLE_SHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_JSON'] as const;

/** Google Таблица (docs/architecture.md, раздел 5). Без неё строки ждут в outbox. */
export type SheetsEnv = {
  spreadsheetId: string;
  /** Почта сервисного аккаунта – ей Таблица открыта на редактирование. */
  clientEmail: string;
  /** Закрытый ключ PEM. */
  privateKey: string;
};

/** Бот (docs/architecture.md, раздел 6). Без него заявки ждут в outbox. */
export type TelegramEnv = {
  token: string;
  /** Секрет заголовка `X-Telegram-Bot-Api-Secret-Token`. */
  webhookSecret: string;
  /** Общий чат репетиторов. */
  leadsChatId: number;
  /** Личка Андрея для предупреждений. */
  alertChatId: number;
  /** Telegram ID → tutorId. Апдейты остальных пользователей бот игнорирует. */
  tutors: Readonly<Record<string, string>>;
};

const envSchema = z
  .object({
    APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
    SITE_URL: z.url({ protocol: /^https?$/ }).optional(),
    DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/ }).optional(),
    TELEGRAM_BOT_TOKEN: z
      .string()
      .regex(/^\d+:[\w-]{30,}$/, 'must look like 123456:ABC…')
      .optional(),
    // Допустимые символы секрета – по документации setWebhook.
    TELEGRAM_WEBHOOK_SECRET: z
      .string()
      .regex(/^[\w-]{32,256}$/, 'must be 32–256 characters A-Z, a-z, 0-9, _ and -')
      .optional(),
    TELEGRAM_LEADS_CHAT_ID: chatId.optional(),
    TELEGRAM_ALERT_CHAT_ID: chatId.optional(),
    TELEGRAM_TUTORS: tutorsSchema.optional(),
    // id из адреса Таблицы: docs.google.com/spreadsheets/d/<id>/edit.
    GOOGLE_SHEET_ID: z
      .string()
      .regex(/^[\w-]{20,100}$/, 'must be the id from the spreadsheet URL')
      .optional(),
    GOOGLE_SERVICE_ACCOUNT_JSON: serviceAccountSchema.optional(),
    // Bearer-токен `POST /api/revalidate`: post-deploy ревалидация и `pnpm bot:poll`.
    INTERNAL_API_SECRET: z
      .string()
      .regex(/^[\w-]{32,256}$/, 'must be 32–256 characters A-Z, a-z, 0-9, _ and -')
      .optional(),
  })
  .transform((raw, ctx) => {
    // Бот и Таблица задаются целиком или не задаются: наполовину настроенные молча теряли бы
    // апдейты и строки. В staging и production обязательны оба.
    let incomplete = false;
    for (const [keys, prefix] of [
      [TELEGRAM_KEYS, 'TELEGRAM_*'],
      [GOOGLE_KEYS, 'GOOGLE_*'],
    ] as const) {
      const missing = keys.filter((key) => raw[key] === undefined);
      if (missing.length === 0 || (missing.length === keys.length && raw.APP_ENV === 'local')) {
        continue;
      }
      incomplete = true;
      for (const key of missing) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message:
            raw.APP_ENV === 'local'
              ? `${key} is required when any ${prefix} variable is set`
              : `${key} is required when APP_ENV=${raw.APP_ENV}`,
        });
      }
    }
    if (incomplete) return z.NEVER;
    if (raw.APP_ENV !== 'local') {
      // Локально сайт работает и без базы: она нужна только форме и статусу занятости.
      if (raw.DATABASE_URL === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['DATABASE_URL'],
          message: `DATABASE_URL is required when APP_ENV=${raw.APP_ENV}`,
        });
        return z.NEVER;
      }
      // Без него после деплоя страницы держали бы статусы занятости из сборки.
      if (raw.INTERNAL_API_SECRET === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['INTERNAL_API_SECRET'],
          message: `INTERNAL_API_SECRET is required when APP_ENV=${raw.APP_ENV}`,
        });
        return z.NEVER;
      }
      if (raw.SITE_URL === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['SITE_URL'],
          message: `SITE_URL is required when APP_ENV=${raw.APP_ENV}`,
        });
        return z.NEVER;
      }
      if (!raw.SITE_URL.startsWith('https://')) {
        ctx.addIssue({
          code: 'custom',
          path: ['SITE_URL'],
          message: `SITE_URL must use https when APP_ENV=${raw.APP_ENV}`,
        });
        return z.NEVER;
      }
    }
    return {
      APP_ENV: raw.APP_ENV,
      SITE_URL: (raw.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),
      ...(raw.DATABASE_URL === undefined ? {} : { DATABASE_URL: raw.DATABASE_URL }),
      ...(raw.INTERNAL_API_SECRET === undefined
        ? {}
        : { INTERNAL_API_SECRET: raw.INTERNAL_API_SECRET }),
      ...(raw.TELEGRAM_BOT_TOKEN === undefined ||
      raw.TELEGRAM_WEBHOOK_SECRET === undefined ||
      raw.TELEGRAM_LEADS_CHAT_ID === undefined ||
      raw.TELEGRAM_ALERT_CHAT_ID === undefined ||
      raw.TELEGRAM_TUTORS === undefined
        ? {}
        : {
            telegram: {
              token: raw.TELEGRAM_BOT_TOKEN,
              webhookSecret: raw.TELEGRAM_WEBHOOK_SECRET,
              leadsChatId: Number(raw.TELEGRAM_LEADS_CHAT_ID),
              alertChatId: Number(raw.TELEGRAM_ALERT_CHAT_ID),
              tutors: raw.TELEGRAM_TUTORS,
            } satisfies TelegramEnv,
          }),
      ...(raw.GOOGLE_SHEET_ID === undefined || raw.GOOGLE_SERVICE_ACCOUNT_JSON === undefined
        ? {}
        : {
            sheets: {
              spreadsheetId: raw.GOOGLE_SHEET_ID,
              clientEmail: raw.GOOGLE_SERVICE_ACCOUNT_JSON.client_email,
              privateKey: raw.GOOGLE_SERVICE_ACCOUNT_JSON.private_key,
            } satisfies SheetsEnv,
          }),
    };
  });

export type Env = z.infer<typeof envSchema>;

export class EnvError extends Error {
  override readonly name = 'EnvError';
}

/** Пустые строки считаются незаданными: так ведут себя `.env`-файлы с `KEY=`. */
function dropEmpty(source: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ''));
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(dropEmpty(source));
  if (!result.success) {
    // В сообщении только имена переменных и причины, без значений.
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new EnvError(`Invalid environment: ${details}`);
  }
  return result.data;
}
