import { useId } from 'react';

import { cn } from '@/lib/cn';

// Иллюстрация первого экрана: квадрат из четырёх деталей пазла из разных тетрадей (ТЗ главной,
// блок 1, п. 6; макеты D-1-hero, M-0-1-hero). Метафора, а не список предметов: при новых
// предметах её не меняют. Акцентная деталь один раз «встаёт» на место – анимация `piece-land`.
//
// Координаты – из макета (поле 420 × 420), видимая область поджата до деталей с запасом на тень,
// чтобы в пяти колонках сетки детали были ближе к размеру макета. Толщина линий и размер подписей
// на телефоне крупнее (макет M-0-1-hero): картинка там 280 px. Размеры подписей – в единицах SVG.

export const HERO_ILLUSTRATION_LABEL =
  'Пазл из кусочков разных тетрадей: теорема Пифагора в клетку, парабола на миллиметровке, задача на скорость в линейку и круг с формулой длины окружности, который встаёт на место';

/** Четвёртая деталь: правый нижний угол квадрата с пазами слева и сверху. */
const ACCENT_PIECE =
  'M210,210 L282,210 C278,198 284,184 300,184 C316,184 322,198 318,210 L390,210 L390,380 A10,10 0 0 1 380,390 L210,390 L210,318 C198,322 184,316 184,300 C184,284 198,278 210,282 Z';
const CELL_PIECE =
  'M30,40 A10,10 0 0 1 40,30 L210,30 L210,102 C222,98 236,104 236,120 C236,136 222,142 210,138 L210,210 L138,210 C142,222 136,236 120,236 C104,236 98,222 102,210 L30,210 Z';
const MM_PIECE =
  'M210,30 L380,30 A10,10 0 0 1 390,40 L390,210 L318,210 C322,198 316,184 300,184 C284,184 278,198 282,210 L210,210 L210,138 C222,142 236,136 236,120 C236,104 222,98 210,102 Z';
const LINED_PIECE =
  'M30,210 L102,210 C98,222 104,236 120,236 C136,236 142,222 138,210 L210,210 L210,282 C198,278 184,284 184,300 C184,316 198,322 210,318 L210,390 L40,390 A10,10 0 0 1 30,380 Z';

const INK = { floodColor: 'var(--color-ink)' };

export function HeroIllustration({ className }: { className?: string }) {
  // Несколько SVG на странице не должны делить id узоров и фильтров.
  const id = useId();
  const ref = (name: string) => `${id}-${name}`;

  return (
    <svg
      viewBox="20 20 380 380"
      role="img"
      aria-label={HERO_ILLUSTRATION_LABEL}
      className={cn('overflow-visible', className)}
    >
      <defs>
        <pattern id={ref('cell')} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" style={{ fill: 'var(--paper-cell)' }} />
          <path
            d="M12 0 L0 0 0 12"
            fill="none"
            strokeOpacity="0.22"
            strokeWidth="0.6"
            className="stroke-focus"
          />
        </pattern>
        <pattern id={ref('mm')} width="30" height="30" patternUnits="userSpaceOnUse">
          {/* Цвет листа миллиметровки – как у утилиты paper-mm. */}
          <rect width="30" height="30" fill="#fffdf7" />
          <path
            d="M6 0 V30 M12 0 V30 M18 0 V30 M24 0 V30 M0 6 H30 M0 12 H30 M0 18 H30 M0 24 H30"
            strokeOpacity="0.16"
            strokeWidth="0.4"
            className="stroke-accent"
          />
          <path
            d="M30 0 L0 0 0 30"
            fill="none"
            strokeOpacity="0.35"
            strokeWidth="0.7"
            className="stroke-accent"
          />
        </pattern>
        <pattern id={ref('lined')} width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" className="fill-white" />
          <path d="M0 17.5 H18" strokeOpacity="0.28" strokeWidth="0.7" className="stroke-focus" />
        </pattern>
        {/* Тень «бумаги» у лежащих деталей и тень «летящей детали» (ДС, раздел 3). */}
        <filter id={ref('paper')} x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodOpacity="0.16" style={INK} />
        </filter>
        <filter id={ref('flying')} x="-15%" y="-15%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodOpacity="0.25" style={INK} />
        </filter>
      </defs>

      {/* Пустое место, куда встаёт акцентная деталь. */}
      <path
        d={ACCENT_PIECE}
        strokeOpacity="0.4"
        strokeDasharray="5 4"
        className="fill-kraft-shadow stroke-ink stroke-[1.6] md:stroke-[1.2]"
      />

      <g filter={`url(#${ref('paper')})`}>
        <path d={CELL_PIECE} fill={`url(#${ref('cell')})`} />
        <path d={MM_PIECE} fill={`url(#${ref('mm')})`} />
        <path d={LINED_PIECE} fill={`url(#${ref('lined')})`} />
      </g>

      <g className="font-hand italic">
        {/* Клетка: прямоугольный треугольник и теорема Пифагора. */}
        <g
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="stroke-ink stroke-2 md:stroke-[1.6]"
        >
          <path d="M58,152 L58,66 L164,152 Z" />
          <path d="M58,140 L70,140 L70,152" className="max-md:hidden" />
        </g>
        <g className="fill-ink text-[17px] max-md:hidden">
          <text x="44" y="114">
            a
          </text>
          <text x="106" y="170">
            b
          </text>
          <text x="118" y="102">
            c
          </text>
        </g>
        <text x="116" y="194" textAnchor="middle" className="fill-ink text-[24px] md:text-[20px]">
          a² + b² = c²
        </text>

        {/* Миллиметровка: оси и парабола. */}
        <g fill="none" strokeLinecap="round" className="stroke-ink stroke-2 md:stroke-[1.2]">
          <path d="M228,166 L376,166 M300,176 L300,48" />
          <path d="M371,162 L376,166 L371,170 M296,53 L300,48 L304,53" className="max-md:hidden" />
        </g>
        <path
          d="M246,72 Q300,262 354,72"
          fill="none"
          strokeLinecap="round"
          className="stroke-ink stroke-[2.6] md:stroke-2"
        />
        <text x="316" y="66" className="fill-ink text-[22px] md:text-[18px]">
          y = x²
        </text>

        {/* Линейка с полями: задача на скорость. */}
        <path
          d="M58,214 L58,388"
          strokeOpacity="0.7"
          className="stroke-accent stroke-[1.6] md:stroke-[1.2]"
        />
        <g className="fill-ink text-[19px] md:text-[16px]">
          <text x="68" y="270">
            Задача 1.
          </text>
          <text x="68" y="292">
            s = 120 км
          </text>
          <text x="68" y="314">
            t = 2 ч
          </text>
        </g>
        <text x="68" y="340" className="fill-ink text-[20px] font-medium md:text-[17px]">
          v = 60 км/ч
        </text>
        <path
          d="M66,348 C96,352 128,346 156,349"
          fill="none"
          strokeLinecap="round"
          className="stroke-accent stroke-[2.2] md:stroke-[1.8]"
        />

        {/* Акцентная деталь: круг и длина окружности. Летит с тенью и встаёт на место. */}
        <g className="origin-center animate-piece-land transform-fill">
          <path
            d={ACCENT_PIECE}
            filter={`url(#${ref('flying')})`}
            className="animate-piece-shadow fill-accent opacity-0"
          />
          <path d={ACCENT_PIECE} filter={`url(#${ref('paper')})`} className="fill-accent" />
          <g
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="stroke-ink stroke-[1.6]"
          >
            <circle cx="300" cy="292" r="54" />
            <path d="M300,292 L354,292" />
          </g>
          <circle cx="300" cy="292" r="2.6" className="fill-ink" />
          <text x="322" y="284" className="fill-ink text-[16px]">
            r
          </text>
          <text x="300" y="374" textAnchor="middle" className="fill-ink text-[18px]">
            C = 2πr
          </text>
        </g>
      </g>
    </svg>
  );
}
