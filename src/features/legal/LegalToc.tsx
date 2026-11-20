'use client';

import { useActiveSection } from '@/components/layout/use-active-section';
import type { Heading } from '@/lib/headings';

import { TOC_TITLE } from './texts';

// Оглавление политики на десктопе – ТЗ страницы репетитора, раздел 7; макет P-privacy-d. Слева,
// закреплено при прокрутке, текущий раздел подсвечен. Без JavaScript – обычные якоря без подсветки.

/** Заголовки разделов в тексте политики – их ставит `legalComponents.h2`. */
const SECTION_HEADINGS = '#legal-text h2[id]';

export function LegalToc({ headings }: { headings: readonly Heading[] }) {
  const active = useActiveSection(SECTION_HEADINGS, { lastAtEnd: true });

  return (
    // Отступ сверху – под сжатой шапкой 72 px; длинное оглавление прокручивается само.
    <nav
      aria-labelledby="toc-title"
      className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto"
    >
      <p id="toc-title" className="mb-2 font-display text-[1rem] font-medium text-ink">
        {TOC_TITLE}
      </p>
      <TocList headings={headings} active={active} />
    </nav>
  );
}

type TocListProps = { headings: readonly Heading[]; active?: string | undefined };

/** Пункты оглавления – строка от 44 px, зона клика. */
export function TocList({ headings, active }: TocListProps) {
  return (
    <ul>
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            aria-current={heading.id === active ? 'location' : undefined}
            className="flex min-h-11 items-center py-1.5 text-small text-ink-muted no-underline hover:text-ink aria-[current]:font-semibold aria-[current]:text-ink"
          >
            {heading.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
