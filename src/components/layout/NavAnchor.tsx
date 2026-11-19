import Link from 'next/link';
import type { ReactNode } from 'react';

type NavAnchorProps = {
  href: string;
  className?: string | undefined;
  'aria-current'?: 'location' | undefined;
  children: ReactNode;
};

/** Ссылка пункта навигации: якорь своей страницы (`#how`) – обычная `<a>`, другая страница – next/link. */
export function NavAnchor({ href, className, 'aria-current': current, children }: NavAnchorProps) {
  return href.startsWith('/') ? (
    <Link href={href} className={className} aria-current={current}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className} aria-current={current}>
      {children}
    </a>
  );
}
