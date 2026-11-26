import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import { ScreenshotCarousel } from './ScreenshotCarousel';

const screenshots = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `r-${index}`,
    signature: `Ольга ${index}, мама ученика 7 класса`,
    subject: 'Математика',
    text: `Спасибо за занятия ${index}`,
    screenshot: `/reviews/r-${index}.png`,
    date: '12 октября 2026',
    dateTime: '2026-10-12',
  }));

describe('ScreenshotCarousel', () => {
  it('has no arrows when every screenshot fits', async () => {
    await page.viewport(1280, 900);
    const screen = await render(<ScreenshotCarousel reviews={screenshots(2)} label="Скриншоты" />);
    await expect.element(screen.getByRole('list', { name: 'Скриншоты' })).toBeInTheDocument();
    expect(screen.container.querySelectorAll('button:not(dialog button)')).toHaveLength(0);
  });

  it('scrolls by one screenshot with the arrows and disables them at the ends', async () => {
    await page.viewport(390, 844);
    const screen = await render(<ScreenshotCarousel reviews={screenshots(4)} label="Скриншоты" />);
    const prev = screen.getByRole('button', { name: 'Предыдущие отзывы' });
    const next = screen.getByRole('button', { name: 'Следующие отзывы' });
    await expect.element(prev).toBeDisabled();

    await userEvent.click(next);
    const list = screen.getByRole('list').element();
    await expect.poll(() => list.scrollLeft).toBeGreaterThan(0);
    await expect.element(prev).toBeEnabled();

    list.scrollLeft = list.scrollWidth;
    await expect.element(next).toBeDisabled();
  });

  it('grows the screenshot out of its thumbnail and shrinks it back on close', async () => {
    // Шпион вызывает настоящий метод на document: без этого браузер бросает Illegal invocation.
    const startViewTransition = vi
      .spyOn(document, 'startViewTransition')
      .mockImplementation((update) =>
        Document.prototype.startViewTransition.call(document, update),
      );
    const screen = await render(<ScreenshotCarousel reviews={screenshots(2)} label="Скриншоты" />);
    const link = screen.getByRole('link', { name: 'Скриншот переписки: Спасибо за занятия 1' });
    const thumbnail = link.element().querySelector('span')!;

    await userEvent.click(link);

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    const dialog = document.querySelector('dialog')!;
    // Окно открывается в колбэке перехода – после снимка старого кадра.
    await expect.poll(() => dialog.open).toBe(true);
    // После перелёта имя пары – только у крупного снимка.
    expect(thumbnail.style.viewTransitionName).toBe('');
    expect(dialog.querySelector<HTMLElement>('[style*="view-transition-name"]')).not.toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));

    expect(startViewTransition).toHaveBeenCalledTimes(2);
    await expect.poll(() => dialog.open).toBe(false);
    await expect.poll(() => thumbnail.style.viewTransitionName).toBe('');
    startViewTransition.mockRestore();
  });

  it('opens the dialog at once with reduced motion', async () => {
    const matchMedia = window.matchMedia.bind(window);
    const reduced = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation((query) =>
        query === '(prefers-reduced-motion: reduce)'
          ? { ...matchMedia(query), matches: true }
          : matchMedia(query),
      );
    const startViewTransition = vi.spyOn(document, 'startViewTransition');
    const screen = await render(<ScreenshotCarousel reviews={screenshots(2)} label="Скриншоты" />);

    await userEvent.click(
      screen.getByRole('link', { name: 'Скриншот переписки: Спасибо за занятия 0' }),
    );

    await expect.element(screen.getByRole('dialog')).toBeVisible();
    expect(startViewTransition).not.toHaveBeenCalled();
    reduced.mockRestore();
    startViewTransition.mockRestore();
  });

  it('opens the screenshot in a dialog and closes it', async () => {
    const screen = await render(<ScreenshotCarousel reviews={screenshots(2)} label="Скриншоты" />);
    await userEvent.click(
      screen.getByRole('link', { name: 'Скриншот переписки: Спасибо за занятия 1' }),
    );

    const dialog = screen.getByRole('dialog', { name: 'Ольга 1, мама ученика 7 класса' });
    await expect.element(dialog).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Закрыть' })).toHaveFocus();
    const element = dialog.element();

    await userEvent.keyboard('{Escape}');
    await expect.poll(() => element.hasAttribute('open')).toBe(false);
  });
});
