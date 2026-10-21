/* Ядро: конфиг, общее состояние, плавный скролл (Lenis) и единый цикл кадров на тикере GSAP */
(function () {
    var APP = window.APP = window.APP || {};

    APP.config = {
        // HUD-прицел во 2-м видео: [секунда видео, x, y (доли кадра), ширина рамки (доля ширины кадра)]
        reticle: [
            [2.3, 0.496, 0.5, 0.16], [4, 0.5, 0.49, 0.17], [5, 0.49, 0.48, 0.2], [6, 0.497, 0.46, 0.25],
            [6.5, 0.49, 0.47, 0.29], [7, 0.497, 0.485, 0.32], [7.5, 0.475, 0.475, 0.35], [8, 0.483, 0.48, 0.38],
            [8.5, 0.5, 0.45, 0.45], [9, 0.48, 0.46, 0.5], [9.5, 0.485, 0.42, 0.56], [9.9, 0.45, 0.5, 0.6]
        ],
        reticleFrom: 2.3,
        reticleTo: 9.7
    };

    // строки интерфейса и числа по правилам языка страницы (словарь пишет Pug в window.I18N)
    var I18N = window.I18N || {};
    var numFormats = {};
    APP.lang = I18N.lang || document.documentElement.lang || 'en';
    APP.t = function (key) { return I18N[key] != null ? I18N[key] : key; };
    APP.num = function (v, dec, group) {
        var k = (dec || 0) + (group ? 'g' : '');
        if (!numFormats[k]) {
            try {
                numFormats[k] = new Intl.NumberFormat(I18N.intl || 'en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0, useGrouping: !!group });
            } catch (e) {
                numFormats[k] = { format: function (x) { return x.toFixed(dec || 0); } };
            }
        }
        return numFormats[k].format(v);
    };

    var U = APP.utils = {
        clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
        lerp: function (a, b, t) { return a + (b - a) * t; },
        range: function (v, a, b) { return U.clamp((v - a) / (b - a), 0, 1); },
        damp: function (a, b, lambda, dt) { return U.lerp(a, b, 1 - Math.exp(-lambda * dt)); },
        $: function (s, ctx) { return (ctx || document).querySelector(s); },
        $$: function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); }
    };

    var S = APP.state = {
        vw: window.innerWidth,
        vh: window.innerHeight,
        dpr: 1,
        isMobile: false,
        isTouch: false,
        reduced: false,
        scroll: 0,
        time: 0,
        mouse: { x: 0, y: 0, sx: 0, sy: 0 }
    };

    var reads = [];
    var ticks = [];
    var resizers = [];

    // read — только чтение layout (getBoundingClientRect), tick — запись стилей и рендер
    APP.onRead = function (fn) { reads.push(fn); };
    APP.onTick = function (fn) { ticks.push(fn); };
    APP.onResize = function (fn) { resizers.push(fn); };

    function measure() {
        S.vw = window.innerWidth;
        S.vh = window.innerHeight;
        S.isMobile = S.vw < 768 || S.vw / S.vh < 0.8;
        S.dpr = Math.min(window.devicePixelRatio || 1, 2);
    }

    APP.initCore = function () {
        S.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        S.isTouch = window.matchMedia('(hover: none)').matches;
        if (S.reduced) document.documentElement.classList.add('is-reduced');

        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
        measure();

        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });

        if (!S.reduced && window.Lenis) {
            APP.lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
            APP.lenis.on('scroll', ScrollTrigger.update);
            APP.lenis.stop();
        }

        gsap.ticker.add(function (time, deltaTime) {
            var dt = Math.min(deltaTime / 1000, 0.1);
            var i;
            if (APP.lenis) APP.lenis.raf(time * 1000);
            S.time = time;
            S.scroll = window.scrollY || window.pageYOffset;
            S.mouse.sx = U.damp(S.mouse.sx, S.mouse.x, 3.5, dt);
            S.mouse.sy = U.damp(S.mouse.sy, S.mouse.y, 3.5, dt);
            for (i = 0; i < reads.length; i++) reads[i](time, dt);
            for (i = 0; i < ticks.length; i++) ticks[i](time, dt);
        });
        gsap.ticker.lagSmoothing(0);

        if (!S.isTouch) {
            window.addEventListener('mousemove', function (e) {
                S.mouse.x = (e.clientX / S.vw) * 2 - 1;
                S.mouse.y = (e.clientY / S.vh) * 2 - 1;
            }, { passive: true });
        }

        var lastW = S.vw;
        var lastH = S.vh;
        var timer;
        window.addEventListener('resize', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                var w = window.innerWidth;
                var h = window.innerHeight;
                // на телефонах прячется/появляется адресная строка — это не настоящий ресайз
                if (S.isTouch && w === lastW && Math.abs(h - lastH) < 160) return;
                lastW = w;
                lastH = h;
                measure();
                resizers.forEach(function (fn) { fn(); });
                ScrollTrigger.refresh();
            }, 150);
        });
    };

    var expoOut = function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };

    APP.scrollTo = function (target) {
        if (APP.lenis) {
            APP.lenis.scrollTo(target, { duration: 1.8, easing: expoOut });
            return;
        }
        var y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: y, behavior: S.reduced ? 'auto' : 'smooth' });
    };
})();
