import { cn } from '@/lib/cn';
import { TELEGRAM_LINK_PROPS, telegramUrl, viberUrl } from '@/lib/urls';

import { Icon } from './Icon';

// Квадратная кнопка мессенджера 48×48 – мобильное меню и нижняя панель страницы репетитора
// (ТЗ главной, блок 0 и «Глобальные элементы»; макеты X-menu, X-bottombar).

export type Messenger = 'telegram' | 'viber';

const MESSENGERS: Record<Messenger, { title: string; url: (value: string) => string }> = {
  telegram: { title: 'Telegram', url: telegramUrl },
  viber: { title: 'Viber', url: viberUrl },
};

type MessengerIconButtonProps = {
  messenger: Messenger;
  /** Ник или ссылка Telegram, номер Viber – как в `tutors/*.mdx`. */
  value: string;
  /** Имя в дательном падеже: «Андрею». */
  nameDative: string;
  className?: string;
};

/** Только иконка; имя «Написать Андрею в Telegram» – скрытым текстом, а не `aria-label` (ADR-029). */
export function MessengerIconButton({
  messenger,
  value,
  nameDative,
  className,
}: MessengerIconButtonProps) {
  const { title, url } = MESSENGERS[messenger];

  return (
    <a
      href={url(value)}
      {...(messenger === 'telegram' && TELEGRAM_LINK_PROPS)}
      // Рамка 1,5 px – как у контурной кнопки (ДС, раздел 6).
      className={cn(
        'inline-flex size-12 flex-none items-center justify-center rounded-button border-[1.5px] border-ink text-ink no-underline transition-transform duration-150 select-none hover:bg-ink/6 active:scale-[.98]',
        className,
      )}
    >
      <Icon name={messenger} size={20} />
      <span className="sr-only">{`Написать ${nameDative} в ${title}`}</span>
    </a>
  );
}
