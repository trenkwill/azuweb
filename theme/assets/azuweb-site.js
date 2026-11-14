// Comportements de page : barre de navigation, adresse e-mail, formulaire de contact.
(function () {
  var nav = document.getElementById('nav');
  function stick() { nav.classList.toggle('is-stuck', window.scrollY > 24); }
  window.addEventListener('scroll', stick, { passive: true });
  stick();

  document.getElementById('year').textContent = new Date().getFullYear();

  // L'adresse est assemblée ici pour ne pas être ramassée telle quelle par les robots.
  var mail = document.getElementById('mail');
  var addr = mail.dataset.u + '@' + mail.dataset.d;
  mail.textContent = addr;
  mail.href = 'mailto:' + addr;

  var copy = document.getElementById('copy');
  copy.addEventListener('click', function () {
    var done = function (label) { copy.textContent = label; setTimeout(function () { copy.textContent = 'Copier'; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr).then(function () { done('Adresse copiée'); }, select);
    } else select();
    function select() {
      var r = document.createRange(); r.selectNodeContents(mail);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      done('Adresse sélectionnée');
    }
  });

  document.getElementById('brief').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    var body = [
      'Bonjour,', '', f.msg.value.trim(), '',
      'Besoin : ' + f.need.value,
      f.url.value.trim() ? 'Boutique : ' + f.url.value.trim() : null,
      '', f.name.value.trim(),
    ].filter(function (l) { return l !== null; }).join('\n');
    window.location.href = 'mailto:' + addr +
      '?subject=' + encodeURIComponent('Projet : ' + f.need.value) +
      '&body=' + encodeURIComponent(body);
  });
})();
