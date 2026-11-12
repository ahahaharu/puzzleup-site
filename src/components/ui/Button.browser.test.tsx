import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';

import { Button, LOADING_LABEL } from './Button';

describe('Button', () => {
  it('renders a button of type "button" without href', async () => {
    const screen = await render(<Button>Записаться</Button>);
    const button = screen.getByRole('button', { name: 'Записаться' });

    await expect.element(button).toHaveAttribute('type', 'button');
  });

  it('renders an internal link through next/link and an anchor link as <a>', async () => {
    const screen = await render(
      <>
        <Button href="/tutors/andrei#lead">Записаться к Андрею</Button>
        <Button href="#lead" variant="secondary">
          К форме
        </Button>
      </>,
    );

    await expect
      .element(screen.getByRole('link', { name: 'Записаться к Андрею' }))
      .toHaveAttribute('href', '/tutors/andrei#lead');
    await expect
      .element(screen.getByRole('link', { name: 'К форме' }))
      .toHaveAttribute('href', '#lead');
  });

  it('is 56 px high in size lg and 48 px in size md', async () => {
    const screen = await render(
      <>
        <Button>Большая</Button>
        <Button size="md">Средняя</Button>
      </>,
    );

    const large = screen.getByRole('button', { name: 'Большая' }).element();
    const medium = screen.getByRole('button', { name: 'Средняя' }).element();
    expect(large.getBoundingClientRect().height).toBe(56);
    expect(medium.getBoundingClientRect().height).toBe(48);
  });

  it('fades to 40 % when disabled', async () => {
    const screen = await render(<Button disabled>Записаться</Button>);
    const button = screen.getByRole('button', { name: 'Записаться' });

    await expect.element(button).toBeDisabled();
    expect(getComputedStyle(button.element()).opacity).toBe('0.4');
  });

  it('shows the spinner and "Отправляем…" while loading and cannot be pressed again', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const onClick = vi.fn();
    const screen = await render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <input name="name" aria-label="Имя" />
        <input name="phone" aria-label="Телефон" />
        <Button type="submit" variant="accent" loading onClick={onClick}>
          Записаться на пробное занятие
        </Button>
      </form>,
    );
    const button = screen.getByRole('button', { name: LOADING_LABEL });

    await expect.element(button).toHaveAttribute('aria-disabled', 'true');
    // Фокус остаётся на кнопке – в отличие от disabled.
    expect(button.element().hasAttribute('disabled')).toBe(false);
    expect(button.element().querySelector('[aria-hidden="true"]')).not.toBeNull();

    // Мышью не нажать (pointer-events), поэтому клик – через DOM, как клавиатурой.
    const element = button.element();
    if (element instanceof HTMLElement) element.click();
    // Enter в поле формы – неявная отправка.
    await screen.getByRole('textbox', { name: 'Имя' }).click();
    await userEvent.keyboard('{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('submits the form when not loading', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const screen = await render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <Button type="submit">Отправить</Button>
      </form>,
    );

    await screen.getByRole('button', { name: 'Отправить' }).click();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('puts the icon before the label and hides it from screen readers', async () => {
    const screen = await render(
      <Button href="https://t.me/example" variant="secondary" icon="telegram">
        Telegram
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Telegram' }).element();

    expect(link.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    expect(link.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
});
