/* Главы с видео: прогресс скролла → кадр ролика, панели-секции появляются и уходят синхронно с видео */
import { config, gsap, num, onResize, onTick, S, ScrollTrigger, t, U } from './core';
import * as marquee from './marquee';
import * as rest from './rest';
import * as reveal from './reveal';
import { Sequence } from './sequence';
import * as T from './text';

const FADE = 0.035; // доля главы на въезд/выезд панели

type MapPoints = [number, number][];

// "0:0,.13:.12,..." → [[0,0],[.13,.12],...] — прогресс главы → позиция в ролике
function parseMap(str: string): MapPoints {
  return str.split(',').map((pair) => {
    const p = pair.split(':');
    return [parseFloat(p[0]), parseFloat(p[1])];
  });
}

function mapValue(map: MapPoints, p: number) {
  if (p <= map[0][0]) return map[0][1];
  for (let i = 1; i < map.length; i++) {
    if (p <= map[i][0]) {
      const a = map[i - 1];
      const b = map[i];
      return a[1] + (b[1] - a[1]) * ((p - a[0]) / (b[0] - a[0]));
    }
  }
  return map[map.length - 1][1];
}

// кадры 1920 (из 4K-исходника) — для десктопа; 1280 — телефонам, планшетам и режиму экономии трафика
function useHD() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const saveData = conn && conn.saveData;
  return !saveData && window.matchMedia('(min-width: 1025px)').matches;
}

type Panel = {
  el: HTMLElement;
  a: number;
  b: number;
  rest: number;
  entered: boolean;
  enter: (() => void) | null;
  on?: boolean;
};

type Hook = (ch: Chapter, time: number, dt: number) => void;

class Chapter {
  el: HTMLElement;
  id: string;
  map: MapPoints;
  duration: number;
  focus: number;
  focusM: number;
  seq: Sequence;
  panels: Panel[];
  p = 0;
  t = 0;
  ts = 0; // сглаженная позиция ролика
  visible = false;
  hooks: Hook[] = [];
  st: ScrollTrigger | null = null;

  constructor(el: HTMLElement) {
    this.el = el;
    this.id = el.getAttribute('data-chapter') || '';
    this.map = parseMap(el.getAttribute('data-map') || '0:0,1:1');
    this.duration = parseFloat(el.getAttribute('data-duration') || '10');
    this.focus = parseFloat(el.getAttribute('data-focus') || '0.5');
    this.focusM = parseFloat(el.getAttribute('data-focus-m') || String(this.focus));
    this.seq = new Sequence(U.$<HTMLCanvasElement>('[data-canvas]', el)!, {
      base: (useHD() && el.getAttribute('data-seq-hd')) || el.getAttribute('data-seq') || '',
      count: parseInt(el.getAttribute('data-count') || '0', 10),
      version: el.getAttribute('data-seq-v') || '',
      focusX: this.focus,
    });
    this.panels = U.$$('[data-panel]', el).map((p) => ({
      el: p,
      a: parseFloat(p.getAttribute('data-in') || '0'),
      b: parseFloat(p.getAttribute('data-out') || '1'),
      rest: parseFloat(p.getAttribute('data-rest-at') || '0.3'),
      entered: false,
      enter: null,
    }));
    this.resize();
  }

  resize() {
    this.seq.resize(S.vw, S.vh, S.dpr);
    this.seq.setFocus(S.isMobile ? this.focusM : this.focus);
  }

  panel(name: string) {
    for (let i = 0; i < this.panels.length; i++) {
      if (this.panels[i].el.classList.contains('panel--' + name)) return this.panels[i];
    }
    return null;
  }

  // создаём ScrollTrigger'ы — вызывается в порядке следования секций на странице
  build() {
    const tl = gsap.timeline({ paused: true });
    const shift = S.reduced ? 0 : 1;

    // только прозрачность (не visibility): скрытые панели остаются в дереве доступности,
    // а при фокусе внутри — страница сама докручивается до панели (см. focusin ниже)
    this.panels.forEach((P) => {
      if (P.a > 0) {
        tl.fromTo(P.el, { opacity: 0, y: 90 * shift }, { opacity: 1, y: 0, duration: FADE, ease: 'power2.out' }, P.a);
      } else {
        gsap.set(P.el, { opacity: 1 });
      }
      if (P.b < 1) {
        tl.fromTo(P.el, { opacity: 1, y: 0 }, { opacity: 0, y: -110 * shift, duration: FADE, ease: 'power2.in', immediateRender: false }, P.b - FADE);
      }
      // всё внутри панели появляется своей «сценой» при первом входе
      if (!P.enter) {
        const g = reveal.group(P.el);
        P.enter = () => {
          g.play();
        };
        if (S.reduced) g.progress(1);
      }
    });
    tl.to({}, { duration: 0.001 }, 1);
    tl.progress(0);
    this.syncPointer();

    // Tab в панель, которая сейчас не показана целиком, — встаём на её «готовую» точку
    this.el.addEventListener('focusin', (e) => {
      let P: Panel | null = null;
      for (const x of this.panels) {
        if (x.el.contains(e.target as Node)) P = x;
      }
      if (!P || this.isReady(P)) return;
      rest.go(this.restY(P));
    });

    this.st = ScrollTrigger.create({
      trigger: this.el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (st) => {
        this.p = st.progress;
        tl.progress(st.progress);
        this.syncPointer();
        this.check();
      },
    });

    ScrollTrigger.create({
      trigger: this.el,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (st) => {
        this.visible = st.isActive;
        if (st.isActive) this.seq.load();
      },
    });

    // панели, видимые с самого начала главы (не hero) — запускаем, когда глава въезжает в экран
    this.panels.forEach((P) => {
      if (P.a === 0 && this.id !== 'void') {
        ScrollTrigger.create({
          trigger: this.el,
          start: 'top 60%',
          once: true,
          onEnter: () => {
            P.entered = true;
            P.enter!();
          },
        });
      }
    });

    // «готовые» точки всех панелей главы (для rest.ts)
    rest.zone(() => {
      const st = this.st;
      if (!st) return null;
      return { el: this.el, start: st.start, end: st.end, points: this.panels.map((P) => this.restY(P)) };
    });
  }

  // окно прогресса, в котором панель показана целиком (без въезда/выезда)
  window(P: Panel): [number, number] {
    return [P.a > 0 ? P.a + FADE : 0, P.b < 1 ? P.b - FADE : 1];
  }

  // «готовая» точка панели: начало главы для первой панели, иначе доля окна полной видимости
  // (по умолчанию 30%; data-rest-at у панели — например, манифесту нужен конец, когда горят все слова)
  restP(P: Panel) {
    if (P.a === 0) return 0;
    const w = this.window(P);
    return w[0] + (w[1] - w[0]) * P.rest;
  }

  restY(P: Panel) {
    const st = this.st!;
    return st.start + this.restP(P) * (st.end - st.start);
  }

  isReady(P: Panel) {
    const w = this.window(P);
    return this.p >= w[0] - 0.002 && this.p <= w[1] + 0.002;
  }

  // невидимые панели не перехватывают клики у видимой
  syncPointer() {
    this.panels.forEach((P) => {
      const o = P.el.style.opacity;
      const on = (o === '' ? 1 : parseFloat(o)) > 0.5;
      if (on !== P.on) {
        P.on = on;
        P.el.style.pointerEvents = on ? '' : 'none';
      }
    });
  }

  check() {
    const p = this.p;
    this.panels.forEach((P) => {
      if (!P.entered && P.a > 0 && p >= P.a && p <= P.b) {
        P.entered = true;
        P.enter!();
      }
    });
  }

  tick(time: number, dt: number) {
    this.t = mapValue(this.map, this.p);
    // лёгкое сглаживание поверх Lenis — кадры не дёргаются даже на колесе с шагом
    this.ts = S.reduced ? this.t : U.damp(this.ts, this.t, 14, dt);
    if (!this.visible) return;
    this.seq.set(this.ts);
    this.seq.render();
    for (let i = 0; i < this.hooks.length; i++) this.hooks[i](this, time, dt);
  }
}

// ---------- глава 1: hero-интро ----------
function heroIntro(ch: Chapter) {
  const root = ch.el;
  const kicker = U.$('[data-hero-kicker]', root)!;
  const t1 = U.$('[data-hero-t1]', root)!;
  const t2 = U.$('[data-hero-t2]', root)!;
  const lead = U.$('[data-hero-lead]', root);
  const hud = U.$$('[data-hero-hud] .hud-row', root);
  const hint = U.$('[data-hero-hint]', root);

  const k = T.type(kicker, { stagger: 0.02, duration: 0.4 });
  const a = T.type(t1, { caret: true, stagger: 0.055, duration: 0.6, caretHold: 0.6 });
  const b = T.type(t2, { caret: true, stagger: 0.055, duration: 0.6, caretHold: 3 });
  gsap.set(lead, { opacity: 0, y: 26 });
  gsap.set(hud, { opacity: 0, x: 24 });

  const tl = gsap
    .timeline({ paused: true })
    .add(k.paused(false), 0)
    .add(a.paused(false), 0.25)
    .add(b.paused(false), 0.25 + a.duration() * 0.9)
    .to(hud, { opacity: 1, x: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }, 0.6)
    .to(lead, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 1.3)
    .to(hint, { opacity: 1, duration: 1 }, 2.2);

  if (S.reduced) tl.progress(1);
  return tl;
}

// ---------- глава 1: манифест — слова загораются по скроллу ----------
function manifesto(ch: Chapter) {
  const P = ch.panel('manifesto')!;
  const el = U.$('[data-words]', P.el)!;
  const words = (el.textContent || '').trim().split(/\s+/);
  // скринридеру — цельная фраза, «загорающиеся» слова от него скрыты
  el.innerHTML =
    '<span class="sr-only">' + words.join(' ') + '</span><span aria-hidden="true">' +
    words.map((w) => '<span class="w">' + w + '</span>').join(' ') + '</span>';
  const spans = U.$$('.w', el);
  let last = -1;

  ch.hooks.push(() => {
    const local = U.range(ch.p, P.a + 0.01, P.b - 0.07);
    if (Math.abs(local - last) < 0.0005) return;
    last = local;
    const x = local * (spans.length + 1.5) - 0.5;
    for (let i = 0; i < spans.length; i++) {
      spans[i].style.opacity = (0.14 + 0.86 * U.clamp(x - i, 0, 1)).toFixed(3);
    }
  });
}

// ---------- глава 1: лента партнёров крутится, только когда видна ----------
function partners(ch: Chapter) {
  const P = ch.panel('partners')!;
  marquee.init(U.$('[data-marquee]', P.el));
  ch.hooks.push(() => {
    marquee.setActive(ch.p > P.a - FADE);
  });
}

// ---------- глава 2: прицел ведёт корабль + «живая» телеметрия ----------
function reticle(ch: Chapter) {
  const el = U.$('[data-reticle]', ch.el)!;
  const dist = U.$('[data-reticle-dist]', ch.el)!;
  const P = ch.panel('relay')!;
  const kf = config.reticle;
  const tele = {
    vel: U.$('[data-tele="vel"]', P.el)!,
    lat: U.$('[data-tele="lat"]', P.el)!,
    thr: U.$('[data-tele="thr"]', P.el)!,
  };
  let lastTele = 0;

  function at(sec: number) {
    if (sec <= kf[0][0]) return kf[0];
    for (let i = 1; i < kf.length; i++) {
      if (sec <= kf[i][0]) {
        const a = kf[i - 1];
        const b = kf[i];
        const k = (sec - a[0]) / (b[0] - a[0]);
        return [sec, U.lerp(a[1], b[1], k), U.lerp(a[2], b[2], k), U.lerp(a[3], b[3], k)];
      }
    }
    return kf[kf.length - 1];
  }

  ch.hooks.push((c, time) => {
    const sec = c.ts * ch.duration;
    const panelOn = U.range(c.p, P.a - 0.01, P.a + 0.02) * (1 - U.range(c.p, P.b - 0.03, P.b));
    const o = panelOn * U.range(sec, config.reticleFrom, config.reticleFrom + 0.6) * (1 - U.range(sec, config.reticleTo - 0.5, config.reticleTo));
    el.style.opacity = o.toFixed(3);
    if (o <= 0) return;

    const r = c.seq.rect;
    const k = at(sec);
    const w = k[3] * r.w;
    const h = w * 0.62;
    const x = r.x + k[1] * r.w - w / 2;
    const y = r.y + k[2] * r.h - h / 2;
    el.style.width = w.toFixed(1) + 'px';
    el.style.height = h.toFixed(1) + 'px';
    el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    const km = Math.round(U.lerp(1240, 12, U.range(sec, config.reticleFrom, config.reticleTo)));
    dist.textContent = t('dist') + ' ' + num(km, 0, true) + ' ' + t('km');

    if (time - lastTele > 0.22) {
      lastTele = time;
      tele.vel.textContent = num(7.58 + Math.random() * 0.04, 2) + ' ' + t('kms');
      tele.lat.textContent = num(4.0 + Math.random() * 0.6, 1) + ' ' + t('ms');
      tele.thr.textContent = num(9.62 + Math.random() * 0.33, 2) + ' ' + t('gbps');
    }
  });
}

const chapters: Record<string, Chapter> = {};

// создаём главы и сразу начинаем грузить первую (для прелоадера)
export function init() {
  U.$$('[data-chapter]').forEach((el) => {
    const ch = new Chapter(el);
    chapters[ch.id] = ch;
  });
  onResize(() => {
    Object.keys(chapters).forEach((id) => chapters[id].resize());
  });
  onTick((time, dt) => {
    let covered = false;
    Object.keys(chapters).forEach((id) => {
      const ch = chapters[id];
      ch.tick(time, dt);
      if (ch.p > 0.001 && ch.p < 0.999) covered = true;
    });
    // пока сцена с видео закрывает экран, звёздам под ней рисоваться незачем
    S.covered = covered;
  });
  const v = chapters.void;
  v.seq.load(8);
  // вторая глава догружается после первой
  v.seq.onProgress((s) => {
    if (s.loadedCount === s.count && chapters.orbit) chapters.orbit.seq.load();
  });
  return v.seq;
}

export function buildVoid() {
  const ch = chapters.void;
  const hero = ch.panel('hero')!;
  const intro = heroIntro(ch);
  hero.entered = true;
  hero.enter = () => {
    intro.play();
  };
  manifesto(ch);
  partners(ch);
  ch.build();
}

export function buildOrbit() {
  const ch = chapters.orbit;
  if (!ch) return;
  reticle(ch);
  ch.build();
}

export function playHero() {
  chapters.void.panel('hero')!.enter!();
}
