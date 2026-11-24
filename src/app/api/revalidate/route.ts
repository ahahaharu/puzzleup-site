import { invalidateAvailability } from '@/server/availability/cache';
import { handleRevalidate } from '@/server/availability/revalidate';
import { env } from '@/server/env';

// Сброс кэша статусов занятости: post-deploy и `pnpm bot:poll` (docs/architecture.md, раздел 4).

export function POST(request: Request) {
  return handleRevalidate(request, env.INTERNAL_API_SECRET, invalidateAvailability);
}
