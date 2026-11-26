import { ImageResponse } from 'next/og';

import { listedTutors } from '@/components/layout/texts';
import { getSite, getSubjects, getTutors } from '@/content';
import { badgeNames, heroBadgeTitle } from '@/features/home/hero/hero-badge';
import { ogColors, ogFonts } from '@/features/seo/og/assets';
import { HomeOg, OG_SIZE } from '@/features/seo/og/OgImage';

// OG-картинка главной – по шаблону P-og без фото (ADR-055). Лежит в корне: её же получают
// политики; у страницы репетитора своя.

export const contentType = 'image/png';
export const size = OG_SIZE;
export const alt = heroBadgeTitle(getSubjects(), listedTutors(getTutors()).length);

export default function Image() {
  const tutors = listedTutors(getTutors());
  return new ImageResponse(
    <HomeOg
      colors={ogColors()}
      slogan={getSite().slogan}
      title={heroBadgeTitle(getSubjects(), tutors.length)}
      names={badgeNames(tutors)}
    />,
    { ...OG_SIZE, fonts: ogFonts() },
  );
}
