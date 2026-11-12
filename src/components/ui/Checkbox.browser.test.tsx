import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';

import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('is unchecked by default and toggles by clicking its label text', async () => {
    const screen = await render(<Checkbox id="consent" name="consent" label="Согласен" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Согласен' });

    await expect.element(checkbox).not.toBeChecked();
    await screen.getByText('Согласен').click();
    await expect.element(checkbox).toBeChecked();
  });

  it('has a 24 px box and a click area of at least 44×44', async () => {
    const screen = await render(<Checkbox id="consent" label="Да" />);
    const label = screen.getByRole('checkbox', { name: 'Да' }).element().closest('label');
    if (!label) throw new Error('checkbox label not found');
    const box = label.querySelector('span[aria-hidden="true"]');

    expect(box?.getBoundingClientRect().width).toBe(24);
    expect(box?.getBoundingClientRect().height).toBe(24);
    const area = label.getBoundingClientRect();
    expect(area.height).toBeGreaterThanOrEqual(44);
    expect(area.width).toBeGreaterThanOrEqual(44);
  });

  it('is toggled with Space and shows the focus ring on the box', async () => {
    const screen = await render(<Checkbox id="consent" label="Согласен" />);

    await userEvent.tab();
    const checkbox = screen.getByRole('checkbox', { name: 'Согласен' });
    await expect.element(checkbox).toHaveFocus();
    const box = checkbox.element().closest('label')?.querySelector('span[aria-hidden="true"]');
    if (!box) throw new Error('checkbox box not found');
    expect(getComputedStyle(box).outlineColor).toBe('rgb(58, 111, 216)');
    expect(getComputedStyle(box).outlineWidth).toBe('2px');

    await userEvent.keyboard(' ');
    await expect.element(checkbox).toBeChecked();
  });

  it('describes the checkbox with the small text and the error', async () => {
    const screen = await render(
      <Checkbox
        id="consent"
        label="Согласен на обработку персональных данных"
        description="Операторы – репетиторы сайта."
        error="Без согласия репетиторы не смогут обработать заявку"
        tone="dark"
      />,
    );
    const checkbox = screen.getByRole('checkbox', {
      name: 'Согласен на обработку персональных данных',
    });

    await expect.element(checkbox).toHaveAttribute('aria-invalid', 'true');
    await expect
      .element(checkbox)
      .toHaveAccessibleDescription(
        'Операторы – репетиторы сайта. Без согласия репетиторы не смогут обработать заявку',
      );
    const description = screen.getByText('Операторы – репетиторы сайта.').element();
    expect(getComputedStyle(description).fontSize).toBe('14px');
  });

  it('keeps the checked fill after a server error', async () => {
    const screen = await render(
      <Checkbox
        id="consent"
        label="Согласен"
        tone="dark"
        defaultChecked
        error="Без согласия репетиторы не смогут обработать заявку"
      />,
    );
    const box = screen
      .getByRole('checkbox', { name: 'Согласен' })
      .element()
      .closest('label')
      ?.querySelector('span[aria-hidden="true"]');
    if (!box) throw new Error('checkbox box not found');

    expect(getComputedStyle(box).backgroundColor).toBe('rgb(247, 244, 236)');
    expect(getComputedStyle(box).borderTopColor).toBe('rgb(255, 180, 168)');
  });

  it('puts the small text 6 px under a one-line label and keeps a 44 px target on the box', async () => {
    const screen = await render(
      <div style={{ width: 600 }}>
        <Checkbox id="consent" label="Согласен" description="Мелкий текст." />
      </div>,
    );
    const label = screen.getByRole('checkbox', { name: 'Согласен' }).element().closest('label');
    const box = label?.querySelector('span[aria-hidden="true"]');
    if (!label || !box) throw new Error('checkbox not found');
    const description = screen.getByText('Мелкий текст.').element();

    const gap = description.getBoundingClientRect().top - label.getBoundingClientRect().bottom;
    expect(gap).toBe(6);
    const target = getComputedStyle(box, '::before');
    expect(box.getBoundingClientRect().width + 2 * -Number.parseFloat(target.left)).toBe(44);
    expect(box.getBoundingClientRect().height + 2 * -Number.parseFloat(target.top)).toBe(44);
  });
});
