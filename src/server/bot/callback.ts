import 'server-only';

import { z } from 'zod';

import { leadStatusSchema, rejectionReasonSchema } from '@/lib/lead';

/**
 * `callback_data` кнопок – до 64 байт, поэтому коротко: `st:1024:contacted` – статус,
 * `rj:1024` – показать причины отказа, `rr:1024:expensive` – отказ с причиной, `bk:1024` – назад
 * к статусам, `add:grade:7` – шаг диалога `/add`. Чужие и устаревшие данные – `undefined`.
 */
export type Callback =
  | { kind: 'status'; leadId: number; status: z.infer<typeof leadStatusSchema> }
  | { kind: 'reject'; leadId: number }
  | { kind: 'reason'; leadId: number; reason: z.infer<typeof rejectionReasonSchema> }
  | { kind: 'back'; leadId: number }
  | { kind: 'add'; step: string; value: string };

export const callbackData = {
  status: (leadId: number, status: string) => `st:${leadId}:${status}`,
  reject: (leadId: number) => `rj:${leadId}`,
  reason: (leadId: number, reason: string) => `rr:${leadId}:${reason}`,
  back: (leadId: number) => `bk:${leadId}`,
  add: (step: string, value: string | number) => `add:${step}:${value}`,
};

const leadId = z.coerce.number().int().positive();

export function parseCallback(data: string): Callback | undefined {
  const [prefix, first = '', second = '', ...rest] = data.split(':');
  if (rest.length > 0) return undefined;
  const id = leadId.safeParse(first);
  switch (prefix) {
    case 'st': {
      const status = leadStatusSchema.safeParse(second);
      return id.success && status.success
        ? { kind: 'status', leadId: id.data, status: status.data }
        : undefined;
    }
    case 'rr': {
      const reason = rejectionReasonSchema.safeParse(second);
      return id.success && reason.success
        ? { kind: 'reason', leadId: id.data, reason: reason.data }
        : undefined;
    }
    case 'rj':
      return id.success && second === '' ? { kind: 'reject', leadId: id.data } : undefined;
    case 'bk':
      return id.success && second === '' ? { kind: 'back', leadId: id.data } : undefined;
    case 'add':
      return first !== '' && second !== ''
        ? { kind: 'add', step: first, value: second }
        : undefined;
    default:
      return undefined;
  }
}
