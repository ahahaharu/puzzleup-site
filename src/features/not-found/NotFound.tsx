import { Button } from '@/components/ui/Button';

import { NotFoundIllustration } from './NotFoundIllustration';
import {
  NOT_FOUND_CTA,
  NOT_FOUND_CTA_HREF,
  NOT_FOUND_HOME,
  NOT_FOUND_TEXT,
  NOT_FOUND_TITLE,
} from './texts';

// Страница 404 – ТЗ страницы репетитора, раздел 7; макеты P-404-d, P-404-m. Не тупик: обе кнопки
// ведут к записи. На телефоне иллюстрация 220 px над текстом, кнопки столбиком во всю ширину;
// от 1024 px – текст слева, иллюстрация 360 px справа.

export const NOT_FOUND_ID = 'not-found';

export function NotFound() {
  return (
    <section id={NOT_FOUND_ID} aria-labelledby="not-found-title">
      <div className="page-container flex flex-col gap-7 py-10 lg:flex-row lg:items-center lg:gap-20 lg:py-24">
        <NotFoundIllustration className="mx-auto size-55 flex-none lg:order-last lg:size-90" />
        <div className="flex flex-1 flex-col gap-5">
          <h1 id="not-found-title" className="font-display text-h2 text-ink">
            {NOT_FOUND_TITLE}
          </h1>
          <p className="text-lead text-ink-2">{NOT_FOUND_TEXT}</p>
          <div className="flex flex-col gap-3 lg:flex-row">
            <Button href="/" variant="secondary">
              {NOT_FOUND_HOME}
            </Button>
            <Button href={NOT_FOUND_CTA_HREF}>{NOT_FOUND_CTA}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
