import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/cn';

// Лист тетради – docs/design-system.md, разделы 4 и 6; макет ds/Sheet.
// Вместо скругления – загнутый уголок 26 px: лист обрезается clip-path, а уголок рисуется поверх.

// Все бумаги ДС: новый предмет выбирает бумагу в данных, без правки компонента.
export type SheetKind = 'cell' | 'mm' | 'lined' | 'slanted' | 'staff' | 'margin' | 'plain';

const PAPER: Record<SheetKind, string> = {
  cell: 'paper-cell',
  mm: 'paper-mm',
  // Текст линейки начинается правее красного поля (52 px).
  // Межстрочный 28 px – текст стоит на линейках.
  lined: 'paper-lined pl-18 leading-7',
  slanted: 'paper-slanted leading-7',
  staff: 'paper-staff',
  // Поле чистого листа – на 40 px.
  margin: 'paper-margin pl-14',
  plain: 'paper-plain',
};

type SheetProps = {
  kind?: SheetKind;
  /** Наклон в градусах, на холсте – от −4 до 4. */
  tilt?: number;
  as?: 'div' | 'article' | 'li';
  className?: string;
  children: ReactNode;
};

export function Sheet({
  kind = 'cell',
  tilt = 0,
  as: Tag = 'div',
  className,
  children,
}: SheetProps) {
  const style: CSSProperties & Record<'--tilt', string> = { '--tilt': `${tilt}deg` };

  return (
    <Tag
      style={style}
      // Тень листа – токен drop-shadow-sheet: box-shadow обрезал бы clip-path.
      className={cn('relative rotate-(--tilt) drop-shadow-sheet', className)}
    >
      <div
        className={cn(
          'h-full p-7 text-ink [clip-path:polygon(0_0,calc(100%-26px)_0,100%_26px,100%_100%,0_100%)]',
          PAPER[kind],
        )}
      >
        {children}
      </div>
      {/* Оборот загнутого уголка – kraft-dark, ближайший токен к цвету холста. */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 size-6.5 bg-linear-to-tr from-kraft-dark from-50% to-transparent to-50%"
      />
    </Tag>
  );
}
