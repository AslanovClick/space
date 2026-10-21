/* Интерфейс: шапка, навигация, меню, магнитные кнопки, наклон карточек, пины (Technology, тарифы), формы, прелоадер */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;
    var menuOpen = false;
    var PLANS_PIN = '(min-width: 1025px) and (min-height: 600px)'; // то же условие, что в _plans.scss
    var menuApi = null;

    function header() {
        var el = U.$('[data-header]');
        var lastY = 0;
        var hidden = false;
        var scrolled = false;
        // клавиатурный фокус внутри шапки — шапку не прячем
        el.addEventListener('focusin', function () {
            hidden = false;
            el.classList.remove('is-hidden');
        });
        APP.onTick(function () {
            var y = S.scroll;
            var sc = y > 40;
            if (sc !== scrolled) {
                scrolled = sc;
                el.classList.toggle('is-scrolled', sc);
            }
            var dy = y - lastY;
            if (Math.abs(dy) > 6) {
                var h = dy > 0 && y > S.vh * 0.6 && !menuOpen && !el.contains(document.activeElement);
                if (h !== hidden) {
                    hidden = h;
                    el.classList.toggle('is-hidden', h);
                }
                lastY = y;
            }
        });
    }

    function menu() {
        var btn = U.$('[data-burger]');
        var m = U.$('[data-menu]');
        if (!btn || !m) return;
        var links = U.$$('.menu__link, .menu__account', m);
        var outside = U.$$('main, footer');
        var tl = gsap.timeline({ paused: true })
            .set(m, { visibility: 'visible' })
            .fromTo(m, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.9, ease: 'expo.inOut' })
            .fromTo(links, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06 }, '-=0.45');

        function set(open) {
            menuOpen = open;
            btn.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            btn.setAttribute('aria-label', APP.t(open ? 'menuClose' : 'menuOpen'));
            // остальная страница недоступна, пока открыто меню (диалог)
            outside.forEach(function (el) { el.inert = open; });
            if (open) {
                tl.timeScale(1).play();
                if (APP.lenis) APP.lenis.stop();
                setTimeout(function () { links[0].focus(); }, 60);
            } else {
                tl.timeScale(1.6).reverse();
                if (APP.lenis) APP.lenis.start();
                if (m.contains(document.activeElement)) btn.focus();
            }
        }
        btn.addEventListener('click', function () { set(!menuOpen); });
        document.addEventListener('keydown', function (e) {
            if (!menuOpen) return;
            if (e.key === 'Escape') {
                set(false);
                btn.focus();
                return;
            }
            // ловушка фокуса: бургер ↔ пункты меню
            if (e.key === 'Tab') {
                var items = [btn].concat(links);
                var i = items.indexOf(document.activeElement);
                if (e.shiftKey && i <= 0) {
                    e.preventDefault();
                    items[items.length - 1].focus();
                } else if (!e.shiftKey && i === items.length - 1) {
                    e.preventDefault();
                    items[0].focus();
                }
            }
        });
        menuApi = { close: function () { if (menuOpen) set(false); } };
    }

    function anchors() {
        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[href^="#"]');
            if (!a) return;
            var id = a.getAttribute('href');
            if (id === '#') {
                e.preventDefault();
                return;
            }
            var t = U.$(id);
            if (!t) return;
            e.preventDefault();
            if (menuApi) menuApi.close();
            // глава/пин — сразу в «готовое» состояние (у тарифов — собранные карточки)
            APP.scrollTo(id === '#home' ? 0 : APP.rest.target(t));
            // фокус — на цель якоря, чтобы клавиатура и скринридер продолжили оттуда
            if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
            t.focus({ preventScroll: true });
        });
    }

    // выбор языка: выпадающий список в шапке; выбор запоминается (корень потом сам ведёт на эту версию)
    function langSwitch() {
        U.$$('[data-lang-link]').forEach(function (a) {
            a.addEventListener('click', function () {
                try { localStorage.setItem('domain-lang', a.getAttribute('data-lang-link')); } catch (e) {}
            });
        });
        var root = U.$('[data-lang]');
        if (!root) return;
        var btn = U.$('[data-lang-btn]', root);
        var list = U.$('[data-lang-list]', root);
        var items = U.$$('a', list);
        var open = false;

        function set(v, focusBtn) {
            open = v;
            root.classList.toggle('is-open', v);
            btn.setAttribute('aria-expanded', v ? 'true' : 'false');
            if (v) items[0].focus({ preventScroll: true });
            else if (focusBtn) btn.focus({ preventScroll: true });
        }

        btn.addEventListener('click', function () { set(!open); });
        document.addEventListener('click', function (e) { if (open && !root.contains(e.target)) set(false); });
        root.addEventListener('keydown', function (e) {
            if (!open) return;
            var i = items.indexOf(document.activeElement);
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
        root.addEventListener('focusout', function (e) { if (open && !root.contains(e.relatedTarget)) set(false); });
    }

    function magnetic() {
        if (S.isTouch || S.reduced) return;
        U.$$('[data-magnetic]').forEach(function (el) {
            var xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
            var yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                xTo((e.clientX - r.left - r.width / 2) * 0.25);
                yTo((e.clientY - r.top - r.height / 2) * 0.35);
            });
            el.addEventListener('mouseleave', function () {
                xTo(0);
                yTo(0);
            });
        });
    }

    // наклон к курсору + подсветка, бегущая за курсором
    function tilt() {
        if (S.isTouch || S.reduced) return;
        function spot(card, e) {
            var r = card.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width;
            var py = (e.clientY - r.top) / r.height;
            card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
            return [px, py];
        }
        U.$$('[data-tilt]').forEach(function (card) {
            gsap.set(card, { transformPerspective: 1000 });
            var rx = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: 'power3.out' });
            var ry = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: 'power3.out' });
            card.addEventListener('mousemove', function (e) {
                var p = spot(card, e);
                rx((0.5 - p[1]) * 7);
                ry((p[0] - 0.5) * 9);
            });
            card.addEventListener('mouseleave', function () {
                rx(0);
                ry(0);
            });
        });
        U.$$('[data-step]').forEach(function (card) {
            card.addEventListener('mousemove', function (e) { spot(card, e); });
        });
    }

    function nav() {
        var navEl = U.$('[data-nav]');
        if (!navEl) return;
        var links = U.$$('.nav__link', navEl);
        var ind = U.$('[data-nav-indicator]', navEl);
        var current = links[0];

        function move(link, instant) {
            gsap.to(ind, { x: link.offsetLeft, scaleX: link.offsetWidth / 100, duration: instant ? 0 : 0.8, ease: 'expo.out' });
        }

        function setActive(link) {
            if (link === current) return;
            current.classList.remove('is-active');
            current.removeAttribute('aria-current');
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'true');
            current = link;
            move(link);
        }
        current.setAttribute('aria-current', 'true');

        links.forEach(function (l, i) {
            l.addEventListener('mouseenter', function () { move(l); });
            var target = U.$(l.getAttribute('href'));
            if (!target) return;
            var last = i === links.length - 1;
            ScrollTrigger.create({
                trigger: target,
                start: last ? 'top 85%' : 'top 55%',
                end: last ? 'bottom bottom' : 'bottom 55%',
                onToggle: function (st) { if (st.isActive) setActive(l); }
            });
        });
        navEl.addEventListener('mouseleave', function () { move(current); });
        move(current, true);
        APP.onResize(function () { move(current, true); });
    }

    // пин: секция прилипает, шаги едут горизонтально, картинки внутри — параллаксом
    function tech() {
        var sec = U.$('[data-tech]');
        if (!sec) return;
        var track = U.$('[data-tech-track]', sec);
        var bar = U.$('[data-tech-bar]', sec);
        var idx = U.$('[data-tech-index]', sec);
        var steps = U.$$('[data-step]', sec);
        var last = 0;

        APP.reveal.onEnter(U.$('.tech__head', sec), 'top 75%');
        gsap.fromTo(track, { opacity: 0, y: 90 }, {
            opacity: 1,
            y: 0,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: { trigger: sec, start: 'top 70%', once: true }
        });

        function dist() { return Math.max(0, track.scrollWidth - S.vw); }

        var tween = gsap.to(track, {
            x: function () { return -dist(); },
            ease: 'none',
            scrollTrigger: {
                trigger: sec,
                start: 'top top',
                end: function () { return '+=' + dist(); },
                pin: true,
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: function (st) {
                    bar.style.transform = 'scaleX(' + st.progress.toFixed(4) + ')';
                    var n = 1 + Math.round(st.progress * (steps.length - 1));
                    if (n !== last) {
                        last = n;
                        idx.textContent = '0' + n;
                    }
                }
            }
        });

        steps.forEach(function (step) {
            var img = U.$('[data-step-img]', step);
            gsap.fromTo(img, { xPercent: -7 }, {
                xPercent: 7,
                ease: 'none',
                scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
            });
            gsap.fromTo(step, { opacity: 0.35, scale: 0.94 }, {
                opacity: 1,
                scale: 1,
                ease: 'power2.out',
                scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 100%', end: 'left 60%', scrub: true }
            });
        });

        var shapes = APP.reveal.prepIcons(track);
        var draw = APP.reveal.drawIcons(shapes);
        ScrollTrigger.create({ trigger: sec, start: 'top 60%', once: true, onEnter: function () { draw.play(); } });

        // «готовые» точки пина: целые шаги счётчика 01…05 (равномерно по ходу ленты)
        APP.rest.zone(function () {
            var st = tween.scrollTrigger;
            if (!st || st.end <= st.start) return null;
            return {
                el: sec,
                start: st.start,
                end: st.end,
                points: steps.map(function (s, i) { return st.start + (i / (steps.length - 1)) * (st.end - st.start); })
            };
        });
    }

    // пин: тарифы собираются по скроллу (на больших экранах), иначе — обычное появление
    function plans() {
        var sec = U.$('[data-plans]');
        if (!sec) return;
        var cards = U.$$('[data-plan]', sec);
        var badge = U.$('[data-plan-badge]', sec);
        var counts = U.$$('[data-count]', sec).map(APP.reveal.counter);
        var fired = false;

        function fire() {
            if (fired) return;
            fired = true;
            counts.forEach(function (c) { c.play(); });
        }

        APP.reveal.onEnter(U.$('.section-head', sec), 'top 75%', { cards: false });
        if (badge) gsap.set(badge, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
        var note = U.$('.plans__note', sec);

        // прилипшая секция = ровно экран: если контент выше, ужимаем его масштабом
        var box = U.$('.container', sec);
        var desk = window.matchMedia(PLANS_PIN);
        function fit() {
            if (!desk.matches) {
                sec.style.removeProperty('--fit');
                return;
            }
            var s = Math.min(1, (S.vh - 24) / box.offsetHeight);
            sec.style.setProperty('--fit', s.toFixed(4));
        }
        fit();
        APP.onResize(fit);

        // «готовое» состояние пина — карточки уже собраны (конец пина); начало пина «готовым» не считается
        var pinST = null;
        APP.rest.zone(function () {
            if (!pinST) return null;
            return { el: sec, start: pinST.start, end: pinST.end, points: [pinST.end], anchor: pinST.end };
        });
        // Tab по кнопкам тарифов посреди сборки — докручиваем до собранных карточек
        sec.addEventListener('focusin', function () {
            if (pinST && window.scrollY < pinST.end - 2) APP.rest.go(pinST.end);
        });

        var mm = gsap.matchMedia();
        mm.add(PLANS_PIN, function () {
            var tl = gsap.timeline({
                scrollTrigger: { trigger: sec, start: 'top top', end: '+=130%', pin: true, scrub: true }
            });
            pinST = tl.scrollTrigger;
            tl.fromTo(cards[0], { opacity: 0, x: -160, y: 60 }, { opacity: 1, x: 0, y: 0, duration: 1, ease: 'power2.out' }, 0)
                .fromTo(cards[2], { opacity: 0, x: 160, y: 60 }, { opacity: 1, x: 0, y: 0, duration: 1, ease: 'power2.out' }, 0.25)
                .fromTo(cards[1], { opacity: 0, y: 110, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power2.out' }, 0.5)
                // подпись — только когда карточки встали на места, иначе центральная наезжает на неё
                .fromTo(note, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 1.5)
                .add(fire, 0.6);
            cards.forEach(function (c, i) {
                tl.fromTo(U.$$('.plan__list li', c), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.08 }, 0.45 + i * 0.2);
            });
            if (badge) tl.fromTo(badge, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, 1.35);
            tl.to({}, { duration: 0.45 });
            return function () { pinST = null; };
        });
        mm.add('(max-width: 1024px), (max-height: 599px)', function () {
            gsap.fromTo(note, { opacity: 0, y: 20 }, {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: { trigger: note, start: 'top 94%', once: true }
            });
            cards.forEach(function (c) {
                gsap.fromTo(c, { opacity: 0, y: 70 }, {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: c, start: 'top 88%', once: true, onEnter: fire }
                });
            });
        });
    }

    function perks() {
        var sec = U.$('[data-perks]');
        if (!sec) return;
        var items = U.$$('[data-perk]', sec);
        var draw = APP.reveal.drawIcons(APP.reveal.prepIcons(sec));
        gsap.set(items, { opacity: 0, y: 30 });
        ScrollTrigger.create({
            trigger: sec,
            start: 'top 85%',
            once: true,
            onEnter: function () {
                gsap.to(items, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1 });
                draw.play();
            }
        });
    }

    function cta() {
        var box = U.$('[data-cta]');
        if (!box) return;
        APP.reveal.onEnter(U.$('.cta__content', box), 'top 72%');
        gsap.fromTo(U.$('[data-cta-img]', box), { yPercent: -6 }, {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true }
        });
        gsap.fromTo(box, { clipPath: 'inset(9% 7% 9% 7% round 18px)' }, {
            clipPath: 'inset(0% 0% 0% 0% round 18px)',
            ease: 'power2.out',
            scrollTrigger: { trigger: box, start: 'top 95%', end: 'top 45%', scrub: true }
        });
    }

    // проверка адреса — демо: настоящего API покрытия пока нет
    function checkForm() {
        var form = U.$('[data-check]');
        if (!form) return;
        var input = form.querySelector('input');
        var label = form.querySelector('.btn span');
        var out = U.$('[data-check-result]');
        var busy = false;
        input.addEventListener('input', function () {
            if (!form.classList.contains('is-error')) return;
            form.classList.remove('is-error');
            input.removeAttribute('aria-invalid');
            out.classList.remove('is-error');
            out.textContent = '';
        });
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (busy) return;
            if (!input.value.trim()) {
                form.classList.add('is-error');
                input.setAttribute('aria-invalid', 'true');
                out.classList.add('is-error');
                out.textContent = APP.t('checkErr');
                input.focus();
                return;
            }
            busy = true;
            form.classList.add('is-scanning');
            label.textContent = APP.t('scanning');
            var n = 0;
            var iv = setInterval(function () { out.textContent = APP.t('triangulating') + '.'.repeat(n++ % 4); }, 220);
            setTimeout(function () {
                clearInterval(iv);
                busy = false;
                form.classList.remove('is-scanning');
                label.textContent = APP.t('scan');
                out.textContent = '';
                var res = document.createElement('span');
                res.textContent = APP.t('checkOk');
                out.appendChild(res);
                APP.text.scramble(res, { per: 0.015, dur: 0.3 }).play();
            }, 1600);
        });
    }

    function subscribe() {
        var form = U.$('[data-subscribe]');
        if (!form) return;
        var input = form.querySelector('input');
        var status = U.$('[data-subscribe-status]', form);
        input.addEventListener('input', function () {
            form.classList.remove('is-error');
            input.removeAttribute('aria-invalid');
        });
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(input.value.trim())) {
                form.classList.add('is-error');
                input.setAttribute('aria-invalid', 'true');
                status.textContent = APP.t('subErr');
                input.focus();
                return;
            }
            form.classList.add('is-done');
            input.value = '';
            input.placeholder = APP.t('subDone');
            status.textContent = APP.t('subOk');
        });
    }

    APP.ui = {
        init: function () {
            U = APP.utils;
            S = APP.state;
            header();
            menu();
            langSwitch();
            anchors();
            magnetic();
            tilt();
            checkForm();
            subscribe();
            U.$$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
        },
        nav: nav,
        tech: tech,
        plans: plans,
        perks: perks,
        cta: cta,
        footer: function () { APP.reveal.fades(U.$('.footer')); }
    };
})();
