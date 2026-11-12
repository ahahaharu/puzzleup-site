import 'server-only';

import { parseEnv, type Env } from '@/lib/env';

/** Проверенное окружение сервера. Читается один раз; ошибка останавливает запуск. */
export const env: Env = parseEnv(process.env);
