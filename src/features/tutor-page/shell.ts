import type { Tutor } from '@/content';
import { leadLabel } from '@/features/tutors/texts';
import { leadAnchor } from '@/lib/urls';

import { WAITLIST_CTA, WAITLIST_SHORT } from './texts';

// Шапка и нижняя панель страницы репетитора – ТЗ главной, блок 0 и «Глобальные элементы»; ТЗ
// страницы репетитора, раздел 3. Записывают к этому репетитору, при «Мест нет» – в лист
// ожидания; у ушедшего – «Выбрать репетитора» по умолчанию (ADR-045).

export function tutorShell(
  tutor: Pick<Tutor, 'archived' | 'availability' | 'nameDative' | 'telegram'>,
) {
  if (tutor.archived) {
    return { bottomBar: { showAfter: 'top', hideWhenVisible: 'more' } };
  }
  const cta =
    tutor.availability === 'full'
      ? { label: WAITLIST_CTA, short: WAITLIST_SHORT }
      : { label: leadLabel(tutor.nameDative), short: 'Записаться' };
  return {
    cta: { ...cta, href: leadAnchor('header') },
    bottomBar: {
      cta: { ...cta, href: leadAnchor('bottom_bar') },
      telegram: { value: tutor.telegram, nameDative: tutor.nameDative },
      showAfter: 'top',
      hideWhenVisible: 'lead',
    },
  };
}
