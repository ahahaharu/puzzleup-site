import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { NotFound } from './NotFound';

describe('NotFound', () => {
  it('leads back to the home page and to the tutors block with entry=404', async () => {
    const screen = await render(<NotFound />);

    await expect
      .element(screen.getByRole('heading', { level: 1 }))
      .toHaveTextContent('Этой детали здесь нет');
    await expect
      .element(screen.getByRole('link', { name: 'На главную' }))
      .toHaveAttribute('href', '/');
    await expect
      .element(screen.getByRole('link', { name: 'Выбрать репетитора' }))
      .toHaveAttribute('href', '/?entry=404#tutors');
    await expect
      .element(screen.getByRole('img', { name: 'Пазл из четырёх деталей, одной не хватает' }))
      .toBeVisible();
  });
});
