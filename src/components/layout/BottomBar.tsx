'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { MessengerIconButton } from '@/components/ui/MessengerIconButton';

// Нижняя панель на телефоне – ТЗ главной, «Глобальные элементы»; ТЗ страницы репетитора, раздел 3;
// макет X-bottombar. До 1023 px.

type BottomBarProps = {
  cta: { label: string; href: string };
  /** Кнопка Telegram репетитора 48 px – на его странице. */
  telegram?: { value: string; nameDative: string } | undefined;
  /** Панель появляется, когда этот блок ушёл вверх: первый экран главной, профиль репетитора. */
  showAfter: string;
  /** И прячется, пока этот блок в зоне видимости: блок репетиторов, форма. */
  hideWhenVisible: string;
};

function useVisible(showAfter: string, hideWhenVisible: string) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const after = document.getElementById(showAfter);
    const target = document.getElementById(hideWhenVisible);
    // Без первого экрана панель нужна сразу; без целевого блока – не прячется.
    let passed = !after;
    let targetVisible = false;
    const update = () => setVisible(passed && !targetVisible);

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === after) {
          passed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        } else {
          targetVisible = entry.isIntersecting;
        }
      }
      update();
    });
    if (after) observer.observe(after);
    if (target) observer.observe(target);
    // Наблюдать может быть нечего – тогда состояние нужно сразу.
    update();

    return () => observer.disconnect();
  }, [showAfter, hideWhenVisible]);

  return visible;
}

/**
 * Без JavaScript панели нет: та же кнопка есть в шапке. Скрытая панель – `inert`, Tab в неё
 * не попадает. Открытое меню и cookie-баннер прячут её через CSS: баннер (фича 4.2) ставит
 * `data-cookie-banner`, пока виден.
 */
export function BottomBar({ cta, telegram, showAfter, hideWhenVisible }: BottomBarProps) {
  const visible = useVisible(showAfter, hideWhenVisible);

  return (
    <div
      data-visible={visible || undefined}
      inert={!visible}
      // Фон paper 95 % с размытием 8 px – из ТЗ и макета X-bottombar.
      // Селектор меню – литерал: Tailwind не видит классы, собранные из переменных (id – MENU_ID).
      className="fixed inset-x-0 bottom-0 z-30 translate-y-full border-t border-ink/12 bg-paper/95 pb-[env(safe-area-inset-bottom)] opacity-0 backdrop-blur-[8px] transition-[translate,opacity] duration-200 ease-out data-visible:translate-y-0 data-visible:opacity-100 lg:hidden [html:has(#site-menu[open])_&]:hidden [html:has([data-cookie-banner])_&]:hidden"
    >
      <div className="page-container flex h-16 items-center gap-2.5">
        <Button href={cta.href} size="md" fullWidth>
          {cta.label}
        </Button>
        {telegram && (
          <MessengerIconButton
            messenger="telegram"
            value={telegram.value}
            nameDative={telegram.nameDative}
          />
        )}
      </div>
    </div>
  );
}
