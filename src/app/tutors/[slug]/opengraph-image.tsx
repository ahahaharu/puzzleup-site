import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';

import { getSubjects, getTutorBySlug, getTutors } from '@/content';
import { ogColors, ogFonts, ogPhoto } from '@/features/seo/og/assets';
import { OG_SIZE, TutorOg } from '@/features/seo/og/OgImage';
import { tutorOgNote } from '@/features/seo/texts';
import { activeSubjects } from '@/features/tutor-page/page-data';
import { tutorSubtitle } from '@/features/tutor-page/texts';
import { tutorGrades } from '@/features/tutors/grades';

// OG-картинка страницы репетитора – ТЗ страницы репетитора, раздел 6; макет P-og. Рисуется при
// сборке для каждого файла `content/tutors`, включая ушедших.

export const contentType = 'image/png';
// Без `alt`: подпись с именем можно задать только через `generateImageMetadata`, а с ним Next 16.4
// не пререндерит картинку для страниц из `generateStaticParams` и рисует её на каждый запрос
// (ADR-055).
export const size = OG_SIZE;

// Параметры страницы `page.tsx` на соседний маршрут картинки не распространяются.
export function generateStaticParams() {
  return getTutors().map((tutor) => ({ slug: tutor.slug }));
}

function ogData(slug: string) {
  const tutor = getTutorBySlug(slug);
  if (!tutor) return undefined;
  const subjects = getSubjects();
  const active = activeSubjects(tutor, subjects);
  return {
    tutor,
    role: tutorSubtitle(active.map((subject) => subject.nameDativeWithPrep)),
    note: tutorOgNote(tutorGrades(tutor, subjects)),
  };
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const data = ogData((await params).slug);
  if (!data) notFound();
  const { tutor } = data;

  return new ImageResponse(
    <TutorOg
      colors={ogColors()}
      name={tutor.name}
      role={data.role}
      note={data.note}
      photo={tutor.photo ? ogPhoto(tutor.photo) : undefined}
    />,
    { ...OG_SIZE, fonts: ogFonts() },
  );
}
