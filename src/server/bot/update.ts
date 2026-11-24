import 'server-only';

import { z } from 'zod';

// Часть апдейта Telegram, которую читает бот. Остальные поля отбрасываются: текст чужих
// сообщений дальше разбора не идёт.

const chat = z.object({ id: z.number().int(), type: z.string() });
const user = z.object({ id: z.number().int() });

export const updateSchema = z.object({
  update_id: z.number().int(),
  message: z
    .object({
      message_id: z.number().int(),
      chat,
      from: user.optional(),
      text: z.string().optional(),
    })
    .optional(),
  callback_query: z
    .object({
      id: z.string(),
      from: user,
      data: z.string().optional(),
      message: z.object({ message_id: z.number().int(), chat }).optional(),
    })
    .optional(),
});

export type Update = z.infer<typeof updateSchema>;
export type Chat = z.infer<typeof chat>;

/** `/add`, `/add@puzzleup_bot`, `/help что-то` → `add`, `help`. Не команда – `undefined`. */
export function commandOf(text: string | undefined): string | undefined {
  return text === undefined
    ? undefined
    : /^\/([a-z]+)(?:@\w+)?(?:\s|$)/i.exec(text)?.[1]?.toLowerCase();
}
