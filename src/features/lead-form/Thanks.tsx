'use client';

import { useEffect, useRef, type MouseEvent } from 'react';

import { MessengerButtons } from '@/components/ui/MessengerButtons';
import { PuzzlePiece } from '@/components/ui/PuzzlePiece';
import type { ContactMethod } from '@/lib/lead';

import { THANKS_AGAIN, THANKS_TITLE, thanksDay, thanksNight } from './texts';

// Экран «Спасибо» – ТЗ главной, блок 9; макеты X-thanks-d, X-thanks-m, X-thanks-night. Встаёт на
// месте формы в той же тёмной детали; `data-lead-thanks` прячет заголовок детали и чип репетитора
// (LeadSection). Акцентная деталь «встаёт» в угол за 400 мс, фокус – на заголовке.

type ThanksProps = {
  tutor: { name: string; nameDative: string; telegram: string; viber: string };
  contactMethod: ContactMethod;
  night: boolean;
  /** «9:00» – начало часов ответа. */
  responseFrom: string;
  /** Новая пустая форма без JavaScript: адрес этой же страницы с другим запросом. */
  againHref: string;
  /** С JavaScript – пустая форма без перезагрузки. */
  onAgain?: () => void;
  /** Фокус на заголовок – когда экран сменил форму, а не пришёл с сервера. */
  focus: boolean;
};

export function Thanks({
  tutor,
  contactMethod,
  night,
  responseFrom,
  againHref,
  onAgain,
  focus,
}: ThanksProps) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus) title.current?.focus();
  }, [focus]);

  const text = night
    ? thanksNight({ name: tutor.name, contactMethod, from: responseFrom })
    : thanksDay({ name: tutor.name, contactMethod });

  function again(event: MouseEvent<HTMLAnchorElement>) {
    if (!onAgain) return;
    event.preventDefault();
    onAgain();
  }

  return (
    <div data-lead-thanks="" className="flex flex-col items-start gap-4.5 lg:gap-5.5">
      {/* 64 и 84 px, поворот −6° – из макетов X-thanks-m и X-thanks-d. */}
      <PuzzlePiece className="size-16 -rotate-6 animate-piece-snap text-accent lg:size-21" />
      <h3
        ref={title}
        tabIndex={-1}
        className="font-display text-[1.875rem] leading-[1.1] font-bold focus:outline-none lg:text-[2.5rem]"
      >
        {THANKS_TITLE}
      </h3>
      {/* 18 и 20 px – из макетов. */}
      <p className="text-[1.125rem] leading-normal text-kraft lg:text-[1.25rem]">{text}</p>
      <MessengerButtons
        telegram={tutor.telegram}
        viber={tutor.viber}
        nameDative={tutor.nameDative}
        label="personal"
        tone="dark"
        className="w-full"
      />
      <a
        href={againHref}
        onClick={again}
        className="inline-flex min-h-11 items-center text-field font-medium text-accent-light underline underline-offset-4"
      >
        {THANKS_AGAIN}
      </a>
    </div>
  );
}
