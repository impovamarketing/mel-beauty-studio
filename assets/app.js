/* Mel Beauty Studio · Interaktion und Motion (Vanilla JS) */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = 'https://wa.me/491636839277';
  const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ---------- Navigation ---------- */
  const bar = $('#top-bar'), burger = $('#burger'), mnav = $('#mnav');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    document.body.style.overflow = open ? 'hidden' : '';
    if (window.lenis) open ? window.lenis.stop() : window.lenis.start();
    if (open) { mnav.hidden = false; requestAnimationFrame(() => mnav.classList.add('is-open')); bar.classList.add('is-scrolled'); }
    else { mnav.classList.remove('is-open'); setTimeout(() => { if (!mnav.classList.contains('is-open')) mnav.hidden = true; }, 450); }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  let lastY = scrollY, ticking = false;
  const steps = $('.steps');
  const onScroll = () => {
    const y = scrollY, open = burger.getAttribute('aria-expanded') === 'true';
    bar.classList.toggle('is-scrolled', y > 10 || open);
    if (!open) bar.classList.toggle('is-hidden', y > 520 && y > lastY + 3);
    if (y < lastY - 3) bar.classList.remove('is-hidden');
    // Handy: WhatsApp-Knopf erst einblenden, wenn der Hero aus dem Blick ist
    const waBtn = document.getElementById('wa-float');
    if (waBtn) waBtn.classList.toggle('is-away', innerWidth <= 640 && y < innerHeight * 0.6);
    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (innerHeight * 0.6)));
      steps.style.setProperty('--p', p.toFixed(3));
      $$('li', steps).forEach((li, i, all) => li.classList.toggle('in', p >= i / all.length + 0.02));
    }
    lastY = y; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Aktiver Abschnitt in der Navigation */
  const spyLinks = $$('[data-spy]');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    spyLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  spyLinks.forEach(a => { const s = $(a.getAttribute('href')); s && spy.observe(s); });

  /* ---------- Reveal ---------- */
  $$('.split').forEach(el => {
    const html = el.innerHTML.trim(); let i = 0;
    el.setAttribute('aria-label', el.textContent.trim());
    // Wörter einzeln maskieren, <em> bleibt erhalten
    el.innerHTML = html.split(/(<em[^>]*>.*?<\/em>)/).map(part => {
      if (part.startsWith('<em')) {
        const open = part.match(/^<em[^>]*>/)[0], inner = part.replace(/^<em[^>]*>|<\/em>$/g, '');
        return inner.split(/\s+/).filter(Boolean).map(w => `<span class="w" aria-hidden="true"><span style="--i:${i++}">${open}${w}</em></span></span>`).join(' ');
      }
      return part.split(/\s+/).filter(Boolean).map(w => `<span class="w" aria-hidden="true"><span style="--i:${i++}">${w}</span></span>`).join(' ');
    }).join(' ').replace(/\s+([.,!?“])/g, '$1');
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    $$('[data-count]', e.target).forEach(countUp);
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  const startReveals = () => { document.documentElement.classList.add('rv-live'); $$('.rv, .split, .reveal-img').forEach(el => io.observe(el)); };
  if (document.documentElement.classList.contains('preloading')) document.addEventListener('mel:ready', startReveals, { once: true });
  else startReveals();

  function countUp(el) {
    if (still) return;
    const to = +el.dataset.count, t0 = performance.now(), dur = 1400;
    const tick = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  /* ---------- Behandlungs-Tabs ---------- */
  const tabs = $$('[role="tab"]'), ink = $('.tab-ink');
  const moveInk = t => { ink.style.width = t.offsetWidth + 'px'; ink.style.transform = `translateX(${t.offsetLeft}px)`; };
  const selectTab = (t, focus) => {
    tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
    $$('[role="tabpanel"]').forEach(p => {
      const on = p.id === t.getAttribute('aria-controls');
      p.hidden = !on;
      if (on && !still) { p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
    });
    $$('.menu-img').forEach(f => f.classList.toggle('is-on', f.dataset.for === t.dataset.tab));
    moveInk(t); if (focus) t.focus();
    t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: still ? 'auto' : 'smooth' });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  addEventListener('load', () => moveInk($('[role="tab"][aria-selected="true"]')));
  addEventListener('resize', () => moveInk($('[role="tab"][aria-selected="true"]')));
  moveInk(tabs[0]);
  window.melSelectTab = name => { const t = tabs.find(x => x.dataset.tab === name); if (t) selectTab(t); };

  /* ---------- Galerie: Slideshow, wechselt alle 3,5 Sekunden ----------
     Läuft weiter, auch wenn die Maus darüber steht. Pausiert nur per Button,
     außerhalb des Sichtbereichs, in einem Hintergrund-Tab und bei "Bewegung reduzieren". */
  const show = $('.gal-x__show');
  if (show) {
    const slides = $$('.gal-x__slide', show), thumbs = $$('.gal-x__thumb', show), n = slides.length;
    const count = $('.gal-x__count b', show), cap = $('.gal-x__cap', show), fill = $('.gal-x__progress span', show);
    const toggle = $('.gal-play', show), stage = $('.gal-x__stage', show);
    const DELAY = 3500;
    let pos = 0, elapsed = 0, last = 0, paused = still, visible = false;

    const go = i => {
      pos = (i + n) % n; elapsed = 0;
      slides.forEach((s, k) => { s.classList.toggle('is-active', k === pos); s.toggleAttribute('aria-hidden', k !== pos); });
      thumbs.forEach((t, k) => { t.classList.toggle('is-active', k === pos); t.toggleAttribute('aria-current', k === pos); });
      count.textContent = String(pos + 1).padStart(2, '0');
      cap.textContent = thumbs[pos].dataset.cap;
      fill.style.transform = 'scaleX(0)';
      const next = slides[(pos + 1) % n].querySelector('img'); if (next.loading === 'lazy') next.loading = 'eager';
    };
    const tick = t => {
      const dt = last ? t - last : 0; last = t;
      if (!paused && visible && !document.hidden) {
        elapsed += dt;
        fill.style.transform = 'scaleX(' + Math.min(1, elapsed / DELAY) + ')';
        if (elapsed >= DELAY) go(pos + 1);
      }
      requestAnimationFrame(tick);
    };
    const setPaused = p => {
      paused = p;
      toggle.setAttribute('aria-pressed', p);
      toggle.setAttribute('aria-label', p ? 'Slideshow starten' : 'Slideshow pausieren');
      toggle.classList.toggle('is-paused', p);
    };
    toggle.addEventListener('click', () => setPaused(!paused));
    $$('.gal-btn[data-dir]', show).forEach(b => b.addEventListener('click', () => go(pos + Number(b.dataset.dir))));
    thumbs.forEach(t => t.addEventListener('click', () => go(Number(t.dataset.i))));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.3 }).observe(stage);

    // Wischen auf dem Handy, Ziehen mit der Maus
    let sx = null;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; });
    stage.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go(pos + (dx < 0 ? 1 : -1)); });
    stage.addEventListener('pointercancel', () => { sx = null; });
    // Pfeiltasten, wenn die Slideshow fokussiert ist
    show.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(pos + 1); else if (e.key === 'ArrowLeft') go(pos - 1); });

    go(0);
    setPaused(paused);
    requestAnimationFrame(tick);
  }

  /* ---------- FAQ weich animieren ---------- */
  $$('details.faq').forEach(d => {
    const s = $('summary', d), body = $('.faq-body', d);
    s.addEventListener('click', e => {
      if (still) return; e.preventDefault();
      if (d.open) {
        const a = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 450, easing: 'cubic-bezier(.65,0,.35,1)' });
        d.classList.add('closing'); a.onfinish = () => { d.open = false; d.classList.remove('closing'); };
      } else {
        d.open = true; const h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    });
  });

})();
