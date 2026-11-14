// Comportements de page : navigation, machine à remonter le temps, tracés au stylo,
// ligne de crête du Vercors, adresse e-mail et formulaire de contact.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var nav = document.getElementById('nav');
  function stick() { nav.classList.toggle('is-stuck', window.scrollY > 8); }
  window.addEventListener('scroll', stick, { passive: true });
  stick();
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Hasard reproductible : les tracés sont les mêmes à chaque visite ---------- */
  function rng(seed) {
    return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  }

  /* ---------- La machine à remonter le temps ---------- */
  var machine = document.getElementById('machine');
  var captions = {
    tables: 'Fin des années 90. Tout est dans des cases de tableau, bordures comprises.',
    web2: 'Milieu des années 2000. Les feuilles de style arrivent, et avec elles les boutons brillants.',
    flat: 'Années 2010. Le téléphone impose ses règles : aplats, grandes zones, menu replié.',
    now: "Aujourd'hui. Moins d'effets, plus de texte. Et toujours la même question : est-ce que ça vend ?",
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
  function go(name) {
    if (machine.dataset.era === name) return;
    // L'API View Transitions anime le passage d'une époque à l'autre ; sans elle, on change simplement.
    if (document.startViewTransition && !reduced) document.startViewTransition(function () { show(name); });
    else show(name);
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
    var el = document.getElementById('ridge'), w = el.clientWidth, h = el.clientHeight;
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

  /* ---------- Contact ---------- */
  // L'adresse est assemblée ici pour ne pas être ramassée telle quelle par les robots.
  var mail = document.getElementById('mail');
  var addr = mail.dataset.u + '@' + mail.dataset.d;
  mail.textContent = addr;
  mail.href = 'mailto:' + addr;

  var copy = document.getElementById('copy');
  copy.addEventListener('click', function () {
    var done = function (label) { copy.textContent = label; setTimeout(function () { copy.textContent = 'Copier'; }, 1800); };
    function select() {
      var range = document.createRange(); range.selectNodeContents(mail);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      done('Adresse sélectionnée');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(function () { done('Adresse copiée'); }, select);
    else select();
  });

  document.getElementById('brief').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    var body = ['Hello William,', '', f.msg.value.trim(), '',
      f.url.value.trim() ? 'Ma boutique : ' + f.url.value.trim() : null,
      '', f.name.value.trim()].filter(function (l) { return l !== null; }).join('\n');
    window.location.href = 'mailto:' + addr + '?subject=' + encodeURIComponent(f.need.value) + '&body=' + encodeURIComponent(body);
  });
})();
