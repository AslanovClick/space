import type { Metadata, Viewport } from 'next';
import { getDictionary, LANG_ORDER, LANGS, langHref, type Lang } from '@/i18n';
import { absoluteUrl, BRAND, getPlans, SITE_URL } from './site';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#05040b',
  colorScheme: 'dark',
};

const OG_IMAGE = '/img/og-image.jpg';

export function buildMetadata(lang: Lang): Metadata {
  const t = getDictionary(lang);
  const path = langHref(lang);
  const languages: Record<string, string> = {};
  LANG_ORDER.forEach((l) => {
    languages[l] = langHref(l);
  });
  languages['x-default'] = '/';

  return {
    metadataBase: new URL(SITE_URL),
    title: t.meta.title,
    description: t.meta.description,
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    alternates: { canonical: path, languages },
    openGraph: {
      type: 'website',
      siteName: BRAND,
      locale: LANGS[lang].locale,
      alternateLocale: LANG_ORDER.filter((l) => l !== lang).map((l) => LANGS[l].locale),
      url: path,
      title: t.meta.title,
      description: t.meta.description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: t.meta.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.meta.title,
      description: t.meta.description,
      images: [{ url: OG_IMAGE, alt: t.meta.imageAlt }],
    },
    icons: {
      icon: [
        { url: '/img/favicon.svg', type: 'image/svg+xml' },
        { url: '/img/icon-192.png', type: 'image/png', sizes: '192x192' },
      ],
      apple: '/img/apple-touch-icon.png',
    },
  };
}

// структурированные данные для поисковиков
export function buildJsonLd(lang: Lang) {
  const t = getDictionary(lang);
  const site = absoluteUrl('/');
  const page = absoluteUrl(langHref(lang));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': site + '#organization',
        name: BRAND,
        url: site,
        logo: absoluteUrl('/img/icon-512.png'),
        slogan: t.meta.slogan,
        description: t.meta.description,
      },
      {
        '@type': 'WebSite',
        '@id': site + '#website',
        url: site,
        name: BRAND,
        inLanguage: LANG_ORDER,
        publisher: { '@id': site + '#organization' },
      },
      {
        '@type': 'Service',
        '@id': page + '#internet',
        serviceType: t.meta.service,
        name: BRAND + ' Premium Internet',
        inLanguage: lang,
        provider: { '@id': site + '#organization' },
        areaServed: 'Worldwide',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: t.nav.plans,
          itemListElement: getPlans(t).map((p) => ({
            '@type': 'Offer',
            name: p.name,
            description: p.speed + '. ' + p.list.join(', ') + '.',
            url: page + '#plans',
            price: p.price,
            priceCurrency: 'USD',
            priceSpecification: { '@type': 'UnitPriceSpecification', price: p.price, priceCurrency: 'USD', unitText: 'MONTH' },
            itemOffered: { '@type': 'Service', name: BRAND + ' ' + p.name + ' (' + p.speed + ')' },
          })),
        },
      },
    ],
  };
}

// JSON для <script type="application/ld+json">: «<» экранируется, чтобы строка не закрыла тег
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
