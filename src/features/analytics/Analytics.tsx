'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useSyncExternalStore } from 'react';

import type { Analytics as AnalyticsConfig } from '@/lib/analytics';

import { useConsent } from './consent';
import { forgetMetrika, loadMetrika, metrikaHit } from './metrika';
import { loadUmami } from './umami';

// Счётчики – ТЗ главной, «Глобальные элементы»: Umami (без cookie) считает всегда, Яндекс Метрика
// загружается только после «Принять». Оба – только на боевом адресе: копия на staging и
// локальный сервер статистику не портят (ADR-056).

type AnalyticsProps = AnalyticsConfig & {
  /** Боевой адрес из `site.json`. */
  siteUrl: string;
};

const noSubscription = () => () => {};

function useLive(siteUrl: string): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => window.location.origin === siteUrl,
    () => false,
  );
}

function useMetrika(counterId: number | undefined, enabled: boolean) {
  const loaded = useRef(false);
  const pathname = usePathname();
  const lastUrl = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (counterId === undefined) return;
    if (enabled && !loaded.current) {
      loadMetrika(counterId);
      loaded.current = true;
      lastUrl.current = window.location.href;
    } else if (!enabled && loaded.current) {
      forgetMetrika();
    }
  }, [counterId, enabled]);

  useEffect(() => {
    if (counterId === undefined || !loaded.current) return;
    const url = window.location.href;
    if (lastUrl.current !== undefined && lastUrl.current !== url) {
      metrikaHit(counterId, url, lastUrl.current);
    }
    lastUrl.current = url;
  }, [counterId, pathname]);
}

export function Analytics({ siteUrl, umami, metrikaId }: AnalyticsProps) {
  const live = useLive(siteUrl);
  const { choice } = useConsent();
  useMetrika(metrikaId, live && choice === 'all');

  const umamiScript = umami?.scriptUrl;
  const umamiWebsite = umami?.websiteId;
  useEffect(() => {
    if (live && umamiScript && umamiWebsite) {
      loadUmami({ scriptUrl: umamiScript, websiteId: umamiWebsite });
    }
  }, [live, umamiScript, umamiWebsite]);

  return null;
}
