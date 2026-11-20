import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { SectionHead } from '@/components/ui/SectionHead';
import { cn } from '@/lib/cn';

import { subjectColumns, type SubjectCardData } from './cards';
import { SUBJECTS_LEAD, SUBJECTS_TITLE, TAUGHT_BY } from './texts';

// Блок «Предметы» – ТЗ главной, блок 4; макеты D-4-subjects, M-4-subjects.
// Колонки зависят от числа предметов, карточка – от своей ширины (container query): широкая, от
// 768 px, – «кусок тетради» слева 360 px (D-4, один предмет на десктопе), узкая – сверху.

type SubjectsProps = {
  /** Якорь блока; другой – только на витрине /dev/sections, где блоков несколько. */
  id?: string;
  subjects: readonly SubjectCardData[];
};

// Минимальная ширина карточки – 320 px (ТЗ): три в ряд – только от 1280, на 768–1279 – по две.
const COLUMNS = { 1: '', 2: 'md:grid-cols-2', 3: 'md:grid-cols-2 xl:grid-cols-3' } as const;

// Бумаги ДС (раздел 4) – те же значения, что `paper` у предмета.
const PAPER = {
  cell: 'paper-cell',
  mm: 'paper-mm',
  lined: 'paper-lined',
  slanted: 'paper-slanted',
  staff: 'paper-staff',
  margin: 'paper-margin',
  plain: 'paper-plain',
} as const satisfies Record<SubjectCardData['paper'], string>;

function SubjectCard({ subject }: { subject: SubjectCardData }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-ink/12 bg-card shadow-paper @[48rem]:flex-row">
      <div
        className={cn(
          PAPER[subject.paper],
          'flex h-30 flex-none items-center justify-center border-b border-ink/12 @[24rem]:h-35 @[48rem]:h-auto @[48rem]:w-90 @[48rem]:border-r @[48rem]:border-b-0',
        )}
      >
        {/* Формула – декор «от руки»: 28–34 px, ТЗ, «Карточка предмета». */}
        <span
          aria-hidden="true"
          className="-rotate-2 font-hand text-[1.75rem] leading-[1.1] text-ink italic @[48rem]:text-[2.125rem]"
        >
          {subject.formula}
        </span>
      </div>

      <div className="flex min-w-0 grow flex-col gap-3.5 p-5 @[48rem]:gap-4 @[48rem]:p-8">
        <div className="flex flex-wrap items-center gap-2.5 @[48rem]:gap-3">
          {/* 24 px на десктопе – ТЗ, «Карточка предмета». */}
          <h3 className="font-display text-[1.25rem] leading-tight font-medium text-ink @[48rem]:text-[1.5rem]">
            {subject.title}
          </h3>
          <span className="rounded-full bg-kraft px-3 py-1 text-caption font-medium text-ink">
            {subject.grades}
          </span>
        </div>
        {/* Строка рвётся только между темами: «ЦТ и ЦЭ» не разваливается на две строки. */}
        <p className="text-small leading-relaxed text-ink-2">
          {subject.topics.map((topic, index) => (
            <span key={topic}>
              {index > 0 && ' · '}
              <span className="whitespace-nowrap">{topic}</span>
            </span>
          ))}
        </p>
        <div className="flex flex-col items-start gap-x-6 text-small text-ink-muted @[30rem]:flex-row @[30rem]:flex-wrap @[30rem]:items-center">
          <span>{TAUGHT_BY}</span>
          {subject.tutors.map((tutor) => (
            <Link
              key={tutor.slug}
              href={tutor.href}
              className="inline-flex min-h-11 items-center gap-1.5 text-field font-semibold text-ink no-underline hover:underline"
            >
              {tutor.name} <span className="font-normal text-ink-muted">· {tutor.grades}</span>
              <Icon name="arrow-right" size={18} />
            </Link>
          ))}
        </div>
        <div className="mt-auto pt-1">
          {/* Подпись длинная – на узкой карточке переносится, а не вылезает за край. */}
          <Button
            href={subject.ctaHref}
            size="md"
            fullWidth
            className="py-3 text-center whitespace-normal @[30rem]:w-auto"
          >
            {subject.ctaLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function Subjects({ subjects, id = 'subjects' }: SubjectsProps) {
  // Блок без данных не выводится.
  if (subjects.length === 0) return null;

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="paper-page">
      <div className="page-container py-14 lg:py-24">
        <SectionHead id={`${id}-title`} title={SUBJECTS_TITLE} lead={SUBJECTS_LEAD} />
        <ul
          className={cn(
            'mt-6 grid gap-4 md:gap-6 lg:mt-10 xl:gap-8',
            COLUMNS[subjectColumns(subjects.length)],
          )}
        >
          {subjects.map((subject) => (
            <li key={subject.id} className="@container">
              <SubjectCard subject={subject} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
