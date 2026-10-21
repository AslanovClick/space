import { LandingPage } from '@/components/LandingPage';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata('uk');

export default function Page() {
  return <LandingPage lang="uk" />;
}
