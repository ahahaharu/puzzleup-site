import type { ReactNode } from 'react';

import { AboutTutor } from './AboutTutor';
import { HowToStart } from './HowToStart';
import { LeadSection } from './LeadSection';
import { More } from './More';
import { Outside } from './Outside';
import type { TutorPageData } from './page-data';
import { Profile } from './Profile';
import { TutorReviews } from './TutorReviews';

// Страница репетитора – ТЗ страницы репетитора, разделы 3 и 5: семь блоков между шапкой и подвалом,
// блок без данных не выводится. При «Мест нет» и у ушедшего «Другие репетиторы» – сразу под
// профилем; у ушедшего нет «Как начать» и формы.

type TutorPageProps = {
  data: TutorPageData;
  /** Текст «О себе» – тело MDX. */
  aboutText: ReactNode;
  /** Поля формы – LeadForm. */
  form?: ReactNode;
};

export function TutorPage({ data, aboutText, form }: TutorPageProps) {
  const more = data.more && <More more={data.more} />;

  return (
    <>
      <Profile profile={data.profile} />
      {data.moreFirst && more}
      <AboutTutor about={data.about}>{aboutText}</AboutTutor>
      <Outside outside={data.outside} />
      <TutorReviews title={data.reviews.title} reviews={data.reviews.items} />
      {data.how && <HowToStart how={data.how} />}
      {data.lead && <LeadSection lead={data.lead}>{form}</LeadSection>}
      {!data.moreFirst && more}
    </>
  );
}
