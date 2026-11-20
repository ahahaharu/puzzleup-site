import Link from 'next/link';
import type { ReactNode } from 'react';

// Простой Markdown в текстах из content/ (docs/data-model.md, `faq.json`): абзацы через пустую
// строку, **жирный** и ссылки [текст](адрес). Больше ничего: ответы короткие, а полный Markdown
// тянул бы зависимость.

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'link'; text: string; href: string };

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

// Допустимые адреса ссылок: свои страницы, якоря, http(s), почта и телефон. Остальное (`javascript:`,
// `//host`) ссылкой не становится – остаётся текстом.
const SAFE_HREF = /^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;
const EXTERNAL = /^https?:\/\//i;

/** Строка → абзацы из кусков текста, жирного и ссылок. */
export function parseMarkdown(source: string): Inline[][] {
  return source
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const parts: Inline[] = [];
      let last = 0;
      for (const match of paragraph.matchAll(INLINE)) {
        if (match.index > last)
          parts.push({ kind: 'text', text: paragraph.slice(last, match.index) });
        const [, strong, text, href] = match;
        if (strong !== undefined) parts.push({ kind: 'strong', text: strong });
        else if (href && SAFE_HREF.test(href)) parts.push({ kind: 'link', text: text ?? '', href });
        else parts.push({ kind: 'text', text: text ?? '' });
        last = match.index + match[0].length;
      }
      if (last < paragraph.length) parts.push({ kind: 'text', text: paragraph.slice(last) });
      return parts;
    });
}

const LINK = 'underline underline-offset-4 hover:no-underline';

function renderInline(part: Inline, key: number): ReactNode {
  switch (part.kind) {
    case 'text':
      return part.text;
    case 'strong':
      return (
        <strong key={key} className="font-semibold text-ink">
          {part.text}
        </strong>
      );
    case 'link':
      // Свои страницы – в той же вкладке, внешние ссылки – в новой (ТЗ главной, раздел 3).
      if (part.href.startsWith('/')) {
        return (
          <Link key={key} href={part.href} className={LINK}>
            {part.text}
          </Link>
        );
      }
      return EXTERNAL.test(part.href) ? (
        <a key={key} href={part.href} target="_blank" rel="noopener noreferrer" className={LINK}>
          {part.text}
        </a>
      ) : (
        <a key={key} href={part.href} className={LINK}>
          {part.text}
        </a>
      );
  }
}

type MarkdownProps = { source: string; className?: string };

export function Markdown({ source, className }: MarkdownProps) {
  return (
    <div className={className}>
      {parseMarkdown(source).map((paragraph, index) => (
        <p key={index} className="mt-3 first:mt-0">
          {paragraph.map(renderInline)}
        </p>
      ))}
    </div>
  );
}
