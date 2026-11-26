import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { CTA, HOURS_LINE, LINKS, TUTORS } from './fixtures';
import { Header } from './Header';

function Page({ spy = true, cta = CTA }: { spy?: boolean; cta?: typeof CTA }) {
  return (
    <>
      <Header links={LINKS} spy={spy} cta={cta} menu={{ tutors: TUTORS, hoursLine: HOURS_LINE }} />
      <main>
        {['top', 'tutors', 'situations', 'how', 'prices'].map((id) => (
          <section key={id} id={id} style={{ height: 1200 }}>
            {id}
          </section>
        ))}
      </main>
    </>
  );
}

const header = () => document.querySelector('header')!;

afterEach(async () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  await page.viewport(360, 740);
});

describe('Header', () => {
  it('on a phone shows the short button with the full accessible name and the burger', async () => {
    const screen = await render(<Page />);
    const cta = screen.getByRole('link', { name: 'Выбрать репетитора' });

    await expect.element(cta).toHaveAttribute('href', '#tutors');
    expect(cta.element().getBoundingClientRect().width).toBeLessThan(120);
    expect(cta.element().getBoundingClientRect().height).toBe(44);
    await expect.element(screen.getByRole('button', { name: 'Меню' })).toBeVisible();
    await expect
      .element(screen.getByRole('navigation', { name: 'Основная' }))
      .not.toBeInTheDocument();
    expect(header().getBoundingClientRect().height).toBe(64);
  });

  it('on a desktop shows navigation instead of the burger', async () => {
    await page.viewport(1280, 800);
    const screen = await render(<Page />);
    const nav = screen.getByRole('navigation', { name: 'Основная' });

    await expect.element(nav).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Меню' })).not.toBeInTheDocument();
    expect(Array.from(nav.element().querySelectorAll('a'), (link) => link.textContent)).toEqual([
      'Репетиторы',
      'Как это работает',
      'Предметы',
      'Отзывы',
      'Цены',
    ]);
    expect(header().getBoundingClientRect().height).toBe(88);
  });

  it('shrinks to 72 px on a desktop after 80 px of scroll', async () => {
    await page.viewport(1280, 800);
    await render(<Page />);

    window.scrollTo({ top: 80, behavior: 'instant' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(header().hasAttribute('data-scrolled')).toBe(false);

    window.scrollTo({ top: 81, behavior: 'instant' });
    await expect.poll(() => header().hasAttribute('data-scrolled')).toBe(true);
    await expect.poll(() => header().getBoundingClientRect().bottom).toBe(72);
  });

  it('highlights the item of the current block only', async () => {
    await page.viewport(1280, 800);
    const screen = await render(<Page />);
    const how = screen.getByRole('link', { name: 'Как это работает' });

    document.getElementById('how')!.scrollIntoView({ behavior: 'instant' });
    await expect.element(how).toHaveAttribute('aria-current', 'location');
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(1);

    // «Узнаёте ситуацию?» в навигации нет – не подсвечено ничего.
    document.getElementById('situations')!.scrollIntoView({ behavior: 'instant' });
    await expect.element(how).not.toHaveAttribute('aria-current');
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(0);
  });

  it('slides one line to the current item and fades it out in place', async () => {
    await page.viewport(1280, 800);
    const screen = await render(<Page />);
    const line = () =>
      document.querySelector<HTMLElement>('header nav > span[aria-hidden="true"]')!;
    const labelLeft = (name: string) =>
      screen.getByRole('link', { name }).element().querySelector<HTMLElement>('[data-nav-label]')!
        .offsetLeft;

    document.getElementById('tutors')!.scrollIntoView({ behavior: 'instant' });
    await expect.poll(() => getComputedStyle(line()).opacity).toBe('1');
    const atTutors = line().style.transform;
    expect(atTutors).toContain(`translate(${labelLeft('Репетиторы')}px`);

    document.getElementById('how')!.scrollIntoView({ behavior: 'instant' });
    await expect
      .poll(() => line().style.transform)
      .toContain(`translate(${labelLeft('Как это работает')}px`);
    // Переезд от пункта к пункту – анимацией transform.
    expect(getComputedStyle(line()).transitionProperty).toContain('transform');

    document.getElementById('situations')!.scrollIntoView({ behavior: 'instant' });
    await expect.poll(() => line().className).toContain('opacity-0');
    expect(line().style.transform).toContain(`translate(${labelLeft('Как это работает')}px`);
  });

  it('does not highlight items on other pages', async () => {
    await page.viewport(1280, 800);
    const screen = await render(<Page spy={false} />);

    document.getElementById('how')!.scrollIntoView({ behavior: 'instant' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect
      .element(screen.getByRole('link', { name: 'Как это работает' }))
      .not.toHaveAttribute('aria-current');
  });

  it('shows a short label that is a part of the full one on a phone', async () => {
    const screen = await render(
      <Page cta={{ label: 'Встать в лист ожидания', short: 'Лист ожидания', href: '#lead' }} />,
    );
    const cta = screen.getByRole('link', { name: 'Встать в лист ожидания' });

    await expect.element(cta).toBeVisible();
    // Видна короткая подпись, полная – только для дикторов.
    // sr-only браузер считает видимым – отличаем по ширине (у sr-only она 1 px).
    const visible = [...cta.element().querySelectorAll('span span')].filter(
      (span) => span.getBoundingClientRect().width > 1,
    );
    expect(visible.map((span) => span.textContent)).toEqual(['Лист ожидания']);
    expect(visible[0]?.getAttribute('aria-hidden')).toBe('true');
    // Кнопка меню не заходит в поле страницы (16 px) и не выталкивается за экран.
    for (const width of [360, 390]) {
      await page.viewport(width, 740);
      const menu = screen.getByRole('button', { name: 'Меню' }).element();
      expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(width - 16);
    }
  });
});
