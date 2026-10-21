// Языки сайта: en — корень, ru — /ru/, uk — /uk/
export const LANG_ORDER = ['en', 'ru', 'uk'] as const;

export type Lang = (typeof LANG_ORDER)[number];

type LangInfo = { code: string; name: string; locale: string; intl: string; path: string };

export const LANGS: Record<Lang, LangInfo> = {
  en: { code: 'EN', name: 'English', locale: 'en_US', intl: 'en-US', path: '' },
  ru: { code: 'RU', name: 'Русский', locale: 'ru_RU', intl: 'ru-RU', path: 'ru/' },
  uk: { code: 'UA', name: 'Українська', locale: 'uk_UA', intl: 'uk-UA', path: 'uk/' },
};

// адрес версии сайта на языке l (корневой путь, со слешем на конце — см. trailingSlash в next.config.ts)
export function langHref(l: Lang): string {
  return '/' + LANGS[l].path;
}

// числа по правилам языка: 4,200 / 4 200; 99.99 / 99,99
export function formatNum(lang: Lang, v: number | string, dec = 0, group = false): string {
  return new Intl.NumberFormat(LANGS[lang].intl, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
    useGrouping: group,
  }).format(typeof v === 'string' ? parseFloat(v) : v);
}
