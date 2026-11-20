import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MessengerButtons } from '@/components/ui/MessengerButtons';
import { PhotoTape } from '@/components/ui/PhotoTape';
import { pluralize } from '@/lib/plural';
import { aboutName } from '@/lib/text';
import { tutorLeadUrl, tutorUrl } from '@/lib/urls';

import type { TutorCardData } from './card-data';
import {
  CURRENCY,
  leadLabel,
  LESSON_LENGTH,
  MORE_LABEL,
  REVIEW_FORMS,
  WAITLIST_LABEL,
} from './texts';

// Карточка репетитора – ТЗ главной, блок 5 «Карточка репетитора»; макеты D-5-tutors, M-5-tutors.
// Раскладку карточка выбирает по своей ширине (container query), а не по окну: она стоит и в узкой
// колонке сетки, и одна на всю ширину блока.
// - Узкая (M-5): плашка, ниже фото 92 px рядом с именем, остальное – под ними во всю ширину.
// - Широкая, от 544 px (D-5): фото 170 px слева, плашка, имя и остальное – колонкой справа. Порог – чтобы
//   пара карточек по 6 колонок на 1280 (560 px) была широкой, как в макете.

type TutorCardProps = {
  tutor: TutorCardData;
  /** Наклон фото, ±1,5°: соседние карточки наклонены в разные стороны, как в макете. */
  tilt?: number;
};

// Ссылки под кнопками – строки от 44 px, как в подвале.
const TEXT_LINK =
  'inline-flex min-h-11 items-center text-small underline underline-offset-4 hover:no-underline';

export function TutorCard({ tutor, tilt = -1.5 }: TutorCardProps) {
  const about = aboutName(tutor.namePrepositional);
  const page = tutorUrl(tutor.slug);
  const full = tutor.availability === 'full';

  return (
    <article className="@container h-full rounded-card border border-ink/12 bg-card">
      <div className="grid h-full grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto_1fr] items-center gap-x-4 gap-y-3.5 p-5 @[34rem]:items-start @[34rem]:gap-x-7 @[34rem]:gap-y-2.5 @[34rem]:p-7">
        <Badge
          status={tutor.availability}
          className="col-span-2 justify-self-start @[34rem]:col-span-1 @[34rem]:col-start-2 @[34rem]:row-start-1"
        />

        {/* Фото ведёт туда же, куда имя рядом: от дикторов и клавиатуры скрыто, чтобы не было двух
            одинаковых ссылок подряд. */}
        <Link
          href={page}
          tabIndex={-1}
          aria-hidden="true"
          className="col-start-1 row-start-2 block @[34rem]:row-span-3 @[34rem]:row-start-1"
        >
          <PhotoTape
            name={tutor.name}
            photo={tutor.photo ? { src: tutor.photo, alt: '' } : undefined}
            tilt={tilt}
            sizes="170px"
            className="w-23 @[34rem]:w-42.5"
          />
        </Link>

        <div className="col-start-2 row-start-2 flex min-w-0 flex-col gap-1.5 @[34rem]:gap-2.5">
          <h3 className="font-display text-h3 text-ink">
            {/* Зона нажатия растянута по высоте до 44 px, строка при этом не выше заголовка. */}
            <Link
              href={page}
              className="relative no-underline after:absolute after:inset-x-0 after:-inset-y-3 hover:underline"
            >
              {tutor.name}
            </Link>
          </h3>
          {tutor.subjectLines.map((line) => (
            <p key={line} className="text-small font-medium text-ink-muted">
              {line}
            </p>
          ))}
          <p className="text-small text-ink-2">{tutor.credentials}</p>
        </div>

        <div className="col-span-2 row-start-3 flex min-w-0 flex-col gap-3.5 self-stretch @[34rem]:col-span-1 @[34rem]:col-start-2 @[34rem]:gap-2.5">
          {/* Фраза о подходе – пометка от руки: Spectral Italic 18 px, межстрочный 1,35 из макета. */}
          <p className="font-hand text-hand-sm leading-[1.35] text-ink-2 italic">
            «{tutor.tagline}»
          </p>
          {/* Golos 600 17 px на всех ширинах – из ТЗ; роль text-body на телефоне – 16 px. */}
          <p className="text-[1.0625rem] font-semibold text-ink">
            {tutor.price} {CURRENCY}{' '}
            <span className="font-normal text-ink-muted">· {LESSON_LENGTH}</span>
          </p>

          {/* Кнопки прижаты к низу: в ряду сетки они стоят на одной линии у карточек разной высоты. */}
          <div className="mt-auto flex flex-col gap-2.5">
            <Button href={tutorLeadUrl(tutor.slug, { entry: 'tutors' })} size="md" fullWidth>
              {full ? (
                <span>
                  {WAITLIST_LABEL}
                  <span className="sr-only"> к {tutor.nameDative}</span>
                </span>
              ) : (
                leadLabel(tutor.nameDative)
              )}
            </Button>
            <MessengerButtons
              telegram={tutor.telegram}
              viber={tutor.viber}
              nameDative={tutor.nameDative}
            />
          </div>

          {/* Строки по 44 px выше текста – отрицательный отступ возвращает ритм макета. */}
          <div className="-my-2 flex flex-wrap gap-x-5">
            <Link href={page} className={`${TEXT_LINK} font-semibold text-ink`}>
              {MORE_LABEL}
              <span className="sr-only"> {about}</span>
            </Link>
            {tutor.reviewCount > 0 && (
              <Link
                href={tutorUrl(tutor.slug, 'reviews')}
                className={`${TEXT_LINK} font-medium text-accent-text`}
              >
                {pluralize(tutor.reviewCount, REVIEW_FORMS)}
                <span className="sr-only"> {about}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
