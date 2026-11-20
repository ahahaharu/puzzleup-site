'use client';

import type { ReactNode, RefObject } from 'react';

import { Button } from '@/components/ui/Button';
import { CHOICE_CHIP_SHAPE } from '@/components/ui/ChoiceChip';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

import { collapsedCount, tutorsLayout, type FilterTab, type TutorsLayout } from './filter';
import { ALL_TAB, LIST_LABEL, SHOW_ALL, TABS_LABEL } from './texts';

// Вкладки и карточки блока «Репетиторы» – ТЗ главной, блок 5; макеты D-5-tutors, M-5-tutors.
// Только разметка: выбор вкладки и адрес – в TutorsBrowser. Та же разметка без обработчиков –
// запасной вариант до гидратации и без JavaScript: видны все карточки, вкладок нет.

export type TutorItem = { id: string; subjectIds: string[]; card: ReactNode };

type TutorsViewProps = {
  items: readonly TutorItem[];
  tabs: readonly FilterTab[];
  /** Выбранный предмет; `null` – «Все». */
  subject: string | null;
  expanded: boolean;
  /** Запасная разметка: то, что требует скрипта, видно только при включённом скрипте. */
  fallback?: boolean;
  /** Лента на телефоне – тогда у неё подпись и фокус с клавиатуры. */
  phone?: boolean;
  /** Карточки появляются плавно – только после выбора вкладки, не при загрузке. */
  animate?: boolean;
  announcement?: string;
  onSelect?: (subject: string | null) => void;
  onExpand?: () => void;
  listRef?: RefObject<HTMLUListElement | null>;
};

// Вкладка выглядит как чип выбора из ДС: выбранная – заливка ink и галочка.
const TAB = cn(
  CHOICE_CHIP_SHAPE,
  'border-ink/25 text-ink hover:border-ink/60 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper',
);

const LIST: Record<TutorsLayout, string> = {
  single: 'page-grid gap-y-4',
  pair: 'page-grid gap-y-4 md:gap-y-6',
  // Телефон: лента карточек в строку. С 768 px – сетка.
  grid: 'flex gap-4 md:page-grid md:gap-y-6 xl:gap-y-8',
};

// Две карточки – по 6 колонок на всю ширину, с фото слева, как в макете D-5 (ADR-043); одна – 8 колонок по центру.
// Три в ряд – с 1280 px: на 1024–1279 пара мессенджеров не помещается в треть строки (ADR-043).
const ITEM: Record<TutorsLayout, string> = {
  single: 'col-span-full lg:col-span-8 lg:col-start-3',
  pair: 'col-span-full md:col-span-4 lg:col-span-6',
  // Карточка ленты – 85 % ширины экрана, край следующей виден (ТЗ, «Телефон»).
  grid: 'w-[85vw] flex-none snap-start md:col-span-4 md:w-auto lg:col-span-6 xl:col-span-4',
};

export function TutorsView({
  items,
  tabs,
  subject,
  expanded,
  fallback = false,
  phone = true,
  animate = false,
  announcement = '',
  onSelect,
  onExpand,
  listRef,
}: TutorsViewProps) {
  const visible =
    subject === null ? items : items.filter((item) => item.subjectIds.includes(subject));
  const layout = tutorsLayout(visible.length);
  const collapsed = collapsedCount(visible.length, subject, expanded);
  const ribbon = layout === 'grid' && phone;
  // Без скрипта вкладки и «Показать всех» ничего не делают – их нет.
  const scriptOnly = fallback && 'noscript:hidden';

  return (
    <>
      {tabs.length > 0 && (
        <div
          role="group"
          aria-label={TABS_LABEL}
          className={cn(
            // Телефон: вкладки прокручиваются в строку; py – место для кольца фокуса.
            '-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:flex-wrap md:px-0 lg:mt-10',
            scriptOnly,
          )}
        >
          {[{ id: null, label: ALL_TAB, count: undefined }, ...tabs].map((tab) => {
            const pressed = tab.id === subject;
            return (
              <button
                key={tab.id ?? 'all'}
                type="button"
                aria-pressed={pressed}
                className={TAB}
                onClick={onSelect && (() => onSelect(tab.id))}
              >
                {pressed && <Icon name="check" size={18} strokeWidth={2.2} />}
                {tab.count === undefined ? tab.label : `${tab.label} · ${tab.count}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Объявление для дикторов – только после смены вкладки. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Лента на телефоне – прокрутка по карточкам; подпись и фокус – у неё, у списка – его семантика. */}
      <div
        role={ribbon ? 'region' : undefined}
        aria-label={ribbon ? LIST_LABEL : undefined}
        tabIndex={ribbon ? 0 : undefined}
        className={cn(
          layout === 'grid' &&
            '-mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0',
          tabs.length > 0 ? 'mt-6 lg:mt-8' : 'mt-6 lg:mt-10',
        )}
      >
        <ul
          // Новый ключ при смене вкладки – карточки появляются заново.
          key={subject ?? 'all'}
          ref={listRef}
          className={LIST[layout]}
        >
          {visible.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                ITEM[layout],
                animate && 'motion-safe:animate-fade-in',
                index >= visible.length - collapsed &&
                  (fallback ? 'scripting:md:hidden' : 'md:hidden'),
              )}
            >
              {item.card}
            </li>
          ))}
        </ul>
      </div>

      {collapsed > 0 && (
        <div className={cn('mt-8 flex justify-center max-md:hidden', scriptOnly)}>
          <Button variant="secondary" size="md" onClick={onExpand}>
            {SHOW_ALL}
          </Button>
        </div>
      )}
    </>
  );
}
