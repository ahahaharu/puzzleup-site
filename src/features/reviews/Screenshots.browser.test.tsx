import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import { Screenshots } from './Screenshots';

const screenshots = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `r-${index}`,
    signature: `Ольга ${index}, мама ученика 7 класса`,
    subject: 'Математика',
    text: `Спасибо за занятия ${index}`,
    screenshot: `/reviews/r-${index}.png`,
    date: '12 октября 2026',
    dateTime: '2026-10-12',
    screenshotSize: { width: 900, height: index % 2 === 0 ? 410 : 900 },
  }));

const NOTE = {
  title: 'Пробное занятие – бесплатно',
  text: '30 минут онлайн.',
  cta: { label: 'Записаться к Андрею', href: '#lead' },
};

describe('Screenshots', () => {
  it('previews the first four screenshots in two columns and fades the bottom', async () => {
    await page.viewport(1280, 900);
    const screen = await render(
      <Screenshots reviews={screenshots(6)} label="Скриншоты" layout="preview" />,
    );
    const list = screen.getByRole('list', { name: 'Скриншоты' });
    expect(screen.getByRole('listitem').all()).toHaveLength(4);
    // Широкий, квадратный, широкий, квадратный: колонки выше предела – низ растворяется.
    expect(getComputedStyle(list.element()).maskImage).toContain('linear-gradient');
  });

  it('previews two screenshots on a phone', async () => {
    await page.viewport(390, 844);
    const screen = await render(
      <Screenshots reviews={screenshots(6)} label="Скриншоты" layout="preview" />,
    );
    expect(screen.getByRole('listitem').all()).toHaveLength(2);
  });

  it('does not fade a preview that fits', async () => {
    await page.viewport(1280, 900);
    const screen = await render(
      <Screenshots reviews={screenshots(1)} label="Скриншоты" layout="preview" />,
    );
    const list = screen.getByRole('list', { name: 'Скриншоты' }).element();
    expect(getComputedStyle(list).maskImage).toBe('none');
  });

  it('lays out every screenshot in columns and puts the note into the room left', async () => {
    await page.viewport(1280, 900);
    const screen = await render(
      <Screenshots reviews={screenshots(5)} label="Скриншоты" layout="wall" note={NOTE} />,
    );
    expect(screen.getByRole('listitem').all()).toHaveLength(5);
    await expect.element(screen.getByRole('link', { name: 'Записаться к Андрею' })).toBeVisible();
    // Скрытая кнопка не попадает в дерево доступности – ищем по тексту в разметке.
    const more = [...screen.container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Показать ещё',
    );
    expect(more?.checkVisibility()).toBe(false);
  });

  it('shows three screenshots on a phone until «Показать ещё»', async () => {
    await page.viewport(390, 844);
    const screen = await render(
      <Screenshots reviews={screenshots(5)} label="Скриншоты" layout="wall" note={NOTE} />,
    );
    const visible = () =>
      screen
        .getByRole('listitem')
        .elements()
        .filter((item) => item.checkVisibility());
    expect(visible()).toHaveLength(3);
    // Записка – только от 1024 px; скрытую ссылку ищем по тексту в разметке.
    const cta = [...screen.container.querySelectorAll('a')].find(
      (link) => link.textContent === 'Записаться к Андрею',
    );
    expect(cta?.checkVisibility()).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё' }));
    expect(visible()).toHaveLength(5);
    await expect
      .element(screen.getByRole('link', { name: 'Скриншот переписки: Спасибо за занятия 3' }))
      .toHaveFocus();
  });

  it('grows the screenshot out of its thumbnail and shrinks it back on close', async () => {
    // Шпион вызывает настоящий метод на document: без этого браузер бросает Illegal invocation.
    const startViewTransition = vi
      .spyOn(document, 'startViewTransition')
      .mockImplementation((update) =>
        Document.prototype.startViewTransition.call(document, update),
      );
    const screen = await render(
      <Screenshots reviews={screenshots(2)} label="Скриншоты" layout="wall" />,
    );
    const link = screen.getByRole('link', { name: 'Скриншот переписки: Спасибо за занятия 1' });
    const thumbnail = link.element().querySelector<HTMLElement>('[data-thumbnail]')!;

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
    const screen = await render(
      <Screenshots reviews={screenshots(2)} label="Скриншоты" layout="wall" />,
    );

    await userEvent.click(
      screen.getByRole('link', { name: 'Скриншот переписки: Спасибо за занятия 0' }),
    );

    await expect.element(screen.getByRole('dialog')).toBeVisible();
    expect(startViewTransition).not.toHaveBeenCalled();
    reduced.mockRestore();
    startViewTransition.mockRestore();
  });

  it('opens the screenshot in a dialog and closes it', async () => {
    const screen = await render(
      <Screenshots reviews={screenshots(2)} label="Скриншоты" layout="wall" />,
    );
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
