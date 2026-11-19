import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { Hero } from './Hero';
import { HERO_ILLUSTRATION_LABEL } from './HeroIllustration';
import { HERO_FACTS, HERO_LEAD, HERO_NOTE } from './texts';

const BADGE = 'Онлайн-репетиторы по математике для 5–11 классов: Андрей и Максим';

const renderHero = () => render(<Hero badge={BADGE} slogan="Всё сложится." />);

/** Свойства, которые анимации разрешено менять (ДС, раздел 7), плюс служебные поля кадра. */
const ALLOWED_KEYFRAME_KEYS = new Set([
  'transform',
  'opacity',
  'offset',
  'computedOffset',
  'easing',
  'composite',
]);

describe('Hero', () => {
  it('makes the badge the only heading and keeps the slogan a paragraph', async () => {
    const screen = await renderHero();

    await expect.element(screen.getByRole('heading', { level: 1, name: BADGE })).toBeVisible();
    expect(screen.container.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(1);

    const slogan = screen.getByText('сложится.', { exact: true });
    await expect.element(slogan).toBeVisible();
    expect(slogan.element().closest('p')).not.toBeNull();
    const dot = slogan.element().querySelector('span');
    expect(dot?.textContent).toBe('.');
    expect(getComputedStyle(dot ?? document.body).color).toBe('rgb(228, 87, 46)');
  });

  it('keeps the grade range on one line', async () => {
    const screen = await renderHero();
    const range = screen.getByText('5–11', { exact: true });

    expect(getComputedStyle(range.element()).whiteSpace).toBe('nowrap');
  });

  it('shows the lead, the footnote and a 56 px button to the tutors block', async () => {
    const screen = await renderHero();

    await expect.element(screen.getByText(HERO_LEAD)).toBeVisible();
    await expect.element(screen.getByText(HERO_NOTE)).toBeVisible();
    expect(
      Number.parseFloat(getComputedStyle(screen.getByText(HERO_NOTE).element()).fontSize),
    ).toBe(14);

    const button = screen.getByRole('link', { name: 'Выбрать репетитора' });
    await expect.element(button).toHaveAttribute('href', '#tutors');
    expect(button.element().getBoundingClientRect().height).toBe(56);
  });

  it('stretches the button to the full width on phones only', async () => {
    await page.viewport(360, 740);
    const screen = await renderHero();
    const button = screen.getByRole('link', { name: 'Выбрать репетитора' }).element();
    const lead = screen.getByText(HERO_LEAD).element();

    expect(button.getBoundingClientRect().width).toBe(lead.getBoundingClientRect().width);

    await page.viewport(1280, 800);
    expect(button.getBoundingClientRect().width).toBeLessThan(400);
  });

  it('describes the illustration for screen readers', async () => {
    const screen = await renderHero();

    await expect
      .element(screen.getByRole('img', { name: HERO_ILLUSTRATION_LABEL }))
      .toBeInTheDocument();
  });

  it('lists three facts with numbers hidden from screen readers', async () => {
    const screen = await renderHero();
    const items = screen.getByRole('listitem').elements();

    expect(items.map((item) => item.textContent)).toEqual(
      HERO_FACTS.map((fact, index) => `0${index + 1}${fact}`),
    );
    for (const item of items) {
      expect(item.querySelector('[aria-hidden="true"]')?.textContent).toMatch(/^0[1-3]$/);
    }
  });

  it('hides margin notes on phones and shows them on desktop', async () => {
    await page.viewport(360, 740);
    const screen = await renderHero();
    const notes = [...screen.container.querySelectorAll('span[aria-hidden="true"]')].filter(
      (note) => note.textContent.includes('='),
    );

    expect(notes.length).toBeGreaterThanOrEqual(2);
    expect(notes.every((note) => getComputedStyle(note).display === 'none')).toBe(true);

    await page.viewport(1280, 800);
    expect(notes.every((note) => getComputedStyle(note).display !== 'none')).toBe(true);
  });

  it('lands the accent piece once, animating only transform and opacity', async () => {
    const screen = await renderHero();
    const animations = screen.container
      .querySelector('svg[role="img"]')
      ?.getAnimations({ subtree: true });

    expect(animations?.length).toBeGreaterThan(0);
    for (const animation of animations ?? []) {
      expect(animation.effect?.getTiming().iterations).toBe(1);
      expect(animation.effect?.getTiming().duration).toBe(600);
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- у AnimationEffect нет getKeyframes, он есть у KeyframeEffect
      const keyframes = (animation.effect as KeyframeEffect).getKeyframes();
      for (const key of keyframes.flatMap((frame) => Object.keys(frame))) {
        expect(ALLOWED_KEYFRAME_KEYS).toContain(key);
      }
    }
  });
});
