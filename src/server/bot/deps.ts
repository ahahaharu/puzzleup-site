import 'server-only';

import type { Clock } from '@/lib/time';
import type { Db } from '@/server/db/client';

import type { BotAccess } from './auth';
import type { BotDirectory } from './directory';
import type { TelegramPort } from './port';

export type BotLog = (event: string, fields: Record<string, string | number>) => void;

/** Всё, что нужно обработчику апдейтов; реализации передаются явно (docs/conventions.md). */
export type BotDeps = {
  db: Db;
  clock: Clock;
  telegram: TelegramPort;
  access: BotAccess;
  directory: BotDirectory;
  log: BotLog;
  /** Сброс кэша статусов занятости на сайте после `/status` (src/server/availability/cache.ts). */
  invalidateAvailability: () => Promise<void>;
};
