import { LandingPage } from '@/components/LandingPage';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata('en');

export default function Page() {
  return <LandingPage lang="en" />;
}
