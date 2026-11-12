import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { Field } from './Field';

describe('Field', () => {
  it('labels a 52 px input with 16 px text', async () => {
    const screen = await render(
      <Field id="name" name="name" label="Имя родителя" autoComplete="name" />,
    );
    const input = screen.getByRole('textbox', { name: 'Имя родителя' });

    await expect.element(input).toHaveAttribute('autocomplete', 'name');
    await expect.element(input).not.toHaveAttribute('aria-invalid');
    await expect.element(input).not.toHaveAttribute('aria-describedby');
    expect(input.element().getBoundingClientRect().height).toBe(52);
    expect(getComputedStyle(input.element()).fontSize).toBe('16px');
  });

  it('describes the input with its hint', async () => {
    const screen = await render(
      <Field
        id="comment"
        label="Комментарий"
        hint="Не указывайте сведения о здоровье ребёнка"
        multiline
      />,
    );
    const textarea = screen.getByRole('textbox', { name: 'Комментарий' });

    expect(textarea.element().tagName.toLowerCase()).toBe('textarea');
    await expect
      .element(textarea)
      .toHaveAccessibleDescription('Не указывайте сведения о здоровье ребёнка');
  });

  it('marks an error with aria-invalid, an icon, text and a 2 px border', async () => {
    const screen = await render(
      <Field
        id="phone"
        type="tel"
        label="Телефон"
        hint="Мобильный номер"
        error="Укажите номер телефона"
        tone="dark"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Телефон' });

    await expect.element(input).toHaveAttribute('aria-invalid', 'true');
    await expect
      .element(input)
      .toHaveAccessibleDescription('Мобильный номер Укажите номер телефона');

    const style = getComputedStyle(input.element());
    expect(style.borderTopWidth).toBe('2px');
    // На тёмной форме – error-light.
    expect(style.borderTopColor).toBe('rgb(255, 180, 168)');

    const error = screen.getByText('Укажите номер телефона').element();
    expect(error.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(getComputedStyle(error).color).toBe('rgb(255, 180, 168)');
  });

  it('uses the error token on light backgrounds', async () => {
    const screen = await render(
      <Field id="name" label="Имя" error="Укажите, как к вам обращаться" />,
    );

    const error = screen.getByText('Укажите, как к вам обращаться').element();
    expect(getComputedStyle(error).color).toBe('rgb(179, 38, 30)');
  });
});
