import type { ReactNode } from 'react';

import type { AboutData } from './page-data';
import { ABOUT_TITLE, HELPS_TITLE } from './texts';

// Блок 2 «О себе» – ТЗ страницы репетитора, раздел 4, блок 2; макеты T-2-about, TM-2-about.
// Слева (8 колонок) – текст из MDX до 680 px, справа (4 колонки) – карточка «С чем помогаю»,
// от 1024 px закреплена при прокрутке. На телефоне карточка – под текстом.

type AboutTutorProps = {
  about: AboutData;
  /** Текст «О себе» – тело MDX репетитора. */
  children: ReactNode;
};

export function AboutTutor({ about, children }: AboutTutorProps) {
  return (
    <section id="about" aria-labelledby="about-title" className="paper-page">
      <div className="page-container page-grid gap-y-6 py-14 lg:py-24">
        <div className="col-span-full lg:col-span-8">
          <h2 id="about-title" className="font-display text-h2 text-ink">
            {ABOUT_TITLE}
          </h2>
          {/* 17 px и межстрочный 1,6 – из ТЗ. */}
          <div className="mt-6 flex max-w-[42.5rem] flex-col gap-4 text-[1.0625rem] leading-[1.6] text-ink-2 lg:gap-5 [&_a]:underline [&_a]:underline-offset-4">
            {children}
          </div>
        </div>

        <div className="col-span-full lg:col-span-4">
          {/* Отступ сверху – под сжатой шапкой 72 px. */}
          <div className="rounded-card border border-ink/12 bg-card p-5 shadow-paper lg:sticky lg:top-28 lg:p-6">
            <h3 className="font-display text-h3 text-ink">{HELPS_TITLE}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {about.goals.map((goal) => (
                <li
                  key={goal}
                  className="inline-flex min-h-9 items-center rounded-full border-[1.5px] border-ink/25 px-4.5 py-1 text-field font-medium text-ink"
                >
                  {goal}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-small text-ink-muted">{about.platforms}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
