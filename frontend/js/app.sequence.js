/* Покадровое «видео» на canvas: прогрессивная загрузка, cover-кадрирование, смешивание соседних кадров */
(function () {
    var APP = window.APP = window.APP || {};

    function Sequence(canvas, o) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.base = o.base;
        this.count = o.count;
        this.ext = o.ext || 'webp';
        this.pad = o.pad || 3;
        this.version = o.version || '';
        this.focusX = o.focusX == null ? 0.5 : o.focusX;
        this.focusY = 0.5;
        this.frames = new Array(this.count);
        this.loaded = new Uint8Array(this.count);
        this.loadedCount = 0;
        this.current = 0;
        this.dirty = true;
        this.iw = 0;
        this.ih = 0;
        this.cw = 0;
        this.ch = 0;
        this.rect = { x: 0, y: 0, w: 0, h: 0 }; // где кадр лежит на экране (css px)
        this.started = false;
        this.listeners = [];
        this.queue = this.buildQueue();
    }

    // сначала ~16 опорных кадров (и последний), потом всё гуще — скролл работает почти сразу;
    // шаг первого прохода — степень двойки под длину ролика (240 кадров → 16, 480 → 32)
    Sequence.prototype.buildQueue = function () {
        var order = [];
        var seen = new Uint8Array(this.count);
        var self = this;
        var steps = [];
        for (var st = Math.pow(2, Math.max(0, Math.round(Math.log(this.count / 16) / Math.LN2))); st >= 1; st /= 2) steps.push(st);
        steps.forEach(function (step, pass) {
            for (var i = 0; i < self.count; i += step) {
                if (!seen[i]) {
                    seen[i] = 1;
                    order.push(i);
                }
            }
            if (pass === 0 && !seen[self.count - 1]) {
                seen[self.count - 1] = 1;
                order.push(self.count - 1);
            }
            if (pass === 0) self.firstPass = order.length;
        });
        return order;
    };

    Sequence.prototype.src = function (i) {
        var s = String(i);
        while (s.length < this.pad) s = '0' + s;
        return this.base + s + '.' + this.ext + (this.version ? '?v=' + encodeURIComponent(this.version) : '');
    };

    Sequence.prototype.onProgress = function (fn) {
        this.listeners.push(fn);
    };

    Sequence.prototype.load = function (concurrency) {
        if (this.started) return;
        this.started = true;
        var self = this;
        var next = 0;
        var active = 0;
        concurrency = concurrency || 6;

        function finish(i, img) {
            self.frames[i] = img;
            self.loaded[i] = 1;
            self.loadedCount++;
            if (!self.iw) {
                self.iw = img.naturalWidth;
                self.ih = img.naturalHeight;
                self.layout();
            }
            self.dirty = true;
            self.listeners.forEach(function (fn) { fn(self); });
        }

        function pump() {
            while (active < concurrency && next < self.queue.length) {
                (function (i) {
                    active++;
                    var img = new Image();
                    img.decoding = 'async';
                    img.onload = function () {
                        var done = function () {
                            finish(i, img);
                            active--;
                            pump();
                        };
                        if (img.decode) img.decode().then(done, done);
                        else done();
                    };
                    img.onerror = function () {
                        active--;
                        pump();
                    };
                    img.src = self.src(i);
                })(self.queue[next++]);
            }
        }
        pump();
    };

    Sequence.prototype.resize = function (w, h, dpr) {
        this.cw = w;
        this.ch = h;
        var pw = Math.min(Math.round(w * Math.min(dpr, 1.5)), 2560);
        var ratio = pw / w;
        this.canvas.width = pw;
        this.canvas.height = Math.round(h * ratio);
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.layout();
        this.dirty = true;
    };

    Sequence.prototype.setFocus = function (x) {
        this.focusX = x;
        this.layout();
        this.dirty = true;
    };

    Sequence.prototype.layout = function () {
        if (!this.iw || !this.cw) return;
        var s = Math.max(this.cw / this.iw, this.ch / this.ih);
        var r = this.rect;
        r.w = this.iw * s;
        r.h = this.ih * s;
        r.x = (this.cw - r.w) * this.focusX;
        r.y = (this.ch - r.h) * this.focusY;
    };

    // t — 0..1 по всей длине ролика
    Sequence.prototype.set = function (t) {
        var f = Math.max(0, Math.min(1, t)) * (this.count - 1);
        if (Math.abs(f - this.current) > 0.0005) {
            this.current = f;
            this.dirty = true;
        }
    };

    Sequence.prototype.nearest = function (i, dir) {
        for (var k = i; k >= 0 && k < this.count; k += dir) {
            if (this.loaded[k]) return k;
        }
        return -1;
    };

    Sequence.prototype.render = function () {
        if (!this.dirty || !this.iw || !this.cw) return;
        var f = this.current;
        var a = this.nearest(Math.floor(f), -1);
        var b = this.nearest(Math.min(Math.floor(f) + 1, this.count - 1), 1);
        if (a < 0 && b < 0) return;
        if (a < 0) a = b;
        if (b < 0) b = a;
        var r = this.rect;
        var ctx = this.ctx;
        ctx.globalAlpha = 1;
        ctx.drawImage(this.frames[a], r.x, r.y, r.w, r.h);
        // между кадрами — полупрозрачное наложение следующего: скролл без «ступенек»
        if (b !== a) {
            var k = (f - a) / (b - a);
            if (k > 0.02) {
                ctx.globalAlpha = k;
                ctx.drawImage(this.frames[b], r.x, r.y, r.w, r.h);
                ctx.globalAlpha = 1;
            }
        }
        this.dirty = false;
    };

    APP.Sequence = Sequence;
})();
