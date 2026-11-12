import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { PhotoTape } from './PhotoTape';

describe('PhotoTape', () => {
  it('shows the initial on kraft while there is no photo', async () => {
    const screen = await render(<PhotoTape name="андрей" sizes="170px" className="w-[170px]" />);
    const initial = screen.getByText('А').element();

    expect(initial.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(initial.parentElement ?? initial).backgroundColor).toBe(
      'rgb(233, 223, 199)',
    );
    expect(screen.container.querySelector('img')).toBeNull();
  });

  it('frames the photo 4:5 in white with an 8 px or 12 px border', async () => {
    const screen = await render(
      <>
        <PhotoTape name="Андрей" sizes="170px" className="w-[170px]" />
        <PhotoTape name="Максим" frame="lg" tilt={1.5} sizes="420px" className="w-[420px]" />
      </>,
    );
    const small = screen.getByText('А').element().closest('[style]');
    const large = screen.getByText('М').element().closest('[style]');
    if (!(small instanceof HTMLElement) || !(large instanceof HTMLElement))
      throw new Error('frame not found');

    expect(getComputedStyle(small).padding).toBe('8px');
    expect(getComputedStyle(large).padding).toBe('12px');
    expect(getComputedStyle(small).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(large).rotate).toBe('1.5deg');
    // Размеры без учёта поворота: getBoundingClientRect дал бы описанный прямоугольник.
    const photo = small.firstElementChild;
    if (!(photo instanceof HTMLElement)) throw new Error('photo box not found');
    expect(photo.offsetWidth / photo.offsetHeight).toBeCloseTo(0.8, 2);
  });

  it('renders the photo with its alt text', async () => {
    const screen = await render(
      <PhotoTape
        name="Андрей"
        photo={{ src: '/tutors/example.jpg', alt: 'Андрей – репетитор по математике' }}
        sizes="170px"
        className="w-[170px]"
      />,
    );

    const image = screen.getByRole('img', { name: 'Андрей – репетитор по математике' });
    await expect.element(image).toHaveAttribute('sizes', '170px');
    await expect.element(image).toHaveAttribute('loading', 'lazy');
  });

  it('loads the first-screen photo eagerly with preload', async () => {
    const screen = await render(
      <PhotoTape
        name="Андрей"
        photo={{ src: '/tutors/example.jpg', alt: 'Андрей' }}
        sizes="420px"
        preload
      />,
    );

    await expect
      .element(screen.getByRole('img', { name: 'Андрей' }))
      .not.toHaveAttribute('loading', 'lazy');
  });
});
