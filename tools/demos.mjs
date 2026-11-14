// Une démonstration interactive par page métier. Les données affichées sont des exemples, et c'est écrit.
// Le comportement est dans assets/js/metier.js, le style dans la section « Démonstrations » de site.css.
const bag = (c = '#d9c7a3') => `<span class="bag" style="color:${c}" aria-hidden="true"></span>`;

export const demos = {
  shopify: `<section class="demo" data-demo="editor" aria-labelledby="demo-t">
  <div class="prose"><h2 class="h2--small" id="demo-t">Essayez : c'est votre équipe qui tient l'éditeur.</h2>
  <p>Cochez, décochez. La fiche produit se recompose sans une ligne de code. C'est ce qu'on livre : un thème où chaque bloc se règle depuis Shopify.</p></div>
  <div class="demo__stage editor">
    <fieldset class="editor__panel">
      <legend>Sections de la fiche</legend>
      <label><input type="checkbox" id="ed-bar" data-toggle="bar" checked> Bandeau livraison offerte</label>
      <label><input type="checkbox" id="ed-avis" data-toggle="avis" checked> Avis clients</label>
      <label><input type="checkbox" id="ed-guide" data-toggle="guide"> Guide des tailles</label>
      <label><input type="checkbox" id="ed-plus" data-toggle="plus"> Produits complémentaires</label>
      <label><input type="checkbox" id="ed-b2b" data-toggle="b2b"> Prix professionnels</label>
    </fieldset>
    <div class="editor__page" aria-live="polite">
      <p class="ed-block ed-bar" data-block="bar">Livraison offerte dès 50 €</p>
      <div class="ed-main">
        <div class="ed-photo">${bag()}</div>
        <div class="ed-info">
          <p class="ed-title">Le Cabas n° 1</p>
          <p class="ed-block ed-avis" data-block="avis">★★★★★ <span>312 avis</span></p>
          <p class="ed-price">39 € <span class="ed-block ed-b2b" data-block="b2b" hidden>· 27 € HT par 10</span></p>
          <p class="ed-block ed-guide" data-block="guide" hidden><span>S</span><span>M</span><span>L</span> <u>Guide des tailles</u></p>
          <p class="ed-btn">Ajouter au panier</p>
        </div>
      </div>
      <div class="ed-block ed-plus" data-block="plus" hidden><b>Souvent achetés avec</b><p><span>${bag('#2f4a3a')}Trousse · 9 €</span><span>${bag('#b5651d')}Mini · 14 €</span><span>${bag('#26334d')}Bandoulière · 12 €</span></p></div>
    </div>
  </div>
  <p class="demo__legend">Boutique et prix d'exemple.</p>
</section>`,

  amazon: `<section class="demo" data-demo="compare" aria-labelledby="demo-t">
  <div class="prose"><h2 class="h2--small" id="demo-t">Avant, après : faites glisser.</h2>
  <p>La même fiche Amazon, avant et après notre passage. À gauche, ce qu'on trouve souvent. À droite, ce que l'acheteur devrait lire.</p></div>
  <div class="demo__stage compare" style="--cut:50%">
    <div class="compare__side compare__after">
      <p class="az-tag">Après</p>
      <div class="az-row"><div class="az-photo">${bag()}<i></i><i></i><i></i></div>
        <div class="az-text"><p class="az-title">Le Cabas n° 1, sac en toile de coton épais, fabriqué en France</p><p class="az-stars">★★★★★ <span>312</span></p>
        <ul><li><b>Solide :</b> toile 400 g, coutures doublées</li><li><b>Pratique :</b> poche intérieure zippée</li><li><b>Garanti :</b> 10 ans, réparé gratuitement</li></ul></div></div>
      <div class="az-aplus"><span>La matière</span><span>La fabrication</span><span>La garantie</span></div>
      <p class="az-store">Visiter la boutique de la marque ›</p>
    </div>
    <div class="compare__side compare__before" aria-hidden="true">
      <p class="az-tag">Avant</p>
      <div class="az-row"><div class="az-photo az-photo--bad">${bag('#9aa0a6')}</div>
        <div class="az-text"><p class="az-title">SAC TOILE CABAS SAC COURSES SAC PLAGE SAC FEMME HOMME SHOPPING COTON GRAND SAC TOTE BAG SOLIDE RÉSISTANT NEUF</p><p class="az-stars">★★★☆☆ <span>4</span></p>
        <p class="az-blob">Sac de bonne qualité. Livraison rapide. Convient pour les courses la plage le travail. Matière coton. Dimensions voir photo. Merci de nous contacter pour toute question avant de laisser un avis.</p></div></div>
    </div>
    <div class="compare__handle" aria-hidden="true"><span>‹ ›</span></div>
    <label class="sr" for="cmp-range">Position du curseur avant / après</label>
    <input class="compare__range" id="cmp-range" type="range" min="0" max="100" value="50">
  </div>
  <p class="demo__legend">Fiche d'exemple, pour une marque fictive.</p>
</section>`,

  'publicite-meta': `<section class="demo" data-demo="releve" aria-labelledby="demo-t">
  <div class="prose"><h2 class="h2--small" id="demo-t">Le relevé du matin, en vrai.</h2>
  <p>Voilà à quoi ressemble ce qu'on regarde chaque matin. Deux annonces vendent, deux dépensent pour rien. Appuyez sur le bouton pour voir ce qu'on en fait.</p></div>
  <div class="demo__stage releve">
    <table>
      <thead><tr><th>Annonce</th><th>Dépensé hier</th><th>Achats</th><th>Budget</th></tr></thead>
      <tbody>
        <tr data-keep><td>Vidéo atelier</td><td>42 €</td><td>9</td><td><span class="bar" style="--w:25%" data-after="50%"></span></td></tr>
        <tr data-keep><td>Avis clientes</td><td>38 €</td><td>7</td><td><span class="bar" style="--w:25%" data-after="50%"></span></td></tr>
        <tr data-cut><td>Photo studio</td><td>40 €</td><td>0</td><td><span class="bar" style="--w:25%" data-after="0%"></span></td></tr>
        <tr data-cut><td>Carrousel promo</td><td>41 €</td><td>1</td><td><span class="bar" style="--w:25%" data-after="0%"></span></td></tr>
      </tbody>
    </table>
    <p class="releve__actions"><button class="btn" type="button" id="releve-btn">Couper ce qui ne vend pas</button><span class="hint" id="releve-note" hidden>même budget, sur ce qui marche</span></p>
  </div>
  <p class="demo__legend">Chiffres d'exemple.</p>
</section>`,

  'emails-klaviyo': `<section class="demo" data-demo="flow" aria-labelledby="demo-t">
  <div class="prose"><h2 class="h2--small" id="demo-t">Une séquence, e-mail par e-mail.</h2>
  <p>Choisissez une séquence et regardez-la se dérouler. Chacune part toute seule, au bon moment, pour chaque client.</p></div>
  <div class="demo__stage flow">
    <div class="machine__tabs" role="group" aria-label="Choisir une séquence">
      <button type="button" data-flow="bienvenue" aria-pressed="true">Bienvenue</button>
      <button type="button" data-flow="panier" aria-pressed="false">Panier abandonné</button>
      <button type="button" data-flow="apres" aria-pressed="false">Après l'achat</button>
    </div>
    <ol class="flow__line" id="flow-line"></ol>
  </div>
  <p class="demo__legend">Délais et contenus d'exemple : on les règle sur votre marque.</p>
</section>`,

  donnees: `<section class="demo" data-demo="merge" aria-labelledby="demo-t">
  <div class="prose"><h2 class="h2--small" id="demo-t">Cinq onglets, puis un seul écran.</h2>
  <p>Chaque outil a son tableau de bord, et aucun ne donne le même chiffre. Appuyez pour les réunir.</p></div>
  <div class="demo__stage merge" id="merge">
    <div class="merge__cards">
      <div class="merge__card" style="--i:0"><b>Meta Ads</b><span>Achats : 31</span></div>
      <div class="merge__card" style="--i:1"><b>Google Ads</b><span>Conversions : 18</span></div>
      <div class="merge__card" style="--i:2"><b>Amazon Ads</b><span>Commandes : 22</span></div>
      <div class="merge__card" style="--i:3"><b>Klaviyo</b><span>Ventes : 14</span></div>
      <div class="merge__card" style="--i:4"><b>Shopify</b><span>Commandes : 52</span></div>
    </div>
    <div class="merge__board" aria-live="polite">
      <p class="merge__title">Cette semaine <span>dans l'admin Shopify</span></p>
      <dl><div><dt>Commandes</dt><dd>52</dd></div><div><dt>Dépense publicitaire</dt><dd>1 140 €</dd></div><div><dt>Coût par commande</dt><dd>21,90 €</dd></div><div><dt>Vs semaine précédente</dt><dd>+8 %</dd></div></dl>
      <p class="merge__rows"><span style="--w:42%">Meta</span><span style="--w:24%">Google</span><span style="--w:20%">E-mail</span><span style="--w:14%">Direct</span></p>
    </div>
    <p class="releve__actions"><button class="btn" type="button" id="merge-btn">Tout réunir</button></p>
  </div>
  <p class="demo__legend">Chiffres d'exemple.</p>
</section>`,

  'agents-ia': `<section class="demo" data-demo="agents" aria-labelledby="demo-t">
  <div class="prose"><h2 class="h2--small" id="demo-t">Qui fait quoi, et qui signe.</h2>
  <p>Les agents travaillent en continu et remontent ce qu'ils trouvent. Rien ne part en ligne sans passer par l'un de nous deux.</p></div>
  <div class="demo__stage agents">
    <svg viewBox="0 0 720 360" role="img" aria-label="Quatre agents IA envoient leurs trouvailles à une personne, qui valide avant la mise en ligne">
      <g class="ag-links"><path id="ag-1" d="M120 70 C240 70 250 180 360 180"/><path id="ag-2" d="M120 150 C220 150 260 180 360 180"/><path id="ag-3" d="M120 230 C220 230 260 180 360 180"/><path id="ag-4" d="M120 310 C240 310 250 180 360 180"/><path id="ag-5" d="M360 180 L600 180"/></g>
      <g class="ag-pulses">
        <circle r="6"><animateMotion dur="3.2s" repeatCount="indefinite" begin="0s"><mpath href="#ag-1"/></animateMotion></circle>
        <circle r="6"><animateMotion dur="3.2s" repeatCount="indefinite" begin="0.8s"><mpath href="#ag-2"/></animateMotion></circle>
        <circle r="6"><animateMotion dur="3.2s" repeatCount="indefinite" begin="1.6s"><mpath href="#ag-3"/></animateMotion></circle>
        <circle r="6"><animateMotion dur="3.2s" repeatCount="indefinite" begin="2.4s"><mpath href="#ag-4"/></animateMotion></circle>
        <circle r="7" class="ag-ok"><animateMotion dur="1.6s" repeatCount="indefinite" begin="0.4s"><mpath href="#ag-5"/></animateMotion></circle>
      </g>
      <g class="ag-nodes">
        <g transform="translate(20 46)"><rect width="200" height="48" rx="24"/><text x="100" y="30">Audit du site</text></g>
        <g transform="translate(20 126)"><rect width="200" height="48" rx="24"/><text x="100" y="30">Récap publicité</text></g>
        <g transform="translate(20 206)"><rect width="200" height="48" rx="24"/><text x="100" y="30">Relecture des textes</text></g>
        <g transform="translate(20 286)"><rect width="200" height="48" rx="24"/><text x="100" y="30">Veille</text></g>
        <g class="ag-human" transform="translate(290 140)"><rect width="150" height="80" rx="14"/><text x="75" y="30">Emilie</text><text x="75" y="50">ou William</text><text class="ag-sub" x="75" y="69">relit et valide</text></g>
        <g class="ag-live" transform="translate(600 156)"><rect width="100" height="48" rx="24"/><text x="50" y="30">En ligne</text></g>
      </g>
    </svg>
  </div>
</section>`,
};
