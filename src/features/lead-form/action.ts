'use server';

import { createHash } from 'node:crypto';

import type { SubmissionResult } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { headers } from 'next/headers';

import { getSite, getSubjects, getTutors } from '@/content';
import type { Entry } from '@/lib/entry';
import { contactMethodSchema, type ContactMethod } from '@/lib/lead';
import { isWithinHours, systemClock } from '@/lib/time';
import { UTM_KEYS, type Utm } from '@/lib/utm';
import { getDb } from '@/server/db/client';
import { env } from '@/server/env';
import { clientIp, contextFromReferer, isSameOrigin } from '@/server/http';
import { createLead } from '@/server/leads/service';
import { createMemoryRateLimiter, LEAD_RATE_LIMIT } from '@/server/rate-limit';

import { consentText, leadFormData } from './form-data';
import { HONEYPOT, leadSchema } from './schema';

// Приём заявки – docs/architecture.md, раздел 5: Origin → rate limit → ловушка → Zod → одна
// транзакция в базе. Без JavaScript форма отправляется обычным POST, и страница рендерится с
// этим же состоянием. В логи – только код ошибки, без ПД и без текста ошибки базы: в нём бывают
// значения полей.

export type FormProblem = 'server' | 'rate_limit';

export type LeadActionState =
  /** `result` нет при сбое сети: поля на месте, ответа сервера не было. */
  | { status: 'error'; result?: SubmissionResult<string[]>; problem?: FormProblem | undefined }
  | {
      status: 'success';
      result: SubmissionResult<string[]>;
      /** `entry` – для ссылки «Отправить ещё одну заявку» без JavaScript. */
      thanks: { contactMethod: ContactMethod; night: boolean; entry: Entry };
    };

const limiter = createMemoryRateLimiter(LEAD_RATE_LIMIT);

function logFailure(code: string, error?: unknown) {
  // `code` у ошибок pg – SQLSTATE (23514 – CHECK): по нему видно причину без значений полей.
  const sqlState =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
  console.error(JSON.stringify({ scope: 'leads', event: code, sqlState }));
}

function thanksFor(contactMethod: ContactMethod, entry: Entry, now: number) {
  return { contactMethod, entry, night: !isWithinHours(now, getSite().responseHours) };
}

export async function submitLead(
  _previous: LeadActionState | undefined,
  formData: FormData,
): Promise<LeadActionState> {
  const requestHeaders = await headers();
  const now = systemClock.now();
  const tutor = getTutors().find(
    (candidate) => candidate.id === formData.get('tutorId') && !candidate.archived,
  );
  const data =
    tutor && leadFormData(tutor, { site: getSite(), subjects: getSubjects(), tutors: getTutors() });
  const submission = parseWithZod(formData, {
    schema: leadSchema(data?.options ?? { tutorId: '', grades: [], subjects: [], goals: [] }),
  });
  // Ответ с ошибкой формы сохраняет введённые данные: без JavaScript они вернутся в поля.
  const fail = (problem: FormProblem) => ({
    status: 'error' as const,
    result: submission.reply(),
    problem,
  });

  if (!isSameOrigin(requestHeaders, env.SITE_URL)) {
    logFailure('origin_rejected');
    return fail('server');
  }
  if (!limiter.hit(clientIp(requestHeaders), now)) {
    logFailure('rate_limited');
    return fail('rate_limit');
  }

  // Ловушка для спама заполнена – тихий «успех» без записи.
  const honeypot = formData.get(HONEYPOT);
  if (typeof honeypot === 'string' && honeypot !== '') {
    logFailure('honeypot');
    return {
      status: 'success',
      result: submission.reply({ resetForm: true }),
      thanks: thanksFor(
        contactMethodSchema.safeParse(submission.payload.contactMethod).data ?? 'telegram',
        'direct',
        now,
      ),
    };
  }

  if (!tutor || !data) {
    logFailure('unknown_tutor');
    return fail('server');
  }
  if (submission.status !== 'success') {
    return { status: 'error', result: submission.reply() };
  }

  const { value } = submission;
  const formUtm: Utm = {};
  for (const key of UTM_KEYS) {
    const tag = value[key];
    if (tag !== undefined) formUtm[key] = tag;
  }
  const referer = contextFromReferer(requestHeaders, env.SITE_URL);
  const entry = value.entry === 'direct' ? (referer.entry ?? 'direct') : value.entry;
  const site = getSite();

  try {
    await createLead(await getDb(), {
      tutorId: tutor.id,
      parentName: value.parentName,
      phone: value.phone,
      contactMethod: value.contactMethod,
      grade: value.grade,
      subjects: value.subjects,
      goal: value.goal,
      contactTime: value.contactTime,
      comment: value.comment,
      entry,
      landingPath: value.landing ?? data.landing,
      utm: Object.keys(formUtm).length > 0 ? formUtm : referer.utm,
      initialAvailability: tutor.availability,
      consent: {
        version: site.consent.version,
        textSha256: createHash('sha256').update(consentText(data.consent)).digest('hex'),
      },
    });
  } catch (error) {
    logFailure('create_failed', error);
    return fail('server');
  }

  return {
    status: 'success',
    result: submission.reply({ resetForm: true }),
    thanks: thanksFor(value.contactMethod, entry, now),
  };
}
