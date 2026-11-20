import { Children, isValidElement, type ComponentProps, type ReactNode } from 'react';

import { anchorId } from '@/lib/headings';

// Оформление текста политики из MDX – ТЗ страницы репетитора, раздел 7; макет P-privacy-d.
// Заголовки разделов H2 – Unbounded 500, 24 px, с якорем из текста заголовка: тот же, что
// в оглавлении (`markdownHeadings`). Пункты «1.1», «1.2» – с висячими номерами.

/** Текст узла React: заголовок из MDX – строка, но разметку внутри тоже нужно прочитать. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

function Heading({ children }: ComponentProps<'h2'>) {
  return (
    // Над заголовком 36 px, под ним 12 px (макет) – вместе с промежутком 16 px между абзацами.
    <h2
      id={anchorId(textOf(children))}
      className="mt-5 -mb-1 font-display text-[1.5rem] leading-[1.25] font-medium text-ink"
    >
      {children}
    </h2>
  );
}

/** Номер пункта в начале абзаца: «1.1.», «2.3», «1.2.1.». Одна цифра – не пункт, а обычный текст. */
const ITEM_NUMBER = /^(\d+(?:\.\d+)+\.?)\s+/;

function Paragraph({ children }: ComponentProps<'p'>) {
  const [first, ...rest] = Children.toArray(children);
  const match = typeof first === 'string' ? ITEM_NUMBER.exec(first) : null;
  if (typeof first !== 'string' || !match) return <p>{children}</p>;
  return (
    // Номер висит слева от текста; места хватает на «10.12.».
    <p className="relative pl-14">
      <span className="absolute left-0 text-ink tabular-nums">{match[1]}</span>
      {first.slice(match[0].length)}
      {rest}
    </p>
  );
}

export const legalComponents = {
  h2: Heading,
  p: Paragraph,
  ul: (props: ComponentProps<'ul'>) => (
    <ul className="flex list-disc flex-col gap-2 pl-6 marker:text-ink-muted" {...props} />
  ),
  ol: (props: ComponentProps<'ol'>) => (
    <ol className="flex list-decimal flex-col gap-2 pl-6 marker:text-ink-muted" {...props} />
  ),
  a: ({ children, ...props }: ComponentProps<'a'>) => (
    <a className="text-ink underline underline-offset-4" {...props}>
      {children}
    </a>
  ),
};
