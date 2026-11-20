import { markdownHeadings, type Heading } from '@/lib/headings';
import { formatLongDate } from '@/lib/time';

// Данные страницы политики из `content/legal/<slug>.mdx` – ТЗ страницы репетитора, раздел 7.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type LegalSource = { title: string; effectiveDate: string; content: string };

export type LegalPageData = {
  title: string;
  effectiveDate: { label: string; dateTime?: string };
  headings: Heading[];
};

export function legalPageData(doc: LegalSource): LegalPageData {
  // Схема пропускает дату или, до релиза, заглушку `[дата]` – та выводится как есть, без `<time>`.
  const effectiveDate = ISO_DATE.test(doc.effectiveDate)
    ? { label: formatLongDate(doc.effectiveDate), dateTime: doc.effectiveDate }
    : { label: doc.effectiveDate };
  return { title: doc.title, effectiveDate, headings: markdownHeadings(doc.content) };
}
