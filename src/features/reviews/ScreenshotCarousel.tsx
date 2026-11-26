'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';

import { Icon } from '@/components/ui/Icon';

import type { ReviewCardData } from './card-data';
import { SCREENSHOT_CLOSE, screenshotAlt, SCREENSHOTS_NEXT, SCREENSHOTS_PREV } from './texts';

// Лента скриншотов отзывов из мессенджеров (ADR-062) – на главной в колонке репетитора и на его
// странице. Рамки одного размера, снимок вписан целиком. Текст переписки на экране не повторяется:
// он – имя снимка для дикторов и поиска. Нажатие открывает снимок крупно в `<dialog>`.
// Без JavaScript лента прокручивается пальцем и колесом, стрелок нет, снимок открывается ссылкой.
// Снимок вырастает из миниатюры и при закрытии уменьшается обратно в неё – View Transition с общим
// именем на время перехода (globals.css). Без поддержки и при reduced-motion окно открывается сразу.

/** Имя пары «миниатюра – снимок крупно» на время перехода. */
const ZOOM = 'screenshot-zoom';
/** Дольше крупный снимок не ждём: лучше перелёт к пустой рамке, чем задержка нажатия. */
const DECODE_TIMEOUT_MS = 300;

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

type ScreenshotCarouselProps = {
  reviews: readonly Screenshot[];
  /** Имя списка для дикторов: «Скриншоты отзывов об Андрее». */
  label: string;
};

const ARROW =
  'inline-flex size-11 items-center justify-center rounded-full border-[1.5px] border-ink text-ink hover:bg-ink/6 disabled:pointer-events-none disabled:opacity-30';

export function ScreenshotCarousel({ reviews, label }: ScreenshotCarouselProps) {
  const list = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const zoomed = useRef<HTMLSpanElement>(null);
  // Миниатюра открытого снимка – в неё он уменьшается при закрытии.
  const origin = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<Screenshot>();
  // Без прокрутки (все снимки видны) и до гидратации стрелок нет.
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const update = () =>
      setEdges({
        start: element.scrollLeft <= 1,
        end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
      });
    update();
    element.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  function scroll(direction: -1 | 1) {
    const element = list.current;
    const item = element?.firstElementChild;
    if (!element || !(item instanceof HTMLElement)) return;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollBy({
      left: direction * (item.offsetWidth + gap),
      behavior: still ? 'auto' : 'smooth',
    });
  }

  function show(event: MouseEvent<HTMLAnchorElement>, review: Screenshot) {
    event.preventDefault();
    const thumbnail = event.currentTarget.querySelector('span');
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

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ul
        ref={list}
        aria-label={label}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 max-md:-mx-4 max-md:scroll-px-4 max-md:px-4"
      >
        {reviews.map((review) => (
          <li key={review.id} className="w-64 flex-none snap-start md:w-72">
            <figure className="flex flex-col gap-3">
              <a
                href={review.screenshot}
                onClick={(event) => show(event, review)}
                className="relative block aspect-3/4 rounded-card border border-ink/12 bg-card shadow-paper"
              >
                <span className="absolute inset-2">
                  <Image
                    src={review.screenshot}
                    alt={screenshotAlt(review.text)}
                    fill
                    sizes="(min-width: 48rem) 288px, 256px"
                    className="object-contain"
                  />
                </span>
              </a>
              <figcaption className="flex flex-col gap-1">
                <span className="text-small font-semibold text-ink">{review.signature}</span>
                <time dateTime={review.dateTime} className="text-caption text-ink-muted">
                  {review.date}
                </time>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {!(edges.start && edges.end) && (
        <div className="flex gap-2.5">
          <button type="button" disabled={edges.start} onClick={() => scroll(-1)} className={ARROW}>
            <Icon name="arrow-right" size={20} className="rotate-180" />
            <span className="sr-only">{SCREENSHOTS_PREV}</span>
          </button>
          <button type="button" disabled={edges.end} onClick={() => scroll(1)} className={ARROW}>
            <Icon name="arrow-right" size={20} />
            <span className="sr-only">{SCREENSHOTS_NEXT}</span>
          </button>
        </div>
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
