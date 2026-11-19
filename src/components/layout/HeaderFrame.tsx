'use client';

import { useEffect, useState, type ReactNode } from 'react';

// Шапка после прокрутки – ТЗ главной, блок 0; макеты X-header-d, X-header-m.

/** Прокрутка, после которой шапка сжимается и становится полупрозрачной. */
export const SCROLLED_AFTER = 80;

/**
 * Закреплённая шапка. После 80 px – фон paper 92 % с размытием и линия снизу; на десктопе шапка
 * уходит вверх на 16 px, а её содержимое опускается на 8 px: видно 72 px вместо 88. Двигается только
 * `transform` – содержимое страницы под шапкой не сдвигается. Без JavaScript шапка остаётся в
 * исходном виде.
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
      {/* До прокрутки – та же клетка, что у страницы; размытие 8 px – из ТЗ. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 border-b border-transparent paper-page group-data-scrolled/header:border-ink/10 group-data-scrolled/header:bg-paper/92 group-data-scrolled/header:bg-none group-data-scrolled/header:backdrop-blur-[8px]"
      />
      {children}
    </header>
  );
}
