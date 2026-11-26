import Link from 'next/link';

import { BREADCRUMB_PARENTS, BREADCRUMBS_LABEL } from './texts';

// Хлебные крошки над профилем – ТЗ страницы репетитора, раздел 3: «Главная / Репетиторы / Андрей»,
// «Репетиторы» ведёт в блок на главной. Макеты T-1-profile, TM-1-profile.

const LINK = 'inline-flex min-h-11 items-center underline-offset-4 hover:text-ink hover:underline';

export function Breadcrumbs({ name }: { name: string }) {
  return (
    <nav aria-label={BREADCRUMBS_LABEL}>
      {/* Строки ссылок – 44 px; отрицательный отступ возвращает ритм макета. */}
      <ol className="-my-2.5 flex flex-wrap items-center gap-x-2 text-small text-ink-muted">
        {BREADCRUMB_PARENTS.map((item) => (
          <li key={item.href} className="flex items-center gap-x-2">
            <Link href={item.href} className={LINK}>
              {item.label}
            </Link>
            <span aria-hidden="true">/</span>
          </li>
        ))}
        <li aria-current="page" className="inline-flex min-h-11 items-center font-medium text-ink">
          {name}
        </li>
      </ol>
    </nav>
  );
}
