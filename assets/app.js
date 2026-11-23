/* Mel Beauty Studio · Interaktion, Motion und Beauty-Concierge (Vanilla JS) */
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
  addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); closeConcierge(); } });

  let lastY = scrollY, ticking = false;
  const steps = $('.steps');
  const onScroll = () => {
    const y = scrollY, open = burger.getAttribute('aria-expanded') === 'true';
    bar.classList.toggle('is-scrolled', y > 10 || open);
    if (!open) bar.classList.toggle('is-hidden', y > 520 && y > lastY + 3);
    if (y < lastY - 3) bar.classList.remove('is-hidden');
    // Handy: Termin-Knopf erst einblenden, wenn der Hero-Button aus dem Blick ist
    const cBox = document.getElementById('concierge');
    if (cBox) cBox.classList.toggle('c-away', innerWidth <= 640 && y < innerHeight * 0.6 && !cBox.classList.contains('is-open'));
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

  /* ---------- Galerie mit Slideshow ---------- */
  const gal = $('.gallery');
  if (gal) {
    const items = $$('.g-item', gal), n = items.length, count = $('.gal-count b'), fill = $('.gal-bar span'), toggle = $('.gal-play');
    const DELAY = 3500;           // Wechsel alle 3,5 Sekunden
    let pos = 0, programmatic = 0;

    // Aktives Bild hervorheben, Zähler und Fortschritt setzen
    const setActive = i => {
      pos = (i + n) % n;
      items.forEach((it, k) => it.classList.toggle('is-active', k === pos));
      count.textContent = String(pos + 1).padStart(2, '0');
      fill.style.transform = 'scaleX(' + ((pos + 1) / n) + ')';
    };
    const goTo = i => {
      setActive(i);
      const pad = parseFloat(getComputedStyle(gal).paddingLeft);
      const max = gal.scrollWidth - gal.clientWidth;
      programmatic = Date.now() + 900;
      gal.scrollTo({ left: Math.min(max, items[pos].offsetLeft - pad), behavior: still ? 'auto' : 'smooth' });
    };
    // Bei manuellem Scrollen das Bild am linken Rand als aktiv nehmen
    gal.addEventListener('scroll', () => requestAnimationFrame(() => {
      if (Date.now() < programmatic) return;
      const left = gal.getBoundingClientRect().left + parseFloat(getComputedStyle(gal).paddingLeft);
      let idx = 0, best = Infinity;
      items.forEach((it, k) => { const d = Math.abs(it.getBoundingClientRect().left - left); if (d < best) { best = d; idx = k; } });
      if (idx !== pos) setActive(idx);
    }), { passive: true });

    /* Automatik: pausiert bei Hover, Fokus, Berührung, außerhalb des Sichtbereichs,
       in einem Hintergrund-Tab, per Pause-Button und bei "Bewegung reduzieren". */
    let timer = null, paused = still, hover = false, visible = false, holdUntil = 0;
    const canRun = () => !paused && !hover && visible && !document.hidden && Date.now() > holdUntil && !gal.contains(document.activeElement);
    const schedule = () => { clearTimeout(timer); timer = setTimeout(() => { if (canRun()) goTo(pos + 1); schedule(); }, DELAY); };
    const hold = () => { holdUntil = Date.now() + 6000; schedule(); };
    const setPaused = p => {
      paused = p;
      toggle.setAttribute('aria-pressed', p);
      toggle.setAttribute('aria-label', p ? 'Slideshow starten' : 'Slideshow pausieren');
      toggle.classList.toggle('is-paused', p);
      schedule();
    };
    toggle.addEventListener('click', () => setPaused(!paused));
    gal.addEventListener('mouseenter', () => { hover = true; });
    gal.addEventListener('mouseleave', () => { hover = false; schedule(); });
    gal.addEventListener('touchstart', hold, { passive: true });
    gal.addEventListener('wheel', hold, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: 0.35 }).observe(gal);
    document.addEventListener('visibilitychange', schedule);
    $$('.gal-btn[data-dir]').forEach(b => b.addEventListener('click', () => { goTo(pos + Number(b.dataset.dir)); hold(); }));

    // Ziehen mit der Maus
    let down = false, sx = 0, sl = 0, moved = false;
    gal.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; hold(); down = true; moved = false; sx = e.clientX; sl = gal.scrollLeft; gal.classList.add('is-drag'); });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 3) moved = true; gal.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; gal.classList.remove('is-drag'); });
    gal.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);
    $$('img', gal).forEach(i => i.draggable = false);

    setActive(0);
    setPaused(paused);
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

  /* =========================================================
     Beauty-Concierge
     Regelbasierter Assistent mit Antworten aus den bestätigten
     Studio-Infos. Anfragen gehen per WhatsApp an Meltem.
     ========================================================= */
  const box = $('#concierge'), launch = $('.c-launch', box), panel = $('#c-panel'), log = $('.c-log', box), quick = $('.c-quick', box), form = $('.c-form', box), input = $('#c-input');
  const state = { picks: [], step: null, when: '', name: '', started: false };

  const TREATS = ['PhiBrows Microblading', 'Powder Brows', 'Permanent Make-up Lippen', 'PhiRemoval', 'DS V-Line Kollagen', 'Microneedling', 'Skin Care', 'Vitaminbehandlung', 'Wimpernlifting', 'Noch unsicher, Beratung'];
  const DEFAULT_QUICK = ['Termin anfragen', 'Preise ansehen', 'Anfahrt Landshut', 'Wie lange hält PhiBrows?', 'Altes PMU entfernen'];

  const KB = [
    { k: ['preis', 'kost', 'teuer', 'euro', '€', 'preise'], a: 'Ein Überblick: PhiBrows Microblading 490 €, Powder Brows 390 €, Lippen 450 €, Liner 250–350 € (jeweils inkl. Nachbehandlung), PhiRemoval Gesicht 149 €, DS V-Line Kollagen 245 €, Microneedling ab 119 €, Skin Care ab 99 €, Wimpernlifting 90 €. Das ganze Menü steht oben unter „Behandlungen“.', go: '#behandlungen' },
    { k: ['anfahrt', 'adresse', 'wo ', 'wo?', 'wo ist', 'standort', 'route', 'neustadt', 'finde'], a: 'Das Studio ist in der Landshuter Neustadt: Neustadt 439, 84028 Landshut. <a href="https://www.google.com/maps/search/?api=1&query=Mel+Beauty+Studio%2C+Neustadt+439%2C+84028+Landshut" target="_blank" rel="noopener">Route in Google Maps öffnen</a>.' },
    { k: ['öffnung', 'offen', 'geöffnet', 'uhrzeit', 'wann habt', 'wann hast'], a: 'Termine vereinbarst du per Telefon (<a href="tel:+491636839277">0163 6839277</a>), WhatsApp oder Direktnachricht auf Instagram. Feste Öffnungszeiten sind hier nicht hinterlegt, Meltem nennt dir gern freie Termine.' },
    { k: ['wie lange hält', 'haltbar', 'hält', 'halten', 'jahre'], a: 'PhiBrows Microblading hält 2 bis 3 Jahre, Permanent Make-up an den Lippen etwa 2 Jahre. Auffrischung nach 12 Monaten: PhiBrows 225 €, Brows &amp; Lippen 190 €, Liner 150 €. Ab 18 Monaten oder bei Fremdarbeit gilt der Neupreis.' },
    { k: ['nachbehandlung', 'nachbehandeln', '21'], a: 'Bei PhiBrows, Powder Brows, Lippen und allen Linern ist die Nachbehandlung nach 21 Tagen im Preis enthalten.' },
    { k: ['entfern', 'removal', 'tattoo', 'altes', 'alte', 'pmu weg', 'korrigier'], a: 'Mit PhiRemoval werden Farbpigmente ohne Lasertechnologie präzise entfernt. Mit hautschonenden Produkten lassen sich fehlerhafte Permanent Make-ups, Microblading oder Tattoos entfernen oder korrigieren. Gesicht 149 €, Körper individuell.' },
    { k: ['phibrows', 'microblading', 'härchen', 'brauen', 'augenbrauen'], a: 'PhiBrows Microblading erzielt einen natürlichen 3D-Augenbraueneffekt: Fehlende Härchen werden ergänzt, blasse Brauen optisch verdichtet. Vegane PhiBrows Pigmente ohne Farbveränderung, sterile personengebundene Aufsätze. Hält 2–3 Jahre, 490 € inkl. Nachbehandlung nach 21 Tagen.' },
    { k: ['powder'], a: 'Powder Brows sind eine Pigmentierung der Augenbrauen, 390 € inkl. Nachbehandlung nach 21 Tagen. Ob PhiBrows oder Powder Brows besser zu dir passt, klärt Meltem in der individuellen Beratung.' },
    { k: ['lippe', 'lips'], a: 'Permanent Make-up für die Lippen: Blasse Lippenfarben werden intensiviert, asymmetrische oder formlose Lippen erhalten eine harmonische, natürliche Kontur. Organische Pigmente, hält ca. 2 Jahre. 450 € inkl. Nachbehandlung nach 21 Tagen.' },
    { k: ['liner', 'lidstrich', 'eyeliner'], a: 'Eyeliner 350 €, Babyliner 300 €, Dipliner 250 €, jeweils inkl. Nachbehandlung nach 21 Tagen.' },
    { k: ['v-line', 'vline', 'kollagen', 'falten', 'straff'], a: 'DS V-Line Kollagen: Natürliche Kollagenfäden straffen die Haut sanft und reduzieren Falten, tiefe Linien, Poren und Pigmentflecken, ohne chirurgischen Eingriff. 245 €.' },
    { k: ['peeling', 'algae', 'algen'], a: 'Das Algae Peeling ist eine biologische Behandlung mit feinen Algenpartikeln. Es unterstützt die natürliche Hauterneuerung, etwa bei unreiner Haut, Narben, großen Poren, Pigmentflecken oder Dehnungsstreifen. Gesicht 99 €.' },
    { k: ['needling', 'narben', 'poren'], a: 'Microneedling mit individuell abgestimmten Seren gegen Narben, Pigmentflecken und unregelmäßige Hautstruktur. Gesicht 119 €, Gesicht + Hals 139 €.' },
    { k: ['skin', 'haut', 'akne', 'pflege', 'gesichtsbehandlung', 'facial'], a: 'Skin Care individuell nach Hauttyp: Classic 99 €, Professional 129 €, Akne 139 €.' },
    { k: ['haar', 'bart', 'vitamin', 'haarausfall', 'kopfhaut'], a: 'Vitaminbehandlungen stärken geschwächte Bereiche an Haar, Bart und Augenbrauen mit speziellen Seren: Kopfhaut 199 €, Bart 139 €, Augenbrauen 99 €, einzelne Stellen 99 €.' },
    { k: ['wimper', 'lash'], a: 'Wimpernlifting: schonende Methode zur dauerhaften Schwunggebung der natürlichen Wimpern, ohne künstliche Wimpernverlängerung. 90 €.' },
    { k: ['hygien', 'steril'], a: 'Alle verwendeten Aufsätze sind steril und personengebunden.' },
    { k: ['vegan', 'pigment', 'allerg'], a: 'Die PhiBrows Pigmente sind vegan und verursachen keine Farbveränderung. Für die Lippen werden organische Pigmente verwendet.' },
    { k: ['wer ist', 'meltem', 'erfahrung', 'zertifi', 'ausbildung'], a: 'Meltem Demirci ist Kosmetikerin seit 10 Jahren und zertifiziert als PhiBrows Artist sowie für DS V-Line Kollagenfäden und Algae Peeling.' },
  ];

  const scrollLog = () => { log.scrollTop = log.scrollHeight; };
  const add = (html, who = 'bot') => { const m = document.createElement('div'); m.className = 'msg ' + who; m.innerHTML = html; log.appendChild(m); scrollLog(); return m; };
  const say = (html, delay = 650) => new Promise(res => {
    if (still) { add(html); return res(); }
    const t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); scrollLog();
    setTimeout(() => { t.remove(); add(html); res(); }, delay);
  });
  const chips = list => { quick.innerHTML = ''; list.forEach(l => { const b = document.createElement('button'); b.type = 'button'; b.textContent = l; b.addEventListener('click', () => handle(l, true)); quick.appendChild(b); }); };

  const waLink = text => `${WA}?text=${encodeURIComponent(text)}`;
  const summary = () => {
    const parts = ['Hallo Meltem,'];
    parts.push(`ich interessiere mich für: ${state.picks.join(', ') || 'eine Beratung'}.`);
    if (state.when) parts.push(`Wunschzeit: ${state.when}.`);
    if (state.name) parts.push(`Viele Grüße, ${state.name}`);
    parts.push('(Anfrage über die Website)');
    return parts.join('\n');
  };

  async function startTermin() {
    state.step = 'treat';
    if (state.picks.length) return askWhen();
    await say('Sehr gern. Welche Behandlung interessiert dich? Du kannst auch mehrere nacheinander antippen.');
    chips(TREATS);
  }
  async function askWhen() {
    state.step = 'when';
    await say(`Notiert: <b>${esc(state.picks.join(', '))}</b>. Wann passt es dir ungefähr?`);
    chips(['Vormittags', 'Nachmittags', 'Samstag', 'Flexibel']);
  }
  async function askName() {
    state.step = 'name';
    await say('Wie darf Meltem dich ansprechen? Schreib deinen Vornamen unten ins Feld, oder überspring den Schritt.');
    chips(['Überspringen']); input.focus();
  }
  async function finish() {
    state.step = null;
    const text = summary();
    await say(`Deine Anfrage ist vorbereitet:<br><br><i>${esc(text).replace(/\n/g, '<br>')}</i><br><a class="wa" href="${waLink(text)}" target="_blank" rel="noopener">Per WhatsApp senden</a>`, 900);
    await say('Meltem meldet sich dann persönlich bei dir. Lieber anrufen? <a href="tel:+491636839277">0163 6839277</a>', 500);
    chips(['Neue Anfrage', 'Preise ansehen', 'Anfahrt Landshut']);
  }

  async function handle(raw, fromChip = false) {
    const text = raw.trim(); if (!text) return;
    add(esc(text), 'me'); quick.innerHTML = '';
    const low = text.toLowerCase();

    if (state.step === 'treat' && fromChip) {
      if (!state.picks.includes(text)) state.picks.push(text);
      return askWhen();
    }
    if (state.step === 'when') { state.when = text; return askName(); }
    if (state.step === 'name') { if (low !== 'überspringen') state.name = text.slice(0, 40); return finish(); }

    if (/termin|buchen|anfrage|neue anfrage/.test(low)) { if (low === 'neue anfrage') { state.picks = []; state.when = ''; state.name = ''; } return startTermin(); }
    if (low === 'anfahrt landshut') return answer(KB[1]);
    if (low === 'altes pmu entfernen') return answer(KB[5]);

    const hit = KB.find(e => e.k.some(k => low.includes(k)));
    if (hit) return answer(hit);
    await say(`Das beantwortet dir Meltem am besten persönlich. <a class="wa" href="${waLink('Hallo Meltem, ich habe eine Frage: ' + text)}" target="_blank" rel="noopener">Frage per WhatsApp senden</a>`);
    chips(DEFAULT_QUICK);
  }
  async function answer(e) {
    await say(e.a);
    if (e.go) { const t = $(e.go); t && setTimeout(() => t.scrollIntoView({ behavior: still ? 'auto' : 'smooth' }), 300); }
    chips(['Termin anfragen', ...DEFAULT_QUICK.filter(q => q !== 'Termin anfragen').slice(0, 3)]);
  }

  function openConcierge(mode) {
    box.classList.remove('c-away'); box.classList.add('is-open'); panel.hidden = false; launch.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => panel.classList.add('is-open'));
    if (innerWidth <= 640) { document.body.style.overflow = 'hidden'; if (window.lenis) window.lenis.stop(); }
    setMenu(false);
    if (!state.started) {
      state.started = true;
      say('Willkommen im Mel Beauty Studio. Ich bin der digitale Concierge und helfe dir bei Fragen zu Behandlungen oder bereite deine Terminanfrage an Meltem vor.', 400)
        .then(() => mode === 'termin' ? startTermin() : chips(DEFAULT_QUICK));
    } else if (mode === 'termin') startTermin();
    else if (mode === 'picked') askWhen();
    if (innerWidth > 640) setTimeout(() => input.focus({ preventScroll: true }), 500);
  }
  function closeConcierge() {
    if (!box.classList.contains('is-open')) return;
    panel.classList.remove('is-open'); launch.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
    setTimeout(() => { panel.hidden = true; box.classList.remove('is-open'); launch.focus({ preventScroll: true }); }, 380);
  }
  launch.addEventListener('click', () => openConcierge());
  $('.c-x', box).addEventListener('click', closeConcierge);
  $$('[data-concierge]').forEach(b => b.addEventListener('click', () => openConcierge(b.dataset.concierge)));
  form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; handle(v); });

  /* „Auswählen“ im Behandlungs-Menü */
  $$('.pick').forEach(b => b.addEventListener('click', () => {
    const name = b.dataset.pick;
    if (!state.picks.includes(name)) state.picks.push(name);
    b.classList.add('is-picked'); b.textContent = 'Ausgewählt ✓';
    const wasStarted = state.started;
    if (!wasStarted) { openConcierge('termin'); return; }
    openConcierge();
    add(esc(name), 'me'); askWhen();
  }));
})();
