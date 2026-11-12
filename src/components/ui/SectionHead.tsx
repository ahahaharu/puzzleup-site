import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

// Заголовок секции – H2 и лид; docs/design-system.md, раздел 6; макет ds/SectionHead.

type SectionHeadProps = {
  title: ReactNode;
  lead?: ReactNode;
  /** Номер «от руки» над заголовком: «01». */
  number?: string;
  /** Точка accent после заголовка, как в слогане. */
  dot?: boolean;
  /** id заголовка – для `aria-labelledby` секции. */
  id?: string;
  as?: 'h1' | 'h2';
  className?: string;
};

export function SectionHead({
  title,
  lead,
  number,
  dot = false,
  id,
  as: Heading = 'h2',
  className,
}: SectionHeadProps) {
  return (
    <div className={cn('flex max-w-3xl flex-col gap-4', className)}>
      {number && (
        <span aria-hidden="true" className="font-hand text-hand-md text-accent-text italic">
          {number}
        </span>
      )}
      <Heading id={id} className="font-display text-h2 text-ink">
        {title}
        {dot && (
          <span aria-hidden="true" className="text-accent">
            .
          </span>
        )}
      </Heading>
      {lead && <p className="text-lead text-ink-2">{lead}</p>}
    </div>
  );
}
