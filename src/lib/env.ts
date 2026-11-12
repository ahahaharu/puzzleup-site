import { z } from 'zod';

/**
 * Схема переменных окружения – чистая, без чтения process.env.
 * Экземпляр для приложения – src/server/env.ts, проверка при старте – src/instrumentation.ts.
 * Новая переменная добавляется сюда в той фиче, где она впервые нужна
 * (список – docs/architecture.md, раздел 8).
 */
const envSchema = z
  .object({
    APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
    SITE_URL: z.url({ protocol: /^https?$/ }).optional(),
  })
  .transform((raw, ctx) => {
    if (raw.APP_ENV !== 'local') {
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
