import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';

import { ChoiceChip } from './ChoiceChip';

function checkMark(label: Element) {
  const svg = label.querySelector('svg');
  return svg ? getComputedStyle(svg).display : 'missing';
}

describe('ChoiceChip', () => {
  it('is a 44 px high label around a native input', async () => {
    const screen = await render(
      <ChoiceChip type="radio" name="contact" value="telegram">
        Telegram
      </ChoiceChip>,
    );
    const radio = screen.getByRole('radio', { name: 'Telegram' });

    await expect.element(radio).not.toBeChecked();
    const label = radio.element().closest('label');
    expect(label?.getBoundingClientRect().height).toBe(44);
  });

  it('selects one radio in a group and shows the check mark only on the selected chip', async () => {
    const screen = await render(
      <form>
        <ChoiceChip type="radio" name="contact" value="telegram">
          Telegram
        </ChoiceChip>
        <ChoiceChip type="radio" name="contact" value="viber">
          Viber
        </ChoiceChip>
      </form>,
    );
    const telegram = screen.getByRole('radio', { name: 'Telegram' });
    const viber = screen.getByRole('radio', { name: 'Viber' });

    await screen.getByText('Telegram').click();
    await expect.element(telegram).toBeChecked();

    await screen.getByText('Viber').click();
    await expect.element(viber).toBeChecked();
    await expect.element(telegram).not.toBeChecked();

    const telegramLabel = telegram.element().closest('label');
    const viberLabel = viber.element().closest('label');
    if (!telegramLabel || !viberLabel) throw new Error('chip label not found');
    expect(checkMark(viberLabel)).toBe('block');
    expect(checkMark(telegramLabel)).toBe('none');
    // Выбранный – заливка ink.
    expect(getComputedStyle(viberLabel).backgroundColor).toBe('rgb(29, 35, 64)');
  });

  it('is operated from the keyboard with a visible focus ring on the chip', async () => {
    const screen = await render(
      <ChoiceChip type="checkbox" name="subject" value="math">
        Математика
      </ChoiceChip>,
    );

    await userEvent.tab();
    const checkbox = screen.getByRole('checkbox', { name: 'Математика' });
    await expect.element(checkbox).toHaveFocus();

    const label = checkbox.element().closest('label');
    if (!label) throw new Error('chip label not found');
    const ring = getComputedStyle(label);
    expect(ring.outlineStyle).toBe('solid');
    expect(ring.outlineWidth).toBe('2px');
    expect(ring.outlineColor).toBe('rgb(58, 111, 216)');

    await userEvent.keyboard(' ');
    await expect.element(checkbox).toBeChecked();
  });

  it('allows several checkboxes at once', async () => {
    const screen = await render(
      <>
        <ChoiceChip type="checkbox" name="time" value="morning">
          Утром
        </ChoiceChip>
        <ChoiceChip type="checkbox" name="time" value="evening">
          Вечером
        </ChoiceChip>
      </>,
    );

    await screen.getByText('Утром').click();
    await screen.getByText('Вечером').click();

    await expect.element(screen.getByRole('checkbox', { name: 'Утром' })).toBeChecked();
    await expect.element(screen.getByRole('checkbox', { name: 'Вечером' })).toBeChecked();
  });

  it('inverts on the dark form: selected chip is filled with paper', async () => {
    const screen = await render(
      <ChoiceChip type="radio" name="grade" value="10" tone="dark" defaultChecked>
        10
      </ChoiceChip>,
    );
    const label = screen.getByRole('radio', { name: '10' }).element().closest('label');
    if (!label) throw new Error('chip label not found');

    expect(getComputedStyle(label).backgroundColor).toBe('rgb(247, 244, 236)');
    expect(getComputedStyle(label).color).toBe('rgb(29, 35, 64)');
  });
});
