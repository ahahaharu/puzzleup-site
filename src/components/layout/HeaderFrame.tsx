'use client';

import { useEffect, useState, type ReactNode } from 'react';

// Шапка после прокрутки – ТЗ главной, блок 0; макеты X-header-d, X-header-m.

/** Прокрутка, после которой шапка сжимается и становится полупрозрачной. */
const SCROLLED_AFTER = 80;

/**
 * Закреплённая шапка. Фон – paper 92 % с размытием всегда (ADR-058). После 80 px снизу появляется
 * линия, а на десктопе шапка уходит вверх на 16 px и её содержимое опускается на 8 px: видно 72 px
 * вместо 88. Двигается только `transform` – содержимое страницы под шапкой не сдвигается. Без
 * JavaScript шапка остаётся в исходном виде.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SCROLLED_AFTER);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="group/header sticky top-0 z-40 transition-transform duration-200 ease-out lg:data-scrolled:-translate-y-4"
    >
      {/* Клетка своего фона не стыковалась с клеткой страницы, поэтому фон один и тот же до и после
          прокрутки. Размытие 8 px – из ТЗ. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 border-b border-transparent bg-paper/92 backdrop-blur-[8px] group-data-scrolled/header:border-ink/10"
      />
      {children}
    </header>
  );
}
