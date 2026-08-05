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
    setupLightbox();
    setupChatBubble();

    const year = new Date().getFullYear();
    document.querySelectorAll('.current-year').forEach(el => el.textContent = year);
  });

  /* ------------------------------------------------------------------
     Bulle de portrait flottante — déplaçable au drag (souris ou tactile),
     position persistée dans localStorage, clic (sans drag) scroll vers
     la section Contact. Se replace dans la fenêtre au resize.
     ------------------------------------------------------------------ */
  function setupChatBubble() {
    const bubble = $('#chatBubble');
    if (!bubble) return;

    const STORAGE_KEY = 'chat-bubble-position';
    const CLICK_THRESHOLD = 5;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const applyPosition = (x, y) => {
      const size = bubble.offsetWidth;
      const maxX = window.innerWidth - size - 8;
      const maxY = window.innerHeight - size - 8;
      const clampedX = clamp(x, 8, maxX);
      const clampedY = clamp(y, 8, maxY);
      bubble.style.left = clampedX + 'px';
      bubble.style.top = clampedY + 'px';
      bubble.style.right = 'auto';
      bubble.style.bottom = 'auto';
      return { x: clampedX, y: clampedY };
    };

    const restore = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      try {
        const { x, y } = JSON.parse(stored);
        if (typeof x === 'number' && typeof y === 'number') applyPosition(x, y);
      } catch (e) { /* ignore */ }
    };
    restore();

    let dragging = false;
    let hasMoved = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let startBubbleX = 0;
    let startBubbleY = 0;

    const onPointerDown = (e) => {
      const rect = bubble.getBoundingClientRect();
      startBubbleX = rect.left;
      startBubbleY = rect.top;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      dragging = true;
      hasMoved = false;
      bubble.classList.add('is-dragging');
      bubble.setPointerCapture && bubble.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startPointerX;
      const dy = e.clientY - startPointerY;
      if (!hasMoved && (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD)) {
        hasMoved = true;
      }
      applyPosition(startBubbleX + dx, startBubbleY + dy);
    };

    const onPointerUp = (e) => {
      if (!dragging) return;
      dragging = false;
      bubble.classList.remove('is-dragging');
      bubble.releasePointerCapture && bubble.releasePointerCapture(e.pointerId);

      if (hasMoved) {
        const rect = bubble.getBoundingClientRect();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: rect.left, y: rect.top }));
      }
    };

    bubble.addEventListener('pointerdown', onPointerDown);
    bubble.addEventListener('pointermove', onPointerMove);
    bubble.addEventListener('pointerup', onPointerUp);
    bubble.addEventListener('pointercancel', onPointerUp);

    bubble.addEventListener('click', (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const rect = bubble.getBoundingClientRect();
        if (bubble.style.left) applyPosition(rect.left, rect.top);
      }, 120);
    });
  }

  /* ------------------------------------------------------------------
     Lightbox — clic sur une image projet ouvre un aperçu plein écran
     avec zoom molette et déplacement par glisser-déposer.
     ------------------------------------------------------------------ */
  function setupLightbox() {
    const lightbox = $('#lightbox');
    const stage    = $('#lightboxStage');
    const img      = $('#lightboxImg');
    const closeBtn = $('#lightboxClose');
    if (!lightbox || !stage || !img || !closeBtn) return;

    const MIN_SCALE = 1;
    const MAX_SCALE = 6;
    const state = { scale: 1, tx: 0, ty: 0, dragging: false, startX: 0, startY: 0, baseTx: 0, baseTy: 0 };

    const apply = () => {
      img.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
      img.style.cursor = state.scale > 1 ? (state.dragging ? 'grabbing' : 'grab') : 'zoom-in';
    };

    const reset = () => { state.scale = 1; state.tx = 0; state.ty = 0; apply(); };

    const open = (src, alt) => {
      img.src = src;
      img.alt = alt || '';
      reset();
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => lightbox.classList.add('is-open'));
    };

    const close = () => {
      lightbox.classList.remove('is-open');
      const done = () => {
        lightbox.hidden = true;
        document.body.style.overflow = '';
        img.src = '';
        lightbox.removeEventListener('transitionend', done);
      };
      lightbox.addEventListener('transitionend', done);
    };

    $$('.work-img').forEach((el) => {
      el.style.cursor = 'zoom-in';
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open(el.currentSrc || el.src, el.alt);
      });
    });

    closeBtn.addEventListener('click', close);
    stage.addEventListener('click', (e) => { if (e.target === stage) close(); });
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === '+' || e.key === '=') { state.scale = Math.min(MAX_SCALE, state.scale + 0.5); apply(); }
      else if (e.key === '-') { state.scale = Math.max(MIN_SCALE, state.scale - 0.5); if (state.scale === 1) { state.tx = 0; state.ty = 0; } apply(); }
      else if (e.key === '0') reset();
    });

    img.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.scale === 1) { state.scale = 2; apply(); }
      else reset();
    });

    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, state.scale + delta * state.scale));
      state.scale = next;
      if (state.scale === 1) { state.tx = 0; state.ty = 0; }
      apply();
    }, { passive: false });

    img.addEventListener('mousedown', (e) => {
      if (state.scale <= 1) return;
      e.preventDefault();
      state.dragging = true;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.baseTx = state.tx;
      state.baseTy = state.ty;
      apply();
    });
    window.addEventListener('mousemove', (e) => {
      if (!state.dragging) return;
      state.tx = state.baseTx + (e.clientX - state.startX);
      state.ty = state.baseTy + (e.clientY - state.startY);
      apply();
    });
    window.addEventListener('mouseup', () => {
      if (!state.dragging) return;
      state.dragging = false;
      apply();
    });
  }

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
