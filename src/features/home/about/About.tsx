import Link from 'next/link';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { MessengerIconButton } from '@/components/ui/MessengerIconButton';
import { leadLabel } from '@/features/tutors/texts';

import type { AboutTutor } from './cards';
import { ABOUT_CTA, ABOUT_TITLE } from './texts';

// Блок «О сайте» – ТЗ главной, блок 9; макеты D-9-about, M-9-about. Тёмная деталь во всю ширину
// контейнера: слева (6 колонок) – кто стоит за сайтом, справа (6) – карточки репетиторов. Телефон –
// текст, под ним карточки столбиком. Без карточек (3+ репетитора) – кнопка «Выбрать репетитора».

type AboutProps = {
  /** `site.about`. */
  text: string;
  /** Пустой список – вместо карточек кнопка. */
  tutors: readonly AboutTutor[];
};

function TutorCard({ tutor }: { tutor: AboutTutor }) {
  return (
    <li className="@container flex flex-col gap-3.5 rounded-card bg-card p-4 text-ink">
      <div className="flex items-center gap-3.5">
        <Avatar name={tutor.name} photo={tutor.photo} size={64} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="font-display text-[1.125rem] leading-tight font-medium">
            {/* Зона нажатия растянута по высоте до 44 px, строка не выше заголовка. */}
            <Link
              href={tutor.href}
              className="relative no-underline after:absolute after:inset-x-0 after:-inset-y-3 hover:underline"
            >
              {tutor.name}
            </Link>
          </h3>
          <p className="text-small text-ink-muted">{tutor.meta}</p>
        </div>
      </div>
      {/* Узкая карточка (телефон): кнопка – строкой, иконки мессенджеров – парой под ней. */}
      <div className="flex flex-wrap gap-2.5">
        <Button
          href={tutor.leadHref}
          size="md"
          className="basis-full @[22rem]:grow @[22rem]:basis-0"
        >
          {leadLabel(tutor.nameDative)}
        </Button>
        <MessengerIconButton
          messenger="telegram"
          value={tutor.telegram}
          nameDative={tutor.nameDative}
        />
        <MessengerIconButton messenger="viber" value={tutor.viber} nameDative={tutor.nameDative} />
      </div>
    </li>
  );
}

export function About({ text, tutors }: AboutProps) {
  return (
    <section id="about" aria-labelledby="about-title" className="paper-page-alt">
      <div className="page-container py-14 lg:py-24">
        <div className="grid items-center gap-5 rounded-piece bg-ink p-6 text-paper md:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
          <div className="flex flex-col items-start gap-4.5 lg:gap-5">
            {/* 36 px на десктопе – ТЗ, 26 px на телефоне – макет M-9. */}
            <h2
              id="about-title"
              className="font-display text-[1.625rem] leading-[1.15] font-bold text-paper lg:text-[2.25rem]"
            >
              {ABOUT_TITLE}
            </h2>
            <p className="max-w-150 text-field leading-[1.6] text-paper/85 lg:text-[1.125rem]">
              {text}
            </p>
            {tutors.length === 0 && (
              <Button href="#tutors" variant="onDark" className="mt-2">
                {ABOUT_CTA}
              </Button>
            )}
          </div>
          {tutors.length > 0 && (
            <ul className="flex flex-col gap-2.5 lg:gap-3">
              {tutors.map((tutor) => (
                <TutorCard key={tutor.slug} tutor={tutor} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
