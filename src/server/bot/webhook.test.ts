import { describe, expect, it, vi } from 'vitest';

import { handleWebhook, SECRET_HEADER } from './webhook';

const SECRET = 'fake-webhook-secret-fake-webhook-secret';

const request = (body: string, secret?: string) =>
  new Request('http://localhost/api/telegram', {
    method: 'POST',
    headers: secret === undefined ? {} : { [SECRET_HEADER]: secret },
    body,
  });

describe('handleWebhook', () => {
  it('is not found while the bot is off', async () => {
    expect((await handleWebhook(request('{}', SECRET), undefined)).status).toBe(404);
  });

  it.each([undefined, '', 'fake-webhook-secret', `${SECRET}x`])(
    'rejects the secret %j',
    async (secret) => {
      const handle = vi.fn(async () => {});
      expect((await handleWebhook(request('{}', secret), { secret: SECRET, handle })).status).toBe(
        401,
      );
      expect(handle).not.toHaveBeenCalled();
    },
  );

  it('rejects a body that is not JSON', async () => {
    const handle = vi.fn(async () => {});
    expect((await handleWebhook(request('{', SECRET), { secret: SECRET, handle })).status).toBe(
      400,
    );
  });

  it('handles the update and answers 200', async () => {
    const handle = vi.fn(async () => {});
    const response = await handleWebhook(request('{"update_id":1}', SECRET), {
      secret: SECRET,
      handle,
    });
    expect(response.status).toBe(200);
    expect(handle).toHaveBeenCalledWith({ update_id: 1 });
  });
});
