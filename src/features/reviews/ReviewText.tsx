'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

import { READ_LESS, READ_MORE } from './texts';

// Текст отзыва длиннее 8 строк обрезается, кнопка раскрывает его на месте (ТЗ главной, блок 6).
// Без JavaScript обрезки нет – текст виден целиком; кнопка появляется, только если текст правда
// не поместился.

export function ReviewText({ text }: { text: string }) {
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      if (!expanded) setClamped(element.scrollHeight > element.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded]);

  return (
    <div className="flex flex-col items-start gap-1">
      {/* 17 px и строка 32 px – текст лежит на линейках листа (макет D-6-reviews). */}
      <p
        ref={ref}
        id={id}
        className={cn(
          'text-[1.0625rem] leading-8 text-ink-2',
          !expanded && 'scripting:line-clamp-8',
        )}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex min-h-11 items-center text-small font-semibold text-ink underline underline-offset-4 hover:no-underline"
        >
          {expanded ? READ_LESS : READ_MORE}
        </button>
      )}
    </div>
  );
}
