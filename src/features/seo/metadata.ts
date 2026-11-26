import type { Metadata } from 'next';

// Метатеги страницы – ТЗ страницы репетитора, раздел 6. Next склеивает `openGraph` родителя
// и страницы не по полям, а целиком: общие поля повторяются здесь. Адреса относительные,
// полными их делает `metadataBase` корневого layout (`site.url`).

type PageMeta = {
  siteName: string;
  /** Адрес страницы от корня: `/tutors/andrei`. */
  path: string;
  title: string;
  description?: string;
};

export function pageMetadata({ siteName, path, title, description }: PageMeta): Metadata {
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
    },
  };
}
