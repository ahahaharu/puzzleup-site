import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { SectionHead } from '@/components/ui/SectionHead';
import type { Site } from '@/content';
import { formatPrice } from '@/features/tutors/card-data';
import { CURRENCY } from '@/features/tutors/texts';

import type { PriceRow } from './rows';
import { PRICES_CTA, PRICES_LEAD, PRICES_TITLE } from './texts';

// Блок «Цены» – ТЗ главной, блок 7; макеты D-7-prices, M-7-prices. Две карточки: тёмная
// «Пробное занятие» и светлая «Занятие» со строкой на каждого репетитора. Телефон – столбиком,
// пробное первым.

type PricesProps = {
  prices: Site['prices'];
  rows: readonly PriceRow[];
};

export function Prices({ prices, rows }: PricesProps) {
  // Блок без данных не выводится: без репетиторов цен нет.
  if (rows.length === 0) return null;

  return (
    <section id="prices" aria-labelledby="prices-title" className="paper-section">
      <div className="page-container py-14 lg:py-24">
        <SectionHead id="prices-title" title={PRICES_TITLE} lead={PRICES_LEAD} />

        <div className="mt-6 grid max-w-240 gap-4 md:grid-cols-2 md:gap-6 lg:mt-10 xl:gap-8">
          <div className="flex flex-col gap-3.5 rounded-card bg-ink p-7 text-paper lg:p-10">
            <h3 className="font-display text-h3 text-paper">{prices.trial.title}</h3>
            {/* Цифры – Unbounded 700, 64 px (на телефоне 48), валюта – 24 px: ТЗ. */}
            <p className="flex items-baseline gap-2.5 font-display">
              <span className="text-[3rem] leading-none font-bold tracking-[-0.02em] lg:text-[4rem]">
                {formatPrice(prices.trial.price)}
              </span>
              <span className="text-[1.5rem] font-medium">{CURRENCY}</span>
            </p>
            {/* Подписи карточек – 17 px на всех ширинах: макет D-7 / M-7. */}
            <p className="text-[1.0625rem] text-kraft">{prices.trial.caption}</p>
          </div>

          <div className="flex flex-col gap-3.5 rounded-card border border-ink/12 bg-card p-7 shadow-paper lg:p-10">
            <h3 className="font-display text-h3 text-ink">{prices.lesson.title}</h3>
            <p className="text-[1.0625rem] text-ink-2">{prices.lesson.caption}</p>
            <ul>
              {rows.map((row) => (
                <li
                  key={row.slug}
                  className="flex items-center justify-between gap-3 border-t border-ink/12 py-1.5 lg:py-2.5"
                >
                  {/* Имя и классы – 17 px на десктопе, 16 на телефоне: макет D-7 / M-7. */}
                  <Link
                    href={row.href}
                    className="inline-flex min-h-11 flex-wrap items-center gap-x-1.5 text-field font-semibold text-ink no-underline hover:underline lg:text-[1.0625rem]"
                  >
                    {row.name}
                    {/* Пробел – для имени ссылки в любом браузере; на экране промежуток даёт gap. */}
                    {row.grades && ' '}
                    {row.grades && (
                      <span className="font-normal text-ink-muted">· {row.grades}</span>
                    )}
                  </Link>
                  {/* Цена в строке – Unbounded 700, 28 px (на телефоне 20), валюта 16 px: макет D-7 / M-7. */}
                  <span className="font-display text-[1.25rem] font-bold tracking-[-0.02em] whitespace-nowrap text-ink lg:text-[1.75rem]">
                    {row.price}{' '}
                    <span className="text-field font-medium tracking-normal">{CURRENCY}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start gap-4 lg:mt-10 lg:gap-5">
          <p className="max-w-205 text-body text-ink-2">{prices.paymentNote}</p>
          <Button href="#tutors" fullWidth className="md:w-auto">
            {PRICES_CTA}
          </Button>
          <p className="text-caption text-ink-muted">{prices.offerNote}</p>
        </div>
      </div>
    </section>
  );
}
