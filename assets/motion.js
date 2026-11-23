/* Mel Beauty Studio · Scroll-Choreografie, Cursor, Magnet-Buttons, Karte
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

  /* ---------- Signature-Showcase: Index aus Scrollfortschritt ---------- */
  const showcase = $('#signature');
  if (showcase) {
    const slides = $$('.sc-slide', showcase), bar = $('.sc-bar i', showcase), count = $('.sc-count b', showcase);
    let idx = 0;
    const desk = matchMedia('(min-width: 1024px)');
    const onScroll = () => {
      if (!desk.matches) return;
      const r = showcase.getBoundingClientRect();
      const total = showcase.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      bar.style.transform = `scaleX(${p})`;
      const i = Math.min(slides.length - 1, Math.floor(p * slides.length * 0.999));
      if (i !== idx) {
        slides[idx].classList.remove('is-active'); slides[idx].classList.add('is-leaving');
        const old = slides[idx]; setTimeout(() => old.classList.remove('is-leaving'), 1000);
        slides[i].classList.add('is-active'); idx = i;
        count.textContent = String(i + 1).padStart(2, '0');
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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

    /* Hero: Inhalt gleitet beim Wegscrollen weich zurück */
    const heroText = $('.hero .lg\\:col-span-6');
    if (heroText) gsap.to(heroText, { yPercent: -5, opacity: .55, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

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

    /* Laufband: Tempo und Neigung folgen der Scroll-Geschwindigkeit */
    const track = $('.marquee-track');
    if (track) {
      track.style.animation = 'none';
      let x = 0, speed = 0.45;
      const half = () => track.scrollWidth / 2;
      gsap.ticker.add(() => {
        const v = lenis ? Math.abs(lenis.velocity) : 0;
        speed += ((0.45 + Math.min(v * 0.12, 1.8)) - speed) * 0.04;
        x -= speed;
        const w = half(); if (x <= -w) x += w;
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      });
    }

    addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ---------- Eigener Cursor ---------- */
  if (fine && !reduce) {
    const cur = $('.cursor'), ring = $('.cursor-ring'), dot = $('.cursor-dot'), label = $('.cursor-label');
    document.documentElement.classList.add('has-cursor');
    cur.classList.add('is-hidden'); // erst sichtbar, wenn die Maus sich bewegt
    let mx = -100, my = -100, rx = mx, ry = my, first = true;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (first) { rx = mx; ry = my; first = false; } cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    const tick = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(tick);
    };
    tick();
    document.addEventListener('pointerover', e => {
      const media = e.target.closest('.g-item, .sc-img, .menu-visual, .bridge-img, .hero-visual, .studio-ambient');
      const link = e.target.closest('a, button, [role="tab"], summary, input, .leaflet-marker-icon');
      cur.classList.toggle('is-media', !!media && !link);
      cur.classList.toggle('is-link', !!link);
      label.textContent = media ? (media.classList.contains('g-item') ? 'Ziehen' : 'Ansehen') : '';
      const onPine = e.target.closest('.section-pine');
      ring.style.borderColor = ''; if (onPine && !media) ring.style.borderColor = 'rgba(200,170,110,.9)';
    });
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

  /* ---------- Magnetische Buttons ---------- */
  if (fine && !reduce) {
    $$('.btn, .gal-btn, .c-launch, .brand-mark').forEach(el => {
      el.setAttribute('data-magnetic', '');
      const strength = el.classList.contains('btn') ? 0.16 : 0.22;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 1s cubic-bezier(.16,1,.3,1)';
        el.style.transform = '';
      });
    });
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
