/* Интерфейс: шапка, навигация, меню, магнитные кнопки, наклон карточек, пины (Technology, тарифы), формы */
import { gsap, lenis, onResize, onTick, S, scrollTo, ScrollTrigger, t, U } from './core';
import * as rest from './rest';
import * as reveal from './reveal';
import * as T from './text';

const PLANS_PIN = '(min-width: 1025px) and (min-height: 600px)'; // то же условие, что в _plans.scss
let menuOpen = false;
let menuApi: { close: () => void } | null = null;

function header() {
  const el = U.$('[data-header]');
  if (!el) return;
  let lastY = 0;
  let hidden = false;
  let scrolled = false;
  // клавиатурный фокус внутри шапки — шапку не прячем
  el.addEventListener('focusin', () => {
    hidden = false;
    el.classList.remove('is-hidden');
  });
  onTick(() => {
    const y = S.scroll;
    const sc = y > 40;
    if (sc !== scrolled) {
      scrolled = sc;
      el.classList.toggle('is-scrolled', sc);
    }
    const dy = y - lastY;
    if (Math.abs(dy) > 6) {
      const h = dy > 0 && y > S.vh * 0.6 && !menuOpen && !el.contains(document.activeElement);
      if (h !== hidden) {
        hidden = h;
        el.classList.toggle('is-hidden', h);
      }
      lastY = y;
    }
  });
}

function menu() {
  const btn = U.$('[data-burger]');
  const m = U.$('[data-menu]');
  if (!btn || !m) return;
  const links = U.$$('.menu__link, .menu__account', m);
  const outside = U.$$('main, footer');
  const tl = gsap
    .timeline({ paused: true })
    .set(m, { visibility: 'visible' })
    .fromTo(m, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.9, ease: 'expo.inOut' })
    .fromTo(links, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06 }, '-=0.45');

  function set(open: boolean) {
    menuOpen = open;
    btn!.classList.toggle('is-open', open);
    btn!.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn!.setAttribute('aria-label', t(open ? 'menuClose' : 'menuOpen'));
    // остальная страница недоступна, пока открыто меню (диалог)
    outside.forEach((el) => {
      el.inert = open;
    });
    if (open) {
      tl.timeScale(1).play();
      if (lenis) lenis.stop();
      setTimeout(() => links[0].focus(), 60);
    } else {
      tl.timeScale(1.6).reverse();
      if (lenis) lenis.start();
      if (m!.contains(document.activeElement)) btn!.focus();
    }
  }
  btn.addEventListener('click', () => set(!menuOpen));
  document.addEventListener('keydown', (e) => {
    if (!menuOpen) return;
    if (e.key === 'Escape') {
      set(false);
      btn.focus();
      return;
    }
    // ловушка фокуса: бургер ↔ пункты меню
    if (e.key === 'Tab') {
      const items = [btn].concat(links);
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    }
  });
  menuApi = {
    close: () => {
      if (menuOpen) set(false);
    },
  };
}

function anchors() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href')!;
    if (id === '#') {
      e.preventDefault();
      return;
    }
    const tg = U.$(id);
    if (!tg) return;
    e.preventDefault();
    if (menuApi) menuApi.close();
    // глава/пин — сразу в «готовое» состояние (у тарифов — собранные карточки)
    scrollTo(id === '#home' ? 0 : rest.target(tg));
    // фокус — на цель якоря, чтобы клавиатура и скринридер продолжили оттуда
    if (!tg.hasAttribute('tabindex')) tg.setAttribute('tabindex', '-1');
    tg.focus({ preventScroll: true });
  });
}

// выбор языка: выпадающий список в шапке; выбор запоминается (корень потом сам ведёт на эту версию)
function langSwitch() {
  U.$$('[data-lang-link]').forEach((a) => {
    a.addEventListener('click', () => {
      try {
        localStorage.setItem('domain-lang', a.getAttribute('data-lang-link') || '');
      } catch (e) {}
    });
  });
  const root = U.$('[data-lang]');
  if (!root) return;
  const btn = U.$('[data-lang-btn]', root)!;
  const list = U.$('[data-lang-list]', root);
  const items = U.$$('a', list);
  let open = false;

  function set(v: boolean, focusBtn?: boolean) {
    open = v;
    root!.classList.toggle('is-open', v);
    btn.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v) items[0].focus({ preventScroll: true });
    else if (focusBtn) btn.focus({ preventScroll: true });
  }

  btn.addEventListener('click', () => set(!open));
  document.addEventListener('click', (e) => {
    if (open && !root.contains(e.target as Node)) set(false);
  });
  root.addEventListener('keydown', (e) => {
    if (!open) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      set(false, true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(i + 1) % items.length].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length].focus();
    }
  });
  root.addEventListener('focusout', (e) => {
    if (open && !root.contains(e.relatedTarget as Node | null)) set(false);
  });
}

function magnetic() {
  if (S.isTouch || S.reduced) return;
  U.$$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

// наклон к курсору + подсветка, бегущая за курсором
function tilt() {
  if (S.isTouch || S.reduced) return;
  function spot(card: HTMLElement, e: MouseEvent) {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    return [px, py];
  }
  U.$$('[data-tilt]').forEach((card) => {
    gsap.set(card, { transformPerspective: 1000 });
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    card.addEventListener('mousemove', (e) => {
      const p = spot(card, e);
      rx((0.5 - p[1]) * 7);
      ry((p[0] - 0.5) * 9);
    });
    card.addEventListener('mouseleave', () => {
      rx(0);
      ry(0);
    });
  });
  U.$$('[data-step]').forEach((card) => {
    card.addEventListener('mousemove', (e) => spot(card, e));
  });
}

export function nav() {
  const navEl = U.$('[data-nav]');
  if (!navEl) return;
  const links = U.$$('.nav__link', navEl);
  const ind = U.$('[data-nav-indicator]', navEl);
  let current = links[0];

  function move(link: HTMLElement, instant?: boolean) {
    gsap.to(ind, { x: link.offsetLeft, scaleX: link.offsetWidth / 100, duration: instant ? 0 : 0.8, ease: 'expo.out' });
  }

  function setActive(link: HTMLElement) {
    if (link === current) return;
    current.classList.remove('is-active');
    current.removeAttribute('aria-current');
    link.classList.add('is-active');
    link.setAttribute('aria-current', 'true');
    current = link;
    move(link);
  }
  current.setAttribute('aria-current', 'true');

  links.forEach((l, i) => {
    l.addEventListener('mouseenter', () => move(l));
    const target = U.$(l.getAttribute('href') || '');
    if (!target) return;
    const last = i === links.length - 1;
    ScrollTrigger.create({
      trigger: target,
      start: last ? 'top 85%' : 'top 55%',
      end: last ? 'bottom bottom' : 'bottom 55%',
      onToggle: (st) => {
        if (st.isActive) setActive(l);
      },
    });
  });
  navEl.addEventListener('mouseleave', () => move(current));
  move(current, true);
  onResize(() => move(current, true));
}

// пин: секция прилипает, шаги едут горизонтально, картинки внутри — параллаксом
export function tech() {
  const sec = U.$('[data-tech]');
  if (!sec) return;
  const track = U.$('[data-tech-track]', sec)!;
  const bar = U.$('[data-tech-bar]', sec)!;
  const idx = U.$('[data-tech-index]', sec)!;
  const steps = U.$$('[data-step]', sec);
  let last = 0;

  reveal.onEnter(U.$('.tech__head', sec)!, 'top 75%');
  gsap.fromTo(track, { opacity: 0, y: 90 }, {
    opacity: 1,
    y: 0,
    duration: 1.4,
    ease: 'power3.out',
    scrollTrigger: { trigger: sec, start: 'top 70%', once: true },
  });

  function dist() {
    return Math.max(0, track.scrollWidth - S.vw);
  }

  const tween = gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: sec,
      start: 'top top',
      end: () => '+=' + dist(),
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (st) => {
        bar.style.transform = 'scaleX(' + st.progress.toFixed(4) + ')';
        const n = 1 + Math.round(st.progress * (steps.length - 1));
        if (n !== last) {
          last = n;
          idx.textContent = '0' + n;
        }
      },
    },
  });

  steps.forEach((step) => {
    const img = U.$('[data-step-img]', step);
    gsap.fromTo(img, { xPercent: -7 }, {
      xPercent: 7,
      ease: 'none',
      scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
    });
    gsap.fromTo(step, { opacity: 0.35, scale: 0.94 }, {
      opacity: 1,
      scale: 1,
      ease: 'power2.out',
      scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 100%', end: 'left 60%', scrub: true },
    });
  });

  const shapes = reveal.prepIcons(track);
  const draw = reveal.drawIcons(shapes);
  ScrollTrigger.create({ trigger: sec, start: 'top 60%', once: true, onEnter: () => draw.play() });

  // «готовые» точки пина: целые шаги счётчика 01…05 (равномерно по ходу ленты)
  rest.zone(() => {
    const st = tween.scrollTrigger;
    if (!st || st.end <= st.start) return null;
    return {
      el: sec,
      start: st.start,
      end: st.end,
      points: steps.map((s, i) => st.start + (i / (steps.length - 1)) * (st.end - st.start)),
    };
  });
}

// пин: тарифы собираются по скроллу (на больших экранах), иначе — обычное появление
export function plans() {
  const sec = U.$('[data-plans]');
  if (!sec) return;
  const cards = U.$$('[data-plan]', sec);
  const badge = U.$('[data-plan-badge]', sec);
  const counts = U.$$('[data-count]', sec).map(reveal.counter);
  let fired = false;

  function fire() {
    if (fired) return;
    fired = true;
    counts.forEach((c) => c.play());
  }

  reveal.onEnter(U.$('.section-head', sec)!, 'top 75%', { cards: false });
  if (badge) gsap.set(badge, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
  const note = U.$('.plans__note', sec);

  // прилипшая секция = ровно экран: если контент выше, ужимаем его масштабом
  const box = U.$('.container', sec)!;
  const desk = window.matchMedia(PLANS_PIN);
  function fit() {
    if (!desk.matches) {
      sec!.style.removeProperty('--fit');
      return;
    }
    const s = Math.min(1, (S.vh - 24) / box.offsetHeight);
    sec!.style.setProperty('--fit', s.toFixed(4));
  }
  fit();
  onResize(fit);

  // «готовое» состояние пина — карточки уже собраны (конец пина); начало пина «готовым» не считается
  let pinST: ScrollTrigger | null = null;
  rest.zone(() => {
    if (!pinST) return null;
    return { el: sec, start: pinST.start, end: pinST.end, points: [pinST.end], anchor: pinST.end };
  });
  // Tab по кнопкам тарифов посреди сборки — докручиваем до собранных карточек
  sec.addEventListener('focusin', () => {
    if (pinST && window.scrollY < pinST.end - 2) rest.go(pinST.end);
  });

  const mm = gsap.matchMedia();
  mm.add(PLANS_PIN, () => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sec, start: 'top top', end: '+=130%', pin: true, scrub: true },
    });
    pinST = tl.scrollTrigger || null;
    tl.fromTo(cards[0], { opacity: 0, x: -160, y: 60 }, { opacity: 1, x: 0, y: 0, duration: 1, ease: 'power2.out' }, 0)
      .fromTo(cards[2], { opacity: 0, x: 160, y: 60 }, { opacity: 1, x: 0, y: 0, duration: 1, ease: 'power2.out' }, 0.25)
      .fromTo(cards[1], { opacity: 0, y: 110, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power2.out' }, 0.5)
      // подпись — только когда карточки встали на места, иначе центральная наезжает на неё
      .fromTo(note, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 1.5)
      .add(fire, 0.6);
    cards.forEach((c, i) => {
      tl.fromTo(U.$$('.plan__list li', c), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.08 }, 0.45 + i * 0.2);
    });
    if (badge) tl.fromTo(badge, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, 1.35);
    tl.to({}, { duration: 0.45 });
    return () => {
      pinST = null;
    };
  });
  mm.add('(max-width: 1024px), (max-height: 599px)', () => {
    gsap.fromTo(note, { opacity: 0, y: 20 }, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: note, start: 'top 94%', once: true },
    });
    cards.forEach((c) => {
      gsap.fromTo(c, { opacity: 0, y: 70 }, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: c, start: 'top 88%', once: true, onEnter: fire },
      });
    });
  });
}

export function perks() {
  const sec = U.$('[data-perks]');
  if (!sec) return;
  const items = U.$$('[data-perk]', sec);
  const draw = reveal.drawIcons(reveal.prepIcons(sec));
  gsap.set(items, { opacity: 0, y: 30 });
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to(items, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1 });
      draw.play();
    },
  });
}

export function cta() {
  const box = U.$('[data-cta]');
  if (!box) return;
  reveal.onEnter(U.$('.cta__content', box)!, 'top 72%');
  gsap.fromTo(U.$('[data-cta-img]', box), { yPercent: -6 }, {
    yPercent: 6,
    ease: 'none',
    scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.fromTo(box, { clipPath: 'inset(9% 7% 9% 7% round 18px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 18px)',
    ease: 'power2.out',
    scrollTrigger: { trigger: box, start: 'top 95%', end: 'top 45%', scrub: true },
  });
}

// проверка адреса — демо: настоящего API покрытия пока нет
function checkForm() {
  const form = U.$<HTMLFormElement>('[data-check]');
  if (!form) return;
  const input = U.$<HTMLInputElement>('input', form)!;
  const label = U.$('.btn span', form)!;
  const out = U.$('[data-check-result]')!;
  let busy = false;
  input.addEventListener('input', () => {
    if (!form.classList.contains('is-error')) return;
    form.classList.remove('is-error');
    input.removeAttribute('aria-invalid');
    out.classList.remove('is-error');
    out.textContent = '';
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy) return;
    if (!input.value.trim()) {
      form.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      out.classList.add('is-error');
      out.textContent = t('checkErr');
      input.focus();
      return;
    }
    busy = true;
    form.classList.add('is-scanning');
    label.textContent = t('scanning');
    let n = 0;
    const iv = setInterval(() => {
      out.textContent = t('triangulating') + '.'.repeat(n++ % 4);
    }, 220);
    setTimeout(() => {
      clearInterval(iv);
      busy = false;
      form.classList.remove('is-scanning');
      label.textContent = t('scan');
      out.textContent = '';
      const res = document.createElement('span');
      res.textContent = t('checkOk');
      out.appendChild(res);
      T.scramble(res, { per: 0.015, dur: 0.3 }).play();
    }, 1600);
  });
}

function subscribe() {
  const form = U.$<HTMLFormElement>('[data-subscribe]');
  if (!form) return;
  const input = U.$<HTMLInputElement>('input', form)!;
  const status = U.$('[data-subscribe-status]', form)!;
  input.addEventListener('input', () => {
    form.classList.remove('is-error');
    input.removeAttribute('aria-invalid');
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(input.value.trim())) {
      form.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      status.textContent = t('subErr');
      input.focus();
      return;
    }
    form.classList.add('is-done');
    input.value = '';
    input.placeholder = t('subDone');
    status.textContent = t('subOk');
  });
}

export function init() {
  header();
  menu();
  langSwitch();
  anchors();
  magnetic();
  tilt();
  checkForm();
  subscribe();
  U.$$('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

export function footer() {
  reveal.fades(U.$('.footer'));
}
