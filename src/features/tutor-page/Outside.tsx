import { PUZZLE_PIECE_PATH } from '@/components/ui/PuzzlePiece';
import { reveal } from '@/lib/reveal';

import type { OutsideData } from './page-data';
import { OUTSIDE_TITLE } from './texts';

// Блок 3 «Вне занятий» – ТЗ страницы репетитора, раздел 4, блок 3; макеты T-3-outside, TM-3-outside.
// «Пометка на полях тетради»: лист в линейку с красной линией полей, Spectral Italic, набросок
// детали пазла в углу. До 720 px по центру, от 1024 px – поворот −0,5°.

// Линейка через 36 px – межстрочный текста; поле – 44 px от края. Цвета – токены, доли – из макета.
const SHEET =
  'bg-card bg-[linear-gradient(90deg,transparent_44px,color-mix(in_srgb,var(--color-accent)_60%,transparent)_44px_45px,transparent_45px),repeating-linear-gradient(transparent_0_35px,color-mix(in_srgb,var(--color-focus)_22%,transparent)_35px_36px)]';

export function Outside({ outside }: { outside: OutsideData }) {
  if (outside.paragraphs.length === 0) return null;

  return (
    <section aria-labelledby="outside-title" className="paper-section">
      <div className="page-container py-10 lg:py-18">
        <div
          {...reveal('paper')}
          className={`relative mx-auto max-w-180 rounded-field border border-ink/12 py-7 pr-6 pl-16 shadow-paper lg:-rotate-[0.5deg] lg:py-10 lg:pr-10 lg:pl-20 ${SHEET}`}
        >
          {/* Набросок от руки – один на всех: контур детали пазла. */}
          <svg
            viewBox="0 0 120 120"
            aria-hidden="true"
            focusable="false"
            className="absolute top-3 right-7 size-16 rotate-8 text-ink/45 lg:top-5"
          >
            <path
              d={PUZZLE_PIECE_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
          </svg>
          <h2
            id="outside-title"
            className="mb-3 pr-16 font-hand text-[1.625rem] leading-9 text-ink italic"
          >
            {OUTSIDE_TITLE}
          </h2>
          {/* Заголовок 26 px, текст 18 / 20 px – из ТЗ; набросок стоит над первой строкой, отступ справа – только у заголовка. */}
          <div className="flex flex-col gap-3 font-hand text-[1.125rem] leading-9 text-ink-2 italic lg:text-[1.25rem]">
            {outside.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
