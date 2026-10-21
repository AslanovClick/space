import type { Dictionary } from '@/i18n';

export const BRAND = 'DOMAIN';

// Адрес сайта для canonical, hreflang, Open Graph, JSON-LD, robots.txt и sitemap.xml.
// NEXT_PUBLIC_SITE_URL — ручная настройка; на Vercel без неё берётся продакшен-домен проекта (*.vercel.app или свой)
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return 'https://' + vercel;
  return 'http://localhost:3000';
}

export const SITE_URL = resolveSiteUrl();

// абсолютный адрес страницы или файла сайта
export function absoluteUrl(path = '/'): string {
  return new URL(path, SITE_URL + '/').toString();
}

// версия кадров видео: МЕНЯТЬ при каждой перенарезке public/seq/* — иначе браузеры возьмут старые кадры из кэша
// (имена файлов те же: 000.webp, 001.webp…) и смешают их с новыми
export const SEQ_V = '48fps-1';

// тарифы: цены и иконки общие, тексты — из словаря
type PlanBase = { id: 'cosmic' | 'galactic' | 'supernova'; code: string; price: string; featured?: boolean };

const PLAN_BASE: PlanBase[] = [
  { id: 'cosmic', code: 'PLAN / 01', price: '59.99' },
  { id: 'galactic', code: 'PLAN / 02', price: '89.99', featured: true },
  { id: 'supernova', code: 'PLAN / 03', price: '159.99' },
];

export type Plan = PlanBase & Dictionary['plans']['items'][PlanBase['id']];

export function getPlans(t: Dictionary): Plan[] {
  return PLAN_BASE.map((p) => ({ ...p, ...t.plans.items[p.id] }));
}
