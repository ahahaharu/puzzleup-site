'use client';

import { useEffect, useState } from 'react';

import { currentSection } from './active-section';
import type { NavLink } from './nav';
import { NavAnchor } from './NavAnchor';

// Навигация шапки на десктопе – ТЗ главной, раздел 3 и блок 0; макет X-header-d.

/**
 * Линия, до которой должен дойти верх блока, – отступ якорей `scroll-padding-top` (высота шапки):
 * после перехода по пункту подсвечен именно он.
 */
function probeLine() {
  return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 1;
}

function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string>();

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>('main section[id]'),
        (section) => ({ id: section.id, top: section.getBoundingClientRect().top }),
      );
      setActive(currentSection(sections, probeLine()));
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
  }, [enabled]);

  return active;
}

type HeaderNavProps = {
  links: readonly NavLink[];
  /** Подсвечивать пункт текущего блока – только на главной, где блоки на той же странице. */
  spy: boolean;
};

export function HeaderNav({ links, spy }: HeaderNavProps) {
  const active = useActiveSection(spy);

  return (
    <nav aria-label="Основная" className="hidden lg:block">
      {/* 36 px между пунктами из ТЗ – от 1280 px; на 1024 пункты и кнопка не поместились бы. */}
      <ul className="flex gap-6 xl:gap-9">
        {links.map((link) => (
          <li key={link.id}>
            <NavAnchor
              href={link.href}
              aria-current={link.id === active ? 'location' : undefined}
              // Golos 500, 16 px – из ТЗ; зона клика 44 px, линия – под текстом.
              className="group/nav inline-flex min-h-11 items-center text-[1rem] font-medium text-ink no-underline"
            >
              <span className="border-b-2 border-transparent py-1.5 group-hover/nav:border-ink/25 group-aria-[current]/nav:border-accent-text">
                {link.label}
              </span>
            </NavAnchor>
          </li>
        ))}
      </ul>
    </nav>
  );
}
