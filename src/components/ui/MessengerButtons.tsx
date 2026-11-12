import { cn } from '@/lib/cn';
import { telegramUrl, viberUrl } from '@/lib/urls';

import { Button, type ButtonSize } from './Button';
import type { IconName } from './Icon';

// Кнопки мессенджеров – ТЗ главной, раздел 2 «Компоненты» и раздел 5 «Карточка репетитора»;
// docs/design-system.md, раздел 6; макеты D-5-tutors, T-1-profile, X-thanks.

/**
 * Видимая подпись на широкой паре кнопок. Пока пара узкая (телефон, карточка), видно только
 * название мессенджера. Доступное имя всегда полное: «Написать Андрею в Telegram» (ADR-029).
 * - `short` – «Telegram» на любой ширине (карточка репетитора);
 * - `action` – «Написать в Telegram» (профиль);
 * - `personal` – «Написать Андрею в Telegram» (экран «Спасибо»).
 */
export type MessengerLabel = 'short' | 'action' | 'personal';

type MessengerButtonsProps = {
  telegram: string;
  viber: string;
  /** Имя в дательном падеже: «Андрею». */
  nameDative: string;
  label?: MessengerLabel;
  /** `dark` – на тёмной детали формы и экране «Спасибо». */
  tone?: 'light' | 'dark';
  size?: ButtonSize;
  className?: string;
};

// Скрытые слова остаются в доступном имени: видимая подпись – его часть (WCAG 2.5.3).
// Длинная подпись включается по ширине самой пары (container query), а не окна: пара стоит
// и в узкой колонке карточки, и в широкой колонке профиля.
const SR_ONLY = 'sr-only';
const WIDE_ACTION = 'sr-only @lg:not-sr-only';
const WIDE_PERSONAL = 'sr-only @2xl:not-sr-only';

function Label({
  label,
  nameDative,
  title,
}: {
  label: MessengerLabel;
  nameDative: string;
  title: string;
}) {
  const verb = label === 'short' ? SR_ONLY : label === 'action' ? WIDE_ACTION : WIDE_PERSONAL;
  const name = label === 'personal' ? WIDE_PERSONAL : SR_ONLY;

  return (
    <span>
      <span className={verb}>Написать </span>
      <span className={name}>{nameDative} </span>
      <span className={verb}>в </span>
      {title}
    </span>
  );
}

/** Telegram и Viber репетитора – всегда парой, в два равных столбца, без переноса по одной. */
export function MessengerButtons({
  label = 'short',
  tone = 'light',
  size = 'md',
  className,
  telegram,
  viber,
  nameDative,
}: MessengerButtonsProps) {
  const messengers: Array<{ icon: IconName; title: string; href: string }> = [
    { icon: 'telegram', title: 'Telegram', href: telegramUrl(telegram) },
    { icon: 'viber', title: 'Viber', href: viberUrl(viber) },
  ];

  return (
    // Зазор 10 px – из макетов карточки и профиля.
    <div className={cn('@container', className)}>
      <div className="grid grid-cols-2 gap-2.5">
        {messengers.map(({ icon, title, href }) => (
          <Button
            key={title}
            href={href}
            variant={tone === 'dark' ? 'secondaryOnDark' : 'secondary'}
            size={size}
            icon={icon}
            fullWidth
          >
            <Label label={label} nameDative={nameDative} title={title} />
          </Button>
        ))}
      </div>
    </div>
  );
}
