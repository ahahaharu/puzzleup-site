import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { CONSENT_KEY, resetConsentForTests } from './consent';
import { CookieBanner } from './CookieBanner';
import { CookieSettingsButton } from './CookieSettingsButton';

const TEXT = 'Сайт использует cookie для статистики: по ним видно, какие страницы читают чаще.';

function renderBanner() {
  return render(
    <>
      <CookieSettingsButton />
      <CookieBanner text={TEXT} policyLinkLabel="Политике cookie" />
    </>,
  );
}

const banner = () => document.querySelector('[data-cookie-banner]');

beforeEach(() => {
  window.localStorage.clear();
  resetConsentForTests();
});

afterEach(async () => {
  await page.viewport(360, 740);
});

describe('CookieBanner', () => {
  it('asks until a choice is made, with the policy link', async () => {
    const screen = await renderBanner();

    await expect
      .element(screen.getByRole('region'))
      .toHaveAccessibleName(`${TEXT} Подробнее – в Политике cookie.`);
    await expect
      .element(screen.getByRole('link', { name: 'Политике cookie' }))
      .toHaveAttribute('href', '/cookies');
  });

  it('gives both buttons the same size and weight', async () => {
    for (const width of [360, 390, 1280]) {
      await page.viewport(width, 800);
      const screen = await renderBanner();
      const accept = screen.getByRole('button', { name: 'Принять' }).element();
      const decline = screen.getByRole('button', { name: 'Отклонить' }).element();

      expect(accept.className).toBe(decline.className);
      expect(accept.getBoundingClientRect().width).toBe(decline.getBoundingClientRect().width);
      expect(accept.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
      expect(decline.scrollWidth).toBeLessThanOrEqual(decline.clientWidth);
      await screen.unmount();
    }
  });

  it('spans the phone width and is a 560 px card at the bottom left on desktop', async () => {
    await page.viewport(390, 800);
    let screen = await renderBanner();
    expect(banner()!.getBoundingClientRect()).toMatchObject({ left: 0, width: 390, bottom: 800 });
    await screen.unmount();

    await page.viewport(1280, 800);
    screen = await renderBanner();
    expect(banner()!.getBoundingClientRect()).toMatchObject({ left: 24, width: 560, bottom: 776 });
  });

  it.each([
    ['Принять', 'accepted'],
    ['Отклонить', 'declined'],
  ])('remembers «%s» and hides', async (label, stored) => {
    const screen = await renderBanner();

    await screen.getByRole('button', { name: label }).click();

    expect(banner()).toBeNull();
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe(stored);
  });

  it('stays hidden after a remembered choice and reopens from the settings button', async () => {
    window.localStorage.setItem(CONSENT_KEY, 'declined');
    const screen = await renderBanner();
    expect(banner()).toBeNull();

    const settings = screen.getByRole('button', { name: 'Настройки cookie' });
    await settings.click();

    await expect.element(screen.getByRole('button', { name: 'Принять' })).toHaveFocus();
    await screen.getByRole('button', { name: 'Принять' }).click();
    expect(banner()).toBeNull();
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe('accepted');
    await expect.element(settings).toHaveFocus();
  });
});
