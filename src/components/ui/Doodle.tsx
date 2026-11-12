import { cn } from '@/lib/cn';

// Каракули на полях – docs/design-system.md, разделы 6 и 8; макет ds/Doodle.
// Не больше шести на экран; скрыты от дикторов и от мыши.

type Stroke = { d: string; dashed?: boolean };

const SHAPES = {
  circle: [
    { d: 'M10,50 A40,40 0 1 0 90,50 A40,40 0 1 0 10,50 Z' },
    { d: 'M10,50 H90', dashed: true },
    { d: 'M50,50 L84,29' },
  ],
  sine: [
    { d: 'M6,52 H96 M10,10 V92' },
    { d: 'M91,48 L96,52 L91,56 M6,15 L10,10 L14,15' },
    { d: 'M10,52 C26,4 46,4 56,52 S84,100 94,52' },
  ],
  lever: [
    { d: 'M6,56 L94,40' },
    { d: 'M46,48 L36,80 H60 Z' },
    { d: 'M14,12 V44 M9,39 L14,44 L19,39' },
    { d: 'M88,6 V30 M83,25 L88,30 L93,25' },
  ],
  cube: [
    { d: 'M38,12 H88 V62 H38 Z' },
    { d: 'M12,38 H62 V88 H12 Z' },
    { d: 'M12,38 L38,12 M62,38 L88,12 M62,88 L88,62' },
    { d: 'M12,88 L38,62', dashed: true },
  ],
  triangle: [
    { d: 'M10,86 L90,86 L64,22 Z' },
    { d: 'M64,22 V86', dashed: true },
    { d: 'M64,80 H58 V86' },
  ],
} satisfies Record<string, Stroke[]>;

export type DoodleShape = keyof typeof SHAPES;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- ключи литерала SHAPES известны, Object.keys теряет их тип
export const DOODLE_SHAPES = Object.keys(SHAPES) as DoodleShape[];

type DoodleProps = {
  shape: DoodleShape;
  /** Сторона в px. */
  size?: number;
  /** Прозрачность чернил: 0,1–0,15 на фоне секции, как на холсте. */
  opacity?: number;
  /** На телефоне каракули часто наезжают на текст – по умолчанию видны только от md. */
  hideOnMobile?: boolean;
  /** Положение и поворот на полях – классами (`absolute -z-10 left-… rotate-6`). */
  className?: string;
};

export function Doodle({
  shape,
  size = 120,
  opacity = 0.15,
  hideOnMobile = true,
  className,
}: DoodleProps) {
  // Тип расширен до Stroke[]: у части штрихов нет поля dashed.
  const strokes: Stroke[] = SHAPES[shape];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity={opacity}
      aria-hidden="true"
      focusable="false"
      className={cn(
        'pointer-events-none flex-none stroke-ink',
        hideOnMobile && 'max-md:hidden',
        className,
      )}
    >
      {strokes.map(({ d, dashed }) => (
        <path key={d} d={d} strokeDasharray={dashed ? '3 4' : undefined} />
      ))}
    </svg>
  );
}
