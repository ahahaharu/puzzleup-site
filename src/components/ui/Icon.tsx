import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

// Линейные иконки 24×24 в цвет текста – docs/design-system.md, раздел 6. Контуры – из макетов docs/design.
const PATHS = {
  telegram: <path d="M21 4 3 11.5l7 2.5L21 4Zm0 0-6.5 16L10 14" />,
  viber: (
    <>
      <path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M9 8.5c.4 2.5 2.4 4.6 5.5 5.5" />
    </>
  ),
  'arrow-right': <path d="M4 12h15M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- ключи литерала PATHS известны, Object.keys теряет их тип
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

type IconProps = {
  name: IconName;
  /** Размер в px; по умолчанию 24. */
  size?: number;
  /** Толщина линии: 1,7 у иконок, 2,2–2,5 у галочек в чипах и чекбоксе (макет DS-States). */
  strokeWidth?: number;
  className?: string;
};

/** Декоративная иконка: смысл всегда несёт текст рядом, поэтому она скрыта от дикторов. */
export function Icon({ name, size = 24, strokeWidth = 1.7, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('flex-none', className)}
    >
      {PATHS[name]}
    </svg>
  );
}
