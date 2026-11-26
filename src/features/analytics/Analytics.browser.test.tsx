import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Analytics } from './Analytics';
import { choose, CONSENT_KEY, resetConsentForTests } from './consent';
import { forgetMetrika, loadMetrika, metrikaHit } from './metrika';
import { loadUmami } from './umami';

const navigation = vi.hoisted(() => ({ pathname: '/' }));

vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }));
// Внешние скрипты в тестах не грузятся: проверяется только, что их подключают.
vi.mock('./metrika', () => ({ loadMetrika: vi.fn(), metrikaHit: vi.fn(), forgetMetrika: vi.fn() }));
vi.mock('./umami', () => ({ loadUmami: vi.fn() }));

const UMAMI = {
  scriptUrl: 'https://stats.example.by/script.js',
  websiteId: '0b6f5b37-8f8a-4c47-9b4a-0d3f3c6e2a11',
};
const COUNTER = 12345678;

function renderAnalytics(siteUrl = window.location.origin) {
  return render(<Analytics siteUrl={siteUrl} umami={UMAMI} metrikaId={COUNTER} />);
}

beforeEach(() => {
  window.localStorage.clear();
  resetConsentForTests();
  navigation.pathname = '/';
  vi.clearAllMocks();
});

describe('Analytics', () => {
  it('loads Umami without consent and Metrika only after «Принять»', async () => {
    await renderAnalytics();

    expect(loadUmami).toHaveBeenCalledWith(UMAMI);
    expect(loadMetrika).not.toHaveBeenCalled();

    choose('all');
    await vi.waitFor(() => expect(loadMetrika).toHaveBeenCalledWith(COUNTER));
  });

  it('never loads Metrika after «Только необходимые»', async () => {
    window.localStorage.setItem(CONSENT_KEY, 'necessary');
    await renderAnalytics();

    expect(loadUmami).toHaveBeenCalledOnce();
    expect(loadMetrika).not.toHaveBeenCalled();
  });

  it('loads Metrika at once when consent was given earlier', async () => {
    window.localStorage.setItem(CONSENT_KEY, 'all');
    await renderAnalytics();

    await vi.waitFor(() => expect(loadMetrika).toHaveBeenCalledOnce());
  });

  it('counts nothing outside the production address', async () => {
    window.localStorage.setItem(CONSENT_KEY, 'all');
    await renderAnalytics('https://puzzle-up.by');

    expect(loadUmami).not.toHaveBeenCalled();
    expect(loadMetrika).not.toHaveBeenCalled();
  });

  it('forgets Metrika when consent is withdrawn', async () => {
    window.localStorage.setItem(CONSENT_KEY, 'all');
    await renderAnalytics();
    await vi.waitFor(() => expect(loadMetrika).toHaveBeenCalledOnce());

    choose('necessary');

    await vi.waitFor(() => expect(forgetMetrika).toHaveBeenCalledOnce());
  });

  it('sends a Metrika hit on navigation inside the site', async () => {
    window.localStorage.setItem(CONSENT_KEY, 'all');
    const screen = await renderAnalytics();
    await vi.waitFor(() => expect(loadMetrika).toHaveBeenCalledOnce());
    const before = window.location.href;
    expect(metrikaHit).not.toHaveBeenCalled();

    window.history.pushState(null, '', '/tutors/andrei');
    navigation.pathname = '/tutors/andrei';
    await screen.rerender(<Analytics siteUrl={window.location.origin} metrikaId={COUNTER} />);

    expect(metrikaHit).toHaveBeenCalledWith(COUNTER, window.location.href, before);
    window.history.pushState(null, '', before);
  });
});
