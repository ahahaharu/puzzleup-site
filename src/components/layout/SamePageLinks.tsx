'use client';

import { useEffect } from 'react';

// Ссылки на блок этой же страницы с параметрами в адресе – `?entry=tutor_profile#lead` (ТЗ главной,
// раздел 3: `entry` передаётся в адресе). Это обычные `<a>`, а не next/link: next/link, нажатый во
// время гидратации, меняет адрес, но не прокручивает к якорю. Без JavaScript браузер загружает
// страницу заново и сам переходит к якорю. С JavaScript – адрес меняется без перезагрузки
// (`pushState` Next синхронизирует с `useSearchParams`), блок прокручивается к началу экрана.

export function SamePageLinks() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const link = event.target.closest<HTMLAnchorElement>('a[href^="?"]');
      if (!link || link.target) return;
      const url = new URL(link.href);
      const block = url.hash ? document.getElementById(url.hash.slice(1)) : null;
      if (url.pathname !== window.location.pathname || !block) return;

      event.preventDefault();
      // Повторный клик по той же ссылке не плодит одинаковые записи в истории.
      if (url.href === window.location.href) {
        window.history.replaceState(window.history.state, '', url);
      } else {
        window.history.pushState(window.history.state, '', url);
      }
      // Плавность и отступ под шапку – из CSS (`scroll-behavior`, `scroll-padding-top` у html).
      block.scrollIntoView();
      // Как у обычного якоря, следующий Tab ведёт по блоку, а не дальше по месту ссылки.
      if (!block.hasAttribute('tabindex')) block.tabIndex = -1;
      block.focus({ preventScroll: true });
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
