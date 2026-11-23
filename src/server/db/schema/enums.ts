import 'server-only';

import { pgEnum } from 'drizzle-orm/pg-core';

import { availabilitySchema } from '@/lib/availability';
import { ENTRIES } from '@/lib/entry';
import { goalSchema } from '@/lib/goal';
import {
  contactMethodSchema,
  contactTimeSchema,
  leadSourceSchema,
  leadStatusSchema,
  rejectionReasonSchema,
} from '@/lib/lead';

// Перечисления – docs/data-model.md, раздел 2. Значения берутся из Zod-схем src/lib, чтобы форма,
// бот и база не разошлись. Новое значение в схеме – это `drizzle-kit generate` и миграция
// `ALTER TYPE … ADD VALUE`; удаление или переименование – только вручную написанной миграцией.

export const goalEnum = pgEnum('goal', goalSchema.enum);
export const availabilityEnum = pgEnum('availability', availabilitySchema.enum);
// Кортежем, а не объектом `.enum`: в объекте ключ '404' встаёт первым (целочисленные ключи).
export const entryEnum = pgEnum('entry', ENTRIES);
export const contactMethodEnum = pgEnum('contact_method', contactMethodSchema.enum);
export const contactTimeEnum = pgEnum('contact_time', contactTimeSchema.enum);
export const leadSourceEnum = pgEnum('lead_source', leadSourceSchema.enum);
export const leadStatusEnum = pgEnum('lead_status', leadStatusSchema.enum);
export const rejectionReasonEnum = pgEnum('rejection_reason', rejectionReasonSchema.enum);
