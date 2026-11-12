import { cn } from '@/lib/cn';
import { telegramUrl, viberUrl } from '@/lib/urls';

import { Button, type ButtonSize } from './Button';
import type { IconName } from './Icon';

// Кнопки мессенджеров – ТЗ главной, раздел 2 «Компоненты» и раздел 5 «Карточка репетитора»;
// docs/design-system.md, раздел 6; макеты D-5-tutors, T-1-profile, X-thanks.

/**
 * Подпись и доступное имя (ADR-029). Видимая подпись всегда входит в доступное имя (WCAG 2.5.3):
 * - `short` – видно «Telegram», имя «Написать Андрею в Telegram» (карточка репетитора, ТЗ главной, раздел 5);
 * - `action` – на широкой паре видно «Написать в Telegram», на узкой – «Telegram»; имя «Написать
 *   в Telegram»: страница и так про этого репетитора (профиль, ТЗ страницы репетитора, раздел 1);
 * - `personal` – всегда видно «Написать Андрею в Telegram» (экран «Спасибо», ТЗ главной, раздел 9);
 *   пока пара не помещается в строку, кнопки стоят столбиком.
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

// Ширина решается по самой паре (container query), а не по окну: пара стоит и в узкой колонке
// карточки, и в широкой колонке профиля.
function Label({
  label,
  nameDative,
  title,
}: {
  label: MessengerLabel;
  nameDative: string;
  title: string;
}) {
  if (label === 'personal') {
    // Длинное имя («Александре») переносится внутри кнопки, а не вылезает за край.
    return (
      <span className="text-center whitespace-normal">{`Написать ${nameDative} в ${title}`}</span>
    );
  }

  // Скрытый текст – в начале имени: видимое слово остаётся его цельным хвостом.
  const prefix = label === 'short' ? `Написать ${nameDative} в ` : 'Написать в ';
  return (
    <span>
      {/* «Написать в Telegram» при 17 px помещается в пару от 532 px – порог с запасом. */}
      <span className={label === 'action' ? 'sr-only @[34rem]:not-sr-only' : 'sr-only'}>
        {prefix}
      </span>
      {title}
    </span>
  );
}

/**
 * Telegram и Viber репетитора – всегда парой и равного веса: в два равных столбца, без переноса
 * по одной; длинная подпись `personal` – столбиком, пока пара не помещается в строку.
 */
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
    // Контейнер не берёт ширину из содержимого: без w-full пара схлопнулась бы в колонке items-start.
    <div className={cn('@container w-full', className)}>
      <div
        className={cn(
          'grid gap-2.5',
          // «Написать Александре в Telegram» – около 300 px на кнопку.
          label === 'personal' ? 'grid-cols-1 @2xl:grid-cols-2' : 'grid-cols-2',
        )}
      >
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
