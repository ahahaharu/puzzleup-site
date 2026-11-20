import type { ReactNode } from 'react';

import { getLegal, getPublishedReviews, getSite, getSubjects, getTutors } from '@/content';

import { BottomBar } from './BottomBar';
import { Footer } from './Footer';
import { Header, type Cta } from './Header';
import { navData, navLinks } from './nav';
import { SamePageLinks } from './SamePageLinks';
import { MAIN_ID, SkipLink } from './SkipLink';
import { footerTexts, listedTutors, responseHoursLine } from './texts';

// Каркас страницы: ссылка «к содержанию», шапка, содержимое, подвал и нижняя панель на телефоне.
// Данные – из content/, компоненты получают их пропсами.

/** Документы подвала по порядку ТЗ (блок 10); страница без файла в content/legal не выводится. */
const DOCUMENTS = ['privacy', 'cookies'] as const;

type SiteShellProps = {
  children: ReactNode;
  /** Главная: пункты навигации – якоря этой страницы, подсвечивается текущий блок. */
  home?: boolean;
  /** Кнопка шапки, меню и нижней панели; по умолчанию – «Выбрать репетитора». */
  cta?: Cta;
  /** Нижняя панель: кнопка Telegram и блоки, по которым она появляется и прячется. */
  bottomBar?: {
    /** Своя кнопка панели – с `entry=bottom_bar`; по умолчанию – та же, что в шапке. */
    cta?: Cta;
    telegram?: { value: string; nameDative: string };
    showAfter: string;
    hideWhenVisible: string;
  };
};

export function SiteShell({ children, home = false, cta, bottomBar }: SiteShellProps) {
  const site = getSite();
  const tutors = listedTutors(getTutors());
  const links = navLinks(
    navData({ subjects: getSubjects(), tutors, reviews: getPublishedReviews() }),
    { onHome: home },
  );
  const action = cta ?? {
    label: 'Выбрать репетитора',
    short: 'Выбрать',
    href: home ? '#tutors' : '/#tutors',
  };
  const contacts = tutors.map(({ slug, name, nameDative, telegram, viber }) => ({
    slug,
    name,
    nameDative,
    telegram,
    viber,
  }));
  const documents = DOCUMENTS.flatMap((slug) => {
    const doc = getLegal(slug);
    return doc ? [{ title: doc.title, href: `/${slug}` }] : [];
  });

  return (
    <>
      <SkipLink />
      <Header
        links={links}
        spy={home}
        cta={action}
        menu={{ tutors: contacts, hoursLine: responseHoursLine(site.responseHours) }}
      />
      {/* tabIndex – чтобы ссылка «к содержанию» переносила фокус, а не только прокрутку. */}
      <main id={MAIN_ID} tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <Footer
        slogan={site.slogan}
        tagline={site.footer.tagline}
        links={links}
        tutors={contacts}
        documents={documents}
        {...footerTexts(site, tutors)}
      />
      <BottomBar
        cta={bottomBar?.cta ?? action}
        telegram={bottomBar?.telegram}
        showAfter={bottomBar?.showAfter ?? 'top'}
        hideWhenVisible={bottomBar?.hideWhenVisible ?? 'tutors'}
      />
      <SamePageLinks />
    </>
  );
}
