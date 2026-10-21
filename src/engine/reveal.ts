/* Появления: подпись «дешифруется», заголовок печатается, текст и карточки всплывают, цифры считаются, иконки прорисовываются */
import { gsap, num, S, ScrollTrigger, U } from './core';
import * as T from './text';

const srOf = new WeakMap<HTMLElement, HTMLElement>();

function formatNum(v: number, dec: number, fmt: string | null) {
  return num(v, dec, fmt === 'comma');
}

export function counter(el: HTMLElement) {
  const to = parseFloat(el.getAttribute('data-count') || '0');
  const from = parseFloat(el.getAttribute('data-from') || '0');
  const dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
  const fmt = el.getAttribute('data-format');
  const o = { v: from };
  // скринридеру — сразу итоговое значение, бегущие цифры от него скрыты
  if (!srOf.has(el)) {
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = formatNum(to, dec, fmt);
    el.parentNode!.insertBefore(sr, el);
    el.setAttribute('aria-hidden', 'true');
    srOf.set(el, sr);
  }
  el.textContent = formatNum(from, dec, fmt);
  return gsap.to(o, {
    v: to,
    duration: 2.2,
    ease: 'power3.out',
    paused: true,
    onUpdate: () => {
      el.textContent = formatNum(o.v, dec, fmt);
    },
  });
}

// линии иконок рисуются «пером»
export function prepIcons(scope: ParentNode | null) {
  const shapes = U.$$<SVGElement>('.ico .icon path, .ico .icon circle, .ico .icon ellipse, .ico .icon rect', scope);
  if (!shapes.length) return shapes;
  shapes.forEach((s) => s.setAttribute('pathLength', '1'));
  gsap.set(shapes, { strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 });
  return shapes;
}

export function drawIcons(shapes: SVGElement[]): { play: () => unknown } {
  if (!shapes.length) return { play: () => {} };
  return gsap.to(shapes, {
    strokeDashoffset: 0,
    opacity: 1,
    duration: 1.4,
    ease: 'power2.inOut',
    stagger: 0.03,
    paused: true,
  });
}

type GroupOptions = { cards?: boolean };

// собирает все анимации внутри scope в одну таймлайн-«сцену»
export function group(scope: HTMLElement, o: GroupOptions = {}) {
  const tl = gsap.timeline({ paused: true });
  const labels = U.$$('[data-scramble]', scope);
  const titles = U.$$('[data-type]', scope);
  const fades = U.$$('[data-fade]', scope);
  const cards = o.cards === false ? [] : U.$$('[data-card]', scope);
  const counts = U.$$('[data-count]', scope).map(counter);
  const values = U.$$('[data-scramble-value]', scope);
  const shapes = prepIcons(scope);

  labels.forEach((el) => {
    tl.add(T.scramble(el).paused(false), 0);
  });

  let typeEnd = 0.15;
  titles.forEach((el, i) => {
    const t = T.type(el, { caret: true, stagger: 0.04, duration: 0.5 });
    tl.add(t.paused(false), 0.15 + i * 0.2);
    typeEnd = Math.max(typeEnd, 0.15 + i * 0.2 + t.duration() * 0.6);
  });
  const at = titles.length ? typeEnd : 0.2;

  if (fades.length) {
    gsap.set(fades, { opacity: 0, y: 30 });
    tl.to(fades, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 }, at);
  }
  if (cards.length) {
    gsap.set(cards, { opacity: 0, y: 46 });
    tl.to(cards, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09 }, at + 0.15);
  }
  if (shapes.length) {
    const draw = drawIcons(shapes);
    tl.add(() => {
      draw.play();
    }, at + 0.25);
  }
  if (counts.length) {
    tl.add(() => {
      counts.forEach((c) => c.play());
    }, at + 0.3);
  }
  values.forEach((el) => {
    const sc = T.scramble(el, { per: 0.05, dur: 0.6 });
    tl.add(() => {
      sc.play();
    }, at + 0.45);
  });
  return tl;
}

// группа запускается, когда scope входит в экран
export function onEnter(scope: HTMLElement, start?: string, o?: GroupOptions) {
  const tl = group(scope, o);
  if (S.reduced) {
    tl.progress(1);
    return tl;
  }
  ScrollTrigger.create({
    trigger: scope,
    start: start || 'top 78%',
    once: true,
    onEnter: () => {
      tl.play();
    },
  });
  return tl;
}

// одиночные [data-fade] вне групп (подвал)
export function fades(scope: HTMLElement | null) {
  U.$$('[data-fade]', scope).forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 36 }, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
      delay: parseFloat(el.getAttribute('data-delay') || '0'),
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });
}
