import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { FIXTURE_SUBJECTS, FIXTURE_TUTORS } from '@/features/tutors/fixtures';
import { TutorCard } from '@/features/tutors/TutorCard';

import { filterTabs } from './filter';
import { TutorsBrowser } from './TutorsBrowser';
import { TutorsView, type TutorItem } from './TutorsView';

// Адрес вместо роутера Next.js: useSearchParams читает location и обновляется после replaceState,
// как в приложении (Next.js встраивает history.replaceState в роутер).
vi.mock('next/navigation', async () => {
  const { useSyncExternalStore } = await import('react');
  const subscribe = (onChange: () => void) => {
    window.addEventListener('test:url', onChange);
    return () => window.removeEventListener('test:url', onChange);
  };
  const useSearchParams = () =>
    new URLSearchParams(useSyncExternalStore(subscribe, () => window.location.search));
  // next/navigation – CommonJS: Vite берёт именованные экспорты из `default`.
  return { useSearchParams, default: { useSearchParams } };
});

const replaceState = window.history.replaceState.bind(window.history);

beforeEach(() => {
  vi.spyOn(window.history, 'replaceState').mockImplementation((...args) => {
    replaceState(...args);
    window.dispatchEvent(new Event('test:url'));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  replaceState(null, '', window.location.pathname);
});

function items(count: number): TutorItem[] {
  return FIXTURE_TUTORS.slice(0, count).map((tutor) => ({
    id: tutor.id,
    subjectIds: tutor.subjectIds,
    card: (
      <article>
        <h3>
          <a href={`/tutors/${tutor.slug}`}>{tutor.name}</a>
        </h3>
      </article>
    ),
  }));
}

function setup(count: number) {
  const list = items(count);
  return { list, tabs: filterTabs(FIXTURE_SUBJECTS, list) };
}

const names = (screen: Awaited<ReturnType<typeof render>>) =>
  [...screen.container.querySelectorAll('li')]
    .filter((item) => item.checkVisibility())
    .map((item) => item.textContent);

describe('TutorsBrowser', () => {
  it('shows tabs with counts, «Все» pressed by default', async () => {
    const { list, tabs } = setup(3);
    const screen = await render(<TutorsBrowser items={list} tabs={tabs} />);

    await expect
      .element(screen.getByRole('button', { name: 'Все' }))
      .toHaveAttribute('aria-pressed', 'true');
    await expect
      .element(screen.getByRole('button', { name: 'Математика · 2' }))
      .toHaveAttribute('aria-pressed', 'false');
    await expect.element(screen.getByRole('button', { name: 'Физика · 2' })).toBeVisible();
    expect(names(screen)).toEqual(['Анна', 'Игорь', 'Вера']);
  });

  it('filters by subject, writes it to the address and announces the count', async () => {
    const { list, tabs } = setup(3);
    const screen = await render(<TutorsBrowser items={list} tabs={tabs} />);

    await screen.getByRole('button', { name: 'Физика · 2' }).click();

    await expect
      .element(screen.getByRole('button', { name: 'Физика · 2' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(new URLSearchParams(window.location.search).get('subject')).toBe('physics');
    expect(names(screen)).toEqual(['Игорь', 'Вера']);
    await expect.element(screen.getByText('Показаны 2 репетитора')).toBeInTheDocument();
    expect(screen.getByText('Показаны 2 репетитора').element().getAttribute('aria-live')).toBe(
      'polite',
    );

    await screen.getByRole('button', { name: 'Все' }).click();
    expect(window.location.search).toBe('');
    expect(names(screen)).toHaveLength(3);
  });

  it('opens the filtered list from a link with ?subject=', async () => {
    replaceState(null, '', '?subject=math');
    const { list, tabs } = setup(3);
    const screen = await render(<TutorsBrowser items={list} tabs={tabs} />);

    await expect
      .element(screen.getByRole('button', { name: 'Математика · 2' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(names(screen)).toEqual(['Анна', 'Игорь']);
  });

  it('treats an unknown subject as «Все»', async () => {
    replaceState(null, '', '?subject=chemistry');
    const { list, tabs } = setup(3);
    const screen = await render(<TutorsBrowser items={list} tabs={tabs} />);

    await expect
      .element(screen.getByRole('button', { name: 'Все' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(names(screen)).toHaveLength(3);
  });

  it('shows no tabs when there is a single subject', async () => {
    const list = items(2).map((item) => ({ ...item, subjectIds: ['math'] }));
    const screen = await render(
      <TutorsBrowser items={list} tabs={filterTabs(FIXTURE_SUBJECTS, list)} />,
    );

    await expect.element(screen.getByText('Анна')).toBeVisible();
    expect(screen.container.querySelector('[role="group"]')).toBeNull();
  });

  it('makes three or more cards a labelled, keyboard-scrollable ribbon on a phone', async () => {
    const { list, tabs } = setup(3);
    const screen = await render(<TutorsBrowser items={list} tabs={tabs} />);

    const ribbon = screen.getByRole('region', { name: 'Репетиторы' });
    await expect.element(ribbon).toHaveAttribute('tabindex', '0');
    const box = ribbon.element();
    expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);

    // Карточка – 85 % ширины экрана.
    const card = box.querySelector('li');
    expect(card?.getBoundingClientRect().width).toBeCloseTo(window.innerWidth * 0.85, 0);
  });

  it('scrolls the ribbon of real cards without scrolling the page sideways', async () => {
    const list = FIXTURE_TUTORS.slice(0, 3).map((tutor) => ({
      id: tutor.id,
      subjectIds: tutor.subjectIds,
      card: <TutorCard tutor={tutor} />,
    }));
    const screen = await render(
      <div className="page-container">
        <TutorsBrowser items={list} tabs={filterTabs(FIXTURE_SUBJECTS, list)} />
      </div>,
    );

    await expect.element(screen.getByRole('region', { name: 'Репетиторы' })).toBeVisible();
    // Абсолютные детали карточек (скотч, скрытый текст) не выходят за обрезку ленты.
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });

  it('stacks one or two cards in a column without a ribbon', async () => {
    const list = items(2);
    const screen = await render(
      <TutorsBrowser items={list} tabs={filterTabs(FIXTURE_SUBJECTS, list)} />,
    );

    await expect.element(screen.getByText('Анна')).toBeVisible();
    expect(screen.container.querySelector('[role="region"]')).toBeNull();
    const [first, second] = [...screen.container.querySelectorAll('li')].map((item) =>
      item.getBoundingClientRect(),
    );
    expect(second?.top).toBeGreaterThan(first?.bottom ?? Infinity);
  });
});

describe('TutorsView collapsing', () => {
  it('hides cards after the sixth behind «Показать всех» from 768 px', async () => {
    await page.viewport(1280, 900);
    const { list, tabs } = setup(7);
    const onExpand = vi.fn();
    const screen = await render(
      <TutorsView items={list} tabs={tabs} subject={null} expanded={false} onExpand={onExpand} />,
    );

    await expect.element(screen.getByRole('button', { name: 'Показать всех' })).toBeVisible();
    expect(names(screen)).toHaveLength(6);
    await screen.getByRole('button', { name: 'Показать всех' }).click();
    expect(onExpand).toHaveBeenCalledOnce();
    await page.viewport(360, 740);
  });

  it('expands to all cards and moves focus to the first opened one', async () => {
    await page.viewport(1280, 900);
    const { list, tabs } = setup(7);
    const screen = await render(<TutorsBrowser items={list} tabs={tabs} />);

    await screen.getByRole('button', { name: 'Показать всех' }).click();

    expect(names(screen)).toHaveLength(7);
    await expect.element(screen.getByRole('link', { name: 'Марина' })).toHaveFocus();
    expect(screen.container.textContent).not.toContain('Показать всех');
    await page.viewport(360, 740);
  });

  it('keeps all cards in the phone ribbon', async () => {
    const { list, tabs } = setup(7);
    const screen = await render(
      <TutorsView items={list} tabs={tabs} subject={null} expanded={false} />,
    );

    await expect.element(screen.getByText('Марина')).toBeInTheDocument();
    expect(names(screen)).toHaveLength(7);
    const showAll = [...screen.container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Показать всех',
    );
    expect(showAll?.checkVisibility()).toBe(false);
  });
});

describe('TutorsView fallback (before hydration and without JavaScript)', () => {
  it('renders every card and marks script-only controls', async () => {
    await page.viewport(1280, 900);
    const { list, tabs } = setup(7);
    const screen = await render(
      <TutorsView items={list} tabs={tabs} subject={null} expanded={false} fallback />,
    );

    await expect.element(screen.getByText('Марина')).toBeInTheDocument();
    const cards = [...screen.container.querySelectorAll('li')];
    expect(cards).toHaveLength(7);
    // Без скрипта (@media (scripting: none)) вкладки и кнопка скрыты, свёрнутая карточка видна.
    expect(screen.container.querySelector('[role="group"]')?.className).toContain(
      'noscript:hidden',
    );
    expect(
      screen.getByRole('button', { name: 'Показать всех' }).element().parentElement?.className,
    ).toContain('noscript:hidden');
    expect(cards[6]?.className).toContain('scripting:md:hidden');
    expect(cards[6]?.className).not.toMatch(/(^|\s)md:hidden/);
    await page.viewport(360, 740);
  });
});
