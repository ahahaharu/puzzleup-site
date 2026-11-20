import { joinWithAnd } from '@/lib/text';
import { shortTime } from '@/lib/time';

// Тексты блока «Как это работает» дословно из ТЗ главной, блок 3. Часы ответа и платформы
// занятий – из `site.json`: они меняются вместе с данными, а не с вёрсткой. Лид в ТЗ не задан –
// из макета D-3-how (ADR-044).

export const HOW_TITLE = 'Как это работает';

export const HOW_LEAD = 'Что будет после того, как вы оставите заявку';

export const HOW_CTA = 'Выбрать репетитора';

/** Плашка у шага пробного занятия – главный аргумент блока. */
export const FREE_BADGE = 'бесплатно';

export type HowStep = { title: string; text: string; highlight?: boolean };

type StepsData = {
  responseHours: { from: string; to: string };
  platforms: readonly string[];
};

export function howSteps({ responseHours, platforms }: StepsData): HowStep[] {
  const hours = `с ${shortTime(responseHours.from)} до ${shortTime(responseHours.to)}`;
  return [
    {
      title: 'Выбираете репетитора',
      text: 'По классу, подходу и отзывам – и оставляете заявку на его странице или пишете ему в Telegram или Viber. Это минута.',
    },
    {
      title: 'Репетитор пишет вам',
      text: `Сам, в выбранный мессенджер, обычно ${hours}. Договариваетесь о времени пробного занятия. Перед первым занятием репетитор просит подтвердить, что ребёнок учится в школе (справка или дневник).`,
    },
    {
      title: 'Пробное занятие',
      text: `30 минут, бесплатно. Онлайн в ${joinWithAnd(platforms)}. Репетитор знакомится с ребёнком и находит пробелы: ребёнок решает задачи своего уровня – без оценок и давления.`,
      highlight: true,
    },
    {
      title: 'Итог и план',
      text: 'Репетитор присылает итог сообщением: какие темы в порядке, где пробелы и с чего начать. Продолжать или нет – решаете вы.',
    },
    {
      title: 'Занятия',
      text: 'По цене репетитора, 60 минут, индивидуально и онлайн. Оплата – переводом напрямую репетитору, он присылает чек.',
    },
  ];
}

// Карточка «Пример итога пробного занятия» – ТЗ главной, блок 3; само сообщение – `site.trialExample`.

export const EXAMPLE_TITLE = 'Пример итога пробного занятия';

export const EXAMPLE_BADGE = 'пример';

export const EXAMPLE_SENDER_NOTE = 'сообщение родителю';

export const EXAMPLE_LABELS = {
  strong: 'Уверенно:',
  improve: 'Подтянуть:',
  startWith: 'Начнём с:',
} as const;
