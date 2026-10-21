/* «Готовые» положения скролла: после перезагрузки, по якорю и по Tab страница встаёт на целую секцию,
   а не на середину перехода (между панелями глав, внутри пинов Technology и тарифов).
   Зоны (глава/пин) дают свои точки; в обычном потоке точки — верх секций с [data-rest] и конец страницы. */
import { lenis, ScrollTrigger, U } from './core';

// зона от модуля секции: el, границы по скроллу и готовые точки (anchor — куда вести по якорю, если не на первую точку)
export type RestZone = { el: HTMLElement; start: number; end: number; points: number[]; anchor?: number };

const providers: (() => RestZone | null)[] = [];

function storageKey() {
  return 'domain-scroll:' + location.pathname;
}

function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function zones() {
  const out: RestZone[] = [];
  providers.forEach((fn) => {
    const z = fn();
    if (z) out.push(z);
  });
  return out;
}

function nearest(arr: number[], y: number) {
  let best = arr[0];
  let d = Infinity;
  arr.forEach((p) => {
    const dd = Math.abs(p - y);
    if (dd < d) {
      d = dd;
      best = p;
    }
  });
  return best;
}

// все готовые точки страницы
function points() {
  const max = maxScroll();
  let pts = [0, max];
  zones().forEach((z) => {
    pts = pts.concat(z.points);
  });
  U.$$('[data-rest]').forEach((el) => {
    pts.push(el.getBoundingClientRect().top + window.scrollY);
  });
  return pts.map((y) => U.clamp(y, 0, max));
}

// ближайшая готовая точка: внутри главы/пина — только её точки, в обычном потоке — любая
export function snap(y: number) {
  const zs = zones();
  for (let i = 0; i < zs.length; i++) {
    if (y >= zs[i].start - 1 && y <= zs[i].end + 1) return nearest(zs[i].points, y);
  }
  return nearest(points(), y);
}

export function go(y: number) {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
  ScrollTrigger.update();
}

function save() {
  try {
    sessionStorage.setItem(storageKey(), String(Math.round(window.scrollY)));
  } catch (e) {}
}

function navType() {
  const nav = performance.getEntriesByType ? (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined) : undefined;
  return nav ? nav.type : 'navigate';
}

// модуль секции (глава, пин) регистрирует свою зону
export function zone(fn: () => RestZone | null) {
  providers.push(fn);
}

// цель якорной ссылки: у главы/пина — её первая готовая точка (у тарифов — уже собранные карточки)
export function target(el: HTMLElement): number | HTMLElement {
  const zs = zones();
  for (let i = 0; i < zs.length; i++) {
    if (zs[i].el === el) return zs[i].anchor != null ? zs[i].anchor! : zs[i].points[0];
  }
  return el;
}

export function init() {
  window.addEventListener('pagehide', save);
  window.addEventListener('beforeunload', save);
}

// после перезагрузки (и «назад/вперёд») — на запомненное место, притянутое к готовой точке
export function restore() {
  const type = navType();
  if (type !== 'reload' && type !== 'back_forward') return;
  if (location.hash.length > 1) return;
  let y = NaN;
  try {
    y = parseFloat(sessionStorage.getItem(storageKey()) || '');
  } catch (e) {}
  if (y > 0) go(snap(Math.min(y, maxScroll())));
}

// перед показом страницы: если кто-то (например, dev-сервер) сдвинул скролл — снова на готовую точку
export function settle() {
  const y = window.scrollY;
  const s = snap(y);
  if (Math.abs(s - y) > 2) go(s);
}
