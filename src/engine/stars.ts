/* Звёздное небо: 3 слоя глубины с параллаксом от скролла и мыши + мягкие туманности */
import { onResize, onTick, S, U } from './core';

const LAYERS = [
  { density: 0.00011, min: 60, speed: 0.04, size: [0.5, 1.0], alpha: [0.25, 0.6], mouse: 4 },
  { density: 0.00005, min: 30, speed: 0.1, size: [0.8, 1.4], alpha: [0.4, 0.85], mouse: 9 },
  { density: 0.000012, min: 8, speed: 0.2, size: [1.2, 2.0], alpha: [0.65, 1], mouse: 16 },
];
const COLORS = ['255,255,255', '214,222,255', '228,212,255', '196,214,255'];
const NEBULAE = [
  { x: 0.12, y: 0.32, r: 0.55, c: '124,58,237', a: 0.09 },
  { x: 0.88, y: 0.62, r: 0.5, c: '59,110,246', a: 0.07 },
  { x: 0.3, y: 1.18, r: 0.6, c: '168,85,247', a: 0.07 },
  { x: 0.82, y: 1.55, r: 0.45, c: '76,125,255', a: 0.06 },
];

type Star = { x: number; y: number; size: number; alpha: number; speed: number; mouse: number; tw: number; ph: number; color: string };

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let sprite: HTMLCanvasElement;
let nebula: HTMLCanvasElement;
let stars: Star[] = [];

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function makeSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(235,228,255,.7)');
  grd.addColorStop(0.45, 'rgba(170,150,255,.16)');
  grd.addColorStop(1, 'rgba(140,120,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return c;
}

// туманности рисуются один раз в маленький холст (2 экрана по высоте), потом просто двигаются
function makeNebula() {
  const scale = 0.25;
  const w = Math.max(2, Math.round(S.vw * scale));
  const h = Math.max(2, Math.round(S.vh * 2 * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  NEBULAE.forEach((n) => {
    const cx = n.x * w;
    const r = n.r * Math.max(w, h * 0.5);
    // рисуем с переносом по вертикали, чтобы плитка стыковалась без шва
    for (let k = -1; k <= 1; k++) {
      const cy = (n.y / 2) * h + k * h;
      const grd = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      grd.addColorStop(0, 'rgba(' + n.c + ',' + n.a + ')');
      grd.addColorStop(1, 'rgba(' + n.c + ',0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    }
  });
  return c;
}

function build() {
  const area = S.vw * S.vh;
  stars = [];
  LAYERS.forEach((L) => {
    const count = Math.max(L.min, Math.round(area * L.density));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: rand(L.size[0], L.size[1]),
        alpha: rand(L.alpha[0], L.alpha[1]),
        speed: L.speed,
        mouse: L.mouse,
        tw: rand(0.6, 2.2),
        ph: rand(0, Math.PI * 2),
        color: COLORS[(Math.random() * COLORS.length) | 0],
      });
    }
  });
  // группируем по цвету, чтобы реже менять fillStyle
  stars.sort((a, b) => (a.color < b.color ? -1 : 1));
  nebula = makeNebula();
}

function resize() {
  canvas.width = Math.round(S.vw * S.dpr);
  canvas.height = Math.round(S.vh * S.dpr);
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  build();
}

function draw(time: number) {
  if (S.covered) return;
  const w = S.vw;
  const h = S.vh;
  const scroll = S.scroll;
  ctx.clearRect(0, 0, w, h);

  // туманности: самый медленный параллакс, бесшовно по кругу
  const nh = h * 2;
  const ny = -((scroll * 0.03) % nh);
  ctx.globalAlpha = 1;
  ctx.drawImage(nebula, S.mouse.sx * -6, ny, w, nh);
  ctx.drawImage(nebula, S.mouse.sx * -6, ny + nh, w, nh);

  let color = '';
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    let y = (s.y * h - scroll * s.speed - S.mouse.sy * s.mouse) % h;
    if (y < 0) y += h;
    const x = s.x * w - S.mouse.sx * s.mouse;
    const a = s.alpha * (0.62 + 0.38 * Math.sin(time * s.tw + s.ph));
    if (s.size > 1.25) {
      const g = s.size * 5;
      ctx.globalAlpha = a * 0.75;
      ctx.drawImage(sprite, x - g, y - g, g * 2, g * 2);
    } else {
      if (s.color !== color) {
        color = s.color;
        ctx.fillStyle = 'rgb(' + color + ')';
      }
      ctx.globalAlpha = a;
      ctx.fillRect(x - s.size / 2, y - s.size / 2, s.size, s.size);
    }
  }
  ctx.globalAlpha = 1;
}

export function init() {
  const el = U.$<HTMLCanvasElement>('[data-stars]');
  if (!el) return;
  canvas = el;
  ctx = canvas.getContext('2d')!;
  sprite = makeSprite();
  resize();
  onResize(resize);
  onTick(draw);
}
