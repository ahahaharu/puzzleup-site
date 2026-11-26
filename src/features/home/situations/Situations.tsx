import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Doodle } from '@/components/ui/Doodle';
import { Icon } from '@/components/ui/Icon';
import { SectionHead } from '@/components/ui/SectionHead';
import { cn } from '@/lib/cn';

import type { SituationCard } from './cards';
import { ctaSpan, knobs } from './puzzle-grid';
import {
  CTA_LABEL,
  CTA_TITLE,
  LEAD_LINK_HINT,
  SITUATIONS_LEAD,
  SITUATIONS_TITLE,
  WORKS_WITH,
} from './texts';

// Блок «Узнаёте ситуацию?» – ТЗ главной, блок 2; макеты D-2-situations, M-2-situations.
// Карточки стоят вплотную и сцеплены выступами, как детали пазла: линии между ними – фон сетки
// в зазоре 1 px, выступ рисуется поверх зазора цветом своей карточки.
// - Телефон: лента в строку, выступы – в соседа справа.
// - 768–1023: две колонки, от 1024 – три. Тёмная карточка-призыв занимает остаток последней строки.

type SituationsProps = { cards: readonly SituationCard[] };

// Где виден выступ: на телефоне (лента), в двух и в трёх колонках.
const SHOW = { phone: 'max-md:block', md: 'md:max-lg:block', lg: 'lg:block' } as const;
const MD_SPAN = ['', 'md:col-span-1', 'md:col-span-2'] as const;
const LG_SPAN = ['', 'lg:col-span-1', 'lg:col-span-2', 'lg:col-span-3'] as const;

// Выступ – из макета: шейка 30 px по центру грани, выступает на 21,6 px. Начало координат – край
// карточки, заливка заходит на 1 px внутрь, чтобы закрыть зазор без шва.
const KNOB_FILL = 'M-1,-15 L0,-15 C10.1,-18.3 21.6,-13.3 21.6,0 C21.6,13.3 10.1,18.3 0,15 L-1,15 Z';
const KNOB_EDGE = 'M0,-15 C10.1,-18.3 21.6,-13.3 21.6,0 C21.6,13.3 10.1,18.3 0,15';

function Knob({ side, className }: { side: 'right' | 'bottom'; className: string }) {
  const right = side === 'right';
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="-1 -20 24 40"
      className={cn(
        'pointer-events-none absolute z-10 h-10 w-6 overflow-visible',
        right
          ? 'top-1/2 left-full -translate-y-1/2'
          : // Нижний выступ – тот же контур, повёрнутый на 90°: его рамка 24 × 40 стоит поперёк грани.
            'top-full left-1/2 -translate-x-1/2 -translate-y-2 rotate-90',
        className,
      )}
    >
      <path d={KNOB_FILL} className="fill-card" />
      <path d={KNOB_EDGE} className="fill-none stroke-ink/20" strokeWidth={1} />
    </svg>
  );
}

function knobClass(index: number, count: number, side: 'right' | 'bottom') {
  return cn(
    'hidden',
    // Лента на телефоне – одна строка из всех карточек.
    knobs(index, count, count + 1)[side] && SHOW.phone,
    knobs(index, count, 2)[side] && SHOW.md,
    knobs(index, count, 3)[side] && SHOW.lg,
  );
}

export function Situations({ cards }: SituationsProps) {
  // Блок без данных не выводится.
  if (cards.length === 0) return null;

  const count = cards.length;
  // Ячейка ленты – около 75 % экрана, край следующей виден; от 768 px – сетка.
  const cell =
    'relative flex w-[75vw] max-w-80 flex-none snap-start flex-col md:w-auto md:max-w-none';

  return (
    <section id="situations" aria-labelledby="situations-title" className="isolate paper-section">
      <div className="relative page-container py-14 lg:py-24">
        <Doodle
          shape="triangle"
          size={110}
          opacity={0.13}
          className="absolute top-10 right-16 -z-10 rotate-[8deg] max-xl:hidden"
        />
        <SectionHead id="situations-title" title={SITUATIONS_TITLE} lead={SITUATIONS_LEAD} />

        {/* Лента прокручивается вбок; клавиатура доходит до ссылок карточек, прокрутка – за фокусом. */}
        <div className="-mx-4 mt-7 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0 md:pb-0 lg:mt-12">
          {/* Внешняя рамка – поверх карточек: квадратные углы карточек закрыли бы рамку-зазор на
              скруглении. */}
          <ul className="relative flex w-max gap-px overflow-hidden rounded-card bg-ink/20 after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-card after:border after:border-ink/20 md:grid md:w-auto md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <li key={card.id} className={cn(cell, 'bg-card')}>
                <div className="flex grow flex-col justify-between gap-6 p-6 lg:p-8">
                  <div className="flex flex-col gap-2.5 lg:gap-3">
                    {/* Номер – оформление: порядок задаёт список. 28 px – ТЗ, «Вид карточки». */}
                    <span
                      aria-hidden="true"
                      className="font-hand text-[1.75rem] leading-none text-accent-text italic"
                    >
                      {card.number}
                    </span>
                    {/* 18 px на телефоне – ТЗ, «Телефон». */}
                    <h3 className="font-display text-h3 text-ink max-md:text-[1.125rem]">
                      {card.title}
                    </h3>
                    <p className="text-small text-ink-2 lg:text-body">{card.text}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 text-caption text-ink-muted lg:text-small">
                    <span className="basis-full">{WORKS_WITH}</span>
                    {card.tutors.map((tutor) => (
                      <Link
                        key={tutor.slug}
                        href={tutor.href}
                        className="inline-flex min-h-11 items-center gap-1.5 text-small font-semibold text-ink no-underline hover:underline lg:text-field"
                      >
                        {tutor.name}
                        <span className="sr-only">{LEAD_LINK_HINT}</span>
                        <Icon name="arrow-right" size={18} />
                      </Link>
                    ))}
                  </div>
                </div>
                <Knob side="right" className={knobClass(index, count, 'right')} />
                <Knob side="bottom" className={knobClass(index, count, 'bottom')} />
              </li>
            ))}

            <li
              className={cn(
                cell,
                'bg-ink text-paper',
                MD_SPAN[ctaSpan(count, 2)],
                LG_SPAN[ctaSpan(count, 3)],
              )}
            >
              <div className="flex grow flex-col items-start justify-between gap-6 p-6 lg:p-8">
                <h3 className="font-display text-h3 text-paper max-md:text-[1.125rem]">
                  {CTA_TITLE}
                </h3>
                <Button href="#tutors" variant="onDark" size="md">
                  {CTA_LABEL}
                </Button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
