import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import type { Tutor } from '@/content';

import {
  FIXTURE_ANNA,
  FIXTURE_IGOR,
  FIXTURE_SITE,
  FIXTURE_SUBJECTS,
  FIXTURE_VERA,
  fixtureReview,
} from './fixtures';
import { tutorPageData } from './page-data';
import { TutorPage } from './TutorPage';
import { TutorReviews } from './TutorReviews';

function data(tutor: Tutor = FIXTURE_ANNA, reviewCount = 2) {
  return tutorPageData(tutor, {
    site: FIXTURE_SITE,
    subjects: FIXTURE_SUBJECTS,
    tutors: [tutor, FIXTURE_IGOR, FIXTURE_VERA],
    reviews: Array.from({ length: reviewCount }, (_, index) =>
      fixtureReview(`r-${index}`, { date: `2026-10-${String(10 + index).padStart(2, '0')}` }),
    ),
    year: 2026,
  });
}

function renderPage(tutor?: Tutor, reviewCount?: number) {
  return render(<TutorPage data={data(tutor, reviewCount)} aboutText={<p>Текст о себе.</p>} />);
}

const profileText = (container: HTMLElement) => container.querySelector('#top')?.textContent ?? '';

/** id секций страницы по порядку. */
function sectionIds(container: HTMLElement) {
  return [...container.querySelectorAll('section')].map(
    (section) => section.id || section.getAttribute('aria-labelledby'),
  );
}

describe('TutorPage', () => {
  it('reads the heading as one phrase and links the breadcrumbs', async () => {
    const screen = await renderPage();

    await expect
      .element(screen.getByRole('heading', { level: 1 }))
      .toHaveTextContent('Анна – репетитор по математике');
    const crumbs = screen.getByRole('navigation', { name: 'Хлебные крошки' });
    await expect
      .element(crumbs.getByRole('link', { name: 'Репетиторы' }))
      .toHaveAttribute('href', '/#tutors');
    await expect.element(crumbs.getByText('Анна')).toHaveAttribute('aria-current', 'page');
  });

  it('shows the profile of an available tutor with the blocks in order', async () => {
    const screen = await renderPage();

    expect(profileText(screen.container)).toContain('Есть свободное время');
    await expect
      .element(screen.getByRole('link', { name: 'Записаться к Анне' }))
      .toHaveAttribute('href', '?entry=tutor_profile#lead');
    await expect.element(screen.getByRole('link', { name: 'Написать в Telegram' })).toBeVisible();
    await expect
      .element(screen.getByRole('link', { name: /Отзывы · 2/ }))
      .toHaveAttribute('href', '#reviews');
    await expect.element(screen.getByText(/^Услуги оказывает Примерова/)).toBeVisible();
    expect(sectionIds(screen.container)).toEqual([
      'top',
      'about',
      'outside-title',
      'reviews',
      'how',
      'lead',
      'more',
    ]);
  });

  it('turns into the waitlist and raises the other tutors when full', async () => {
    const screen = await renderPage({ ...FIXTURE_ANNA, availability: 'full' });

    expect(profileText(screen.container)).toContain('Мест нет');
    await expect
      .element(screen.getByRole('link', { name: 'Встать в лист ожидания' }))
      .toHaveAttribute('href', '?entry=tutor_full#lead');
    await expect
      .element(screen.getByRole('link', { name: 'Ещё на сайте: Игорь' }))
      .toHaveAttribute('href', '/tutors/igor');
    await expect.element(screen.getByText(/^Сейчас у Анны нет свободного времени/)).toBeVisible();
    expect(sectionIds(screen.container).slice(0, 2)).toEqual(['top', 'more']);
  });

  it('leaves an archived tutor without booking, price and form', async () => {
    const screen = await renderPage({ ...FIXTURE_ANNA, archived: true });

    await expect
      .element(screen.getByText(/больше не принимает новых учеников/))
      .toHaveTextContent(
        'Анна больше не принимает новых учеников. По математике на сайте есть Игорь – посмотрите его страницу.',
      );
    await expect
      .element(screen.getByRole('link', { name: 'посмотрите его страницу' }))
      .toHaveAttribute('href', '/tutors/igor');
    await expect
      .element(screen.getByRole('link', { name: 'Выбрать репетитора' }))
      .toHaveAttribute('href', '/#tutors');
    const profile = profileText(screen.container);
    expect(profile).not.toContain('Есть свободное время');
    expect(profile).not.toContain('BYN');
    expect(profile).not.toContain('Услуги оказывает');
    expect(screen.container.querySelector('#top a[href^="https://t.me"]')).toBeNull();
    expect(sectionIds(screen.container)).toEqual([
      'top',
      'more',
      'about',
      'outside-title',
      'reviews',
    ]);
  });

  it('hides the blocks without data', async () => {
    const screen = await renderPage(
      { ...FIXTURE_VERA, hobby: undefined, personalNote: undefined },
      0,
    );
    // Вера ведёт физику: Игорь тоже, поэтому «Другие репетиторы» остаются.
    expect(sectionIds(screen.container)).toEqual(['top', 'about', 'how', 'lead', 'more']);
    await expect.element(screen.getByRole('link', { name: /Отзывы ·/ })).not.toBeInTheDocument();
  });

  it('keeps the profile button on the first phone screen', async () => {
    await page.viewport(360, 740);
    const screen = await renderPage();
    const button = screen.getByRole('link', { name: 'Записаться к Анне' }).element();
    // Над профилем на сайте ещё шапка 64 px.
    expect(button.getBoundingClientRect().bottom + 64).toBeLessThanOrEqual(740);
  });
});

describe('TutorReviews', () => {
  const reviews = (count: number) =>
    data(FIXTURE_ANNA, count).reviews.items.map((review) => review);

  async function renderReviews(count: number) {
    return render(<TutorReviews title="Отзывы" reviews={reviews(count)} />);
  }

  const visible = (container: HTMLElement) =>
    [...container.querySelectorAll('li')].filter((item) => item.checkVisibility()).length;

  it('shows three reviews on the phone and the rest after «Показать ещё»', async () => {
    await page.viewport(390, 844);
    const screen = await renderReviews(5);

    expect(screen.container.querySelectorAll('li')).toHaveLength(5);
    expect(visible(screen.container)).toBe(3);
    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё' }));
    expect(visible(screen.container)).toBe(5);
    await expect
      .element(screen.getByRole('button', { name: 'Показать ещё' }))
      .not.toBeInTheDocument();
    await expect
      .poll(() => document.activeElement)
      .toBe(screen.container.querySelectorAll('li')[3]);
  });

  it('shows six reviews in two columns on the desktop', async () => {
    await page.viewport(1280, 900);
    const few = await renderReviews(5);
    expect(visible(few.container)).toBe(5);
    expect(few.container.querySelector('button')?.checkVisibility()).toBe(false);
    few.unmount();

    const many = await renderReviews(8);
    expect(visible(many.container)).toBe(6);
    await expect.element(many.getByRole('button', { name: 'Показать ещё' })).toBeVisible();
  });

  it('renders nothing without reviews', async () => {
    const screen = await renderReviews(0);
    expect(screen.container.innerHTML).toBe('');
  });
});
