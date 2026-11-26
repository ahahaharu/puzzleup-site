import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { reveal, STAGGER_MS } from '@/lib/reveal';

import { ScrollReveal } from './ScrollReveal';

const VIEWPORT = { width: 360, height: 740 };

function Page() {
  // Блок, который появляется в разметке после гидратации – как карточки «Репетиторов». Кнопка – на
  // первом экране, чтобы нажатие не прокручивало страницу.
  const [late, setLate] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setLate(true)}>
        Добавить
      </button>
      <div data-testid="first" {...reveal()} style={{ height: 200 }} />
      <div style={{ height: 1200 }} />
      <div style={{ display: 'flex', gap: 16 }}>
        {['a', 'b', 'c'].map((id) => (
          <div key={id} data-testid={id} {...reveal()} style={{ width: 100, height: 200 }} />
        ))}
      </div>
      {late && <div data-testid="late" {...reveal()} style={{ height: 200 }} />}
      <div style={{ height: 2000 }} />
      <ScrollReveal />
    </>
  );
}

const block = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const opacity = (id: string) => getComputedStyle(block(id)).opacity;
const animation = (id: string) => block(id).getAnimations()[0];
const playState = (id: string) => animation(id)?.playState ?? 'none';

async function scrollToY(top: number) {
  window.scrollTo({ top, behavior: 'instant' });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

beforeEach(async () => {
  await page.viewport(VIEWPORT.width, VIEWPORT.height);
  window.scrollTo({ top: 0, behavior: 'instant' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ScrollReveal', () => {
  it('leaves the first screen alone and hides only what is below it', async () => {
    await render(<Page />);

    await expect.poll(() => opacity('a')).toBe('0');
    expect(playState('a')).toBe('paused');
    expect(playState('first')).toBe('none');
    expect(opacity('first')).toBe('1');
  });

  it('does not touch the markup React hydrates', async () => {
    await render(<Page />);
    await expect.poll(() => opacity('a')).toBe('0');

    expect(block('a').getAttributeNames().sort()).toEqual(['data-reveal', 'data-testid', 'style']);
    expect(block('a').getAttribute('style')).toBe('width: 100px; height: 200px;');
  });

  it('reveals a row as it scrolls in, left to right, and ends fully visible', async () => {
    await render(<Page />);
    await expect.poll(() => opacity('a')).toBe('0');

    await scrollToY(900);

    await expect.poll(() => playState('c')).toBe('running');
    expect(['a', 'b', 'c'].map((id) => animation(id)?.effect?.getTiming().delay)).toEqual([
      0,
      STAGGER_MS,
      2 * STAGGER_MS,
    ]);
    await expect.poll(() => opacity('c'), { timeout: 2000 }).toBe('1');
    expect(playState('c')).toBe('none');
  });

  it('picks up blocks added below the window later', async () => {
    const screen = await render(<Page />);
    await expect.poll(() => opacity('a')).toBe('0');

    await screen.getByRole('button', { name: 'Добавить' }).click();

    await expect.poll(() => opacity('late')).toBe('0');
  });

  it('shows everything again when it goes away', async () => {
    const screen = await render(<Page />);
    await expect.poll(() => opacity('a')).toBe('0');
    const element = block('a');

    await screen.unmount();

    expect(element.getAnimations()).toEqual([]);
  });

  it('hides nothing when the visitor asked for reduced motion', async () => {
    const matchMedia = window.matchMedia.bind(window);
    vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
      query === '(prefers-reduced-motion: reduce)'
        ? { ...matchMedia(query), matches: true }
        : matchMedia(query),
    );

    await render(<Page />);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(opacity('a')).toBe('1');
  });
});
