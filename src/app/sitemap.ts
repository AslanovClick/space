import type { MetadataRoute } from 'next';
import { LANG_ORDER, langHref } from '@/i18n';
import { absoluteUrl } from '@/lib/site';

// три языковые версии одной страницы, у каждой — ссылки на остальные (hreflang)
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LANG_ORDER.map((l) => [l, absoluteUrl(langHref(l))]));
  return LANG_ORDER.map((l) => ({
    url: absoluteUrl(langHref(l)),
    changeFrequency: 'monthly',
    priority: l === 'en' ? 1 : 0.8,
    alternates: { languages },
  }));
}
