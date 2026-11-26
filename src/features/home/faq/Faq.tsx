import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Markdown } from '@/components/ui/Markdown';
import type { FaqItem } from '@/content';
import { reveal } from '@/lib/reveal';

import { FAQ_CTA, FAQ_NOTE, FAQ_TITLE } from './texts';

// Блок FAQ – ТЗ главной, блок 8; макеты D-8-faq, M-8-faq. Аккордеон – нативный <details>: работает
// без JavaScript и с клавиатуры, все пункты закрыты. Десктоп: слева (4 колонки) заголовок и кнопка,
// справа (8) – вопросы. Телефон: одна колонка, кнопка – после вопросов.

type FaqProps = { items: readonly FaqItem[] };

function Cta({ className }: { className: string }) {
  return (
    <Button href="#tutors" size="md" className={className}>
      {FAQ_CTA}
    </Button>
  );
}

export function Faq({ items }: FaqProps) {
  // Блок без данных не выводится.
  if (items.length === 0) return null;

  return (
    <section id="faq" aria-labelledby="faq-title" className="paper-section">
      <div className="page-container page-grid gap-y-6 py-14 lg:py-24">
        <div
          {...reveal()}
          className="col-span-full flex flex-col items-start gap-4 lg:col-span-4 lg:gap-5"
        >
          <h2 id="faq-title" className="font-display text-h2 text-ink">
            {FAQ_TITLE}
          </h2>
          {/* Строка и кнопка на телефоне – после вопросов, как в M-8: две копии, видна одна. */}
          <p className="text-body text-ink-2 max-lg:hidden">{FAQ_NOTE}</p>
          {/* Кнопка на десктопе – под заголовком, на телефоне – после вопросов: две копии, видна одна. */}
          <Cta className="max-lg:hidden" />
        </div>

        <div {...reveal()} className="col-span-full lg:col-span-8">
          {items.map((item) => (
            <details key={item.id} className="group border-t border-ink/15 last:border-b">
              {/* Маркер браузера скрыт: вместо него «+», который при открытии поворачивается в «×».
                  Вопрос – Golos 600, 18 px (на телефоне 17): ТЗ. */}
              <summary className="flex cursor-pointer list-none items-start justify-between gap-5 py-5 text-[1.0625rem] leading-[1.35] font-semibold text-ink lg:text-[1.125rem] [&::-webkit-details-marker]:hidden">
                {item.question}
                <Icon
                  name="plus"
                  size={22}
                  strokeWidth={1.8}
                  className="transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <Markdown
                source={item.answer}
                // Ответ – 16 px, ink-2 (ТЗ), межстрочный 1,55 – макет D-8.
                className="-mt-2 max-w-160 pb-5 text-field leading-[1.55] text-ink-2"
              />
            </details>
          ))}
        </div>

        <div {...reveal()} className="col-span-full lg:hidden">
          <p className="mb-4 text-body text-ink-2">{FAQ_NOTE}</p>
          <Cta className="w-full md:w-auto" />
        </div>
      </div>
    </section>
  );
}
