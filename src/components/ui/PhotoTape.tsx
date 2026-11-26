import Image from 'next/image';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/cn';

// Фото «вклеено в тетрадь» – ТЗ главной, раздел 5 «Карточка репетитора»; ТЗ страницы репетитора,
// раздел 1; docs/design-system.md, раздел 6; макеты D-5-tutors, T-1-profile, TM-1-profile.

type PhotoTapeProps = {
  /** Имя репетитора: первая буква – инициал, пока фото нет. */
  name: string;
  photo?: { src: string; alt: string } | undefined;
  /** Рамка: `sm` – 8 px (карточка, телефон), `lg` – 12 px (профиль на десктопе). */
  frame?: 'sm' | 'lg';
  /** Наклон в градусах, ±1,5. */
  tilt?: number;
  /** Атрибут `sizes` для next/image – ширина вклейки в раскладке. */
  sizes: string;
  /** Фото профиля на первом экране – `preload` (в Next 16 вместо `priority`), остальные грузятся лениво. */
  preload?: boolean;
  /**
   * Фото «отклеивается» при наведении на карточку (`group/card`): приподнимается на 4 px, наклон
   * удваивается, под ним тень полёта. Только transform и opacity тени; на сенсорных экранах наведения нет.
   */
  lift?: boolean;
  /** Ширина – классами (`w-[170px]`, `w-full`). */
  className?: string;
};

// Тень полёта – отдельным слоем: меняется только его прозрачность, не сама тень.
const LIFT =
  'transition-[translate,rotate] duration-300 ease-out group-hover/card:-translate-y-1 group-hover/card:rotate-[calc(var(--tilt)*2)] after:pointer-events-none after:absolute after:inset-0 after:opacity-0 after:shadow-flying after:transition-opacity after:duration-300 group-hover/card:after:opacity-100';

const FRAME = { sm: 'p-2', lg: 'p-3' } as const;

// Полоска «скотча» на верхнем левом углу; размеры – из макетов.
const TAPE = {
  sm: '-top-1.5 -left-3.5 h-4.5 w-14',
  lg: '-top-2 -left-4.5 h-5.5 w-[70px]',
} as const;

// Инициал – доля ширины фото (cqw), как на холсте: 52 px при 170 px в карточке, 105 px при 420 px в профиле.
const INITIAL = { sm: 'text-[34cqw]', lg: 'text-[27cqw]' } as const;

export function PhotoTape({
  name,
  photo,
  frame = 'sm',
  tilt = -1.5,
  sizes,
  preload = false,
  lift = false,
  className,
}: PhotoTapeProps) {
  const style: CSSProperties & Record<'--tilt', string> = { '--tilt': `${tilt}deg` };

  return (
    <div
      style={style}
      className={cn(
        'relative flex-none rotate-(--tilt) bg-white shadow-paper',
        FRAME[frame],
        lift && LIFT,
        className,
      )}
    >
      <div className="@container relative aspect-4/5 overflow-hidden bg-kraft">
        {photo ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes={sizes}
            preload={preload}
            className="object-cover"
          />
        ) : (
          // Инициал – декор: имя рядом всегда написано текстом.
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-0 flex items-center justify-center font-display leading-none font-bold text-ink/40',
              INITIAL[frame],
            )}
          >
            {name.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span aria-hidden="true" className={cn('absolute -rotate-35 bg-accent/35', TAPE[frame])} />
    </div>
  );
}
