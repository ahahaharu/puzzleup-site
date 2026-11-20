import {
  BOTTOM_LEFT_PIECE,
  BOTTOM_RIGHT_PIECE,
  TOP_LEFT_PIECE,
  TOP_RIGHT_PIECE,
} from '@/components/ui/puzzle-square';
import { cn } from '@/lib/cn';

import { NOT_FOUND_ILLUSTRATION_LABEL } from './texts';

// Квадрат из четырёх деталей, одной не хватает – на её месте пунктирный контур (ТЗ страницы
// репетитора, раздел 7; макеты P-404-d, P-404-m). Приём первого экрана, но деталь не прилетает:
// анимации нет. Цвета листов и размеры подписей – из макета, в единицах SVG.

export function NotFoundIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 420"
      role="img"
      aria-label={NOT_FOUND_ILLUSTRATION_LABEL}
      className={cn(className)}
    >
      <path
        d={BOTTOM_RIGHT_PIECE}
        fill="none"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeDasharray="7 6"
        className="stroke-ink"
      />
      <g strokeOpacity="0.18" className="stroke-ink">
        <path d={TOP_LEFT_PIECE} className="fill-(--paper-cell)" />
        <path d={TOP_RIGHT_PIECE} className="fill-(--paper-mm)" />
        <path d={BOTTOM_LEFT_PIECE} className="fill-white" />
      </g>
      <g textAnchor="middle" className="fill-ink font-hand italic">
        <text x="300" y="320" fillOpacity="0.3" className="text-[64px]">
          ?
        </text>
        <text x="116" y="150" className="text-[22px]">
          a² + b² = c²
        </text>
      </g>
    </svg>
  );
}
