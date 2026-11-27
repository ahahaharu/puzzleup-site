import Link from 'next/link';
import type { ReactNode } from 'react';

import { Logo } from '@/components/ui/Logo';
import { CookieSettingsButton } from '@/features/analytics/CookieSettingsButton';
import { TELEGRAM_LINK_PROPS, telegramUrl, viberUrl } from '@/lib/urls';

import type { NavLink } from './nav';
import { NavAnchor } from './NavAnchor';

// Подвал – ТЗ главной, блок 10; макеты D-10-footer, M-10-footer с поправками из
// docs/design-system.md, раздел 9: раскрытие, «Сайт ведёт», копирайт с ФИО, без почты.

export type FooterTutor = {
  slug: string;
  name: string;
  nameDative: string;
  telegram: string;
  viber: string;
};

type FooterProps = {
  slogan: string;
  tagline: string;
  links: readonly NavLink[];
  tutors: readonly FooterTutor[];
  documents: ReadonlyArray<{ title: string; href: string }>;
  /** Кнопка «Настройки cookie» – когда на сайте есть cookie-баннер. */
  cookieSettings?: boolean;
  /** Раскрытие статуса сайта и реквизиты – из шаблона `site.json` (`footer.requisites`). */
  requisites: string;
  copyright: string;
};

// Ссылки – paper 85 %, при наведении accent-light; строка от 44 px – зона клика. Поля 8 px держат
// первую строку двухстрочной ссылки на одной линии с соседними колонками.
const LINK =
  'inline-flex min-h-11 items-center py-2 text-paper/85 no-underline transition-colors hover:text-accent-light';

function Column({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {/* Unbounded 500, 16 px – из макета. */}
      <h2 id={id} className="font-display text-[1rem] leading-snug font-medium text-paper">
        {title}
      </h2>
      {children}
    </div>
  );
}

/** «Всё сложится.» – точка в цвет акцента, как в макете. */
function Slogan({ text }: { text: string }) {
  const body = text.replace(/\.$/, '');
  return (
    // Unbounded 700, 18 px – из макета.
    <p className="font-display text-[1.125rem] leading-snug font-bold text-paper">
      {body}
      {body !== text && <span className="text-accent">.</span>}
    </p>
  );
}

export function Footer({
  slogan,
  tagline,
  links,
  tutors,
  documents,
  cookieSettings = false,
  requisites,
  copyright,
}: FooterProps) {
  return (
    // Снизу на телефоне – место под нижнюю панель (64 px и безопасная зона), чтобы она не закрывала текст.
    <footer className="bg-ink pt-12 pb-[calc(3rem+4rem+env(safe-area-inset-bottom))] text-paper lg:py-18">
      <div className="page-container">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-[1.3fr_1fr_1.3fr_1.3fr]">
          <div className="flex flex-col gap-3.5">
            <Link href="/" className="inline-flex min-h-11 items-center self-start rounded-button">
              <Logo size={32} wordSize={22} tone="paper" />
            </Link>
            <Slogan text={slogan} />
            <p className="text-small text-paper/70">{tagline}</p>
          </div>

          <nav aria-labelledby="footer-nav">
            <Column id="footer-nav" title="Навигация">
              <ul>
                {links.map((link) => (
                  <li key={link.id}>
                    <NavAnchor href={link.href} className={LINK}>
                      {link.label}
                    </NavAnchor>
                  </li>
                ))}
              </ul>
            </Column>
          </nav>

          {tutors.length > 0 && (
            <Column id="footer-tutors" title="Репетиторы">
              <ul className="flex flex-col gap-4">
                {tutors.map((tutor) => (
                  <li key={tutor.slug}>
                    <Link href={`/tutors/${tutor.slug}`} className={`${LINK} font-medium`}>
                      {tutor.name}
                    </Link>
                    <div className="flex gap-3 text-paper/85">
                      <a
                        href={telegramUrl(tutor.telegram)}
                        {...TELEGRAM_LINK_PROPS}
                        className={LINK}
                      >
                        <span className="sr-only">{`Написать ${tutor.nameDative} в `}</span>
                        Telegram
                      </a>
                      <span aria-hidden="true" className="self-center">
                        ·
                      </span>
                      <a href={viberUrl(tutor.viber)} className={LINK}>
                        <span className="sr-only">{`Написать ${tutor.nameDative} в `}</span>
                        Viber
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </Column>
          )}

          {(documents.length > 0 || cookieSettings) && (
            <Column id="footer-documents" title="Документы">
              <ul>
                {documents.map((doc) => (
                  <li key={doc.href}>
                    <Link href={doc.href} className={LINK}>
                      {doc.title}
                    </Link>
                  </li>
                ))}
                {cookieSettings && (
                  // Пустой пункт до гидратации не виден: кнопка появляется вместе со скриптом.
                  <li className="empty:hidden">
                    <CookieSettingsButton className={`${LINK} cursor-pointer text-left`} />
                  </li>
                )}
              </ul>
            </Column>
          )}
        </div>

        {/* Раскрытие и реквизиты – отдельным читаемым блоком: 15 px, paper 85 % (ТЗ). */}
        <div className="mt-8 flex flex-col gap-2 border-t border-paper/15 pt-6 text-small text-paper/85 lg:mt-14">
          <p>{requisites}</p>
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
