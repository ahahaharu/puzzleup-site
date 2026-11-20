import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/SiteShell';
import { NOT_FOUND_ID, NotFound } from '@/features/not-found/NotFound';
import { NOT_FOUND_TITLE } from '@/features/not-found/texts';

// Неизвестный адрес и `notFound()` – ТЗ страницы репетитора, раздел 7. Код 404 и `noindex`
// ставит сам Next. Нижняя панель появляется, когда блок с кнопками ушёл вверх.

export const metadata: Metadata = {
  title: `${NOT_FOUND_TITLE} | PuzzleUp`,
};

export default function NotFoundPage() {
  return (
    <SiteShell bottomBar={{ showAfter: NOT_FOUND_ID, hideWhenVisible: NOT_FOUND_ID }}>
      <NotFound />
    </SiteShell>
  );
}
