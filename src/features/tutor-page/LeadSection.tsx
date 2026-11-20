import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/Icon';
import { MessengerButtons } from '@/components/ui/MessengerButtons';

import { Notice } from './Notice';
import type { LeadData } from './page-data';
import { FORM_TITLE, leadMessengers, leadPoints, leadTitle, tutorChip } from './texts';

// Блок 6 «Форма» – ТЗ страницы репетитора, раздел 4, блок 6; ТЗ главной, блок 9 «Раскладка»;
// макеты T-6-form, TM-6-form, T-S-formfull, TM-S-formfull.
// Слева (5 колонок) – заголовок, три пункта и мессенджеры репетитора, при «Мест нет» – плашка
// листа ожидания. Справа (7 колонок) – тёмная деталь с «язычком», на телефоне – под колонкой,
// язычок сверху. Поля формы (LeadForm) встают в деталь в feature/lead-form.

export const LEAD_ID = 'lead';

type LeadSectionProps = {
  lead: LeadData;
  /** Поля формы – LeadForm. */
  children?: ReactNode;
};

export function LeadSection({ lead, children }: LeadSectionProps) {
  return (
    <section id={LEAD_ID} aria-labelledby="lead-title" className="paper-page-alt">
      <div className="page-container page-grid items-center gap-y-10 py-14 lg:gap-y-6 lg:py-24">
        <div className="col-span-full flex flex-col gap-6 lg:col-span-5 lg:gap-8">
          <h2 id="lead-title" className="font-display text-h2 text-ink">
            {leadTitle(lead.nameDative)}
          </h2>
          {lead.waitlist && <Notice>{lead.waitlist}</Notice>}
          <ol className="flex flex-col gap-3.5">
            {leadPoints(lead.name).map((point, index) => (
              <li key={point} className="flex items-baseline gap-3.5">
                {/* Номер 22 px и пункт 17 px – из макета T-6-form. */}
                <span
                  aria-hidden="true"
                  className="font-hand text-[1.375rem] text-accent-text italic"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[1.0625rem] font-medium text-ink">{point}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-3">
            <p className="text-[1.0625rem] text-ink-2">{leadMessengers(lead.nameDative)}</p>
            <MessengerButtons
              telegram={lead.telegram}
              viber={lead.viber}
              nameDative={lead.nameDative}
              className="max-w-sm"
            />
          </div>
        </div>

        <div className="relative col-span-full rounded-piece bg-ink p-6 text-paper lg:col-span-7 lg:p-10">
          {/* «Язычок» детали смотрит в левую колонку; на телефоне – вверх. */}
          <span
            aria-hidden="true"
            className="absolute -top-3.5 left-1/2 h-3.5 w-11 -translate-x-1/2 rounded-t-full bg-ink lg:top-1/2 lg:-left-3.5 lg:h-11 lg:w-3.5 lg:translate-x-0 lg:-translate-y-1/2 lg:rounded-t-none lg:rounded-l-full"
          />
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="font-display text-h3">{FORM_TITLE}</h3>
              {/* Spectral Italic 18 px – ТЗ главной, блок 9. */}
              <p className="font-hand text-[1.125rem] text-accent-light italic">{lead.price}</p>
            </div>
            {/* Репетитор задан страницей, снять его нельзя (ТЗ главной, блок 9, поля формы). */}
            <p className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-full bg-paper px-4.5 text-field font-medium text-ink">
              <Icon name="check" size={18} strokeWidth={2.2} />
              {tutorChip(lead.name)}
            </p>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
