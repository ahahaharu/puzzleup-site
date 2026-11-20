import type { HowToStartData } from './page-data';
import { HOW_TITLE } from './texts';

// Блок 5 «Как начать» – ТЗ страницы репетитора, раздел 4, блок 5; макеты T-5-how, TM-5-how.
// Три шага в ряд от 1024 px, соединены пунктиром; на телефоне – столбиком. Под шагами – условия
// репетитора и подтверждение статуса ученика.

export function HowToStart({ how }: { how: HowToStartData }) {
  return (
    <section id="how" aria-labelledby="how-title" className="paper-page">
      <div className="page-container py-14 lg:py-24">
        <h2 id="how-title" className="font-display text-h2 text-ink">
          {HOW_TITLE}
        </h2>
        <ol className="mt-7 grid gap-7 lg:mt-12 lg:grid-cols-3 lg:gap-12">
          {how.steps.map((step, index) => (
            <li key={step.title} className="relative flex flex-col gap-2.5">
              {/* Номер – Spectral Italic 40 px accent-text; порядок для дикторов задаёт список. */}
              <span
                aria-hidden="true"
                className="font-hand text-[2.5rem] leading-none text-accent-text italic"
              >
                {index + 1}
              </span>
              {index < how.steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-5 -right-3 left-16 border-t-2 border-dashed border-ink/30 max-lg:hidden"
                />
              )}
              <h3 className="font-display text-h3 text-ink">{step.title}</h3>
              <p className="text-[1.0625rem] leading-[1.55] text-ink-2">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex max-w-3xl flex-col gap-2 text-body text-ink-2 lg:mt-12">
          <p>{how.terms}</p>
          <p>{how.school}</p>
        </div>
      </div>
    </section>
  );
}
