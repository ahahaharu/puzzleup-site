import 'server-only';

import { createPrivateKey, createSign, type KeyObject } from 'node:crypto';

import { z } from 'zod';

import { SheetsApiError } from './port';

/**
 * Клиент Google Sheets API v4 на встроенном `fetch` с ключом сервисного аккаунта
 * (docs/architecture.md, раздел 2). Токен – OAuth 2.0 для сервисных аккаунтов: JWT, подписанный
 * ключом (RS256), меняется на access token на час. Наружу – только `SheetsApiError` с кодом:
 * тело ответа и ключ в ошибки и логи не попадают.
 */
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_TTL_S = 3600;
/** Токен меняется заранее, чтобы не истечь посреди запроса. */
const TOKEN_MARGIN_MS = 5 * 60_000;
// Меньше тайм-аута обработчика outbox (30 с), как у адаптера Telegram.
const REQUEST_TIMEOUT_MS = 20_000;

export type GoogleCredentials = { clientEmail: string; privateKey: string };

export type SheetsRequest = {
  method?: 'GET' | 'POST' | 'PUT';
  /** Путь после `/v4/spreadsheets/`, уже закодированный. */
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal | undefined;
};

export type SheetsClient = {
  /** Ответ проверяется схемой: не совпал – `SheetsApiError('bad_response')`. */
  request<T>(request: SheetsRequest, schema: z.ZodType<T>): Promise<T>;
};

export type SheetsClientOptions = {
  /** Подменяется в тестах. */
  fetch?: typeof fetch;
  now?: () => number;
};

const tokenSchema = z.object({ access_token: z.string(), expires_in: z.number() });

const base64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

function signJwt(claims: Record<string, string | number>, key: KeyObject): string {
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(JSON.stringify(claims))}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key);
  return `${unsigned}.${base64url(signature)}`;
}

export function createSheetsClient(
  credentials: GoogleCredentials,
  options: SheetsClientOptions = {},
): SheetsClient {
  const fetchFn = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  // Битый ключ – ошибка при запуске воркера, а не в каждом задании.
  const key = createPrivateKey(credentials.privateKey);
  let token: { value: string; expiresAt: number } | undefined;

  async function send(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    try {
      return await fetchFn(url, {
        ...init,
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
    } catch (error) {
      if (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) {
        throw new SheetsApiError('timeout');
      }
      throw new SheetsApiError('network');
    }
  }

  async function parse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
    const data: unknown = await response.json().catch(() => undefined);
    const result = schema.safeParse(data);
    if (!result.success) throw new SheetsApiError('bad_response');
    return result.data;
  }

  async function accessToken(signal?: AbortSignal): Promise<string> {
    if (token && token.expiresAt > now() + TOKEN_MARGIN_MS) return token.value;
    const iat = Math.floor(now() / 1000);
    const assertion = signJwt(
      { iss: credentials.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + TOKEN_TTL_S },
      key,
    );
    const response = await send(
      TOKEN_URL,
      {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion,
        }),
      },
      signal,
    );
    if (!response.ok) throw new SheetsApiError(`auth:${response.status}`);
    const data = await parse(response, tokenSchema);
    token = { value: data.access_token, expiresAt: now() + data.expires_in * 1000 };
    return token.value;
  }

  return {
    async request({ method = 'GET', path, query, body, signal }, schema) {
      const url = `${API_URL}/${path}${query ? `?${new URLSearchParams(query)}` : ''}`;
      const response = await send(
        url,
        {
          method,
          headers: {
            authorization: `Bearer ${await accessToken(signal)}`,
            ...(body !== undefined && { 'content-type': 'application/json' }),
          },
          ...(body !== undefined && { body: JSON.stringify(body) }),
        },
        signal,
      );
      // Токен отозван раньше срока – следующая попытка задания возьмёт новый.
      if (response.status === 401) token = undefined;
      if (!response.ok) throw new SheetsApiError(String(response.status));
      return parse(response, schema);
    },
  };
}
