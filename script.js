/* =====================================================================
   Prithivi Agro World — script.js  (v2)
   Mobile menu · Lenis smooth scroll · GSAP reveal + parallax ·
   scroll-spy nav · animated stat count-up.
   Progressive enhancement throughout; honours prefers-reduced-motion.
   ===================================================================== */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ── 1. MOBILE MENU ───────────────────────────────────────────── */
  function initMenu() {
    const burger = $('.nav-burger');
    const menu = $('#m-menu');
    if (!burger || !menu) return;

    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };

    burger.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ── 2. NAV ELEVATION ─────────────────────────────────────────── */
  function makeNavUpdater() {
    const nav = $('.nav');
    if (!nav) return () => {};
    return (y) => nav.classList.toggle('is-scrolled', y > 12);
  }

  /* ── 3. SCROLL-SPY (active nav link) ──────────────────────────── */
  function initScrollSpy() {
    const links = $$('.nav-links a[data-spy]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((l) => [l.getAttribute('href').slice(1), l]));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.remove('is-active'));
        const active = byId.get(e.target.id);
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ── 4. STAT COUNT-UP ─────────────────────────────────────────── */
  function initCounters() {
    const nums = $$('[data-count]');
    if (!nums.length) return;

    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      if (reduceMotion) { el.textContent = target; return; }
      const dur = 1400, start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);           // ease-out cubic
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.4 });
    nums.forEach((n) => io.observe(n));
  }

  /* ── 5. LENIS SMOOTH SCROLL ───────────────────────────────────── */
  function initLenis() {
    if (reduceMotion || typeof Lenis === 'undefined') return null;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      });
    });
    return lenis;
  }

  /* ── 6. GSAP REVEAL + PARALLAX ────────────────────────────────── */
  function initGsap(lenis) {
    const revealEls = $$('[data-reveal]');
    const groups = $$('[data-reveal-group]');

    if (reduceMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Make everything visible if GSAP is unavailable
      [...revealEls, ...$$('[data-reveal-item]')].forEach((el) => {
        el.style.opacity = '1'; el.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // helper: set will-change only for the animation lifetime
    const lift = {
      onStart(t) { gsap.set(t, { willChange: 'transform, opacity' }); },
      onComplete(t) { gsap.set(t, { willChange: 'auto' }); },
    };

    // 6a. Single-element reveals
    revealEls.forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' },
        onStart() { lift.onStart(el); },
        onComplete() { lift.onComplete(el); },
      });
    });

    // 6b. Staggered groups
    groups.forEach((group) => {
      const items = $$('[data-reveal-item]', group);
      if (!items.length) return;
      gsap.to(items, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: group, start: 'top 84%' },
        onStart() { gsap.set(items, { willChange: 'transform, opacity' }); },
        onComplete() { gsap.set(items, { willChange: 'auto' }); },
      });
    });

    // 6c. Hero image parallax (subtle, polished)
    const heroImg = $('.hero-media img');
    if (heroImg) {
      gsap.to(heroImg, {
        yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ── BOOT ─────────────────────────────────────────────────────── */
  function boot() {
    initMenu();
    initScrollSpy();
    initCounters();

    const lenis = initLenis();
    const updateNav = makeNavUpdater();
    updateNav(window.scrollY);

    if (lenis) {
      lenis.on('scroll', ({ scroll }) => updateNav(scroll));
    } else {
      window.addEventListener('scroll', () => updateNav(window.scrollY), { passive: true });
    }

    initGsap(lenis);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
