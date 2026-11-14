# Azuweb

Site de l'agence Azuweb : une page statique, sans étape de build.

- `index.html` : le contenu et les textes
- `assets/css/site.css` : les styles (couleurs et typographie en variables en tête de fichier)
- `assets/js/scene.js` : la scène 3D, un nuage de particules qui change de forme à chaque section (`data-shape` dans le HTML)
- `assets/js/site.js` : navigation, adresse e-mail, formulaire de contact
- `assets/vendor/` : three.js (licence MIT), `assets/fonts/` : Bricolage Grotesque et Instrument Serif (licence OFL), hébergées sur place, sans appel à un service tiers

Pour voir le site en local : `python3 -m http.server` puis ouvrir http://localhost:8000.

L'ancien site (Jekyll et Grunt, 2016) reste dans l'historique git.
