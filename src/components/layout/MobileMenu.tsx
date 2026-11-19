'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { MessengerIconButton } from '@/components/ui/MessengerIconButton';

import { invoker } from './invoker';
import type { NavLink } from './nav';
import { NavAnchor } from './NavAnchor';

// Мобильное меню – ТЗ главной, блок 0 «Телефон»; макет X-menu. До 1023 px.

const MENU_ID = 'site-menu';

export type MenuTutor = { slug: string; nameDative: string; telegram: string; viber: string };

type MobileMenuProps = {
  links: readonly NavLink[];
  cta: { label: string; href: string };
  tutors: readonly MenuTutor[];
  hoursLine: string;
};

// Квадратная контурная кнопка 44×44 – бургер и ✕ (макеты X-header-m, X-menu); рамка 1,5 px – как у
// контурной кнопки ДС.
const SQUARE =
  'inline-flex size-11 flex-none items-center justify-center rounded-button border-[1.5px] border-ink text-ink hover:bg-ink/6';

/**
 * Бургер и меню на весь экран в модальном `<dialog>`: фокус остаётся внутри, Esc закрывает, фокус
 * возвращается на бургер – всё это делает браузер. Страница под меню не прокручивается (globals.css).
 * Без JavaScript меню открывается и закрывается через `commandfor`; переход по пункту закрывает
 * меню только с JavaScript.
 */
export function MobileMenu({ links, cta, tutors, hoursLine }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Слушатель на самом диалоге срабатывает раньше перехода next/link: меню закрыто до прокрутки.
    const closeOnLink = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a')) dialog.close();
    };
    // От 1024 px бургера нет – открытое меню не должно остаться поверх десктопной шапки.
    const wide = window.matchMedia('(min-width: 64rem)');
    const closeOnWide = () => {
      if (wide.matches) dialog.close();
    };

    dialog.addEventListener('click', closeOnLink);
    wide.addEventListener('change', closeOnWide);
    return () => {
      dialog.removeEventListener('click', closeOnLink);
      wide.removeEventListener('change', closeOnWide);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        {...invoker(MENU_ID, 'show-modal')}
        aria-haspopup="dialog"
        onClick={(event) => {
          // С JavaScript – сами: так меню открывается и там, где `commandfor` ещё не поддержан.
          event.preventDefault();
          dialogRef.current?.showModal();
          closeRef.current?.focus();
        }}
        className={`${SQUARE} lg:hidden`}
      >
        <Icon name="menu" size={22} strokeWidth={2} />
        <span className="sr-only">Меню</span>
      </button>

      <dialog
        ref={dialogRef}
        id={MENU_ID}
        aria-label="Меню"
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 paper-page p-0 text-ink backdrop:bg-transparent"
      >
        <div className="page-container flex flex-col gap-5 pb-7">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="inline-flex min-h-11 items-center rounded-button">
              <Logo size={26} />
            </Link>
            <button
              ref={closeRef}
              type="button"
              {...invoker(MENU_ID, 'close')}
              onClick={(event) => {
                event.preventDefault();
                dialogRef.current?.close();
              }}
              className={SQUARE}
            >
              <Icon name="close" size={22} strokeWidth={2} />
              <span className="sr-only">Закрыть меню</span>
            </button>
          </div>

          <nav aria-label="Основная">
            <ul>
              {links.map((link) => (
                <li key={link.id}>
                  <NavAnchor
                    href={link.href}
                    // Unbounded 500, 26 px, строка от 56 px – из ТЗ.
                    className="flex min-h-14 items-center border-b border-ink/10 font-display text-[1.625rem] leading-tight font-medium text-ink no-underline"
                  >
                    {link.label}
                  </NavAnchor>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-2.5">
            <Button href={cta.href} fullWidth>
              {cta.label}
            </Button>
            {tutors.length > 0 && (
              <ul className="flex flex-col gap-2.5">
                {tutors.map((tutor) => (
                  <li key={tutor.slug} className="flex items-center justify-between gap-2.5 py-1.5">
                    <span className="text-button">{`Написать ${tutor.nameDative}`}</span>
                    <span className="flex gap-2.5">
                      <MessengerIconButton
                        messenger="telegram"
                        value={tutor.telegram}
                        nameDative={tutor.nameDative}
                      />
                      <MessengerIconButton
                        messenger="viber"
                        value={tutor.viber}
                        nameDative={tutor.nameDative}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {tutors.length > 0 && (
            <p className="text-center text-small text-balance text-ink-muted">{hoursLine}</p>
          )}
        </div>
      </dialog>
    </>
  );
}
