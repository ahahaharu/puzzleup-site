import type { Metadata } from 'next';
import { Golos_Text, Spectral, Unbounded } from 'next/font/google';
import type { ReactNode } from 'react';

import { getSite } from '@/content';
import { Analytics } from '@/features/analytics/Analytics';
import { CookieBanner } from '@/features/analytics/CookieBanner';
import { resolveAnalytics } from '@/lib/analytics';

import '@/styles/globals.css';

// Шрифты – docs/design-system.md, разделы 2 и 8. Preload – только у Unbounded и Golos Text.
const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-unbounded',
});

const golos = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-golos',
});

const spectral = Spectral({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  style: 'italic',
  display: 'swap',
  variable: '--font-spectral',
  preload: false,
});

// Полные адреса canonical, `og:url` и `og:image` – от боевого адреса из `site.json` (ADR-055).
// Остальное – у страниц (`pageMetadata`).
export const metadata: Metadata = {
  metadataBase: new URL(getSite().url),
  title: getSite().name,
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const site = getSite();
  return (
    <html
      lang="ru"
      // Плавная прокрутка из globals.css – только для якорей; при переходах между страницами Next её отключает.
      data-scroll-behavior="smooth"
      className={`${unbounded.variable} ${golos.variable} ${spectral.variable}`}
    >
      <body>
        {children}
        {/* Без Метрики cookie для статистики нет – и спрашивать не о чем (ADR-056). */}
        {site.analytics?.metrika && <CookieBanner {...site.cookieBanner} />}
        <Analytics siteUrl={site.url} {...resolveAnalytics(site.analytics)} />
      </body>
    </html>
  );
}
