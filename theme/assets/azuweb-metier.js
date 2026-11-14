// Les démonstrations des pages métier. Chaque bloc ne s'active que si sa démonstration est sur la page.
(function () {
  var demo = document.querySelector('[data-demo]');
  if (!demo) return;
  var kind = demo.dataset.demo;

  /* Shopify : l'éditeur de thème. Cocher une case affiche ou masque un bloc de la fiche produit. */
  if (kind === 'editor') {
    [].forEach.call(demo.querySelectorAll('[data-toggle]'), function (box) {
      var blocks = demo.querySelectorAll('[data-block="' + box.dataset.toggle + '"]');
      function apply() { [].forEach.call(blocks, function (b) { b.hidden = !box.checked; if (box.checked) { b.classList.remove('is-in'); void b.offsetWidth; b.classList.add('is-in'); } }); }
      box.addEventListener('change', apply);
      apply();
    });
  }

  /* Amazon : le curseur avant / après. */
  if (kind === 'compare') {
    var stage = demo.querySelector('.compare'), range = demo.querySelector('.compare__range');
    var set = function () { stage.style.setProperty('--cut', range.value + '%'); };
    range.addEventListener('input', set);
    set();
  }

  /* Meta : on coupe les annonces qui ne vendent pas, le budget glisse vers les autres. */
  if (kind === 'releve') {
    var btn = document.getElementById('releve-btn'), note = document.getElementById('releve-note'), done = false;
    btn.addEventListener('click', function () {
      done = !done;
      demo.querySelector('.releve').classList.toggle('is-cut', done);
      [].forEach.call(demo.querySelectorAll('.bar'), function (b) { b.style.setProperty('--w', done ? b.dataset.after : '25%'); });
      btn.textContent = done ? 'Revenir à hier' : 'Couper ce qui ne vend pas';
      note.hidden = !done;
    });
  }

  /* Klaviyo : une séquence qui se déroule étape par étape. */
  if (kind === 'flow') {
    var FLOWS = {
      bienvenue: [['Inscription', 'Le visiteur laisse son adresse'], ['Tout de suite', 'Bienvenue, et le code promis'], ['2 jours après', "L'histoire de la marque"], ['5 jours après', 'Les trois meilleures ventes'], ['8 jours après', 'Dernier rappel du code']],
      panier: [['Panier laissé', 'Le client part sans payer'], ['1 heure après', 'Votre panier vous attend'], ['Le lendemain', 'Les avis sur ce produit'], ['3 jours après', 'Une question ? On répond']],
      apres: [['Commande payée', 'Merci, et le suivi du colis'], ['À la livraison', "Comment bien s'en servir"], ['10 jours après', 'Votre avis, en deux clics'], ['1 mois après', 'Ce qui va bien avec']],
    };
    var line = document.getElementById('flow-line'), timer;
    var play = function (name) {
      clearTimeout(timer);
      line.innerHTML = FLOWS[name].map(function (s, i) { return '<li' + (i ? '' : ' class="flow__start"') + '><b>' + s[0] + '</b><span>' + s[1] + '</span></li>'; }).join('');
      var items = line.children, i = 0;
      (function next() { if (i < items.length) { items[i++].classList.add('is-on'); timer = setTimeout(next, 650); } })();
    };
    [].forEach.call(demo.querySelectorAll('[data-flow]'), function (b) {
      b.addEventListener('click', function () {
        [].forEach.call(demo.querySelectorAll('[data-flow]'), function (o) { o.setAttribute('aria-pressed', o === b); });
        play(b.dataset.flow);
      });
    });
    play('bienvenue');
  }

  /* Données : cinq cartes éparpillées se rangent en un seul écran. */
  if (kind === 'merge') {
    var box = document.getElementById('merge'), mb = document.getElementById('merge-btn'), on = false;
    mb.addEventListener('click', function () {
      on = !on; box.classList.toggle('is-merged', on);
      mb.textContent = on ? 'Séparer à nouveau' : 'Tout réunir';
    });
  }
})();
