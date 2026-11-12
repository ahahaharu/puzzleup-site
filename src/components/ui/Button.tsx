import Link from 'next/link';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Icon, type IconName } from './Icon';

// Кнопка – docs/design-system.md, раздел 6; ТЗ главной, раздел 2 «Компоненты»; макеты ds/Button, ds/DS-States.

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'onDark' | 'secondaryOnDark';
export type ButtonSize = 'md' | 'lg';

export const LOADING_LABEL = 'Отправляем…';

// Анимируется только нажатие (transform); цвет при наведении меняется сразу – ДС, раздел 7.
// Рамка 1,5 px у контурных кнопок – из ДС, в шкале Tailwind такой ширины нет.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-button text-button whitespace-nowrap no-underline select-none transition-transform duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink-2',
  secondary: 'border-[1.5px] border-ink text-ink hover:bg-ink/6',
  // Только отправка формы: белый текст на accent-strong – 4,7:1.
  accent: 'bg-accent-strong text-white hover:bg-accent-text',
  onDark: 'bg-paper text-ink hover:bg-white',
  // Контурная на тёмной детали формы и экране «Спасибо» (макет X-thanks).
  secondaryOnDark: 'border-[1.5px] border-paper/60 text-paper hover:bg-paper/10',
};

const SIZES: Record<ButtonSize, string> = {
  lg: 'min-h-14 px-7',
  md: 'min-h-12 px-5',
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Иконка слева от подписи, 20 px. */
  icon?: IconName;
  className?: string;
  children: ReactNode;
};

// Набор атрибутов ссылки ограничен: next/link не принимает `undefined` в обработчиках событий.
type LinkProps = CommonProps &
  Pick<ComponentProps<'a'>, 'id' | 'target' | 'rel' | 'aria-current' | 'aria-describedby'> & {
    href: string;
  };

type NativeButtonProps = CommonProps &
  Omit<ComponentProps<'button'>, keyof CommonProps> & {
    href?: undefined;
    /**
     * Идёт отправка: спиннер и «Отправляем…», кнопку не нажать повторно. Клиентское состояние
     * (`useFormStatus`), поэтому кнопка не теряет фокус, как с `disabled`, – используется `aria-disabled`.
     */
    loading?: boolean;
  };

export type ButtonProps = LinkProps | NativeButtonProps;

type StyleOptions = {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  fullWidth?: boolean | undefined;
  className?: string | undefined;
};

/** Классы кнопки – для элементов, которые выглядят как кнопка, но не являются `Button`. */
export function buttonClassName({
  variant = 'primary',
  size = 'lg',
  fullWidth,
  className,
}: StyleOptions) {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      // 18 px и толщина 2,5 px – из макета DS-States.
      className="size-4.5 flex-none animate-spin rounded-full border-[2.5px] border-current/40 border-t-current"
    />
  );
}

function preventRepeat(event: MouseEvent<HTMLButtonElement>) {
  // Отменяет и клик, и отправку формы клавишей Enter: браузер посылает её через click по кнопке.
  event.preventDefault();
}

/**
 * Ссылка, если передан `href` (`/…` – через next/link, остальное – обычная `<a>`), иначе `<button>`.
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant, size, fullWidth, icon, className, children, href, ...anchorProps } = props;
    const classes = buttonClassName({ variant, size, fullWidth, className });
    const content = (
      <>
        {icon && <Icon name={icon} size={20} />}
        {children}
      </>
    );

    return href.startsWith('/') ? (
      <Link href={href} className={classes} {...anchorProps}>
        {content}
      </Link>
    ) : (
      <a href={href} className={classes} {...anchorProps}>
        {content}
      </a>
    );
  }

  const {
    variant,
    size,
    fullWidth,
    icon,
    className,
    children,
    loading = false,
    type = 'button',
    onClick,
    ...buttonProps
  } = props;

  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      aria-disabled={loading || undefined}
      onClick={loading ? preventRepeat : onClick}
      {...buttonProps}
    >
      {loading ? <Spinner /> : icon && <Icon name={icon} size={20} />}
      {loading ? LOADING_LABEL : children}
    </button>
  );
}
