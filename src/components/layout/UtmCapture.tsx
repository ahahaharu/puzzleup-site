'use client';

import { useEffect } from 'react';

import { rememberUtm } from '@/lib/utm';

// UTM-метки первого захода – в sessionStorage на любой странице сайта (ТЗ главной, раздел 8):
// родитель может прийти по рекламе на главную, а заявку оставить на странице репетитора.

/** sessionStorage недоступен в части приватных режимов – обращение к нему бросает исключение. */
export function sessionStore(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function UtmCapture() {
  useEffect(() => {
    rememberUtm(window.location.search, sessionStore());
  }, []);
  return null;
}
