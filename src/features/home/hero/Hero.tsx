import { Button } from '@/components/ui/Button';
import { Doodle } from '@/components/ui/Doodle';
import { MarginNote } from '@/components/ui/MarginNote';

import { HeroIllustration } from './HeroIllustration';
import { HERO_CTA, HERO_FACTS, HERO_LEAD, HERO_NOTE, splitSlogan } from './texts';

// Первый экран главной – ТЗ главной, блок 1 (вариант A5); макеты D-1-hero, M-0-1-hero.
// Десктоп: текст на 7 колонок, иллюстрация на 5, факты в ряд под ними. До 1024 px – одна колонка:
// иллюстрация по центру под кнопкой (400 px на планшете, 280 px на телефоне).

type HeroProps = {
  /** H1 страницы – собирается из данных (`heroBadge`). */
  badge: string;
  slogan: string;
};

export function Hero({ badge, slogan }: HeroProps) {
  const { lines, dot } = splitSlogan(slogan);

  return (
    <section id="top" className="relative isolate overflow-clip">
      <div className="relative page-container pt-6 pb-9 lg:pt-10 lg:pb-10">
        <div className="page-grid items-center gap-y-5 lg:gap-y-0">
          <div className="relative col-span-full flex flex-col items-start gap-5 lg:col-span-7 lg:gap-7">
            {/* Пометки на полях – только от 1024 px, в свободных местах рядом с текстом. */}
            <MarginNote size="sm" className="absolute top-26 left-76 -z-10 rotate-3 max-lg:hidden">
              sin²α + cos²α = 1
            </MarginNote>
            <MarginNote className="absolute right-4 bottom-12 -z-10 -rotate-3 max-lg:hidden">
              D = b² − 4ac
            </MarginNote>

            {/* Рамка ink 25 %, Golos 500 15 px на всех ширинах (ТЗ; в M-0-1-hero – 14 px). */}
            <h1 className="rounded-full border border-ink/25 bg-paper px-3 py-1.5 text-small font-medium text-balance text-ink md:px-3.5 md:py-2">
              {/* Диапазон классов «5–11» не разрывается на тире. */}
              {badge.split(/(\d+–\d+)/).map((part, index) =>
                index % 2 === 1 ? (
                  <span key={index} className="whitespace-nowrap">
                    {part}
                  </span>
                ) : (
                  part
                ),
              )}
            </h1>

            {/* Слоган – декоративный абзац, не заголовок (ТЗ, раздел 8). */}
            <p className="font-display text-slogan text-ink">
              {lines.map((line, index) => (
                <span key={index} className="block">
                  {line}
                  {index === lines.length - 1 && dot ? (
                    <span className="text-accent">{dot}</span>
                  ) : null}
                </span>
              ))}
            </p>

            <p className="max-w-130 text-lead text-ink-2">{HERO_LEAD}</p>

            <Button href="#tutors" size="lg" className="max-md:self-stretch">
              {HERO_CTA}
            </Button>

            <p className="text-caption text-ink-muted">{HERO_NOTE}</p>
          </div>

          <div className="col-span-full flex justify-center lg:col-span-5">
            <HeroIllustration className="w-70 md:w-100 lg:w-full lg:max-w-130" />
          </div>
        </div>

        {/* На 1024 три факта помещаются в строку только с промежутком 24 px, от 1280 – 48 px (макет). */}
        <ul className="mt-5 flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-6 lg:mt-7 lg:flex lg:flex-row xl:gap-12">
          {HERO_FACTS.map((fact, index) => (
            <li key={fact} className="flex items-baseline gap-3">
              {/* Номер – декор: порядок фактов не важен для смысла. Spectral 22 px – из ТЗ. */}
              <span
                aria-hidden="true"
                className="flex-none font-hand text-[1.375rem] leading-none text-accent-text italic"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              {/* Golos 500 16 px на всех ширинах – из ТЗ; роль text-body на десктопе – 17 px. */}
              <span className="text-[1rem] leading-[1.45] font-medium text-ink">{fact}</span>
            </li>
          ))}
        </ul>

        <Doodle
          shape="cube"
          size={76}
          className="absolute right-16 bottom-6 -z-10 rotate-6 max-xl:hidden"
        />
      </div>
    </section>
  );
}
