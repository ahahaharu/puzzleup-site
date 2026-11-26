import type { Metadata } from 'next';

// Метатеги страницы – ТЗ страницы репетитора, раздел 6. Next склеивает `openGraph` родителя
// и страницы не по полям, а целиком: общие поля повторяются здесь. Адреса относительные,
// полными их делает `metadataBase` корневого layout (`site.url`).

/** Размер OG-картинок – 1200×630 (ТЗ страницы репетитора, раздел 6). */
export const OG_SIZE = { width: 1200, height: 630 };

/** Картинка главной (`src/app/opengraph-image.tsx`) – для страниц без своей. */
export const HOME_OG_PATH = '/opengraph-image';

type PageMeta = {
  siteName: string;
  /** Адрес страницы от корня: `/tutors/andrei`. */
  path: string;
  title: string;
  description?: string;
  /**
   * Картинка из другого маршрута. Без неё страница своим `openGraph` теряет картинку родителя:
   * файл `opengraph-image` действует только в своём сегменте, а `openGraph` не склеивается.
   */
  image?: { url: string; alt: string };
};

export function pageMetadata({ siteName, path, title, description, image }: PageMeta): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName,
      url: path,
      title,
      ...(description ? { description } : {}),
      ...(image ? { images: [{ ...image, ...OG_SIZE, type: 'image/png' }] } : {}),
    },
  };
}
