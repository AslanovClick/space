import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import type { Lang } from '@/i18n';
import { SEQ_V } from '@/lib/site';
import '@/styles/main.scss';

// корень помнит выбранный язык: вернувшегося посетителя ведём на его версию (поисковиков это не касается)
const LANG_REDIRECT =
  "try{var l=localStorage.getItem('domain-lang');if(l==='ru'||l==='uk')location.replace('/'+l+'/'+location.hash)}catch(e){}";

// .js — до первой отрисовки: CSS прячет то, что будет анимироваться, и показывает прелоадер;
// если движок так и не запустился (ошибка, нет сети) — через 12 с показываем страницу как есть
const BOOT_FLAGS =
  "document.documentElement.classList.add('js');" +
  "setTimeout(function(){if(!window.__engineBooted)document.documentElement.classList.add('is-loaded')},12000);";

type Props = { lang: Lang; fontClassName: string; children: ReactNode };

// Общий <html> для трёх корневых layout (en, ru, uk). Классы .js/.is-ready/.is-loaded/.lenis на <html>
// ставят скрипты, поэтому расхождение атрибутов при гидратации здесь ожидаемо
export function RootDocument({ lang, fontClassName, children }: Props) {
  // первый кадр сцены: HD-набор (1920) для десктопа, SD (1280) — для остальных; то же условие в engine/chapters.ts
  preload(`/seq/void-hd/000.webp?v=${SEQ_V}`, { as: 'image', fetchPriority: 'high', media: '(min-width: 1025px)' });
  preload(`/seq/void-sd/000.webp?v=${SEQ_V}`, { as: 'image', fetchPriority: 'high', media: '(max-width: 1024px)' });

  return (
    <html lang={lang} className={fontClassName} suppressHydrationWarning>
      <head>
        {lang === 'en' && <script dangerouslySetInnerHTML={{ __html: LANG_REDIRECT }} />}
        <script dangerouslySetInnerHTML={{ __html: BOOT_FLAGS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
