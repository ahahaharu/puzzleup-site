import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

import { HeaderFrame } from './HeaderFrame';
import { HeaderNav } from './HeaderNav';
import { MobileMenu, type MenuTutor } from './MobileMenu';
import type { NavLink } from './nav';

// Шапка – ТЗ главной, блок 0; макеты D-1-hero, M-0-1-hero, X-header-d, X-header-m.

/**
 * Основная кнопка шапки: «Выбрать репетитора», на странице репетитора – «Записаться к Андрею»
 * или «Встать в лист ожидания». На телефоне видна короткая подпись (`short`) – начало подписи
 * или её часть («Лист ожидания»); доступное имя – полная подпись.
 */
export type Cta = { label: string; short: string; href: string };

type HeaderProps = {
  links: readonly NavLink[];
  /** Подсветка пункта текущего блока – на главной. */
  spy: boolean;
  cta: Cta;
  menu: { tutors: readonly MenuTutor[]; hoursLine: string };
};

function CtaLabel({ label, short }: Cta) {
  if (!label.toLowerCase().includes(short.toLowerCase())) {
    throw new Error(`Short label «${short}» must be a part of the label «${label}»`);
  }
  if (!label.startsWith(short)) {
    // Видимая подпись входит в доступное имя (WCAG 2.5.3), полная подпись – для дикторов.
    return (
      <span>
        <span aria-hidden="true" className="md:hidden">
          {short}
        </span>
        <span className="max-md:sr-only">{label}</span>
      </span>
    );
  }
  // Одним элементом: в inline-flex кнопке пробел в начале отдельного элемента схлопнулся бы.
  return (
    <span>
      {short}
      <span className="max-md:sr-only">{label.slice(short.length)}</span>
    </span>
  );
}

// «Записаться» – самая длинная короткая подпись, с которой шапка помещается в 360 px вместе со словом
// логотипа.
const SHORT_LABEL_FITS = 'Записаться'.length;

export function Header({ links, spy, cta, menu }: HeaderProps) {
  // С подписью длиннее («Лист ожидания») до 400 px остаётся только деталь логотипа, слово – для дикторов.
  const narrowLogo = cta.short.length > SHORT_LABEL_FITS ? 'max-[25rem]:sr-only' : undefined;

  return (
    <HeaderFrame>
      {/* 64 px до 1024 px, дальше 88 – из ТЗ; после прокрутки содержимое опускается к центру 72 px. */}
      <div className="page-container flex h-16 items-center justify-between gap-3 transition-transform duration-200 ease-out lg:h-22 lg:group-data-scrolled/header:translate-y-2">
        <Link href="/" className="inline-flex min-h-11 flex-none items-center rounded-button">
          {/* Обёртки – flex, а не строчные: в строке логотип вставал на базовую линию и уходил вверх. */}
          <span className="flex lg:hidden">
            <Logo size={26} wordClassName={narrowLogo} />
          </span>
          <span className="hidden lg:flex">
            <Logo size={32} wordSize={22} />
          </span>
        </Link>

        <HeaderNav links={links} spy={spy} />

        <div className="flex items-center gap-2">
          {/* На телефоне кнопка 44 px (ТЗ), с 1024 – 48. */}
          <Button href={cta.href} size="md" className="max-lg:min-h-11 max-lg:px-4">
            <CtaLabel {...cta} />
          </Button>
          <MobileMenu links={links} cta={cta} tutors={menu.tutors} hoursLine={menu.hoursLine} />
        </div>
      </div>
    </HeaderFrame>
  );
}
