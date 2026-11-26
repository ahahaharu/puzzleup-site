'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

import type { NavLink } from './nav';
import { NavAnchor } from './NavAnchor';
import { useActiveSection } from './use-active-section';

// Навигация шапки на десктопе – ТЗ главной, раздел 3 и блок 0; макет X-header-d.
// Линия текущего блока – одна на всё меню: при смене блока переезжает к новому пункту (сдвиг и
// масштаб по ширине – только transform), а не перепрыгивает. Появляется и гаснет на месте.

type HeaderNavProps = {
  links: readonly NavLink[];
  /** Подсвечивать пункт текущего блока – только на главной, где блоки на той же странице. */
  spy: boolean;
};

/** Толщина линии – как у бывшей нижней рамки пункта. */
const LINE_PX = 2;

type Line = { left: number; top: number; width: number; visible: boolean; slide: boolean };

export function HeaderNav({ links, spy }: HeaderNavProps) {
  const active = useActiveSection(spy ? 'main section[id]' : null);
  const nav = useRef<HTMLElement>(null);
  const [line, setLine] = useState<Line>();

  // Замер до отрисовки: линия не мелькает на старом месте. Ширина пунктов меняется с шрифтом и окном.
  useLayoutEffect(() => {
    const element = nav.current;
    if (!element) return;
    const measure = () => {
      const label = element.querySelector<HTMLElement>('[aria-current] [data-nav-label]');
      setLine((previous) =>
        label
          ? {
              // Отсчёт – от <nav>: он ближайший позиционированный предок метки.
              left: label.offsetLeft,
              top: label.offsetTop + label.offsetHeight - LINE_PX,
              width: label.offsetWidth,
              visible: true,
              // Переезд – только от пункта к пункту; появление после пустоты – на месте.
              slide: previous?.visible === true,
            }
          : // Гаснет там, где стояла.
            previous && { ...previous, visible: false, slide: false },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [active]);

  const shown = line?.visible === true;

  return (
    <nav ref={nav} aria-label="Основная" className="relative hidden lg:block">
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
              <span
                data-nav-label
                className="border-b-2 border-transparent py-1.5 group-hover/nav:border-ink/25 group-aria-[current]/nav:border-transparent"
              >
                {link.label}
              </span>
            </NavAnchor>
          </li>
        ))}
      </ul>
      {/* Линия 1 px шириной растягивается масштабом до ширины пункта: анимируется только transform.
          Вне списка – дикторы не услышат лишний пункт. */}
      <span
        aria-hidden="true"
        style={
          line && { transform: `translate(${line.left}px, ${line.top}px) scaleX(${line.width})` }
        }
        className={cn(
          'pointer-events-none absolute top-0 left-0 h-0.5 w-px origin-left bg-accent-text ease-out',
          line?.slide
            ? 'transition-[transform,opacity] duration-300'
            : 'transition-opacity duration-200',
          shown ? 'opacity-100' : 'opacity-0',
        )}
      />
    </nav>
  );
}
