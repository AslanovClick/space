/* Покадровое «видео» на canvas: прогрессивная загрузка, cover-кадрирование, смешивание соседних кадров */

type SequenceOptions = {
  base: string;
  count: number;
  ext?: string;
  pad?: number;
  version?: string;
  focusX?: number;
};

export class Sequence {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  base: string;
  count: number;
  ext: string;
  pad: number;
  version: string;
  focusX: number;
  focusY = 0.5;
  frames: HTMLImageElement[];
  loaded: Uint8Array;
  loadedCount = 0;
  current = 0;
  dirty = true;
  iw = 0;
  ih = 0;
  cw = 0;
  ch = 0;
  rect = { x: 0, y: 0, w: 0, h: 0 }; // где кадр лежит на экране (css px)
  started = false;
  firstPass = 0;
  listeners: ((s: Sequence) => void)[] = [];
  queue: number[];

  constructor(canvas: HTMLCanvasElement, o: SequenceOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.base = o.base;
    this.count = o.count;
    this.ext = o.ext || 'webp';
    this.pad = o.pad || 3;
    this.version = o.version || '';
    this.focusX = o.focusX == null ? 0.5 : o.focusX;
    this.frames = new Array(this.count);
    this.loaded = new Uint8Array(this.count);
    this.queue = this.buildQueue();
  }

  // сначала ~16 опорных кадров (и последний), потом всё гуще — скролл работает почти сразу;
  // шаг первого прохода — степень двойки под длину ролика (240 кадров → 16, 480 → 32)
  buildQueue() {
    const order: number[] = [];
    const seen = new Uint8Array(this.count);
    const steps: number[] = [];
    for (let st = Math.pow(2, Math.max(0, Math.round(Math.log(this.count / 16) / Math.LN2))); st >= 1; st /= 2) steps.push(st);
    steps.forEach((step, pass) => {
      for (let i = 0; i < this.count; i += step) {
        if (!seen[i]) {
          seen[i] = 1;
          order.push(i);
        }
      }
      if (pass === 0 && !seen[this.count - 1]) {
        seen[this.count - 1] = 1;
        order.push(this.count - 1);
      }
      if (pass === 0) this.firstPass = order.length;
    });
    return order;
  }

  src(i: number) {
    let s = String(i);
    while (s.length < this.pad) s = '0' + s;
    return this.base + s + '.' + this.ext + (this.version ? '?v=' + encodeURIComponent(this.version) : '');
  }

  onProgress(fn: (s: Sequence) => void) {
    this.listeners.push(fn);
  }

  load(concurrency = 6) {
    if (this.started) return;
    this.started = true;
    let next = 0;
    let active = 0;

    const finish = (i: number, img: HTMLImageElement) => {
      this.frames[i] = img;
      this.loaded[i] = 1;
      this.loadedCount++;
      if (!this.iw) {
        this.iw = img.naturalWidth;
        this.ih = img.naturalHeight;
        this.layout();
      }
      this.dirty = true;
      this.listeners.forEach((fn) => fn(this));
    };

    const pump = () => {
      while (active < concurrency && next < this.queue.length) {
        const i = this.queue[next++];
        active++;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          const done = () => {
            finish(i, img);
            active--;
            pump();
          };
          if (img.decode) img.decode().then(done, done);
          else done();
        };
        img.onerror = () => {
          active--;
          pump();
        };
        img.src = this.src(i);
      }
    };
    pump();
  }

  resize(w: number, h: number, dpr: number) {
    this.cw = w;
    this.ch = h;
    const pw = Math.min(Math.round(w * Math.min(dpr, 1.5)), 2560);
    const ratio = pw / w;
    this.canvas.width = pw;
    this.canvas.height = Math.round(h * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.layout();
    this.dirty = true;
  }

  setFocus(x: number) {
    this.focusX = x;
    this.layout();
    this.dirty = true;
  }

  layout() {
    if (!this.iw || !this.cw) return;
    const s = Math.max(this.cw / this.iw, this.ch / this.ih);
    const r = this.rect;
    r.w = this.iw * s;
    r.h = this.ih * s;
    r.x = (this.cw - r.w) * this.focusX;
    r.y = (this.ch - r.h) * this.focusY;
  }

  // t — 0..1 по всей длине ролика
  set(t: number) {
    const f = Math.max(0, Math.min(1, t)) * (this.count - 1);
    if (Math.abs(f - this.current) > 0.0005) {
      this.current = f;
      this.dirty = true;
    }
  }

  nearest(i: number, dir: 1 | -1) {
    for (let k = i; k >= 0 && k < this.count; k += dir) {
      if (this.loaded[k]) return k;
    }
    return -1;
  }

  render() {
    if (!this.dirty || !this.iw || !this.cw) return;
    const f = this.current;
    let a = this.nearest(Math.floor(f), -1);
    let b = this.nearest(Math.min(Math.floor(f) + 1, this.count - 1), 1);
    if (a < 0 && b < 0) return;
    if (a < 0) a = b;
    if (b < 0) b = a;
    const r = this.rect;
    const ctx = this.ctx;
    ctx.globalAlpha = 1;
    ctx.drawImage(this.frames[a], r.x, r.y, r.w, r.h);
    // между кадрами — полупрозрачное наложение следующего: скролл без «ступенек»
    if (b !== a) {
      const k = (f - a) / (b - a);
      if (k > 0.02) {
        ctx.globalAlpha = k;
        ctx.drawImage(this.frames[b], r.x, r.y, r.w, r.h);
        ctx.globalAlpha = 1;
      }
    }
    this.dirty = false;
  }
}
