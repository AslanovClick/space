/* Ядро: конфиг, общее состояние, плавный скролл (Lenis) и единый цикл кадров на тикере GSAP */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { EngineStrings } from '@/i18n';

export { gsap, ScrollTrigger };

export const config = {
  // HUD-прицел во 2-м видео: [секунда видео, x, y (доли кадра), ширина рамки (доля ширины кадра)]
  reticle: [
    [2.3, 0.496, 0.5, 0.16], [4, 0.5, 0.49, 0.17], [5, 0.49, 0.48, 0.2], [6, 0.497, 0.46, 0.25],
    [6.5, 0.49, 0.47, 0.29], [7, 0.497, 0.485, 0.32], [7.5, 0.475, 0.475, 0.35], [8, 0.483, 0.48, 0.38],
    [8.5, 0.5, 0.45, 0.45], [9, 0.48, 0.46, 0.5], [9.5, 0.485, 0.42, 0.56], [9.9, 0.45, 0.5, 0.6],
  ] as [number, number, number, number][],
  reticleFrom: 2.3,
  reticleTo: 9.7,
};

// ---------- строки интерфейса и числа по правилам языка страницы (приходят из словаря через <Engine>) ----------
let strings = {} as EngineStrings;
let intl = 'en-US';
let numFormats: Record<string, { format: (v: number) => string }> = {};

export function setLocale(locale: string, dict: EngineStrings) {
  intl = locale;
  strings = dict;
  numFormats = {};
}

export function t<K extends keyof EngineStrings>(key: K): EngineStrings[K] {
  return strings[key];
}

export function num(v: number, dec = 0, group = false): string {
  const k = dec + (group ? 'g' : '');
  if (!numFormats[k]) {
    try {
      numFormats[k] = new Intl.NumberFormat(intl, { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: group });
    } catch (e) {
      numFormats[k] = { format: (x: number) => x.toFixed(dec) };
    }
  }
  return numFormats[k].format(v);
}

// ---------- утилиты ----------
export const U = {
  clamp: (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v),
  lerp: (a: number, b: number, t: number) => a + (b - a) * t,
  range: (v: number, a: number, b: number) => U.clamp((v - a) / (b - a), 0, 1),
  damp: (a: number, b: number, lambda: number, dt: number) => U.lerp(a, b, 1 - Math.exp(-lambda * dt)),
  $: <T extends Element = HTMLElement>(s: string, ctx?: ParentNode | null): T | null => (ctx || document).querySelector<T>(s),
  $$: <T extends Element = HTMLElement>(s: string, ctx?: ParentNode | null): T[] =>
    Array.prototype.slice.call((ctx || document).querySelectorAll<T>(s)),
};

// ---------- общее состояние ----------
export const S = {
  vw: 0,
  vh: 0,
  dpr: 1,
  isMobile: false,
  isTouch: false,
  reduced: false,
  scroll: 0,
  time: 0,
  covered: false, // сцена с видео закрывает экран — звёздам под ней рисоваться незачем
  mouse: { x: 0, y: 0, sx: 0, sy: 0 },
};

export let lenis: Lenis | null = null;

type FrameFn = (time: number, dt: number) => void;

const reads: FrameFn[] = [];
const ticks: FrameFn[] = [];
const resizers: (() => void)[] = [];

// read — только чтение layout (getBoundingClientRect), tick — запись стилей и рендер
export const onRead = (fn: FrameFn) => { reads.push(fn); };
export const onTick = (fn: FrameFn) => { ticks.push(fn); };
export const onResize = (fn: () => void) => { resizers.push(fn); };

function measure() {
  S.vw = window.innerWidth;
  S.vh = window.innerHeight;
  S.isMobile = S.vw < 768 || S.vw / S.vh < 0.8;
  S.dpr = Math.min(window.devicePixelRatio || 1, 2);
}

export function initCore() {
  S.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  S.isTouch = window.matchMedia('(hover: none)').matches;
  if (S.reduced) document.documentElement.classList.add('is-reduced');

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  measure();

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (!S.reduced) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    lenis.stop();
  }

  gsap.ticker.add((time, deltaTime) => {
    const dt = Math.min(deltaTime / 1000, 0.1);
    if (lenis) lenis.raf(time * 1000);
    S.time = time;
    S.scroll = window.scrollY || window.pageYOffset;
    S.mouse.sx = U.damp(S.mouse.sx, S.mouse.x, 3.5, dt);
    S.mouse.sy = U.damp(S.mouse.sy, S.mouse.y, 3.5, dt);
    for (let i = 0; i < reads.length; i++) reads[i](time, dt);
    for (let i = 0; i < ticks.length; i++) ticks[i](time, dt);
  });
  gsap.ticker.lagSmoothing(0);

  if (!S.isTouch) {
    window.addEventListener('mousemove', (e) => {
      S.mouse.x = (e.clientX / S.vw) * 2 - 1;
      S.mouse.y = (e.clientY / S.vh) * 2 - 1;
    }, { passive: true });
  }

  let lastW = S.vw;
  let lastH = S.vh;
  let timer: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // на телефонах прячется/появляется адресная строка — это не настоящий ресайз
      if (S.isTouch && w === lastW && Math.abs(h - lastH) < 160) return;
      lastW = w;
      lastH = h;
      measure();
      resizers.forEach((fn) => fn());
      ScrollTrigger.refresh();
    }, 150);
  });
}

const expoOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function scrollTo(target: number | HTMLElement) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.8, easing: expoOut });
    return;
  }
  const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: y, behavior: S.reduced ? 'auto' : 'smooth' });
}
