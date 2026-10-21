/* Главы с видео: прогресс скролла → кадр ролика, панели-секции появляются и уходят синхронно с видео */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;
    var FADE = 0.035; // доля главы на въезд/выезд панели

    // "0:0,.13:.12,..." → [[0,0],[.13,.12],...] — прогресс главы → позиция в ролике
    function parseMap(str) {
        return str.split(',').map(function (pair) {
            var p = pair.split(':');
            return [parseFloat(p[0]), parseFloat(p[1])];
        });
    }

    function mapValue(map, p) {
        if (p <= map[0][0]) return map[0][1];
        for (var i = 1; i < map.length; i++) {
            if (p <= map[i][0]) {
                var a = map[i - 1];
                var b = map[i];
                return a[1] + (b[1] - a[1]) * ((p - a[0]) / (b[0] - a[0]));
            }
        }
        return map[map.length - 1][1];
    }

    // кадры 1920 (из 4K-исходника) — для десктопа; 1280 — телефонам, планшетам и режиму экономии трафика
    function useHD() {
        var saveData = navigator.connection && navigator.connection.saveData;
        return !saveData && window.matchMedia('(min-width: 1025px)').matches;
    }

    function Chapter(el) {
        this.el = el;
        this.id = el.getAttribute('data-chapter');
        this.map = parseMap(el.getAttribute('data-map'));
        this.duration = parseFloat(el.getAttribute('data-duration') || 10);
        this.focus = parseFloat(el.getAttribute('data-focus') || 0.5);
        this.focusM = parseFloat(el.getAttribute('data-focus-m') || this.focus);
        this.seq = new APP.Sequence(el.querySelector('[data-canvas]'), {
            base: (useHD() && el.getAttribute('data-seq-hd')) || el.getAttribute('data-seq'),
            count: parseInt(el.getAttribute('data-count'), 10),
            version: el.getAttribute('data-seq-v'),
            focusX: this.focus
        });
        this.panels = U.$$('[data-panel]', el).map(function (p) {
            return { el: p, a: parseFloat(p.getAttribute('data-in')), b: parseFloat(p.getAttribute('data-out')), rest: parseFloat(p.getAttribute('data-rest-at') || 0.3), entered: false, enter: null };
        });
        this.p = 0;
        this.t = 0;
        this.ts = 0; // сглаженная позиция ролика
        this.visible = false;
        this.hooks = [];
        this.resize();
    }

    Chapter.prototype.resize = function () {
        this.seq.resize(S.vw, S.vh, S.dpr);
        this.seq.setFocus(S.isMobile ? this.focusM : this.focus);
    };

    Chapter.prototype.panel = function (name) {
        for (var i = 0; i < this.panels.length; i++) {
            if (this.panels[i].el.classList.contains('panel--' + name)) return this.panels[i];
        }
        return null;
    };

    // создаём ScrollTrigger'ы — вызывается в порядке следования секций на странице
    Chapter.prototype.build = function () {
        var self = this;
        var tl = gsap.timeline({ paused: true });
        var shift = S.reduced ? 0 : 1;

        // только прозрачность (не visibility): скрытые панели остаются в дереве доступности,
        // а при фокусе внутри — страница сама докручивается до панели (см. focusin ниже)
        this.panels.forEach(function (P) {
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
                var g = APP.reveal.group(P.el);
                P.enter = function () { g.play(); };
                if (S.reduced) g.progress(1);
            }
        });
        tl.to({}, { duration: 0.001 }, 1);
        tl.progress(0);
        this.syncPointer();

        // Tab в панель, которая сейчас не показана целиком, — встаём на её «готовую» точку
        this.el.addEventListener('focusin', function (e) {
            var P = null;
            self.panels.forEach(function (x) { if (x.el.contains(e.target)) P = x; });
            if (!P || self.isReady(P)) return;
            APP.rest.go(self.restY(P));
        });

        this.st = ScrollTrigger.create({
            trigger: this.el,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: function (st) {
                self.p = st.progress;
                tl.progress(st.progress);
                self.syncPointer();
                self.check();
            }
        });

        ScrollTrigger.create({
            trigger: this.el,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: function (st) {
                self.visible = st.isActive;
                if (st.isActive) self.seq.load();
            }
        });

        // панели, видимые с самого начала главы (не hero) — запускаем, когда глава въезжает в экран
        this.panels.forEach(function (P) {
            if (P.a === 0 && self.id !== 'void') {
                ScrollTrigger.create({
                    trigger: self.el,
                    start: 'top 60%',
                    once: true,
                    onEnter: function () {
                        P.entered = true;
                        P.enter();
                    }
                });
            }
        });
    };

    // окно прогресса, в котором панель показана целиком (без въезда/выезда)
    Chapter.prototype.window = function (P) {
        return [P.a > 0 ? P.a + FADE : 0, P.b < 1 ? P.b - FADE : 1];
    };

    // «готовая» точка панели: начало главы для первой панели, иначе доля окна полной видимости
    // (по умолчанию 30%; data-rest-at у панели — например, манифесту нужен конец, когда горят все слова)
    Chapter.prototype.restP = function (P) {
        if (P.a === 0) return 0;
        var w = this.window(P);
        return w[0] + (w[1] - w[0]) * P.rest;
    };

    Chapter.prototype.restY = function (P) {
        return this.st.start + this.restP(P) * (this.st.end - this.st.start);
    };

    Chapter.prototype.isReady = function (P) {
        var w = this.window(P);
        return this.p >= w[0] - 0.002 && this.p <= w[1] + 0.002;
    };

    // невидимые панели не перехватывают клики у видимой
    Chapter.prototype.syncPointer = function () {
        this.panels.forEach(function (P) {
            var o = P.el.style.opacity;
            var on = (o === '' ? 1 : parseFloat(o)) > 0.5;
            if (on !== P.on) {
                P.on = on;
                P.el.style.pointerEvents = on ? '' : 'none';
            }
        });
    };

    Chapter.prototype.check = function () {
        var p = this.p;
        this.panels.forEach(function (P) {
            if (!P.entered && P.a > 0 && p >= P.a && p <= P.b) {
                P.entered = true;
                P.enter();
            }
        });
    };

    Chapter.prototype.tick = function (time, dt) {
        this.t = mapValue(this.map, this.p);
        // лёгкое сглаживание поверх Lenis — кадры не дёргаются даже на колесе с шагом
        this.ts = S.reduced ? this.t : U.damp(this.ts, this.t, 14, dt);
        if (!this.visible) return;
        this.seq.set(this.ts);
        this.seq.render();
        for (var i = 0; i < this.hooks.length; i++) this.hooks[i](this, time, dt);
    };

    // ---------- глава 1: hero-интро ----------
    function heroIntro(ch) {
        var root = ch.el;
        var T = APP.text;
        var kicker = U.$('[data-hero-kicker]', root);
        var t1 = U.$('[data-hero-t1]', root);
        var t2 = U.$('[data-hero-t2]', root);
        var lead = U.$('[data-hero-lead]', root);
        var hud = U.$$('[data-hero-hud] .hud-row', root);
        var hint = U.$('[data-hero-hint]', root);

        var k = T.type(kicker, { stagger: 0.02, duration: 0.4 });
        var a = T.type(t1, { caret: true, stagger: 0.055, duration: 0.6, caretHold: 0.6 });
        var b = T.type(t2, { caret: true, stagger: 0.055, duration: 0.6, caretHold: 3 });
        gsap.set(lead, { opacity: 0, y: 26 });
        gsap.set(hud, { opacity: 0, x: 24 });

        var tl = gsap.timeline({ paused: true })
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
    function manifesto(ch) {
        var P = ch.panel('manifesto');
        var el = U.$('[data-words]', P.el);
        var words = el.textContent.trim().split(/\s+/);
        // скринридеру — цельная фраза, «загорающиеся» слова от него скрыты
        el.innerHTML = '<span class="sr-only">' + words.join(' ') + '</span><span aria-hidden="true">' +
            words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ') + '</span>';
        var spans = U.$$('.w', el);
        var last = -1;

        ch.hooks.push(function () {
            var local = U.range(ch.p, P.a + 0.01, P.b - 0.07);
            if (Math.abs(local - last) < 0.0005) return;
            last = local;
            var x = local * (spans.length + 1.5) - 0.5;
            for (var i = 0; i < spans.length; i++) {
                spans[i].style.opacity = (0.14 + 0.86 * U.clamp(x - i, 0, 1)).toFixed(3);
            }
        });
    }

    // ---------- глава 1: лента партнёров крутится, только когда видна ----------
    function partners(ch) {
        var P = ch.panel('partners');
        APP.marquee.init(U.$('[data-marquee]', P.el));
        ch.hooks.push(function () {
            APP.marquee.setActive(ch.p > P.a - FADE);
        });
    }

    // ---------- глава 2: прицел ведёт корабль + «живая» телеметрия ----------
    function reticle(ch) {
        var cfg = APP.config;
        var el = U.$('[data-reticle]', ch.el);
        var dist = U.$('[data-reticle-dist]', ch.el);
        var P = ch.panel('relay');
        var kf = cfg.reticle;
        var tele = {
            vel: U.$('[data-tele="vel"]', P.el),
            lat: U.$('[data-tele="lat"]', P.el),
            thr: U.$('[data-tele="thr"]', P.el)
        };
        var lastTele = 0;

        function at(sec) {
            if (sec <= kf[0][0]) return kf[0];
            for (var i = 1; i < kf.length; i++) {
                if (sec <= kf[i][0]) {
                    var a = kf[i - 1];
                    var b = kf[i];
                    var k = (sec - a[0]) / (b[0] - a[0]);
                    return [sec, U.lerp(a[1], b[1], k), U.lerp(a[2], b[2], k), U.lerp(a[3], b[3], k)];
                }
            }
            return kf[kf.length - 1];
        }

        ch.hooks.push(function (c, time) {
            var sec = c.ts * ch.duration;
            var panelOn = U.range(c.p, P.a - 0.01, P.a + 0.02) * (1 - U.range(c.p, P.b - 0.03, P.b));
            var o = panelOn * U.range(sec, cfg.reticleFrom, cfg.reticleFrom + 0.6) * (1 - U.range(sec, cfg.reticleTo - 0.5, cfg.reticleTo));
            el.style.opacity = o.toFixed(3);
            if (o <= 0) return;

            var r = c.seq.rect;
            var k = at(sec);
            var w = k[3] * r.w;
            var h = w * 0.62;
            var x = r.x + k[1] * r.w - w / 2;
            var y = r.y + k[2] * r.h - h / 2;
            el.style.width = w.toFixed(1) + 'px';
            el.style.height = h.toFixed(1) + 'px';
            el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
            var km = Math.round(U.lerp(1240, 12, U.range(sec, cfg.reticleFrom, cfg.reticleTo)));
            dist.textContent = APP.t('dist') + ' ' + APP.num(km, 0, true) + ' ' + APP.t('km');

            if (time - lastTele > 0.22) {
                lastTele = time;
                tele.vel.textContent = APP.num(7.58 + Math.random() * 0.04, 2) + ' ' + APP.t('kms');
                tele.lat.textContent = APP.num(4.0 + Math.random() * 0.6, 1) + ' ' + APP.t('ms');
                tele.thr.textContent = APP.num(9.62 + Math.random() * 0.33, 2) + ' ' + APP.t('gbps');
            }
        });
    }

    var chapters = {};

    APP.chapters = {
        // создаём главы и сразу начинаем грузить первую (для прелоадера)
        init: function () {
            U = APP.utils;
            S = APP.state;
            U.$$('[data-chapter]').forEach(function (el) {
                var ch = new Chapter(el);
                chapters[ch.id] = ch;
            });
            APP.onResize(function () {
                Object.keys(chapters).forEach(function (id) { chapters[id].resize(); });
            });
            APP.onTick(function (time, dt) {
                var covered = false;
                Object.keys(chapters).forEach(function (id) {
                    var ch = chapters[id];
                    ch.tick(time, dt);
                    if (ch.p > 0.001 && ch.p < 0.999) covered = true;
                });
                // пока сцена с видео закрывает экран, звёздам под ней рисоваться незачем
                S.covered = covered;
            });
            var v = chapters.void;
            v.seq.load(8);
            // вторая глава догружается после первой
            v.seq.onProgress(function (s) {
                if (s.loadedCount === s.count && chapters.orbit) chapters.orbit.seq.load();
            });
            return v.seq;
        },

        get: function (id) { return chapters[id]; },

        // «готовые» точки всех панелей всех глав (для app.rest.js)
        restPoints: function () {
            var out = [];
            Object.keys(chapters).forEach(function (id) {
                var ch = chapters[id];
                if (!ch.st) return;
                out.push({ el: ch.el, start: ch.st.start, end: ch.st.end, points: ch.panels.map(function (P) { return ch.restY(P); }) });
            });
            return out;
        },

        buildVoid: function () {
            var ch = chapters.void;
            var hero = ch.panel('hero');
            var intro = heroIntro(ch);
            hero.entered = true;
            hero.enter = function () { intro.play(); };
            manifesto(ch);
            partners(ch);
            ch.build();
        },

        buildOrbit: function () {
            var ch = chapters.orbit;
            if (!ch) return;
            reticle(ch);
            ch.build();
        },

        playHero: function () {
            chapters.void.panel('hero').enter();
        }
    };
})();
