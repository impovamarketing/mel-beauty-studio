/* Mel Beauty Studio · Scroll-Choreografie, Floating Preview, Karte
   Lenis (Smooth-Scroll) + GSAP ScrollTrigger. Alles ist progressiv:
   Ohne die Bibliotheken oder bei "Bewegung reduzieren" bleibt die Seite voll nutzbar. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Lenis: weiches Scrollen ---------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.07, smoothWheel: true, wheelMultiplier: 0.9 });
    window.lenis = lenis;
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  // Interne Links weich ansteuern (Header-Höhe berücksichtigt)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) { if (lenis) { e.preventDefault(); lenis.scrollTo(0); } return; }
    const t = $(id); if (!t) return;
    if (a.dataset.openTab && window.melSelectTab) window.melSelectTab(a.dataset.openTab);
    if (lenis) { e.preventDefault(); lenis.scrollTo(t, { offset: -84, duration: 1.4 }); history.replaceState(null, '', id); }
  });

  /* ---------- Signature: Bild links wechselt, wenn ein Text die Bildmitte erreicht ---------- */
  const sig = $('#signature');
  if (sig) {
    const frames = $$('.sig-x__frame', sig), items = $$('.sig-x__item', sig);
    const count = $('.sig-x__count', sig), name = $('.sig-x__name', sig);
    const show = i => {
      frames.forEach((f, k) => f.classList.toggle('is-active', k === i));
      items.forEach((it, k) => it.classList.toggle('is-active', k === i));
      count.textContent = String(i + 1).padStart(2, '0');
      name.textContent = $('.sig-x__title', items[i]).textContent;
    };
    // Aktiv ist der Eintrag, dessen Mitte der Bildschirmmitte am nächsten liegt (robust auch bei Sprüngen)
    let cur = 0, ticking = false;
    const pick = () => {
      ticking = false;
      const mid = innerHeight / 2;
      let best = cur, bd = Infinity;
      items.forEach((it, k) => { const r = it.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = k; } });
      if (best !== cur) { cur = best; show(best); }
    };
    const onSigScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(pick); } };
    addEventListener('scroll', onSigScroll, { passive: true });
    if (lenis) lenis.on('scroll', onSigScroll);
    pick();
  }

  if (hasGsap && !reduce) {
    gsap.registerPlugin(ScrollTrigger);

    /* Parallax: Elemente mit data-speed bewegen sich mit eigener Geschwindigkeit */
    $$('[data-speed]').forEach(el => {
      const s = parseFloat(el.dataset.speed) || 1;
      gsap.fromTo(el, { y: () => (1 - s) * -110 }, {
        y: () => (1 - s) * 110, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2, invalidateOnRefresh: true },
      });
    });

    /* Brückenbild: öffnet sich per Clip-Path und zoomt beim Scrollen über die Sektionsgrenze */
    const bridge = $('.bridge-img');
    if (bridge) {
      gsap.fromTo(bridge, { clipPath: 'inset(18% 12% 18% 12%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: bridge, start: 'top 95%', end: 'top 30%', scrub: 1.2 },
      });
      gsap.fromTo($('img', bridge), { scale: 1.35 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: bridge, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
    }

    /* Hero: zwei Bilder bewegen sich sanft gegeneinander (Hauptbild -30px, Detail +20px) */
    $$('[data-hero-parallax]').forEach(el => {
      gsap.fromTo(el, { y: 0 }, { y: parseFloat(el.dataset.heroParallax), ease: 'none',
        scrollTrigger: { trigger: '.hero-x', start: 'top top', end: 'bottom top', scrub: 1.2 } });
    });

    /* Galerie-Bilder: leichte Parallaxe innerhalb der Rahmen */
    $$('.g-item img, .menu-img img').forEach(img => {
      gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.closest('figure'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* Grüne Flächen: Überschrift skaliert sanft auf */
    $$('.section-pine h2').forEach(h => {
      gsap.fromTo(h, { scale: .94, transformOrigin: '0% 100%' }, { scale: 1, ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'top 40%', scrub: true } });
    });

    /* Footer-Wortmarke wächst beim Erreichen des Seitenendes */
    const wm = $('.wordmark');
    if (wm) gsap.fromTo(wm, { yPercent: 40, opacity: .02 }, { yPercent: 0, opacity: .09, ease: 'none', scrollTrigger: { trigger: wm, start: 'top bottom', end: 'bottom bottom', scrub: true } });

    addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ---------- Floating Image Reveal: Foto schwebt träge neben der Maus ---------- */
  const fp = $('.float-preview');
  if (fp && fine && !reduce && matchMedia('(min-width: 1024px)').matches) {
    const img = $('img', fp);
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, vx = 0, on = false;
    addEventListener('pointermove', e => { tx = e.clientX + 170; ty = e.clientY; }, { passive: true });
    $$('.mrow[data-preview]').forEach(row => {
      row.addEventListener('pointerenter', () => {
        const src = row.dataset.preview;
        if (!img.src.endsWith(src)) img.src = src;
        fp.classList.add('is-on'); on = true;
      });
      row.addEventListener('pointerleave', () => { fp.classList.remove('is-on'); on = false; });
    });
    const tick = () => {
      const nx = x + (tx - x) * 0.085, ny = y + (ty - y) * 0.085;
      vx += ((nx - x) - vx) * 0.2; x = nx; y = ny;
      if (on || fp.classList.contains('is-on')) fp.style.transform = `translate3d(${x}px,${y}px,0) rotate(${Math.max(-3, Math.min(3, vx * 0.18))}deg)`;
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* ---------- Interaktive Karte (lädt erst nach Klick, DSGVO) ---------- */
  const loadBtn = $('#map-load');
  if (loadBtn) loadBtn.addEventListener('click', () => {
    loadBtn.disabled = true; loadBtn.textContent = 'Karte wird geladen …';
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script'); js.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
    js.onload = () => {
      const L = window.L, pos = [48.53793, 12.15409];
      const map = L.map('map', { center: pos, zoom: 17, zoomControl: false, scrollWheelZoom: false, attributionControl: true });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-Mitwirkende',
      }).addTo(map);
      const icon = L.divIcon({ className: '', html: '<span class="mel-marker"><i></i><i></i><b></b></span>', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -12] });
      L.marker(pos, { icon, title: 'Mel Beauty Studio' }).addTo(map)
        .bindPopup('<b>Mel Beauty Studio</b>Neustadt 439, 84028 Landshut<br><a href="https://www.google.com/maps/search/?api=1&query=Mel+Beauty+Studio%2C+Neustadt+439%2C+84028+Landshut" target="_blank" rel="noopener">Route planen →</a>')
        .openPopup();
      map.on('click', () => map.scrollWheelZoom.enable());
      $('#map-wrap').classList.add('is-loaded');
    };
    js.onerror = () => { loadBtn.disabled = false; loadBtn.textContent = 'Erneut versuchen'; };
    document.head.appendChild(js);
  });
})();
