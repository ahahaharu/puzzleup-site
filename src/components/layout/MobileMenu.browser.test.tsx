import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import { CTA, HOURS_LINE, LINKS, TUTORS } from './fixtures';
import { MobileMenu } from './MobileMenu';

async function renderMenu() {
  const screen = await render(
    <MobileMenu links={LINKS} cta={CTA} tutors={TUTORS} hoursLine={HOURS_LINE} />,
  );
  const dialog = () => document.querySelector('dialog')!;
  return { screen, dialog, burger: screen.getByRole('button', { name: 'Меню' }) };
}

afterEach(async () => {
  await page.viewport(360, 740);
});

describe('MobileMenu', () => {
  it('opens as a modal, moves focus inside and locks page scroll', async () => {
    const { screen, dialog, burger } = await renderMenu();

    await burger.click();

    expect(dialog().open).toBe(true);
    expect(dialog().matches(':modal')).toBe(true);
    await expect.element(screen.getByRole('button', { name: 'Закрыть меню' })).toHaveFocus();
    expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');
    expect(dialog().getBoundingClientRect()).toMatchObject({ width: 360, height: 740 });
  });

  it('lists navigation, the main button, tutor messengers and response hours', async () => {
    const { screen, burger } = await renderMenu();
    await burger.click();

    const items = screen.getByRole('dialog', { name: 'Меню' }).getByRole('listitem');
    expect(items.elements().length).toBeGreaterThan(5);
    for (const link of LINKS) {
      const item = screen.getByRole('link', { name: link.label, exact: true });
      await expect.element(item).toHaveAttribute('href', link.href);
      expect(item.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(56);
    }
    await expect
      .element(screen.getByRole('link', { name: 'Выбрать репетитора' }))
      .toHaveAttribute('href', '#tutors');
    await expect
      .element(screen.getByRole('link', { name: 'Написать Максиму в Viber' }))
      .toHaveAttribute('href', 'viber://chat?number=%2B375290000002');
    await expect.element(screen.getByText(HOURS_LINE)).toBeVisible();
  });

  it('lets the items rise one after another, moving only opacity and transforms', async () => {
    const { dialog, burger } = await renderMenu();
    await burger.click();

    const transitions = dialog()
      .getAnimations({ subtree: true })
      .filter((animation) => animation instanceof CSSTransition);
    expect(new Set(transitions.map(({ transitionProperty }) => transitionProperty))).toEqual(
      new Set(['opacity', 'translate', 'rotate']),
    );
    const delays = [...dialog().querySelectorAll('nav li')].map(
      (item) => getComputedStyle(item).transitionDelay,
    );
    expect(delays).toEqual(LINKS.map((_, index) => `${0.06 + index * 0.04}s`));
  });

  it('closes with Escape and returns focus to the burger', async () => {
    const { dialog, burger } = await renderMenu();
    await burger.click();

    await userEvent.keyboard('{Escape}');

    expect(dialog().open).toBe(false);
    await expect.element(burger).toHaveFocus();
    expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden');
  });

  it('closes with the close button', async () => {
    const { screen, dialog, burger } = await renderMenu();
    await burger.click();

    await screen.getByRole('button', { name: 'Закрыть меню' }).click();

    expect(dialog().open).toBe(false);
  });

  it('closes after following a navigation item', async () => {
    const { screen, dialog, burger } = await renderMenu();
    await burger.click();

    await screen.getByRole('link', { name: 'Цены', exact: true }).click();

    expect(dialog().open).toBe(false);
  });

  it('closes when the screen becomes desktop-wide', async () => {
    const { dialog, burger } = await renderMenu();
    await burger.click();

    await page.viewport(1280, 800);

    await expect.poll(() => dialog().open).toBe(false);
  });

  it('hides tutor rows and hours without tutors', async () => {
    const screen = await render(
      <MobileMenu links={LINKS} cta={CTA} tutors={[]} hoursLine={HOURS_LINE} />,
    );
    await screen.getByRole('button', { name: 'Меню' }).click();

    await expect.element(screen.getByText(HOURS_LINE)).not.toBeInTheDocument();
  });
});
