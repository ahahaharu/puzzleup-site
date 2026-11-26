import { MDXContent } from '@content-collections/mdx/react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/SiteShell';
import { getPublishedReviews, getSite, getSubjects, getTutorBySlug, getTutors } from '@/content';
import { leadFormData } from '@/features/lead-form/form-data';
import { LeadForm } from '@/features/lead-form/LeadForm';
import { personJsonLd, tutorBreadcrumbJsonLd } from '@/features/seo/json-ld';
import { JsonLd } from '@/features/seo/JsonLd';
import { pageMetadata } from '@/features/seo/metadata';
import { tutorMetadata, tutorPageData } from '@/features/tutor-page/page-data';
import { tutorShell } from '@/features/tutor-page/shell';
import { TutorPage } from '@/features/tutor-page/TutorPage';
import { currentYear } from '@/features/tutors/current-year';
import { withAvailability } from '@/lib/availability';
import { tutorUrl } from '@/lib/urls';
import { getAvailability } from '@/server/availability/cache';

// Страница репетитора – ТЗ страницы репетитора. Статическая: по странице на каждый файл
// `content/tutors`, включая ушедших (раздел 6). Неизвестный адрес – 404 через `notFound()`:
// с Cache Components `dynamicParams = false` не поддерживается. `ensureStatic = 'navigation'`
// держит страницу целиком статической и не отдаёт неизвестному адресу оболочку с кодом 200.

export const ensureStatic = 'navigation';

export function generateStaticParams() {
  return getTutors().map((tutor) => ({ slug: tutor.slug }));
}

export async function generateMetadata({ params }: PageProps<'/tutors/[slug]'>): Promise<Metadata> {
  const tutor = getTutorBySlug((await params).slug);
  if (!tutor) return {};
  const meta = tutorMetadata(tutor, getSubjects(), await currentYear());
  return {
    ...pageMetadata({
      siteName: getSite().name,
      path: tutorUrl(tutor.slug),
      title: meta.title,
      description: meta.description,
    }),
    // Ушедший скрыт от поисковиков, ссылки с его страницы остаются (раздел 6, «Мета-теги»).
    robots: meta.noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function TutorRoute({ params }: PageProps<'/tutors/[slug]'>) {
  const slug = (await params).slug;
  // Статус занятости – из базы поверх начального из MDX (ТЗ страницы репетитора, раздел 5).
  const tutors = withAvailability(getTutors(), await getAvailability());
  const tutor = tutors.find((candidate) => candidate.slug === slug);
  if (!tutor) notFound();

  const site = getSite();
  const subjects = getSubjects();
  const data = tutorPageData(tutor, {
    site,
    subjects,
    tutors,
    reviews: getPublishedReviews(),
    year: await currentYear(),
  });

  return (
    <SiteShell {...tutorShell(tutor)}>
      <JsonLd data={personJsonLd(tutor, subjects, site.url)} />
      <JsonLd data={tutorBreadcrumbJsonLd(tutor, site.url)} />
      <TutorPage
        data={data}
        aboutText={<MDXContent code={tutor.mdx} />}
        form={<LeadForm data={leadFormData(tutor, { site, subjects, tutors })} />}
      />
    </SiteShell>
  );
}
