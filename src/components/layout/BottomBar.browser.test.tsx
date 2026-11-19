import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { BottomBar } from './BottomBar';

const CTA = { label: 'Выбрать репетитора', href: '#tutors' };

function Page({ withSections = true }: { withSections?: boolean }) {
  return (
    <>
      {withSections && (
        <>
          <section id="top" style={{ height: 800 }} />
          <div style={{ height: 1500 }} />
          <section id="tutors" style={{ height: 800 }} />
        </>
      )}
      <div style={{ height: 3000 }} />
      <BottomBar cta={CTA} showAfter="top" hideWhenVisible="tutors" />
    </>
  );
}

const bar = () => document.querySelector<HTMLElement>('[inert], [data-visible]')!;
const isShown = () => bar().hasAttribute('data-visible') && !bar().inert;

async function scrollToY(top: number) {
  window.scrollTo({ top, behavior: 'instant' });
  // IntersectionObserver сообщает о пересечениях к следующему кадру.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

afterEach(async () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  await page.viewport(360, 740);
});

describe('BottomBar', () => {
  it('is hidden and inert while the first screen is visible', async () => {
    await render(<Page />);

    await expect.poll(isShown).toBe(false);
    expect(bar().inert).toBe(true);
  });

  it('appears once the first screen has gone up', async () => {
    const screen = await render(<Page />);

    await scrollToY(1000);

    await expect.poll(isShown).toBe(true);
    await expect.element(screen.getByRole('link', { name: 'Выбрать репетитора' })).toBeVisible();
  });

  it('hides while the tutors block is visible', async () => {
    await render(<Page />);
    await scrollToY(1000);
    await expect.poll(isShown).toBe(true);

    await scrollToY(2100);

    await expect.poll(isShown).toBe(false);
  });

  it('is shown at once on a page without the first screen', async () => {
    await render(<Page withSections={false} />);

    await expect.poll(isShown).toBe(true);
  });

  it('hides while the mobile menu is open', async () => {
    await render(
      <>
        <Page withSections={false} />
        <dialog id="site-menu" />
      </>,
    );
    await expect.poll(isShown).toBe(true);

    document.querySelector('dialog')!.showModal();

    expect(getComputedStyle(bar()).display).toBe('none');
  });

  it('is not shown on a desktop', async () => {
    await page.viewport(1280, 800);
    await render(<Page withSections={false} />);

    expect(getComputedStyle(bar()).display).toBe('none');
  });

  it('adds the tutor Telegram button on a tutor page', async () => {
    const screen = await render(
      <BottomBar
        cta={{ label: 'Записаться к Андрею', href: '/tutors/andrei?entry=bottom_bar#lead' }}
        telegram={{ value: 'example_andrei', nameDative: 'Андрею' }}
        showAfter="top"
        hideWhenVisible="lead"
      />,
    );

    await expect
      .element(screen.getByRole('link', { name: 'Написать Андрею в Telegram' }))
      .toHaveAttribute('href', 'https://t.me/example_andrei');
  });
});
