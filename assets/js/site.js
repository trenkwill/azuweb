// Comportements de page : navigation, machine à remonter le temps, tracés au stylo,
// ligne de crête du Vercors, adresse email et formulaire de contact.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var nav = document.getElementById('nav');
  function stick() { nav.classList.toggle('is-stuck', window.scrollY > 8); }
  window.addEventListener('scroll', stick, { passive: true });
  stick();
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Hasard reproductible : les tracés sont les mêmes à chaque visite ---------- */
  function rng(seed) {
    return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  }

  /* ---------- La machine à remonter le temps ---------- */
  var machine = document.getElementById('machine');
  if (machine) (function () {
  var captions = {
    tables: 'Fin des années 90. Un tableau pour le catalogue, un bon de commande à imprimer, et un chèque par la poste.',
    web2: 'Milieu des années 2000. Le panier arrive, avec les boutons brillants et le « paiement 100 % sécurisé ».',
    flat: 'Années 2010. Le téléphone impose ses règles : aplats, grandes photos, menu replié.',
    now: "Aujourd'hui. Une promesse, une preuve, un bouton. Et toujours la même question : est-ce que ça vend ?",
  };
  var tabs = [].slice.call(machine.querySelectorAll('[role="tab"]'));
  var eras = [].slice.call(machine.querySelectorAll('.era'));
  function show(name) {
    tabs.forEach(function (t) {
      var on = t.dataset.era === name;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      if (on) document.getElementById('era-view').setAttribute('aria-labelledby', t.id);
    });
    eras.forEach(function (e) { e.hidden = e.dataset.era !== name; });
    machine.dataset.era = name;
    document.getElementById('era-caption').textContent = captions[name];
  }
  /* ---------- Le passage d'une époque à l'autre : la page se défait en points, puis se refait ---------- */
  // Couleurs dominantes de chaque époque : les points les portent pendant le passage.
  var PALETTE = {
    tables: ['#c0c0c0', '#000080', '#ffffcc', '#ffffff', '#dfdfdf'],
    web2: ['#54a3ee', '#ffffff', '#84c225', '#e9f3fb', '#1e69de'],
    flat: ['#1abc9c', '#2c3e50', '#ecf0f1', '#e74c3c', '#f1c40f'],
    now: ['#faf7f2', '#1f3d2b', '#efe8da', '#d9c7a3', '#ffffff'],
  };
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  var busy = false;
  function go(name) {
    var from = machine.dataset.era;
    if (from === name || busy) return;
    var view = document.getElementById('era-view'), w = view.clientWidth, h = view.clientHeight;
    if (reduced || !w) return show(name);
    busy = true;
    var STEP = w < 500 ? 5 : 6, cols = Math.ceil(w / STEP), rows = Math.ceil(h / STEP), n = cols * rows;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var layer = document.createElement('canvas'); layer.className = 'machine__dots-layer';
    layer.width = w * dpr; layer.height = h * dpr;
    var g = layer.getContext('2d'); g.scale(dpr, dpr);
    var r = rng(Date.now() % 100000), ax = new Float32Array(n), ay = new Float32Array(n), delay = new Float32Array(n), i;
    for (i = 0; i < n; i++) { var a = r() * 6.283, d = 14 + r() * 60; ax[i] = Math.cos(a) * d; ay[i] = Math.sin(a) * d - 18; delay[i] = r() * 0.35; }
    function colours(img, key) {
      var out = new Uint8Array(n * 3), pal = PALETTE[key].map(rgb), k, x, y, o, p;
      for (k = 0; k < n; k++) {
        if (img) { x = Math.min(w - 1, (k % cols) * STEP + (STEP >> 1)); y = Math.min(h - 1, ((k / cols) | 0) * STEP + (STEP >> 1)); o = (y * img.width + x) * 4; out[k * 3] = img.data[o]; out[k * 3 + 1] = img.data[o + 1]; out[k * 3 + 2] = img.data[o + 2]; }
        else { p = pal[(r() * r() * pal.length) | 0]; out[k * 3] = p[0]; out[k * 3 + 1] = p[1]; out[k * 3 + 2] = p[2]; }
      }
      return out;
    }
    // t : 0 = la page intacte, 1 = les points au plus loin. « real » : les points portent les vrais pixels.
    function draw(t, col, real) {
      g.clearRect(0, 0, w, h);
      g.globalAlpha = real ? 1 : Math.min(1, t * 1.6);
      g.fillStyle = '#fffbf8'; g.fillRect(0, 0, w, h);
      g.globalAlpha = 1;
      for (var k = 0; k < n; k++) {
        var e = Math.min(1, Math.max(0, (t - delay[k]) / (1 - 0.35))); e = e * e * (3 - 2 * e);
        var size = real ? STEP + 0.6 - e * (STEP - 2) : e * 3.2;
        if (size < 0.3) continue;
        var x = (k % cols) * STEP + ax[k] * e, y = ((k / cols) | 0) * STEP + ay[k] * e;
        g.fillStyle = 'rgb(' + col[k * 3] + ',' + col[k * 3 + 1] + ',' + col[k * 3 + 2] + ')';
        if (e > 0.5) { g.beginPath(); g.arc(x + STEP / 2, y + STEP / 2, size / 2, 0, 6.283); g.fill(); } else g.fillRect(x, y, size, size);
      }
    }
    function play(ms, fromT, toT, col, real, then) {
      var start = performance.now();
      (function step(now) {
        var p = Math.min(1, (now - start) / ms);
        draw(fromT + (toT - fromT) * p, col, real);
        if (p < 1) requestAnimationFrame(step); else then();
      })(start);
    }
    var colA = colours(null, from);
    view.appendChild(layer);
    play(520, 0, 1, colA, false, function () {
      show(name);
      play(620, 1, 0, colours(null, name), false, function () { layer.remove(); busy = false; });
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { go(t.dataset.era); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus(); go(next.dataset.era);
    });
  });
  })();

  /* ---------- Tracés au stylo : soulignés, ratures, cercles, flèches ---------- */
  function wobble(points, r, amp) {
    // Relie les points par des courbes dont les poignées tremblent un peu.
    var d = 'M' + points[0][0].toFixed(1) + ' ' + points[0][1].toFixed(1);
    for (var i = 1; i < points.length; i++) {
      var a = points[i - 1], b = points[i];
      var cx = (a[0] + b[0]) / 2 + (r() - 0.5) * amp, cy = (a[1] + b[1]) / 2 + (r() - 0.5) * amp;
      d += ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    }
    return d;
  }
  function svg(w, h) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'draw'); s.setAttribute('aria-hidden', 'true');
    s.setAttribute('width', w); s.setAttribute('height', h); s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    return s;
  }
  function path(s, d) {
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d); s.appendChild(p);
    p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1);
    return p;
  }
  var drawn = [];
  function decorate() {
    drawn.forEach(function (s) { s.remove(); }); drawn = [];
    [].forEach.call(document.querySelectorAll('[data-draw]'), function (el, n) {
      var w = el.offsetWidth, h = el.offsetHeight, r = rng(7 + n * 31), kind = el.dataset.draw, s = svg(w, h);
      s.style.left = 0; s.style.top = 0;
      if (kind === 'underline') {
        var y = h * 0.93;
        path(s, wobble([[0, y + 3], [w * 0.5, y - 2], [w, y + 1]], r, 7));
        path(s, wobble([[w * 0.97, y + 9], [w * 0.5, y + 6], [w * 0.1, y + 11]], r, 6));
      } else if (kind === 'strike') {
        path(s, wobble([[-4, h * 0.6], [w * 0.5, h * 0.5], [w + 4, h * 0.56]], r, 8));
        path(s, wobble([[-2, h * 0.5], [w * 0.5, h * 0.62], [w + 6, h * 0.48]], r, 8));
      } else if (kind === 'circle') {
        var pts = [], k, a;
        for (k = 0; k <= 26; k++) { // un tour et un peu plus : la boucle ne se referme jamais pile
          a = -2.3 + (k / 24) * Math.PI * 2;
          pts.push([w / 2 + Math.cos(a) * (w / 2 + 12 + r() * 3 - k * 0.25), h * 0.54 + Math.sin(a) * (h / 2 + 3 + r() * 2)]);
        }
        path(s, wobble(pts, r, 1.5));
      }
      el.appendChild(s); drawn.push(s);
    });
    [].forEach.call(document.querySelectorAll('[data-arrow]'), function (el, n) {
      var r = rng(91 + n), s = svg(44, 40);
      s.style.left = '-50px'; s.style.top = '2px';
      path(s, wobble([[42, 8], [22, 26], [3, 22]], r, 10));
      path(s, wobble([[13, 13], [3, 22], [14, 31]], r, 2));
      el.appendChild(s); drawn.push(s);
    });
    if (reduced || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-drawn'); en.target.classList.remove('is-waiting'); io.unobserve(en.target);
      });
    }, { threshold: 0.9 });
    drawn.forEach(function (s) { s.classList.add('is-waiting'); io.observe(s); });
  }

  /* ---------- La ligne de crête : deux plans de montagne tracés d'un seul geste ---------- */
  function ridge() {
    var el = document.getElementById('ridge');
    if (!el) return;
    var w = el.clientWidth, h = el.clientHeight;
    if (!w) return;
    el.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    function line(seed, base, amp, scale) {
      // Des crêtes pointues et des vallées rondes : une somme de vagues repliées, tracée d'un trait un peu tremblé.
      var r = rng(seed), pts = [], x, y, p1 = r() * 6, p2 = r() * 6, p3 = r() * 6;
      for (x = -20; x <= w + 20; x += 11) {
        y = 0.55 * Math.pow(1 - Math.abs(Math.sin(x / (210 * scale) + p1)), 1.4)
          + 0.3 * Math.pow(1 - Math.abs(Math.sin(x / (97 * scale) + p2)), 1.2)
          + 0.15 * (1 - Math.abs(Math.sin(x / (41 * scale) + p3)));
        pts.push([x, base - amp * y + (r() - 0.5) * 2.4]);
      }
      return wobble(pts, r, 2);
    }
    el.innerHTML =
      '<circle class="sun" cx="' + (w * 0.82).toFixed(0) + '" cy="' + (h * 0.3).toFixed(0) + '" r="' + Math.min(26, h * 0.14).toFixed(0) + '"/>' +
      '<path class="far" d="' + line(5, h * 0.74, h * 0.6, 1.5) + '"/>' +
      '<path d="' + line(12, h * 0.97, h * 0.62, 1) + '"/>';
  }

  var raf;
  function layout() { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { decorate(); ridge(); }); }
  window.addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout); else layout();

  /* ---------- Œuf de Pâques : tapez « azuweb » et les titres se défont en points ---------- */
  // Chaque titre visible est redessiné mot à mot sur un calque, puis échantillonné en points
  // qui fuient le pointeur et reviennent à leur place. Échap (ou dix secondes) pour revenir.
  var typed = '', egg = null;
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && egg) return egg.stop();
    if (e.key.length !== 1 || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed === 'azuweb' && !egg && !reduced) egg = startEgg();
  });
  function startEgg() {
    var W = window.innerWidth, H = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var off = document.createElement('canvas'); off.width = W; off.height = H;
    var o = off.getContext('2d', { willReadFrequently: true });
    var heads = [].filter.call(document.querySelectorAll('h1, h2, h3, .work__name'), function (el) {
      var b = el.getBoundingClientRect(); return b.bottom > 0 && b.top < H && b.width > 0;
    });
    o.textBaseline = 'alphabetic';
    heads.forEach(function (el) {
      var cs = getComputedStyle(el), walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), node, range = document.createRange();
      o.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; o.fillStyle = '#000';
      if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      while ((node = walker.nextNode())) {
        var re = /\S+/g, m;
        while ((m = re.exec(node.data))) {
          range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
          var b = range.getBoundingClientRect();
          if (b.width) o.fillText(m[0], b.left, b.bottom - b.height * 0.22);
        }
      }
    });
    var data = o.getImageData(0, 0, W, H).data, pts = [], x, y, STEP = 3;
    for (y = 0; y < H; y += STEP) for (x = 0; x < W; x += STEP) if (data[(y * W + x) * 4 + 3] > 128) pts.push(x, y, x, y, 0, 0);
    if (!pts.length) return null;
    var layer = document.createElement('canvas');
    layer.width = W * dpr; layer.height = H * dpr;
    layer.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:50;pointer-events:none';
    var g = layer.getContext('2d'); g.scale(dpr, dpr);
    document.body.appendChild(layer);
    heads.forEach(function (el) { el.style.color = 'transparent'; });
    var px = -999, py = -999, alive = true, born = performance.now(), startY = window.scrollY;
    function move(e) { px = e.clientX; py = e.clientY; }
    window.addEventListener('pointermove', move, { passive: true });
    // Une bourrasque au départ, pour qu'on voie tout de suite que les lettres sont devenues des points.
    for (var i = 0; i < pts.length; i += 6) { pts[i + 4] = (Math.random() - 0.5) * 26; pts[i + 5] = (Math.random() - 0.7) * 26; }
    var api = { stop: stop };
    function stop() {
      if (!alive) return; alive = false;
      window.removeEventListener('pointermove', move);
      heads.forEach(function (el) { el.style.color = ''; });
      layer.remove(); egg = null;
    }
    (function frame(now) {
      if (!alive) return;
      if (now - born > 10000 || Math.abs(window.scrollY - startY) > 4) return stop();
      g.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i += 6) {
        var dx = pts[i] - px, dy = pts[i + 1] - py, d2 = dx * dx + dy * dy;
        if (d2 < 12000) { var f = (1 - d2 / 12000) * 2.6, d = Math.sqrt(d2) + 0.01; pts[i + 4] += (dx / d) * f; pts[i + 5] += (dy / d) * f; }
        pts[i + 4] = (pts[i + 4] + (pts[i + 2] - pts[i]) * 0.045) * 0.9;
        pts[i + 5] = (pts[i + 5] + (pts[i + 3] - pts[i + 1]) * 0.045) * 0.9;
        pts[i] += pts[i + 4]; pts[i + 1] += pts[i + 5];
        g.fillStyle = (i / 6) % 7 === 0 ? '#007bf7' : (i / 6) % 11 === 0 ? '#fdafbd' : '#10151f';
        g.fillRect(pts[i], pts[i + 1], 2.2, 2.2);
      }
      requestAnimationFrame(frame);
    })(born);
    return api;
  }

  /* ---------- La fiche à coller dans une IA ---------- */
  function copyText(text, button, okLabel) {
    var initial = button.textContent;
    var done = function (label) { button.textContent = label; setTimeout(function () { button.textContent = initial; }, 2200); };
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove(); done(ok ? okLabel : 'Copie impossible ici');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(okLabel); }, fallback);
    else fallback();
  }
  var brief = document.getElementById('copy-brief'), briefText = document.getElementById('brief-text');
  if (brief && briefText) brief.addEventListener('click', function () {
    copyText('Voici la fiche de la mini-agence e-commerce Azuweb. Réponds à mes questions à partir de ces informations.\n\n' + briefText.textContent, brief, 'Fiche copiée');
  });

  /* ---------- La voix : lecture, et une ligne de points qui se remplit ---------- */
  [].forEach.call(document.querySelectorAll('[data-voice]'), function (box) {
    var audio = box.querySelector('audio'), btn = box.querySelector('.voice__btn'), dots = box.querySelector('.voice__dots'), time = box.querySelector('.voice__time');
    var N = 48, i, label = time.textContent;
    for (i = 0; i < N; i++) dots.appendChild(document.createElement('i'));
    var fmt = function (t) { t = Math.floor(t || 0); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); };
    var paint = function () {
      var d = audio.duration || 0, head = d ? Math.min(N - 1, Math.floor(audio.currentTime / d * N)) : -1;
      [].forEach.call(dots.children, function (el, k) { el.className = k < head ? 'is-on' : k === head && audio.currentTime > 0 ? 'is-head' : ''; });
      time.textContent = audio.currentTime > 0 && d ? fmt(audio.currentTime) + ' / ' + fmt(d) : d && isFinite(d) ? label + ' · ' + fmt(d) : label;
    };
    btn.addEventListener('click', function () { if (audio.paused) audio.play(); else audio.pause(); });
    dots.addEventListener('click', function (e) { if (!audio.duration) return; var r = dots.getBoundingClientRect(); audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration; paint(); });
    audio.addEventListener('play', function () { box.classList.add('is-playing'); btn.setAttribute('aria-label', 'Pause'); });
    audio.addEventListener('pause', function () { box.classList.remove('is-playing'); btn.setAttribute('aria-label', 'Écouter'); });
    ['timeupdate', 'loadedmetadata', 'ended'].forEach(function (ev) { audio.addEventListener(ev, paint); });
  });

  var mailEl = document.getElementById('mail');
  if (mailEl) (function () {
  /* ---------- Contact ---------- */
  // L'adresse est assemblée ici pour ne pas être ramassée telle quelle par les robots.
  var mail = document.getElementById('mail');
  var addr = mail.dataset.u + '@' + mail.dataset.d;
  mail.textContent = addr;
  mail.href = 'mailto:' + addr;

  var copy = document.getElementById('copy');
  copy.addEventListener('click', function () { copyText(addr, copy, 'Adresse copiée'); });

  document.getElementById('brief').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    var body = ['Hello,', '', f.msg.value.trim(), '',
      f.url.value.trim() ? 'Ma boutique : ' + f.url.value.trim() : null,
      '', f.name.value.trim()].filter(function (l) { return l !== null; }).join('\n');
    window.location.href = 'mailto:' + addr + '?subject=' + encodeURIComponent(f.need.value) + '&body=' + encodeURIComponent(body);
  });
  })();
})();
