import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { CTA, HOURS_LINE, LINKS, TUTORS } from './fixtures';
import { Header } from './Header';

function Page({ spy = true }: { spy?: boolean }) {
  return (
    <>
      <Header links={LINKS} spy={spy} cta={CTA} menu={{ tutors: TUTORS, hoursLine: HOURS_LINE }} />
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

  it('does not highlight items on other pages', async () => {
    await page.viewport(1280, 800);
    const screen = await render(<Page spy={false} />);

    document.getElementById('how')!.scrollIntoView({ behavior: 'instant' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect
      .element(screen.getByRole('link', { name: 'Как это работает' }))
      .not.toHaveAttribute('aria-current');
  });
});
