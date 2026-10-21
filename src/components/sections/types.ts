import type { Dictionary, Lang } from '@/i18n';

// все секции страницы получают язык и словарь
export type SectionProps = { lang: Lang; t: Dictionary };
