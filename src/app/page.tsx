import { SiteShell } from '@/components/layout/SiteShell';
import { listedTutors } from '@/components/layout/texts';
import { getSite, getSubjects, getTutors } from '@/content';
import { Hero } from '@/features/home/hero/Hero';
import { heroBadge } from '@/features/home/hero/hero-badge';

export default function HomePage() {
  const site = getSite();

  return (
    <SiteShell home>
      <Hero badge={heroBadge(getSubjects(), listedTutors(getTutors()))} slogan={site.slogan} />
    </SiteShell>
  );
}
