'use client';

import { useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

import { SHOW_MORE } from './texts';

// Сколько отзывов видно до «Показать ещё» – ТЗ страницы репетитора, раздел 4, блок 4: на телефоне 3,
// от 1024 px (две колонки) – 6. Остальные уже в разметке и скрыты CSS, их видят поисковики.
// Без JavaScript видны все, кнопки нет.
const VISIBLE = { phone: 3, desktop: 6 };

type ReviewsListProps = { count: number; children: ReactNode };

export function ReviewsList({ count, children }: ReviewsListProps) {
  const list = useRef<HTMLUListElement>(null);
  const [expanded, setExpanded] = useState(false);

  function expand() {
    setExpanded(true);
    // Кнопка исчезает – фокус переходит на первый открытый отзыв.
    const desktop = window.matchMedia('(min-width: 64rem)').matches;
    const first = list.current?.children[desktop ? VISIBLE.desktop : VISIBLE.phone];
    if (first instanceof HTMLElement) {
      first.tabIndex = -1;
      requestAnimationFrame(() => first.focus());
    }
  }

  return (
    <>
      <ul
        ref={list}
        className={cn(
          'mt-7 grid gap-5 lg:mt-10 lg:grid-cols-2 lg:gap-6',
          !expanded &&
            'scripting:max-lg:[&>li:nth-child(n+4)]:hidden scripting:lg:[&>li:nth-child(n+7)]:hidden',
        )}
      >
        {children}
      </ul>
      {!expanded && count > VISIBLE.phone && (
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={expand}
          className={cn('mt-8 noscript:hidden', count <= VISIBLE.desktop && 'lg:hidden')}
        >
          {SHOW_MORE}
        </Button>
      )}
    </>
  );
}
