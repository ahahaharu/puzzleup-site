'use client';

import { useEffect, useState } from 'react';

import { currentSection } from './active-section';

/**
 * Линия, до которой должен дойти верх блока, – отступ якорей `scroll-padding-top` (высота шапки):
 * после перехода по ссылке подсвечен именно её блок.
 */
function probeLine() {
  return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 1;
}

/** Страница докручена до конца: короткий последний раздел до линии шапки может не дойти. */
function atPageEnd() {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
}

type Options = {
  /** В конце страницы текущим считается последний блок. */
  lastAtEnd?: boolean;
};

/**
 * Текущий блок при прокрутке: id последнего элемента `selector`, чей верх дошёл до низа шапки.
 * `selector: null` – подсветка выключена.
 */
export function useActiveSection(selector: string | null, { lastAtEnd = false }: Options = {}) {
  const [active, setActive] = useState<string>();

  useEffect(() => {
    if (!selector) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const sections = Array.from(document.querySelectorAll<HTMLElement>(selector), (section) => ({
        id: section.id,
        top: section.getBoundingClientRect().top,
      }));
      setActive(
        lastAtEnd && sections.length > 0 && atPageEnd()
          ? sections.at(-1)?.id
          : currentSection(sections, probeLine()),
      );
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [selector, lastAtEnd]);

  return active;
}
