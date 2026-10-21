import type { ReactNode } from 'react';
import { RootDocument } from '@/components/RootDocument';
import { brandFonts } from '@/lib/fonts/brands';
import { cyrillicFonts } from '@/lib/fonts/cyrillic';
import { viewport as siteViewport } from '@/lib/seo';

export const viewport = siteViewport;

// корневой layout версии «uk»: у каждого языка свой <html lang> и свой набор шрифтов
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootDocument lang="uk" fontClassName={`${cyrillicFonts} ${brandFonts}`}>
      {children}
    </RootDocument>
  );
}
