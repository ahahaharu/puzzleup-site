import { Button } from '@/components/ui/Button';
import { Doodle } from '@/components/ui/Doodle';
import { SectionHead } from '@/components/ui/SectionHead';
import { cn } from '@/lib/cn';

import {
  EXAMPLE_BADGE,
  EXAMPLE_LABELS,
  EXAMPLE_SENDER_NOTE,
  EXAMPLE_TITLE,
  FREE_BADGE,
  HOW_CTA,
  HOW_LEAD,
  HOW_TITLE,
  type HowStep,
} from './texts';

// Блок «Как это работает» – ТЗ главной, блок 3; макеты D-3-how, M-3-how.
// - От 1024 px: шаги слева (7 колонок), справа – пример итога, закреплён при прокрутке.
// - Уже: шаги, под ними пример без закрепления, кнопка – последней.

export type TrialExample = {
  name: string;
  intro: string;
  strong: string;
  improve: string;
  startWith: string;
  offer: string;
};

type HowProps = {
  steps: readonly HowStep[];
  /** Пример итога; без него карточки нет. */
  example?: TrialExample | undefined;
};

function Example({ example }: { example: TrialExample }) {
  const lines = [
    [EXAMPLE_LABELS.strong, example.strong],
    [EXAMPLE_LABELS.improve, example.improve],
    [EXAMPLE_LABELS.startWith, example.startWith],
  ] as const;

  return (
    <div className="rounded-card border border-ink/12 bg-card p-5 shadow-paper lg:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-h3 text-ink">{EXAMPLE_TITLE}</h3>
        <span className="flex-none rounded-full bg-kraft px-3 py-1 text-caption font-semibold text-ink">
          {EXAMPLE_BADGE}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 flex-none items-center justify-center rounded-full bg-kraft font-display text-caption font-bold text-ink"
        >
          {example.name.charAt(0)}
        </span>
        <p className="flex flex-col">
          <span className="text-field font-semibold text-ink">{example.name}</span>
          <span className="text-caption text-ink-muted">{EXAMPLE_SENDER_NOTE}</span>
        </p>
      </div>
      {/* Пузырь сообщения: острый угол – у отправителя, без логотипов мессенджеров (ТЗ). */}
      <div className="mt-3.5 flex flex-col gap-3 rounded-[4px_16px_16px_16px] bg-paper p-4 text-small text-ink-2">
        <p>{example.intro}</p>
        {lines.map(([label, value]) => (
          <p key={label}>
            <b className="font-semibold text-ink">{label}</b> {value}
          </p>
        ))}
        <p>{example.offer}</p>
      </div>
    </div>
  );
}

export function How({ steps, example }: HowProps) {
  return (
    <section id="how" aria-labelledby="how-title" className="isolate paper-section">
      <div className="relative page-container py-14 lg:py-24">
        <Doodle
          shape="lever"
          size={110}
          opacity={0.13}
          className="absolute top-14 right-12 -z-10 rotate-6 max-xl:hidden"
        />
        <SectionHead id="how-title" title={HOW_TITLE} lead={HOW_LEAD} />

        <div className="mt-8 page-grid gap-y-8 lg:mt-12 lg:gap-y-10">
          <ol className="col-span-full flex flex-col gap-9 lg:col-span-7 lg:gap-12">
            {steps.map((step, index) => (
              <li key={step.title}>
                <div
                  className={cn(
                    'relative flex gap-2 lg:gap-3',
                    // Подложка шага сдвинута влево, правый край – внутри колонки, как в D-3 и M-3.
                    step.highlight &&
                      '-my-3.5 mr-1 -ml-1 rounded-card bg-kraft p-3.5 lg:-my-5 lg:mr-5 lg:-ml-5 lg:p-5',
                  )}
                >
                  {/* Номер – оформление, порядок задаёт <ol>. 40 px на десктопе – ТЗ. */}
                  <span
                    aria-hidden="true"
                    className="w-11 flex-none font-hand text-[2rem] leading-none text-accent-text italic lg:w-10 lg:text-[2.5rem]"
                  >
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-col gap-2">
                    <h3 className="font-display text-h3 text-ink">
                      {step.title}
                      {step.highlight && (
                        <span className="ml-2.5 inline-block rounded-full bg-accent-strong px-3 py-1 align-middle font-sans text-caption font-semibold text-white">
                          {FREE_BADGE}
                        </span>
                      )}
                    </h3>
                    <p className="text-body text-ink-2">{step.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {example && (
            <div className="col-span-full self-start lg:sticky lg:top-28 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
              <Example example={example} />
            </div>
          )}

          <div className="col-span-full lg:col-span-7 lg:row-start-2">
            <Button href="#tutors" fullWidth className="md:w-auto">
              {HOW_CTA}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
