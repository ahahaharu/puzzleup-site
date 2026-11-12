import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Chip } from '@/components/ui/Chip';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { Doodle, DOODLE_SHAPES } from '@/components/ui/Doodle';
import { Field } from '@/components/ui/Field';
import { Icon, ICON_NAMES } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { MessengerButtons } from '@/components/ui/MessengerButtons';
import { PhotoTape } from '@/components/ui/PhotoTape';
import { PuzzlePiece } from '@/components/ui/PuzzlePiece';
import { PuzzleStep } from '@/components/ui/PuzzleStep';
import { SectionHead } from '@/components/ui/SectionHead';
import { Sheet } from '@/components/ui/Sheet';

// Витрина компонентов ДС для разработки и design-reviewer. Как /dev/tokens, есть только в
// `next dev`: в production-сборке страница отдаёт 404 (ADR-027). Данные – выдуманные.

export const metadata: Metadata = {
  title: 'Компоненты дизайн-системы',
  robots: { index: false, follow: false },
};

const TUTOR = { telegram: 'example_tutor', viber: '+375 29 000-00-00', nameDative: 'Андрею' };

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-6">
      <h2 id={`${id}-title`} className="font-display text-h3 text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="text-caption text-ink-muted">{children}</p>;
}

function Dark({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6 rounded-piece bg-ink p-5 lg:p-10">{children}</div>;
}

export default function UiKitPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="page-container flex flex-col gap-14 py-14 lg:gap-24 lg:py-24">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-h2 text-ink">Компоненты дизайн-системы</h1>
        <p className="max-w-3xl text-lead">
          Витрина для разработки: все компоненты <code>src/components/ui</code> в своих состояниях.
          Описание – <code>docs/design-system.md</code>, раздел 6.
        </p>
      </header>

      <Section id="buttons" title="Button">
        <Caption>
          primary · secondary · lg 56 px и md 48 px · неактивная · загрузка · с иконкой
        </Caption>
        <div className="flex flex-wrap items-center gap-4">
          <Button href="#buttons">Записаться на пробное занятие</Button>
          <Button href="#buttons" variant="secondary">
            Выбрать репетитора
          </Button>
          <Button size="md">Записаться к Андрею</Button>
          <Button size="md" variant="secondary" icon="arrow-right">
            Подробнее
          </Button>
          <Button disabled>Неактивная</Button>
        </div>
        <div className="flex max-w-md flex-col gap-4">
          <Button type="submit" variant="accent" fullWidth>
            Записаться на пробное занятие
          </Button>
          <Button type="submit" variant="accent" fullWidth loading>
            Записаться на пробное занятие
          </Button>
        </div>
        <Dark>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="onDark">Выбрать репетитора</Button>
            <Button variant="secondaryOnDark" size="md">
              Отправить ещё одну заявку
            </Button>
          </div>
        </Dark>
      </Section>

      <Section id="messengers" title="MessengerButtons">
        <Caption>
          short – карточка, action – профиль (широкая пара – «Написать в Telegram»), personal –
          «Спасибо». Пара тянется на всю ширину колонки и в колонке items-start.
        </Caption>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="max-w-82 rounded-card border border-ink/12 bg-card p-5">
            <MessengerButtons {...TUTOR} />
          </div>
          <div className="flex flex-col items-start gap-4">
            <Badge status="available" />
            <MessengerButtons {...TUTOR} label="action" size="lg" />
          </div>
        </div>
        <Dark>
          <MessengerButtons {...TUTOR} label="personal" tone="dark" />
        </Dark>
      </Section>

      <Section id="chips" title="Chip и ChoiceChip">
        <div className="flex flex-wrap items-center gap-2.5">
          <Chip>Математика</Chip>
          <Chip variant="dashed">и другие предметы</Chip>
          <Chip variant="outline">Онлайн · 5–11 класс</Chip>
          <Chip variant="kraft">Математика · 5–9 класс</Chip>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-caption font-medium text-ink">Как с вами связаться?</legend>
          <div className="flex flex-wrap gap-2">
            <ChoiceChip type="radio" name="contact-light" value="telegram" defaultChecked>
              Telegram
            </ChoiceChip>
            <ChoiceChip type="radio" name="contact-light" value="viber">
              Viber
            </ChoiceChip>
            <ChoiceChip type="radio" name="contact-light" value="call">
              Звонок
            </ChoiceChip>
            <ChoiceChip type="radio" name="contact-light" value="disabled" disabled>
              Неактивный
            </ChoiceChip>
          </div>
        </fieldset>
        <Dark>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-caption font-medium text-on-ink-label">Класс</legend>
            <div className="flex flex-wrap gap-2">
              {['5', '6', '7', '8', '9', '10', '11'].map((grade) => (
                <ChoiceChip
                  key={grade}
                  type="radio"
                  name="grade-dark"
                  value={grade}
                  tone="dark"
                  defaultChecked={grade === '10'}
                >
                  {grade}
                </ChoiceChip>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-caption font-medium text-on-ink-label">
              Когда удобно связаться
            </legend>
            <div className="flex flex-wrap gap-2">
              {['Утром', 'Днём', 'Вечером', 'В любое время'].map((time) => (
                <ChoiceChip
                  key={time}
                  type="checkbox"
                  name="time-dark"
                  value={time}
                  tone="dark"
                  defaultChecked={time === 'Вечером'}
                >
                  {time}
                </ChoiceChip>
              ))}
            </div>
          </fieldset>
        </Dark>
      </Section>

      <Section id="badges" title="Badge">
        <div className="flex flex-wrap gap-4">
          <Badge status="available" />
          <Badge status="few" />
          <Badge status="full" />
        </div>
      </Section>

      <Section id="fields" title="Field и Checkbox">
        <div className="grid gap-6 lg:grid-cols-3">
          <Field id="ui-name" label="Имя родителя" placeholder="Мария" autoComplete="off" />
          <Field
            id="ui-phone"
            type="tel"
            label="Телефон"
            hint="Мобильный номер с кодом 25, 29, 33 или 44"
            placeholder="+375 (29) 000-00-00"
            autoComplete="off"
          />
          <Field
            id="ui-phone-error"
            type="tel"
            label="Телефон"
            defaultValue="+375 (29) 00"
            error="Проверьте номер: +375 и 9 цифр, например +375 (29) 123-45-67"
            autoComplete="off"
          />
        </div>
        <Checkbox id="ui-consent-light" label="Согласен на обработку персональных данных" />
        <Dark>
          <div className="grid gap-6 lg:grid-cols-2">
            <Field id="ui-name-dark" label="Имя родителя" tone="dark" autoComplete="off" />
            <Field
              id="ui-name-dark-error"
              label="Имя родителя"
              tone="dark"
              defaultValue="Мария2"
              error="Имя может содержать только буквы, пробел и дефис"
              autoComplete="off"
            />
          </div>
          <Field
            id="ui-comment"
            label="Комментарий"
            hint="Не указывайте сведения о здоровье ребёнка"
            tone="dark"
            multiline
            rows={4}
          />
          <Checkbox
            id="ui-consent-dark"
            tone="dark"
            label="Согласен на обработку персональных данных (политика)"
            description="Мелкий текст под подписью: операторы, хранение, передача, срок."
          />
          <Checkbox
            id="ui-consent-error"
            tone="dark"
            label="Согласен на обработку персональных данных (политика)"
            error="Без согласия репетиторы не смогут обработать заявку"
          />
        </Dark>
      </Section>

      <Section id="sheets" title="Sheet">
        <ul className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
          <Sheet as="li" kind="cell" tilt={-1}>
            <p className="font-display text-h3">Математика</p>
            <p className="font-hand text-hand-lg italic">x² − 5x + 6 = 0</p>
          </Sheet>
          <Sheet as="li" kind="mm" tilt={1}>
            <p className="font-display text-h3">Физика</p>
            <p className="font-hand text-hand-lg italic">F = m · a</p>
          </Sheet>
          <Sheet as="li" kind="lined" tilt={-0.5}>
            <p className="font-display text-h3">Другой предмет</p>
            <p>Линейка с полями.</p>
          </Sheet>
          <Sheet as="li" kind="plain" tilt={0.8}>
            <p className="font-display text-h3">Чистый лист</p>
            <p>Без разметки.</p>
          </Sheet>
          <Sheet as="li" kind="slanted" tilt={-0.8}>
            <p className="font-display text-h3">Косая линейка</p>
            <p>Начальная школа, письмо.</p>
          </Sheet>
          <Sheet as="li" kind="staff" tilt={0.5}>
            <p className="font-display text-h3">Нотный стан</p>
            <p>Музыка.</p>
          </Sheet>
          <Sheet as="li" kind="margin" tilt={-0.3}>
            <p className="font-display text-h3">Лист с полями</p>
            <p>История, рисование.</p>
          </Sheet>
        </ul>
      </Section>

      <Section id="puzzle" title="PuzzlePiece, Logo, PuzzleStep">
        <div className="flex flex-wrap items-center gap-8">
          <PuzzlePiece size={64} className="text-accent" />
          <PuzzlePiece size={64} className="text-kraft" />
          <PuzzlePiece size={64} className="text-ink" />
          <Logo />
          <Logo size={40} />
          <span className="rounded-piece bg-ink p-4">
            <Logo tone="paper" />
          </span>
        </div>
        {/* Цепочка только горизонтальная: на телефоне – лента с прокруткой. */}
        <div
          role="region"
          aria-label="Шаги"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- ленту с прокруткой листают с клавиатуры (axe scrollable-region-focusable)
          tabIndex={0}
          className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0"
        >
          <ol className="grid w-[56rem] max-w-5xl grid-cols-4 md:w-auto">
            <li>
              <PuzzleStep n="01" title="Выбираете репетитора" tone="cell" right="knob">
                Заявка на странице репетитора.
              </PuzzleStep>
            </li>
            <li>
              <PuzzleStep n="02" title="Репетитор пишет вам" tone="sand" left="socket" right="knob">
                В выбранный мессенджер.
              </PuzzleStep>
            </li>
            <li>
              <PuzzleStep n="03" title="Пробное занятие" tone="ink" left="socket" right="knob">
                30 минут, бесплатно.
              </PuzzleStep>
            </li>
            <li>
              <PuzzleStep n="04" title="Итог и план" tone="accent" left="socket" right="flat">
                Решаете вы.
              </PuzzleStep>
            </li>
          </ol>
        </div>
      </Section>

      <Section id="doodles" title="Doodle и Icon">
        <div className="flex flex-wrap items-center gap-10">
          {DOODLE_SHAPES.map((shape) => (
            <Doodle key={shape} shape={shape} size={100} opacity={0.3} hideOnMobile={false} />
          ))}
        </div>
        <ul className="flex flex-wrap gap-6 text-ink">
          {ICON_NAMES.map((name) => (
            <li key={name} className="flex flex-col items-center gap-2">
              <Icon name={name} />
              <span className="text-caption text-ink-muted">{name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="section-head" title="SectionHead">
        <SectionHead
          title="Как это работает"
          lead="Что будет после того, как вы оставите заявку."
          number="01"
          dot
        />
      </Section>

      <Section id="photos" title="PhotoTape">
        <div className="flex flex-wrap items-start gap-12 px-4">
          <PhotoTape name="Андрей" sizes="170px" className="w-[170px]" />
          <PhotoTape name="Максим" tilt={1.2} sizes="170px" className="w-[170px]" />
          <PhotoTape name="Андрей" frame="lg" sizes="420px" className="w-full max-w-[420px]" />
        </div>
      </Section>
    </main>
  );
}
