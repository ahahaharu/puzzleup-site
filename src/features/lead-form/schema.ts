import { z } from 'zod';

import { ENTRIES } from '@/lib/entry';
import { goalSchema, type Goal } from '@/lib/goal';
import { contactMethodSchema, contactTimeSchema } from '@/lib/lead';
import { parsePhone } from '@/lib/phone';
import { UTM_MAX_LENGTH } from '@/lib/utm';

import { ERRORS } from './texts';

// Схема формы заявки – ТЗ главной, блок 9 («Поля по порядку», «Проверка полей»). Одна и та же
// на клиенте (Conform, проверка при уходе из поля и при отправке) и в Server Action.
// Допустимые значения зависят от репетитора: его классы, предметы и цели передаются снаружи.

export const NAME_MAX = 60;
export const COMMENT_MAX = 1000;
/** Счётчик символов комментария появляется с этой длины. */
export const COMMENT_COUNTER_FROM = 800;
/** Путь страницы с формой – не длиннее этого. */
const PATH_MAX = 200;

export const HONEYPOT = 'website';

/** Имя: буквы, пробел и дефис, хотя бы одна буква. */
const NAME_CHARS = /^[\p{L} -]+$/u;

export type LeadFormOptions = {
  tutorId: string;
  /** Классы в чипах: другой класс репетитора – подсказка, а не ошибка. */
  grades: readonly number[];
  /** id активных предметов репетитора. */
  subjects: readonly string[];
  /** Цели из поля `goals` репетитора. */
  goals: readonly Goal[];
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined)
    .catch(undefined);

/** Одна ошибка на поле: сначала пустое, затем недопустимые символы, затем длина. */
function nameError(value: string): string | undefined {
  if (value === '') return ERRORS.nameEmpty;
  if (!NAME_CHARS.test(value) || !/\p{L}/u.test(value)) return ERRORS.nameInvalid;
  // Одна буква – тоже «не указано, как обращаться»; длиннее 60 не даёт набрать `maxLength`.
  if (value.length < 2 || value.length > NAME_MAX) return ERRORS.nameEmpty;
  return undefined;
}

export function leadSchema(options: LeadFormOptions) {
  return z.object({
    tutorId: z.literal(options.tutorId),
    parentName: z
      .string({ error: ERRORS.nameEmpty })
      .trim()
      .superRefine((value, ctx) => {
        const message = nameError(value);
        if (message) ctx.addIssue({ code: 'custom', message });
      }),
    phone: z.string({ error: ERRORS.phoneEmpty }).transform((value, ctx) => {
      const result = parsePhone(value);
      if (result.ok) return result.e164;
      ctx.addIssue({
        code: 'custom',
        message:
          result.problem === 'empty'
            ? ERRORS.phoneEmpty
            : result.problem === 'incomplete'
              ? ERRORS.phoneIncomplete
              : ERRORS.phoneUnknownCode,
      });
      return z.NEVER;
    }),
    contactMethod: z.enum(contactMethodSchema.options, { error: ERRORS.contactEmpty }),
    grade: z
      .number({ error: ERRORS.gradeEmpty })
      .refine((grade) => options.grades.includes(grade), ERRORS.gradeEmpty),
    subjects: z
      .array(
        z.string().refine((id) => options.subjects.includes(id), ERRORS.subjectsEmpty),
        {
          error: ERRORS.subjectsEmpty,
        },
      )
      .min(1, ERRORS.subjectsEmpty)
      .transform((ids) => [...new Set(ids)]),
    // Необязательные поля: подменённое значение не мешает отправке – оно просто отбрасывается.
    goal: z
      .string()
      .optional()
      .transform((value): Goal | undefined => {
        const goal = goalSchema.safeParse(value);
        return goal.success && options.goals.includes(goal.data) ? goal.data : undefined;
      }),
    contactTime: z
      .array(z.string())
      .transform((values) => [
        ...new Set(values.flatMap((value) => contactTimeSchema.safeParse(value).data ?? [])),
      ]),
    comment: z
      .string()
      .trim()
      .max(COMMENT_MAX, ERRORS.commentTooLong)
      .optional()
      .transform((value) => value || undefined),
    consent: z.literal('on', { error: ERRORS.consentMissing }),
    // Скрытые поля: откуда пришёл родитель. Неизвестное значение – «пришёл напрямую».
    entry: z.enum(ENTRIES).catch('direct').default('direct'),
    landing: z
      .string()
      .regex(/^\/[^?#\s]*$/)
      .max(PATH_MAX)
      .optional()
      .catch(undefined),
    utm_source: optionalText(UTM_MAX_LENGTH),
    utm_medium: optionalText(UTM_MAX_LENGTH),
    utm_campaign: optionalText(UTM_MAX_LENGTH),
    utm_term: optionalText(UTM_MAX_LENGTH),
    utm_content: optionalText(UTM_MAX_LENGTH),
  });
}

export type LeadSchema = ReturnType<typeof leadSchema>;
export type LeadInput = z.infer<LeadSchema>;
