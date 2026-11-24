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

const TELEGRAM_KEYS = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'TELEGRAM_LEADS_CHAT_ID',
  'TELEGRAM_ALERT_CHAT_ID',
  'TELEGRAM_TUTORS',
] as const;

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
  })
  .transform((raw, ctx) => {
    // Бот задаётся целиком или не задаётся: наполовину настроенный молча терял бы апдейты.
    const missing = TELEGRAM_KEYS.filter((key) => raw[key] === undefined);
    if (missing.length > 0 && (missing.length < TELEGRAM_KEYS.length || raw.APP_ENV !== 'local')) {
      for (const key of missing) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message:
            raw.APP_ENV === 'local'
              ? `${key} is required when any TELEGRAM_* variable is set`
              : `${key} is required when APP_ENV=${raw.APP_ENV}`,
        });
      }
      return z.NEVER;
    }
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
