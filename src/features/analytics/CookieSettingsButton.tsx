'use client';

import { reopenBanner, useConsent } from './consent';

/**
 * «Настройки cookie» в подвале – заново открывает баннер (ТЗ главной, блок 10). До гидратации
 * и без JavaScript кнопки нет: открыть баннер без скрипта нельзя.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { ready } = useConsent();
  if (!ready) return null;
  return (
    <button type="button" className={className} onClick={reopenBanner}>
      Настройки cookie
    </button>
  );
}
