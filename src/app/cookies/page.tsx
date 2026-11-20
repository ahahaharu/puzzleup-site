import { legalMetadata, LegalRoute } from '@/features/legal/route';

export const metadata = legalMetadata('cookies');

export default function CookiesPage() {
  return <LegalRoute slug="cookies" />;
}
