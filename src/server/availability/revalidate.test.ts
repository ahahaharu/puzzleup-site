import { describe, expect, it, vi } from 'vitest';

import { handleRevalidate, requestRevalidation } from './revalidate';

const SECRET = 'fake-internal-secret-fake-internal-secret';

const request = (authorization?: string) =>
  new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: authorization === undefined ? {} : { authorization },
  });

describe('handleRevalidate', () => {
  it('is not found without INTERNAL_API_SECRET', () => {
    const invalidate = vi.fn();
    expect(handleRevalidate(request(`Bearer ${SECRET}`), undefined, invalidate).status).toBe(404);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it.each([undefined, '', SECRET, `Bearer ${SECRET}x`, 'Bearer fake', `Basic ${SECRET}`])(
    'rejects the authorization %j',
    (authorization) => {
      const invalidate = vi.fn();
      expect(handleRevalidate(request(authorization), SECRET, invalidate).status).toBe(401);
      expect(invalidate).not.toHaveBeenCalled();
    },
  );

  it('invalidates the availability cache', () => {
    const invalidate = vi.fn();
    expect(handleRevalidate(request(`Bearer ${SECRET}`), SECRET, invalidate).status).toBe(204);
    expect(invalidate).toHaveBeenCalledOnce();
  });
});

describe('requestRevalidation', () => {
  it('posts the secret to the site endpoint', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    await requestRevalidation('https://dev.puzzle-up.by', SECRET, fetcher);
    expect(fetcher).toHaveBeenCalledWith(
      new URL('https://dev.puzzle-up.by/api/revalidate'),
      expect.objectContaining({
        method: 'POST',
        headers: { authorization: `Bearer ${SECRET}` },
      }),
    );
  });

  it('fails with the status code only', async () => {
    const fetcher = vi.fn(async () => new Response('secret body', { status: 401 }));
    await expect(requestRevalidation('http://localhost:3000', SECRET, fetcher)).rejects.toThrow(
      'Revalidation failed: HTTP 401',
    );
  });
});
