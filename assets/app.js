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

  /* =========================================================
     Beauty-Concierge
     Regelbasierter Assistent mit Antworten aus den bestätigten
     Studio-Infos. Anfragen gehen per WhatsApp an Meltem.
     ========================================================= */
  const box = $('#concierge'), launch = $('.c-launch', box), panel = $('#c-panel'), log = $('.c-log', box), quick = $('.c-quick', box), form = $('.c-form', box), input = $('#c-input');
  const state = { picks: [], step: null, when: '', name: '', started: false };

  const TREATS = ['PhiBrows Microblading', 'Powder Brows', 'Lippenschattierung', 'Lidstrich', 'PhiRemoval', 'DS V-Line Kollagenfadenlifting', 'Algenpeeling', 'Microneedling', 'Skin Care', 'Vitaminbehandlung', 'Augenbrauenkorrektur', 'Augenbrauenlifting', 'Wimpernlifting', 'Noch unsicher, Beratung'];
  const DEFAULT_QUICK = ['Termin anfragen', 'Preise ansehen', 'Anfahrt Landshut', 'Wie lange hält PhiBrows?', 'Altes PMU entfernen'];

  const KB = [
    { k: ['preis', 'kost', 'teuer', 'euro', '€', 'preise'], a: 'Ein Überblick: PhiBrows Microblading 490 €, Powder Brows 390 €, Lippenschattierung 450 €, Liner 250–350 € (jeweils inkl. Nachbehandlung), Kopfhautpigmentierung 350 €, PhiRemoval Gesicht 149 €, DS V-Line Kollagenfadenlifting 245 €, Algenpeeling 99 €, Microneedling ab 119 €, Skin Care ab 99 €, Wimpernlifting inkl. Färben 90 €. Das ganze Menü steht oben unter „Behandlungen“.', go: '#behandlungen' },
    { k: ['anfahrt', 'adresse', 'wo ', 'wo?', 'wo ist', 'standort', 'route', 'neustadt', 'finde'], a: 'Das Studio ist in der Landshuter Neustadt: Neustadt 439, 84028 Landshut. <a href="https://www.google.com/maps/search/?api=1&query=Mel+Beauty+Studio%2C+Neustadt+439%2C+84028+Landshut" target="_blank" rel="noopener">Route in Google Maps öffnen</a>.' },
    { k: ['öffnung', 'offen', 'geöffnet', 'uhrzeit', 'wann habt', 'wann hast'], a: 'Termine vereinbarst du per Telefon (<a href="tel:+491636839277">0163 6839277</a>), WhatsApp oder Direktnachricht auf Instagram. Feste Öffnungszeiten sind hier nicht hinterlegt, Meltem nennt dir gern freie Termine.' },
    { k: ['wie lange hält', 'haltbar', 'hält', 'halten', 'jahre'], a: 'PhiBrows Microblading hält 2 bis 3 Jahre (je nach Hauttyp, Lebensstil und Pflege), Lippen etwa 2 Jahre, DS V-Line ca. 12 Monate, Wimpernlifting 4 bis 6 Wochen. Auffrischung nach 12 Monaten: PhiBrows 225 €, Brows &amp; Lippen 190 €, Liner 150 €. Ab 18 Monaten oder bei Fremdarbeit gilt der Neupreis.' },
    { k: ['nachbehandlung', 'nachbehandeln', '21'], a: 'Bei PhiBrows, Powder Brows, Lippen und allen Linern ist die Nachbehandlung nach 21 Tagen im Preis enthalten.' },
    { k: ['entfern', 'removal', 'tattoo', 'altes', 'alte', 'pmu weg', 'korrigier'], a: 'Mit PhiRemoval werden Farbpigmente ohne Lasertechnologie präzise entfernt. Mit hautschonenden Produkten lassen sich fehlerhafte Permanent Make-ups, Microblading oder Tattoos entfernen oder korrigieren. Gesicht 149 €, Körper individuell.' },
    { k: ['brauenlifting', 'augenbrauenlifting', 'brauen lifting', 'färben'], a: 'Augenbrauenlifting inkl. Färben: Die Härchen werden verstärkt und formbar gemacht, die Form hält mehrere Wochen (Preis auf Anfrage). Wimpernlifting inkl. Färben: Ellebana-Lifting am Ansatz, gefärbt in dunkelbraun oder schwarz, hält 4 bis 6 Wochen, 90 €.' },
    { k: ['korrektur', 'fadentechnik', 'zupfen', 'goldener schnitt'], a: 'Augenbrauenkorrektur: Vermessung mit dem Goldenen-Schnitt-Messgerät und Formung mit Fadentechnik passend zu deinen Gesichtszügen. Preis auf Anfrage.' },
    { k: ['phibrows', 'microblading', 'härchen', 'brauen', 'augenbrauen'], a: 'PhiBrows Microblading: Feine, haarförmige Striche in Wuchsrichtung ergänzen fehlende Härchen und verdichten die Brauen optisch, kaum von echten zu unterscheiden. Hält 2–3 Jahre, 490 € inkl. Nachbehandlung nach 21 Tagen.' },
    { k: ['powder', 'microshading', 'ombr'], a: 'Powder Brows (Microshading): feine, punktuelle Schattierungen statt Härchen, Puder-Effekt mit Ombré-Verlauf. Für alle Hauttypen, ideal bei fettiger Haut oder Mischhaut. 390 € inkl. Nachbehandlung nach 21 Tagen.' },
    { k: ['lippe', 'lips'], a: 'Lippenschattierung: sanft mit Gloss-Effekt oder als Vollschattierung mit Lipstick-Effekt. Vorgezeichnet, mit feinsten Nadelstichen schattiert, abschließend gepflegt. Hält ca. 2 Jahre, 450 € inkl. Nachbehandlung nach 21 Tagen.' },
    { k: ['liner', 'lidstrich', 'eyeliner'], a: 'Eyeliner 350 €, Babyliner 300 €, Dipliner 250 €, jeweils inkl. Nachbehandlung nach 21 Tagen.' },
    { k: ['v-line', 'vline', 'kollagen', 'falten', 'straff'], a: 'DS V-Line Kollagenfadenlifting mit Microneedling: feinere Linien, mehr Elastizität, pralleres Hautbild. Für alle Hauttypen, sichtbar ab der ersten Behandlung, keine Ausfallzeit, wirkt ca. 12 Monate. 245 €.' },
    { k: ['peeling', 'algae', 'algen', 'schäl'], a: 'Algenpeeling: 100 % biologische Schälkur gegen Akne, verstopfte Poren, Aknenarben und Pigmentflecken. Die Haut schält sich nach 3 bis 7 Tagen, danach ist SPF 50 Pflicht. Nicht bei akuter Rosacea, offenen Wunden oder Couperose. Gesicht 99 €.' },
    { k: ['needling', 'narben', 'poren', 'dehnungsstreifen'], a: 'Microneedling: Feine Nadeln (0,5–2,5 mm) regen Regeneration und körpereigenes Kollagen an. Bei Falten, Narben, Dehnungsstreifen, Akne und großen Poren. Gesicht 119 €, Gesicht + Hals 139 €.' },
    { k: ['skin', 'haut', 'akne', 'pflege', 'gesichtsbehandlung', 'facial'], a: 'Skin Care individuell nach Hauttyp: Classic 99 €, Professional 129 €, Akne 139 €.' },
    { k: ['haar', 'bart', 'vitamin', 'haarausfall', 'kopfhaut'], a: 'Vitaminbehandlung mit PhiHair-Serum und Microneedling aktiviert die Haarfollikel und stärkt geschwächte Bereiche: Kopfhaut 199 €, Bart 139 €, Augenbrauen 99 €, einzelne Stellen 99 €. Für lichte Stellen gibt es außerdem die Kopfhautpigmentierung (350 €).' },
    { k: ['wimper', 'lash'], a: 'Wimpernlifting inkl. Färben: Die eigenen Wimpern werden mit Ellebana-Lotionen am Ansatz angehoben und dunkelbraun oder schwarz gefärbt. Hält 4 bis 6 Wochen, 90 €. Danach 24 Stunden kein Wasser, Dampf oder Öl im Augenbereich.' },
    { k: ['hygien', 'steril'], a: 'Alle verwendeten Aufsätze sind steril und personengebunden.' },
    { k: ['vegan', 'pigment', 'allerg', 'schwermetall'], a: 'Phi-Pigmente sind frei von Schwermetallen, Weichmachern und allergieauslösenden Konservierungsstoffen, vegan und tierversuchsfrei. Die Farben werden gleichmäßig heller, ohne in Rot-, Blau- oder Grüntöne zu kippen.' },
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
