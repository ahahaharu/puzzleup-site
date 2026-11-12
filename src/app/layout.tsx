import type { Metadata } from 'next';
import { Golos_Text, Spectral, Unbounded } from 'next/font/google';
import type { ReactNode } from 'react';

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

export const metadata: Metadata = {
  title: 'PuzzleUp',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${golos.variable} ${spectral.variable}`}>
      <body>{children}</body>
    </html>
  );
}
