'use client';

import Image from 'next/image';
import { useRef, useState, type CSSProperties, type FormEvent, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';

import type { ReviewCardData } from './card-data';
import { SCREENSHOT_CLOSE, screenshotAlt, SCREENSHOTS_MORE } from './texts';
import { wallLayout } from './wall-layout';

// Скриншоты отзывов из мессенджеров (ADR-062, ADR-071), «вклеенные» скотчем с лёгким наклоном, как
// фото в профиле. Два вида:
// - `preview` – мини-кладка на главной в колонке репетитора: первые 4 снимка в две колонки (на
//   телефоне – 2 в одну), не выше 28rem; если кладка выше, низ растворяется – «дальше ещё», все
//   снимки – по ссылке «Все отзывы» под ней;
// - `wall` – кладка на странице репетитора: все снимки сразу, колонки одной ширины (текст на снимках
//   одного размера), снимок – в самую короткую колонку (`wallLayout`). В пустое место под короткой
//   колонкой встаёт записка о пробном занятии. После 3 (телефон), 4 (от 768 px) или 6 (от 1024 px)
//   снимков – «Показать ещё».
// Текст переписки на экране не повторяется: он – имя снимка для дикторов и поиска. Нажатие открывает
// снимок крупно в `<dialog>`: он вырастает из миниатюры и при закрытии уменьшается обратно – View
// Transition с общим именем на время перехода (globals.css). Без поддержки и при reduced-motion окно
// открывается сразу. Без JavaScript в кладке видны все снимки, снимок открывается ссылкой.

/** Имя пары «миниатюра – снимок крупно» на время перехода. */
const ZOOM = 'screenshot-zoom';
/** Дольше крупный снимок не ждём: лучше перелёт к пустой рамке, чем задержка нажатия. */
const DECODE_TIMEOUT_MS = 300;
/** Размер файла неизвестен – рамка 3:4. */
const FALLBACK_SIZE = { width: 900, height: 1200 };
/**
 * Сколько снимков кладки видно до «Показать ещё»: телефон и десктоп – как у текстовых отзывов
 * (ReviewsList), на планшете – 4, чтобы обе колонки были заполнены.
 */
const VISIBLE = { phone: 3, tablet: 4, desktop: 6 };
/** Колонок кладки от 1024 px; уже – одна колонка или две CSS-колонки. */
const WALL_COLUMNS = 3;
/** Наклоны вклеек по кругу, ±1,5° – как у фото репетитора (PhotoTape). */
const TILTS = [-1.2, 0.9, -0.6, 1.3, -0.9, 0.5];
/** Мини-кладка на главной: сколько снимков и колонок, сколько снимков на телефоне. */
const PREVIEW = { count: 4, columns: 2, phone: 2 };
/**
 * Предел высоты мини-кладки в долях ширины колонки: 28rem при колонке ~16rem от 768 px, 26rem при
 * ~20rem на телефоне. Выше – низ растворяется.
 */
const PREVIEW_LIMIT = { desktop: 1.7, phone: 1.25 };
// Растворение низа – целыми строками: Tailwind не видит классы, собранные из частей.
const FADE = {
  phone: 'max-md:max-h-[26rem] max-md:mask-[linear-gradient(to_bottom,#000_65%,transparent)]',
  desktop: 'md:max-h-[28rem] md:mask-[linear-gradient(to_bottom,#000_65%,transparent)]',
};

const WALL_SIZES =
  '(min-width: 80rem) 368px, (min-width: 64rem) 30vw, (min-width: 48rem) 45vw, 92vw';
const PREVIEW_SIZES = '(min-width: 64rem) 272px, (min-width: 48rem) 45vw, 92vw';

function canZoom() {
  return (
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Ждёт, пока крупный снимок готов к показу, – иначе перелёт придёт к пустой рамке. */
async function ready(image: HTMLImageElement | null | undefined) {
  if (!image) return;
  const timeout = new Promise((resolve) => setTimeout(resolve, DECODE_TIMEOUT_MS));
  await Promise.race([image.decode().catch(() => undefined), timeout]);
}

type Screenshot = ReviewCardData & { screenshot: string };

/** Записка о пробном занятии в пустом месте кладки. */
export type WallNote = { title: string; text: string; cta: { label: string; href: string } };

type ScreenshotsProps = {
  reviews: readonly Screenshot[];
  /** Имя списка для дикторов: «Скриншоты отзывов об Андрее». */
  label: string;
  layout: 'preview' | 'wall';
  /** Только у кладки; нет – пустое место остаётся пустым. */
  note?: WallNote | undefined;
};

// Вклейка наклонена и «отклеивается» при наведении вместе со скотчем: приподнимается, наклон
// удваивается, под ней тень полёта. Только transform и opacity тени – как у PhotoTape.
const PASTED =
  'relative block cursor-zoom-in rounded-xl rotate-(--tilt) transition-[translate,rotate] duration-300 ease-out hover:-translate-y-1 hover:rotate-[calc(var(--tilt)*2)] after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:opacity-0 after:shadow-flying after:transition-opacity after:duration-300 hover:after:opacity-100';

export function Screenshots({ reviews, label, layout, note }: ScreenshotsProps) {
  const list = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const zoomed = useRef<HTMLSpanElement>(null);
  // Миниатюра открытого снимка – в неё он уменьшается при закрытии.
  const origin = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<Screenshot>();
  const [expanded, setExpanded] = useState(false);

  function expand() {
    setExpanded(true);
    // Кнопка исчезает – фокус переходит на первый открытый снимок.
    const desktop = window.matchMedia('(min-width: 64rem)').matches;
    const tablet = window.matchMedia('(min-width: 48rem)').matches;
    const first = desktop ? VISIBLE.desktop : tablet ? VISIBLE.tablet : VISIBLE.phone;
    const link = list.current?.querySelector<HTMLElement>(`[data-index="${first}"] a`);
    if (link) requestAnimationFrame(() => link.focus());
  }

  function show(event: MouseEvent<HTMLAnchorElement>, review: Screenshot) {
    event.preventDefault();
    const thumbnail = event.currentTarget.querySelector<HTMLElement>('[data-thumbnail]');
    origin.current = thumbnail;
    const reveal = () => {
      flushSync(() => setOpen(review));
      dialog.current?.showModal();
    };
    if (!thumbnail || !canZoom()) {
      reveal();
      return;
    }
    // Старый кадр – миниатюра, новый – снимок крупно: имя переходит от одной к другому.
    thumbnail.style.viewTransitionName = ZOOM;
    document.startViewTransition(async () => {
      thumbnail.style.viewTransitionName = '';
      reveal();
      await ready(zoomed.current?.querySelector('img'));
    });
  }

  // Закрытие нажатием – обратный перелёт в миниатюру. Esc закрывает сразу: его отменять нельзя.
  function hide(event: FormEvent<HTMLFormElement>) {
    const thumbnail = origin.current;
    if (!thumbnail?.isConnected || !canZoom()) return;
    event.preventDefault();
    const transition = document.startViewTransition(() => {
      flushSync(() => setOpen(undefined));
      dialog.current?.close();
      thumbnail.style.viewTransitionName = ZOOM;
    });
    void transition.finished.finally(() => {
      thumbnail.style.viewTransitionName = '';
    });
  }

  /** Вклеенный снимок со скотчем. */
  function shot(review: Screenshot, index: number, sizes: string) {
    const { width, height } = review.screenshotSize ?? FALLBACK_SIZE;
    const tilt: CSSProperties & Record<'--tilt', string> = {
      '--tilt': `${TILTS[index % TILTS.length] ?? 0}deg`,
    };
    return (
      <figure className="flex flex-col gap-3">
        <div className="relative">
          <a
            href={review.screenshot}
            onClick={(event) => show(event, review)}
            style={tilt}
            className={PASTED}
          >
            <span data-thumbnail className="rounded-xl relative block overflow-hidden shadow-paper">
              <Image
                src={review.screenshot}
                alt={screenshotAlt(review.text)}
                width={width}
                height={height}
                sizes={sizes}
                className="block h-auto w-full"
              />
            </span>
            {/* Полоска «скотча» по верхнему краю – как у фото репетитора. */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute -top-2.5 h-5 w-16 bg-accent/35',
                index % 2 === 0 ? 'left-6 -rotate-6' : 'right-6 rotate-6',
              )}
            />
          </a>
        </div>
        <figcaption className="flex flex-col gap-1 pl-1">
          <span className="text-small font-semibold text-ink">{review.signature}</span>
          <time dateTime={review.dateTime} className="text-caption text-ink-muted">
            {review.date}
          </time>
        </figcaption>
      </figure>
    );
  }

  const sizeOf = (review: Screenshot) => review.screenshotSize ?? FALLBACK_SIZE;
  const shown = layout === 'preview' ? reviews.slice(0, PREVIEW.count) : reviews;
  const { columns, noteColumn, heights } =
    layout === 'wall'
      ? wallLayout(shown.map(sizeOf), {
          columns: WALL_COLUMNS,
          visible: expanded ? reviews.length : VISIBLE.desktop,
        })
      : wallLayout(shown.map(sizeOf), { columns: PREVIEW.columns });
  // На телефоне мини-кладка – одна колонка из первых снимков.
  const phoneHeight = shown
    .slice(0, PREVIEW.phone)
    .reduce((sum, review) => sum + sizeOf(review).height / sizeOf(review).width + 0.25, 0);
  const fade = {
    desktop: Math.max(...heights) > PREVIEW_LIMIT.desktop,
    phone: phoneHeight > PREVIEW_LIMIT.phone,
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {layout === 'preview' ? (
        // Колонки `wallLayout`; на телефоне обёртки растворяются и снимки встают в одну колонку.
        // Поля по бокам – место наклону и скотчу: край обрезан пределом высоты.
        <div
          role="list"
          aria-label={label}
          className={cn(
            'flex flex-col gap-8 overflow-hidden px-2 md:flex-row md:gap-6',
            fade.phone && FADE.phone,
            fade.desktop && FADE.desktop,
          )}
        >
          {columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="contents md:flex md:min-w-0 md:flex-1 md:flex-col md:gap-8"
            >
              {column.map((index) => {
                const review = shown[index];
                if (!review) return null;
                return (
                  <div
                    key={review.id}
                    role="listitem"
                    className={cn('min-w-0 pt-3', index >= PREVIEW.phone && 'max-md:hidden')}
                  >
                    {shot(review, index, PREVIEW_SIZES)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        // От 1024 px – колонки `wallLayout`; уже обёртки колонок растворяются (`contents`), и снимки
        // встают в одну колонку или в две CSS-колонки (с двумя они выравниваются сами) в том же
        // порядке. Порядок для клавиатуры и дикторов совпадает с порядком на экране: по колонкам.
        <div
          ref={list}
          role="list"
          aria-label={label}
          className="grid gap-y-10 md:block md:columns-2 md:gap-x-8 lg:flex lg:gap-10"
        >
          {columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-10"
            >
              {column.map((index) => {
                const review = reviews[index];
                if (!review) return null;
                return (
                  <div
                    key={review.id}
                    role="listitem"
                    data-index={index}
                    // Отступ сверху – место скотчу.
                    className={cn(
                      'min-w-0 pt-3 md:break-inside-avoid md:max-lg:mb-10',
                      !expanded && index >= VISIBLE.phone && 'scripting:max-md:hidden',
                      !expanded && index >= VISIBLE.tablet && 'scripting:md:max-lg:hidden',
                      !expanded && index >= VISIBLE.desktop && 'scripting:lg:hidden',
                    )}
                  >
                    {shot(review, index, WALL_SIZES)}
                  </div>
                );
              })}
              {note && noteColumn === columnIndex && (
                // Записка – только в колонках от 1024 px: уже пустого места нет, а форма – ниже.
                <div className="relative hidden pt-4 lg:block">
                  <Sheet kind="lined" tilt={1.5}>
                    <p className="font-hand text-[1.75rem] leading-7 text-accent-text italic">
                      {note.title}
                    </p>
                    <p className="mt-7 text-body text-ink-2">{note.text}</p>
                    <Button href={note.cta.href} variant="primary" size="md" className="mt-7">
                      {note.cta.label}
                    </Button>
                  </Sheet>
                  {/* Скотч – вне листа: лист обрезан по контуру загнутого уголка. */}
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-3 bg-accent/35"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {layout === 'wall' && !expanded && reviews.length > VISIBLE.phone && (
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={expand}
          className={cn(
            'mt-4 self-start noscript:hidden',
            reviews.length <= VISIBLE.tablet && 'md:max-lg:hidden',
            reviews.length <= VISIBLE.desktop && 'lg:hidden',
          )}
        >
          {SCREENSHOTS_MORE}
        </Button>
      )}

      {/* Всё окно – одна кнопка «Закрыть» формы `method="dialog"`: нажатие в любом месте закрывает
          окно, фокус при открытии встаёт на неё сам, Esc закрывает браузер. Снимок внутри кнопки –
          оформление: расшифровку дикторы уже услышали на ссылке. */}
      <dialog
        ref={dialog}
        aria-label={open?.signature}
        onClose={() => setOpen(undefined)}
        className="m-auto size-full max-h-none max-w-none bg-transparent p-0 backdrop:bg-ink/85"
      >
        <form method="dialog" onSubmit={hide} className="size-full">
          <button type="submit" className="relative block size-full cursor-zoom-out p-4">
            <span className="sr-only">{SCREENSHOT_CLOSE}</span>
            {open && (
              <span
                ref={zoomed}
                style={{ viewTransitionName: ZOOM }}
                className="relative block size-full"
              >
                <Image
                  src={open.screenshot}
                  alt=""
                  fill
                  sizes="100vw"
                  // Не крупнее исходника: растянутый снимок расплывается.
                  className="object-scale-down"
                />
              </span>
            )}
            <span className="absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full bg-paper text-ink">
              <Icon name="close" size={22} strokeWidth={2} />
            </span>
          </button>
        </form>
      </dialog>
    </div>
  );
}
