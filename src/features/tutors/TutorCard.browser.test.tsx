import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';

import { FIXTURE_TUTORS } from './fixtures';
import { TutorCard } from './TutorCard';

function fixture(index: number) {
  const tutor = FIXTURE_TUTORS[index];
  if (!tutor) throw new Error(`fixture ${index} not found`);
  return tutor;
}

const ANNA = fixture(0);
const IGOR = fixture(1);

/** `.element()` не ждёт: сначала дожидаемся, пока карточки отрисованы. */
async function rendered(screen: Awaited<ReturnType<typeof render>>, count = 1) {
  await expect.poll(() => screen.container.querySelectorAll('article h3 a').length).toBe(count);
}

describe('TutorCard', () => {
  it('shows status, name, subjects, credentials, tagline and price', async () => {
    const screen = await render(<TutorCard tutor={ANNA} />);

    await expect.element(screen.getByText('Есть свободное время')).toBeVisible();
    await expect.element(screen.getByRole('heading', { level: 3, name: 'Анна' })).toBeVisible();
    await expect.element(screen.getByText('Математика · 5–9 класс')).toBeVisible();
    await expect.element(screen.getByText(ANNA.credentials)).toBeVisible();
    await expect.element(screen.getByText(`«${ANNA.tagline}»`)).toBeVisible();
    await expect.element(screen.getByText('40 BYN · 60 минут')).toBeVisible();
  });

  it('links the name and «Подробнее» to the tutor page, the photo is hidden from screen readers', async () => {
    const screen = await render(<TutorCard tutor={ANNA} />);

    await expect
      .element(screen.getByRole('link', { name: 'Анна', exact: true }))
      .toHaveAttribute('href', '/tutors/example-1');
    await expect
      .element(screen.getByRole('link', { name: 'Подробнее об Анне' }))
      .toHaveAttribute('href', '/tutors/example-1');

    await rendered(screen);
    const photoLink = screen.container.querySelector('a[aria-hidden="true"]');
    expect(photoLink?.getAttribute('href')).toBe('/tutors/example-1');
    expect(photoLink?.getAttribute('tabindex')).toBe('-1');
  });

  it('lifts the photo off the page on hover, doubling its tilt', async () => {
    const screen = await render(<TutorCard tutor={ANNA} tilt={-1.5} />);
    await rendered(screen);
    const photo = screen.container.querySelector<HTMLElement>('[style*="--tilt"]')!;
    expect(getComputedStyle(photo).rotate).toBe('-1.5deg');

    await userEvent.hover(screen.getByRole('heading', { level: 3, name: 'Анна' }));

    await expect.poll(() => getComputedStyle(photo).rotate).toBe('-3deg');
  });

  it('leads to the form with entry=tutors and to both messengers', async () => {
    const screen = await render(<TutorCard tutor={ANNA} />);

    await expect
      .element(screen.getByRole('link', { name: 'Записаться к Анне' }))
      .toHaveAttribute('href', '/tutors/example-1?entry=tutors#lead');
    await expect
      .element(screen.getByRole('link', { name: 'Написать Анне в Telegram' }))
      .toHaveAttribute('href', 'https://t.me/example_tutor_1');
    await expect
      .element(screen.getByRole('link', { name: 'Написать Анне в Viber' }))
      .toHaveAttribute('href', 'viber://chat?number=%2B375290000001');
  });

  it('offers the waitlist when there are no places', async () => {
    const screen = await render(<TutorCard tutor={{ ...ANNA, availability: 'full' }} />);

    await expect.element(screen.getByText('Мест нет')).toBeVisible();
    await expect
      .element(screen.getByRole('link', { name: 'В лист ожидания к Анне' }))
      .toHaveAttribute('href', '/tutors/example-1?entry=tutors#lead');
    await rendered(screen);
    expect(screen.container.textContent).not.toContain('Записаться');
  });

  it('links the review count to the reviews block', async () => {
    const screen = await render(<TutorCard tutor={IGOR} />);
    await expect
      .element(screen.getByRole('link', { name: '11 отзывов об Игоре' }))
      .toHaveAttribute('href', '/tutors/example-2#reviews');
  });

  it('has no review line without reviews', async () => {
    const screen = await render(<TutorCard tutor={ANNA} />);
    await rendered(screen);
    expect(screen.container.textContent).not.toMatch(/отзыв/);
  });

  it.each([
    [328, 92],
    [560, 170],
    [720, 170],
  ])('in a %i px card the photo is %i px wide', async (width, photo) => {
    const screen = await render(
      <div style={{ width }}>
        <TutorCard tutor={ANNA} />
      </div>,
    );
    await rendered(screen);
    const frame = screen.getByText('А').element().closest('[style]');
    if (!(frame instanceof HTMLElement)) throw new Error('photo frame not found');

    expect(frame.offsetWidth).toBe(photo);
  });

  it('puts text beside the photo only in a wide card', async () => {
    const screen = await render(
      <>
        <div style={{ width: 328 }}>
          <TutorCard tutor={ANNA} />
        </div>
        <div style={{ width: 720 }}>
          <TutorCard tutor={IGOR} />
        </div>
      </>,
    );
    await rendered(screen, 2);
    const boxes = (initial: string) => {
      const frame = screen.getByText(initial, { exact: true }).element().closest('[style]');
      const card = frame?.closest('article');
      const button = card?.querySelector('a[href$="#lead"]');
      if (!frame || !button) throw new Error('card parts not found');
      return { photo: frame.getBoundingClientRect(), button: button.getBoundingClientRect() };
    };
    const narrow = boxes('А');
    const wide = boxes('И');

    expect(narrow.button.left).toBeLessThan(narrow.photo.right);
    expect(wide.button.left).toBeGreaterThan(wide.photo.right);
  });

  it('keeps every link and button at least 44 px tall', async () => {
    const screen = await render(
      <div style={{ width: 328 }}>
        <TutorCard tutor={IGOR} />
      </div>,
    );
    await rendered(screen);
    const targets = [...screen.container.querySelectorAll('a')].filter(
      (link) => link.getAttribute('aria-hidden') !== 'true',
    );
    expect(targets).toHaveLength(6);

    for (const target of targets) {
      // Зона нажатия имени – псевдоэлемент ::after над ссылкой.
      const after = getComputedStyle(target, '::after');
      const height =
        after.position === 'absolute'
          ? Number.parseFloat(after.height)
          : target.getBoundingClientRect().height;
      expect(height, target.textContent).toBeGreaterThanOrEqual(43.5);
    }
  });
});
