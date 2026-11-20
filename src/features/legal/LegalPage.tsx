import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/Icon';
import type { Heading } from '@/lib/headings';

import { LegalToc, TocList } from './LegalToc';
import { EFFECTIVE_FROM, TOC_TITLE } from './texts';

// Страница политики – ТЗ страницы репетитора, раздел 7; макеты P-privacy-d, P-privacy-m. Колонка
// текста до 720 px, фон paper без клетки – клетка мешает читать. Оглавление на десктопе – слева
// и закреплено, на телефоне – свёрнутый `<details>` над текстом. Без разделов оглавления нет.

export const LEGAL_TITLE_ID = 'legal-title';

type LegalPageProps = {
  title: string;
  /** «1 декабря 2026» или заглушка `[дата]`; `dateTime` – только у настоящей даты. */
  effectiveDate: { label: string; dateTime?: string | undefined };
  headings: readonly Heading[];
  /** Текст политики – тело MDX. */
  children: ReactNode;
};

export function LegalPage({ title, effectiveDate, headings, children }: LegalPageProps) {
  const hasToc = headings.length > 0;

  return (
    <section id="legal" aria-labelledby={LEGAL_TITLE_ID} className="bg-paper">
      <div className="page-container py-8 lg:flex lg:justify-center lg:gap-16 lg:py-16">
        {hasToc && (
          <aside className="hidden w-60 flex-none lg:block">
            <LegalToc headings={headings} />
          </aside>
        )}
        <article className="max-w-180 min-w-0 flex-1">
          {hasToc && (
            <details className="group mb-6 rounded-button border border-ink/15 lg:hidden">
              {/* Маркер браузера скрыт: вместо него «+», который при открытии поворачивается в «×». */}
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-field font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {TOC_TITLE}
                <Icon
                  name="plus"
                  size={20}
                  className="transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <nav aria-label={TOC_TITLE} className="px-4 pb-2">
                <TocList headings={headings} />
              </nav>
            </details>
          )}
          {/* H1 – Unbounded 700, 40 px, на телефоне 30 px (макет). */}
          <h1
            id={LEGAL_TITLE_ID}
            className="font-display text-[1.875rem] leading-[1.1] font-bold tracking-[-0.02em] text-ink lg:text-[2.5rem]"
          >
            {title}
          </h1>
          <p className="mt-3 text-small text-ink-muted">
            {EFFECTIVE_FROM}{' '}
            {effectiveDate.dateTime ? (
              <time dateTime={effectiveDate.dateTime}>{effectiveDate.label}</time>
            ) : (
              effectiveDate.label
            )}
          </p>
          {/* Golos 17 px, межстрочный 1,65 – из ТЗ. */}
          <div
            id="legal-text"
            className="mt-4 flex flex-col gap-4 text-[1.0625rem] leading-[1.65] text-ink-2"
          >
            {children}
          </div>
        </article>
      </div>
    </section>
  );
}
