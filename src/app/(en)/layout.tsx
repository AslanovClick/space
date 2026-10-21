import type { ReactNode } from 'react';
import { RootDocument } from '@/components/RootDocument';
import { brandFonts } from '@/lib/fonts/brands';
import { latinFonts } from '@/lib/fonts/latin';
import { viewport as siteViewport } from '@/lib/seo';

export const viewport = siteViewport;

// корневой layout версии «en»: у каждого языка свой <html lang> и свой набор шрифтов
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootDocument lang="en" fontClassName={`${latinFonts} ${brandFonts}`}>
      {children}
    </RootDocument>
  );
}
