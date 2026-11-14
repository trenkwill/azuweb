# Azuweb

Site de l'agence Azuweb : une page statique, sans étape de build.

- `index.html` : le contenu et les textes
- `assets/css/site.css` : les styles (couleurs et typographie en variables en tête de fichier)
- `assets/js/scene.js` : la scène 3D, des points d'encre qui dessinent chaque métier (`data-shape` dans le HTML)
- `assets/js/site.js` : navigation, machine à remonter le temps, tracés au stylo, contact
- `assets/vendor/` : three.js (licence MIT), `assets/fonts/` : Inter et Gochi Hand (licence OFL), hébergées sur place, sans appel à un service tiers

Pour voir le site en local : `python3 -m http.server` puis ouvrir http://localhost:8000.

L'ancien site (Jekyll et Grunt, 2016) reste dans l'historique git.

## Tenir le site à jour

Tout ce qu'on dit sur Azuweb vit dans un seul fichier : `content/azuweb.json` (présentation, services, questions fréquentes, journal « En ce moment »). Après une modification :

    node tools/build.mjs --sans-cas

La commande régénère la fiche, les questions et le journal dans `index.html`, les données structurées (schema.org), `llms.txt` et `llms-full.txt` (la version texte pour les assistants IA), `robots.txt`, `sitemap.xml` et le thème Shopify (dossier `theme/`). Ne modifiez pas ces fichiers à la main.

Les études de cas se rédigent dans `content/cas/<slug>.json` (hors du dépôt tant qu'elles ne sont pas validées). Sans `--sans-cas`, la commande crée aussi une page par étude dans `projets/` et relie la liste des projets.
