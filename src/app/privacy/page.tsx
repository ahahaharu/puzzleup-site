import { legalMetadata, LegalRoute } from '@/features/legal/route';

export const metadata = legalMetadata('privacy');

export default function PrivacyPage() {
  return <LegalRoute slug="privacy" />;
}
