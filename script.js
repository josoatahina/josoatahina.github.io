/**
 * Portfolio — Josoa Tahina
 * JavaScript vanilla, aucune dépendance
 */

(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    setupYear();
    setupTheme();
    setupNavScroll();
    setupMobileMenu();
    setupSmoothAnchors();
    setupScrollSpy();
    setupReveal();
    setupCounters();
    setupTitleWords();
  });

  /* ------------------------------------------------------------------
     Année dynamique
     ------------------------------------------------------------------ */
  function setupYear() {
    const el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------
     Thème clair / sombre
     ------------------------------------------------------------------ */
  function setupTheme() {
    const root = document.documentElement;
    const btn = $('#themeBtn');
    const KEY = 'josoa-theme';

    const stored = localStorage.getItem(KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));

    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem(KEY, next);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (localStorage.getItem(KEY)) return;
      root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
  }

  /* ------------------------------------------------------------------
     Nav — état scrolled
     ------------------------------------------------------------------ */
  function setupNavScroll() {
    const nav = $('#nav');
    if (!nav) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------
     Menu mobile
     ------------------------------------------------------------------ */
  function setupMobileMenu() {
    const btn = $('#burger');
    const menu = $('#mobileMenu');
    if (!btn || !menu) return;

    const close = () => {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    };
    const open = () => {
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    };

    btn.addEventListener('click', () => {
      btn.getAttribute('aria-expanded') === 'true' ? close() : open();
    });

    menu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  /* ------------------------------------------------------------------
     Smooth scroll pour les ancres
     ------------------------------------------------------------------ */
  function setupSmoothAnchors() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        history.pushState(null, '', href);
      });
    });
  }

  /* ------------------------------------------------------------------
     Scroll-spy — lien actif dans la nav.
     Suit l'ensemble des sections dans la bande d'observation :
     quand aucune n'y est (haut de page, hero), on vide tous les états.
     ------------------------------------------------------------------ */
  function setupScrollSpy() {
    const links = $$('.nav-menu a[data-nav]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const sections = links
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    if (!sections.length) return;

    const visible = new Set();

    const applyActive = () => {
      if (visible.size === 0) {
        links.forEach((link) => link.classList.remove('active'));
        return;
      }
      const firstVisible = sections.find((s) => visible.has(s.id));
      const targetHref = firstVisible ? `#${firstVisible.id}` : null;
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === targetHref);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        applyActive();
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    sections.forEach((s) => observer.observe(s));
  }

  /* ------------------------------------------------------------------
     Reveal au scroll
     ------------------------------------------------------------------ */
  function setupReveal() {
    const sel = '.section-head, .about-quote, .about-body, .work-item, .approach-item, .stack-col, .xp-item, .contact-block, .footer-inner';
    const items = $$(sel);
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const siblings = Array.from(entry.target.parentNode.children).filter((c) => c.matches(sel));
            const idx = siblings.indexOf(entry.target);
            entry.target.style.transitionDelay = `${Math.min(idx, 5) * 0.08}s`;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
     Compteurs animés
     ------------------------------------------------------------------ */
  function setupCounters() {
    const counters = $$('.stat-num[data-count]');
    if (!counters.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach((el) => (el.textContent = el.dataset.count));
      return;
    }

    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10);
      if (Number.isNaN(target)) return;
      const duration = 1800;
      const start = performance.now();

      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
     Décalage des mots du titre hero — index continu entre les lignes,
     avec une petite pause entre la ligne principale et la ligne d'accroche
     ------------------------------------------------------------------ */
  function setupTitleWords() {
    const lines = $$('.title-line');
    let running = 0;
    const base = 0.25;
    const step = 0.08;
    const lineGap = 2;

    lines.forEach((line, lineIdx) => {
      const words = $$('.word', line);
      words.forEach((w) => {
        w.style.animationDelay = `${base + running * step}s`;
        running += 1;
      });
      if (lineIdx < lines.length - 1) running += lineGap;
    });
  }
})();
