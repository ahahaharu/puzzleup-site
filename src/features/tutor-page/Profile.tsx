import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { MarginNote } from '@/components/ui/MarginNote';
import { MessengerButtons } from '@/components/ui/MessengerButtons';
import { PhotoTape } from '@/components/ui/PhotoTape';
import { CURRENCY, LESSON_LENGTH } from '@/features/tutors/texts';
import { TutorPhotoTransition } from '@/features/tutors/TutorPhotoTransition';
import { cn } from '@/lib/cn';

import { Breadcrumbs } from './Breadcrumbs';
import { Notice } from './Notice';
import type { ProfileData } from './page-data';
import { FACT_EDUCATION, FACT_EXPERIENCE, REVIEWS_LINK, TRIAL_FREE } from './texts';

// Блок 1 «Профиль» – ТЗ страницы репетитора, раздел 4, блок 1, и раздел 5 (статусы); макеты
// T-1-profile, TM-1-profile, T-S-full, T-S-archived, TM-S-*.
// - Телефон: плашка отдельной строкой, фото 132 px рядом с H1, ниже – во всю ширину: предметы,
//   факты, кнопки, «Услуги оказывает», фраза, цена. Колонка текста – `contents`, её строки встают в общую сетку.
// - От 1024 px: фото – 5 колонок слева, текст – 7 колонок справа; фраза и цена – над кнопками.

export const PROFILE_ID = 'top';

// Подзаголовок H1 – Unbounded 500, 19 px на телефоне и 24 px на десктопе (ТЗ), между – плавно (ADR-026).
const SUBTITLE = 'text-[clamp(1.1875rem,1.0652rem+0.5435vw,1.5rem)] leading-[1.25] font-medium';

// Фраза о подходе – Spectral Italic 19 / 22 px (ТЗ), межстрочный 1,35 из макета.
const TAGLINE = 'text-[clamp(1.1875rem,1.1141rem+0.3261vw,1.375rem)] leading-[1.35]';

export function Profile({ profile }: { profile: ProfileData }) {
  const archived = profile.status === 'archived';
  // Без плашки занятости (ушедший) фото и имя встают в первую строку сетки телефона.
  const row = archived ? 'max-lg:row-start-1' : 'max-lg:row-start-2';

  return (
    <section
      id={PROFILE_ID}
      aria-labelledby="profile-title"
      className="relative isolate overflow-hidden paper-section"
    >
      <div className="page-container pt-6 pb-14 lg:pt-8 lg:pb-24">
        <Breadcrumbs name={profile.name} />

        {profile.archivedNotice && (
          <Notice className="mt-4.5 lg:mt-8">
            {profile.archivedNotice.text}
            {profile.archivedNotice.link && (
              <Link
                href={profile.archivedNotice.link.href}
                className="underline underline-offset-4 hover:no-underline"
              >
                {profile.archivedNotice.link.label}
              </Link>
            )}
            {profile.archivedNotice.link && '.'}
          </Notice>
        )}

        <div className="mt-4.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4.5 gap-y-4.5 lg:mt-8 lg:grid-cols-12 lg:items-start lg:gap-x-8">
          {/* Фото – декор рядом с именем: имя всегда написано в H1. */}
          <div
            className={cn(
              'col-start-1 pt-1.5 pl-1.5 lg:col-span-5 lg:row-start-1 lg:p-0 lg:pt-3',
              row,
            )}
          >
            {/* Фото прилетает сюда из карточки, по которой открыли страницу (ADR-065). */}
            <TutorPhotoTransition slug={profile.slug}>
              <PhotoTape
                name={profile.name}
                photo={profile.photo ? { src: profile.photo, alt: '' } : undefined}
                frame="lg"
                sizes="(min-width: 1280px) 461px, (min-width: 1024px) 36vw, 132px"
                preload
                className="w-33 max-lg:p-2 lg:w-full"
              />
            </TutorPhotoTransition>
          </div>

          <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:items-start lg:gap-5.5">
            {profile.status !== 'archived' && (
              <Badge
                status={profile.status}
                className="col-span-2 row-start-1 justify-self-start"
              />
            )}

            <h1
              id="profile-title"
              className={cn('col-start-2 flex min-w-0 flex-col gap-1.5 text-ink lg:gap-2', row)}
            >
              <span className="font-display text-name">{profile.name}</span>
              {/* Для поисковиков и дикторов заголовок – одна фраза: «Андрей – репетитор по математике». */}
              <span className="sr-only"> – </span>
              <span className={cn('font-display', SUBTITLE)}>{profile.subtitle}</span>
            </h1>

            {profile.subjectLines.length > 0 && (
              <ul className="col-span-2 flex flex-wrap gap-2">
                {profile.subjectLines.map((line) => (
                  <li key={line}>
                    <Chip variant="kraft">{line}</Chip>
                  </li>
                ))}
              </ul>
            )}

            <dl className="col-span-2 flex gap-x-8 lg:gap-x-10">
              {[
                [FACT_EXPERIENCE, profile.experience],
                [FACT_EDUCATION, profile.education],
              ].map(([label, value]) => (
                <div key={label} className="flex min-w-0 flex-col gap-0.5">
                  <dt className="text-caption text-ink-muted">{label}</dt>
                  <dd className="text-field font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            {/* На телефоне кнопки – сразу после фактов: основная видна без прокрутки на 360×740. */}
            <div className="col-span-2 flex w-full flex-col gap-2.5 lg:order-1 lg:items-start lg:gap-3">
              <Button href={profile.cta.href} size="lg" className="w-full lg:w-auto">
                {profile.cta.label}
              </Button>
              {profile.alternative && (
                <Button
                  href={profile.alternative.href}
                  variant="secondary"
                  size="lg"
                  className="w-full max-lg:min-h-12 max-lg:px-5 lg:w-auto"
                >
                  {profile.alternative.label}
                </Button>
              )}
              {!archived && (
                <MessengerButtons
                  telegram={profile.telegram}
                  viber={profile.viber}
                  nameDative={profile.nameDative}
                  label="action"
                  buttonClassName="lg:min-h-14 lg:px-7"
                  className="lg:max-w-xl"
                />
              )}
            </div>

            {/* Реквизиты – сразу после кнопок мессенджеров на телефоне (ТЗ), последней строкой на десктопе. */}
            {profile.provider && (
              <p className="col-span-2 max-w-[32.5rem] border-l-2 border-accent-text pl-4 text-small text-ink-2 lg:order-3">
                {profile.provider}
              </p>
            )}
            <p className="col-span-2 flex items-start gap-2.5 font-hand text-ink-2 italic">
              {/* Кавычка Spectral 48 px и межстрочный 0,8 – из макета T-1-profile. */}
              <span aria-hidden="true" className="text-[3rem] leading-[0.8] text-accent">
                «
              </span>
              <span className={cn('max-w-[32.5rem]', TAGLINE)}>{profile.tagline}</span>
            </p>

            {!archived && (
              <p className="col-span-2 flex flex-col gap-0.5">
                {/* Цена – Golos 600 20 px, из макета T-1-profile. */}
                <span className="text-[1.25rem] font-semibold text-ink">
                  {`${profile.price} ${CURRENCY}`}{' '}
                  <span className="font-normal text-ink-muted">· {LESSON_LENGTH}</span>
                </span>
                <span className="text-small text-ink-muted">{TRIAL_FREE}</span>
              </p>
            )}

            {profile.reviewCount > 0 && (
              <Link
                href="#reviews"
                className="col-span-2 inline-flex min-h-11 items-center gap-2 justify-self-start text-field font-semibold text-ink no-underline hover:underline lg:order-2 lg:-my-2.5"
              >
                {`${REVIEWS_LINK} · ${profile.reviewCount}`}
                <Icon name="arrow-right" size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {profile.formula && (
        // Одна пометка на полях – формула предмета; от 1280 px, где справа от текста есть поле.
        <MarginNote
          size="sm"
          opacity={0.35}
          className={cn(
            'absolute right-16 -z-10 -rotate-4 max-xl:hidden',
            // Под плашкой ушедшего – ниже, чтобы не уйти под неё.
            profile.archivedNotice ? 'top-72' : 'top-37.5',
          )}
        >
          {profile.formula}
        </MarginNote>
      )}
    </section>
  );
}
