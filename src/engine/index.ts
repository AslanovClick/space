/* Точка входа движка: порядок запуска модулей, прелоадер, ScrollTrigger'ы после загрузки шрифтов */
import type { EngineStrings } from '@/i18n';
import * as chapters from './chapters';
import { initCore, lenis, onResize, ScrollTrigger, setLocale } from './core';
import * as cursor from './cursor';
import * as preloader from './preloader';
import * as rest from './rest';
import type { Sequence } from './sequence';
import * as stars from './stars';
import * as text from './text';
import * as ui from './ui';

export type BootOptions = { intl: string; strings: EngineStrings };

declare global {
  interface Window {
    // движок запустился — аварийный таймер из <head> (RootDocument) не нужен
    __engineBooted?: boolean;
  }
}

export function boot({ intl, strings }: BootOptions) {
  if (window.__engineBooted) return;
  const html = document.documentElement;
  setLocale(intl, strings);

  let seq: Sequence;
  try {
    initCore();
    stars.init();
    seq = chapters.init();
    ui.init();
    cursor.init();
    rest.init();
  } catch (e) {
    console.error(e);
    html.classList.add('is-loaded');
    return;
  }
  window.__engineBooted = true;

  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const fontsSafe = Promise.race([fonts, new Promise((r) => setTimeout(r, 3000))]);

  // всё, что меряет текст, — после шрифтов; ScrollTrigger'ы — строго в порядке секций (пины сдвигают всё ниже)
  fontsSafe.then(() => {
    try {
      chapters.buildVoid();
      ui.tech();
      chapters.buildOrbit();
      ui.plans();
      ui.perks();
      ui.cta();
      ui.footer();
      ui.nav();
      onResize(text.refresh);
      ScrollTrigger.refresh();
      // после перезагрузки — на запомненную секцию, но в её «готовом» состоянии
      rest.restore();
    } catch (e) {
      console.error(e);
    }
    html.classList.add('is-ready');
  });

  // пока идёт загрузка, страница для скринридеров «занята»
  const main = document.getElementById('main');
  if (main) main.setAttribute('aria-busy', 'true');

  preloader.run(seq, fontsSafe, () => {
    rest.settle();
    if (lenis) lenis.start();
    if (main) main.removeAttribute('aria-busy');
    chapters.playHero();
  });
}
