'use client';

import Link from 'next/link';
import { useEffect, useId, useRef } from 'react';

import { Button } from '@/components/ui/Button';

import { bannerVisible, choose, useConsent, type ConsentChoice } from './consent';

// Cookie-баннер – ТЗ главной, «Глобальные элементы»; макеты X-cookie-d, X-cookie-m. Не модальный:
// не перекрывает страницу и не блокирует прокрутку. Без JavaScript его нет – и Метрики тоже.

type CookieBannerProps = {
  text: string;
  policyLinkLabel: string;
};

export function CookieBanner({ text, policyLinkLabel }: CookieBannerProps) {
  const consent = useConsent();
  const textId = useId();
  const banner = useRef<HTMLElement>(null);
  // Кнопка «Настройки cookie», которая открыла баннер заново: фокус возвращается к ней.
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!consent.reopened) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    banner.current?.querySelector('button')?.focus();
  }, [consent.reopened]);

  if (!bannerVisible(consent)) return null;

  const select = (choice: ConsentChoice) => () => {
    choose(choice);
    opener.current?.focus();
    opener.current = null;
  };

  return (
    <section
      ref={banner}
      aria-labelledby={textId}
      // Пока баннер виден, нижняя панель спрятана (ADR-040).
      data-cookie-banner=""
      // Телефон – снизу во всю ширину, скруглены верхние углы; от 768 px – карточка 560 px
      // в левом нижнем углу (ТЗ). Отступ 24 px от краёв окна – на сетке ДС.
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-4 rounded-t-card border border-ink/15 bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-ink shadow-paper md:right-auto md:bottom-6 md:left-6 md:w-[560px] md:rounded-card md:pb-5"
    >
      <p id={textId} className="text-small text-ink-2">
        {text} Подробнее – в{' '}
        <Link href="/cookies" className="underline underline-offset-2">
          {policyLinkLabel}
        </Link>
        .
      </p>
      {/* Кнопки одинаковые по размеру и весу (ТЗ). Обе не помещаются в ряд – обе на всю ширину. */}
      <div className="flex flex-wrap gap-2.5">
        <Button size="md" className="flex-1 basis-48" onClick={select('all')}>
          Принять
        </Button>
        <Button size="md" className="flex-1 basis-48" onClick={select('necessary')}>
          Только необходимые
        </Button>
      </div>
    </section>
  );
}
