import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { LegalPage } from './LegalPage';
import { legalComponents } from './prose';

const { h2: H2, p: P } = legalComponents;

const HEADINGS = [
  { id: 'obshchie-polozheniya', title: '1. Общие положения' },
  { id: 'prava-subekta', title: '4. Права субъекта' },
];

function Policy({ headings = HEADINGS }: { headings?: typeof HEADINGS }) {
  return (
    <LegalPage
      title="Политика обработки персональных данных"
      effectiveDate={{ label: '1 декабря 2026', dateTime: '2026-12-01' }}
      headings={headings}
    >
      <H2>1. Общие положения</H2>
      <P>1.1. Первый пункт.</P>
      <P>2 раза в год – не пункт.</P>
      <H2>4. Права субъекта</H2>
    </LegalPage>
  );
}

describe('LegalPage', () => {
  it('shows the title, the effective date and anchored section headings', async () => {
    const screen = await render(<Policy />);

    await expect
      .element(screen.getByRole('heading', { level: 1 }))
      .toHaveTextContent('Политика обработки персональных данных');
    await expect
      .element(screen.getByText('1 декабря 2026'))
      .toHaveAttribute('datetime', '2026-12-01');
    await expect
      .element(screen.getByRole('heading', { level: 2, name: '4. Права субъекта' }))
      .toHaveAttribute('id', 'prava-subekta');
  });

  it('hangs item numbers like 1.1 but leaves other paragraphs as is', async () => {
    const screen = await render(<Policy />);

    const number = screen.getByText('1.1.', { exact: true });
    await expect.element(number).toBeVisible();
    expect(number.element().nextSibling?.textContent).toBe('Первый пункт.');
    await expect.element(screen.getByText('2 раза в год – не пункт.')).toBeVisible();
  });

  it('collapses the table of contents above the text on a phone', async () => {
    await page.viewport(360, 800);
    const screen = await render(<Policy />);
    const details = screen.container.querySelector('details');
    const summary = details?.querySelector('summary');
    if (!details || !summary) throw new Error('no collapsed table of contents');

    expect(details.open).toBe(false);
    await page.elementLocator(summary).click();
    expect(details.open).toBe(true);
    await expect
      .element(
        screen
          .getByRole('navigation', { name: 'Содержание' })
          .getByRole('link', { name: '4. Права субъекта' }),
      )
      .toHaveAttribute('href', '#prava-subekta');
  });

  it('keeps the table of contents on the left on a desktop', async () => {
    await page.viewport(1280, 800);
    const screen = await render(<Policy />);
    const toc = screen.getByRole('navigation', { name: 'Содержание' });

    await expect.element(toc).toBeVisible();
    expect(getComputedStyle(toc.element()).position).toBe('sticky');
    await expect.element(toc.getByRole('link')).toHaveLength(2);
  });

  it('has no table of contents without sections', async () => {
    await page.viewport(1280, 800);
    const screen = await render(<Policy headings={[]} />);

    expect(screen.container.querySelector('nav')).toBeNull();
    expect(screen.container.querySelector('details')).toBeNull();
  });
});
