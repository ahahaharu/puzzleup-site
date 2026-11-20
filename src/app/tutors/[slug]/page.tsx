import { MDXContent } from '@content-collections/mdx/react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/SiteShell';
import { getPublishedReviews, getSite, getSubjects, getTutorBySlug, getTutors } from '@/content';
import { tutorMetadata, tutorPageData } from '@/features/tutor-page/page-data';
import { TutorPage } from '@/features/tutor-page/TutorPage';
import { currentYear } from '@/features/tutors/current-year';
import { leadLabel } from '@/features/tutors/texts';
import { tutorLeadUrl } from '@/lib/urls';

// Страница репетитора – ТЗ страницы репетитора. Статическая: по странице на каждый файл
// `content/tutors`, включая ушедших (раздел 6). Неизвестный адрес – 404 через `notFound()`:
// с Cache Components `dynamicParams = false` не поддерживается.

export function generateStaticParams() {
  return getTutors().map((tutor) => ({ slug: tutor.slug }));
}

export async function generateMetadata({ params }: PageProps<'/tutors/[slug]'>): Promise<Metadata> {
  const tutor = getTutorBySlug((await params).slug);
  if (!tutor) return {};
  const meta = tutorMetadata(tutor, getSubjects(), await currentYear());
  return {
    title: meta.title,
    description: meta.description,
    // Ушедший скрыт от поисковиков, ссылки с его страницы остаются (раздел 6, «Мета-теги»).
    robots: meta.noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function TutorRoute({ params }: PageProps<'/tutors/[slug]'>) {
  const tutor = getTutorBySlug((await params).slug);
  if (!tutor) notFound();

  const data = tutorPageData(tutor, {
    site: getSite(),
    subjects: getSubjects(),
    tutors: getTutors(),
    reviews: getPublishedReviews(),
    year: await currentYear(),
  });

  // Шапка и нижняя панель записывают к этому репетитору; у ушедшего – «Выбрать репетитора».
  const shell = tutor.archived
    ? { bottomBar: { showAfter: 'top', hideWhenVisible: 'more' } }
    : {
        cta: {
          label: leadLabel(tutor.nameDative),
          short: 'Записаться',
          href: tutorLeadUrl(tutor.slug, { entry: 'header' }),
        },
        bottomBar: {
          telegram: { value: tutor.telegram, nameDative: tutor.nameDative },
          showAfter: 'top',
          hideWhenVisible: 'lead',
        },
      };

  return (
    <SiteShell {...shell}>
      <TutorPage data={data} aboutText={<MDXContent code={tutor.mdx} />} />
    </SiteShell>
  );
}
