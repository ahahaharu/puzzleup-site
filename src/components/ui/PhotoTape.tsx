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
  /** Ширина – классами (`w-[170px]`, `w-full`). */
  className?: string;
};

const FRAME = { sm: 'p-2', lg: 'p-3' } as const;

// Полоска «скотча» на верхнем левом углу; размеры – из макетов.
const TAPE = {
  sm: '-top-1.5 -left-3.5 h-4.5 w-14',
  lg: '-top-2 -left-4.5 h-5.5 w-[70px]',
} as const;

export function PhotoTape({
  name,
  photo,
  frame = 'sm',
  tilt = -1.5,
  sizes,
  preload = false,
  className,
}: PhotoTapeProps) {
  const style: CSSProperties & Record<'--tilt', string> = { '--tilt': `${tilt}deg` };

  return (
    <div
      style={style}
      className={cn(
        'relative flex-none rotate-(--tilt) bg-white shadow-paper',
        FRAME[frame],
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
          // Инициал – декор: имя рядом всегда написано текстом. Размер – треть ширины, как на холсте.
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center font-display text-[31cqw] leading-none font-bold text-ink/40"
          >
            {name.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span aria-hidden="true" className={cn('absolute -rotate-35 bg-accent/35', TAPE[frame])} />
    </div>
  );
}
