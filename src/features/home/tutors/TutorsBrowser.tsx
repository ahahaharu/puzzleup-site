'use client';

import { useSearchParams } from 'next/navigation';
import { useRef, useState, useSyncExternalStore } from 'react';

import { activeTab, COLLAPSED_LIMIT, filterBySubject, type FilterTab } from './filter';
import { shownAnnouncement } from './texts';
import { TutorsView, type TutorItem } from './TutorsView';

// Фильтр по предметам – на клиенте, страница остаётся статичной (ТЗ главной, раздел 8; docs/architecture.md,
// раздел 4). Выбор хранится в адресе `?subject=`: ссылка с параметром открывает отфильтрованный
// список, «Назад» со страницы репетитора возвращает тот же фильтр. Компонент стоит внутри <Suspense>:
// до гидратации и без JavaScript видна запасная разметка со всеми репетиторами.

const PHONE = '(max-width: 47.999rem)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PHONE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

type TutorsBrowserProps = {
  items: readonly TutorItem[];
  tabs: readonly FilterTab[];
};

export function TutorsBrowser({ items, tabs }: TutorsBrowserProps) {
  const subject = activeTab(useSearchParams().get('subject'), tabs);
  // Подпись и фокус ленты нужны только там, где она лента; на сервере – как на телефоне.
  const phone = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE).matches,
    () => true,
  );
  const [expanded, setExpanded] = useState(false);
  const [changed, setChanged] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const listRef = useRef<HTMLUListElement>(null);

  function select(next: string | null) {
    const url = new URL(window.location.href);
    if (next === null) url.searchParams.delete('subject');
    else url.searchParams.set('subject', next);
    // Без новой записи в истории: «Назад» ведёт туда, откуда пришли, а не по вкладкам.
    window.history.replaceState(null, '', url);
    setChanged(true);
    setAnnouncement(shownAnnouncement(filterBySubject(items, next).length));
  }

  function expand() {
    setExpanded(true);
    // Кнопка исчезает – фокус переходит к первой из открывшихся карточек.
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelectorAll('li')
        [COLLAPSED_LIMIT]?.querySelector<HTMLElement>('h3 a')
        ?.focus();
    });
  }

  return (
    <TutorsView
      items={items}
      tabs={tabs}
      subject={subject}
      expanded={expanded}
      phone={phone}
      animate={changed}
      announcement={announcement}
      onSelect={select}
      onExpand={expand}
      listRef={listRef}
    />
  );
}
