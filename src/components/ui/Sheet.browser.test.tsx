import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { Sheet, type SheetKind } from './Sheet';

describe('Sheet', () => {
  it.each<SheetKind>(['cell', 'mm', 'lined', 'slanted', 'staff', 'margin', 'plain'])(
    'draws "%s" paper without images',
    async (kind) => {
      const screen = await render(<Sheet kind={kind}>Математика</Sheet>);
      const paper = screen.getByText('Математика').element();
      const backgroundImage = getComputedStyle(paper).backgroundImage;

      expect(backgroundImage).not.toContain('url(');
      if (kind !== 'plain') expect(backgroundImage).toContain('linear-gradient');
    },
  );

  it('starts lined text right of the red margin', async () => {
    const screen = await render(<Sheet kind="lined">Другой предмет</Sheet>);

    expect(getComputedStyle(screen.getByText('Другой предмет').element()).paddingLeft).toBe('72px');
  });

  it('tilts by the given angle and hides the folded corner from screen readers', async () => {
    const screen = await render(
      <Sheet tilt={-1} as="article">
        Физика
      </Sheet>,
    );
    const sheet = screen.getByRole('article').element();

    expect(getComputedStyle(sheet).rotate).toBe('-1deg');
    const corner = sheet.querySelector('[aria-hidden="true"]');
    if (!(corner instanceof HTMLElement)) throw new Error('folded corner not found');
    expect(corner.offsetWidth).toBe(26);
  });
});
