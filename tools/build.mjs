// Régénère tout ce qui dépend du contenu :
//   content/azuweb.json   → fiche, questions, journal et données structurées dans index.html,
//                           llms.txt, llms-full.txt, robots.txt, sitemap.xml
//   content/cas/*.json    → liste des projets et une page par étude de cas (projets/<slug>/)
//                           (--sans-cas pour les laisser de côté)
//   le tout               → le thème Shopify (dossier theme/)
// Usage : node tools/build.mjs
import fs from 'fs';
import path from 'path';
import { demos } from './demos.mjs';

const A = JSON.parse(fs.readFileSync('content/azuweb.json', 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const mois = (ym) => { const [y, m] = ym.split('-'); return `${MOIS[+m - 1]} ${y}`; };
const mail = `${A.contact.utilisateur}@${A.contact.domaine}`;
// Dans le contenu, [texte](adresse) devient un lien ; `root` recale les adresses pour les pages des sous-dossiers.
const rich = (s, root = '') => esc(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) => `<a href="${root}${url}">${txt}</a>`);
const plain = (s) => String(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

/* ---------- Études de cas ---------- */
const casDir = 'content/cas';
const ORDRE = fs.existsSync(`${casDir}/_ordre.json`) ? JSON.parse(fs.readFileSync(`${casDir}/_ordre.json`, 'utf8')) : [];
const rang = (c) => { const i = ORDRE.indexOf(c.slug); return i < 0 ? 999 : i; };
// --sans-cas : la version publique tant que les études de cas ne sont pas validées.
const SANS_CAS = process.argv.includes('--sans-cas');
// --relecture : affiche sur chaque étude le niveau de confiance et les points à confirmer. Jamais pour la mise en ligne.
const RELECTURE = process.argv.includes('--relecture');
const cas = (fs.existsSync(casDir) && !SANS_CAS ? fs.readdirSync(casDir) : [])
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(casDir, f), 'utf8')))
  .filter((c) => c.est_client !== false && c.publier !== false)
  .sort((a, b) => rang(a) - rang(b) || a.client.localeCompare(b.client, 'fr'));
const shot = (slug, kind) => { const f = `assets/img/cas/${slug}-${kind}.jpg`; return fs.existsSync(f) ? f : null; };

/* ---------- Blocs injectés dans index.html ---------- */
const fiche = `<dl class="facts">${A.faits.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${rich(v)}</dd></div>`).join('')}</dl>`;
const faq = `<dl class="faq">${A.faq.map(([q, r]) => `<div><dt>${esc(q)}</dt><dd>${rich(r)}</dd></div>`).join('')}</dl>`;
const now = `<ul class="now">${A.en_ce_moment.map(([d, t]) => `<li><time datetime="${d}">${mois(d)}</time><span>${esc(t)}</span></li>`).join('')}</ul>`;
const work = cas.length
  ? `<ul class="work">${cas.map((c) => `<li><span class="work__name"><a href="projets/${c.slug}/">${esc(c.client)}</a>${RELECTURE ? ` <small class="review-tag review-tag--${c.confiance}">${c.confiance}</small>` : ''}</span><span class="work__kind">${esc(c.secteur)}</span><span class="work__what">${esc(c.resume)}</span></li>`).join('\n')}</ul>`
  : `<ul class="work">${A.projets.map(([n, k, w]) => `<li><span class="work__name">${esc(n)}</span><span class="work__kind">${esc(k)}</span><span class="work__what">${esc(w)}</span></li>`).join('\n')}</ul>`;

const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfessionalService', '@id': `${A.site}/#azuweb`, name: A.nom, url: A.site, slogan: A.accroche, description: A.en_bref,
      email: mail, areaServed: ['FR', 'EU', 'US', 'CA'], knowsLanguage: 'fr',
      address: { '@type': 'PostalAddress', addressRegion: 'Vercors', addressCountry: 'FR' },
      founder: A.equipe.map((p) => ({ '@type': 'Person', name: p.nom, jobTitle: p.role, description: p.bio, worksFor: { '@id': `${A.site}/#azuweb` } })),
      hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Ce que fait Azuweb', itemListElement: A.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.nom, description: s.texte } })) },
    },
    { '@type': 'FAQPage', mainEntity: A.faq.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain(r) } })) },
  ],
};

/* ---------- Version texte, pour les IA ---------- */
const court = `# ${A.nom}

> ${A.en_bref}

Mis à jour le ${A.mis_a_jour}. Contact : ${mail}

## En bref
${A.faits.map(([k, v]) => `- ${k} : ${plain(v)}`).join('\n')}

## Ce qu'on fait
${A.services.map((s) => `- ${s.nom} : ${s.texte} Page : ${A.site}/services/${s.slug}/`).join('\n')}

## Qui
${A.equipe.map((p) => `- ${p.nom} — ${p.role}. ${p.bio}`).join('\n')}

## Comment on travaille
${A.methode.map((m, i) => `${i + 1}. ${m}`).join('\n')}

## Questions fréquentes
${A.faq.map(([q, r]) => `### ${q}\n${plain(r)}`).join('\n\n')}

## En ce moment
${A.en_ce_moment.map(([d, t]) => `- ${mois(d)} : ${t}`).join('\n')}
`;
const long = court + (cas.length ? `
## Études de cas
${cas.map((c) => `### ${c.client} (${c.secteur})
${c.url ? `Site : ${c.url}\n` : ''}${c.periode ? `Période : ${c.periode}\n` : ''}Plateformes : ${(c.plateformes || []).join(', ')}

Le besoin : ${c.problematique}

Ce qu'on a fait :
${(c.solution || []).map((s) => `- ${s.titre} : ${s.texte}`).join('\n')}
${c.resultat ? `\nCe que ça a changé : ${c.resultat}\n` : ''}Page : ${A.site}/projets/${c.slug}/`).join('\n\n')}
` : '');

/* ---------- index.html ---------- */
function inject(html, name, content) {
  const re = new RegExp(`<!-- build:${name} -->[\\s\\S]*?<!-- /build:${name} -->`);
  if (!re.test(html)) throw new Error(`Repère build:${name} introuvable dans index.html`);
  return html.replace(re, () => `<!-- build:${name} -->\n${content}\n<!-- /build:${name} -->`);
}
let html = fs.readFileSync('index.html', 'utf8');
const nav = html.match(/<header class="nav"[\s\S]*?<\/header>/)[0];
const foot = html.match(/<footer class="foot">[\s\S]*?<\/footer>/)[0];
html = inject(html, 'fiche', fiche);
html = inject(html, 'faq', faq);
html = inject(html, 'now', now);
html = inject(html, 'work', work);
html = inject(html, 'jsonld', `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>\n<script type="text/plain" id="brief-text">${esc(long)}</script>`);
fs.writeFileSync('index.html', html);

fs.writeFileSync('llms.txt', court + (cas.length ? `\n## Pour aller plus loin\n- [Version complète avec les études de cas](${A.site}/llms-full.txt)\n` : ''));
fs.writeFileSync('llms-full.txt', long);
fs.writeFileSync('robots.txt', `# Tout le monde est bienvenu, robots d'IA compris : ce site est fait pour être lu et cité.\nUser-agent: *\nAllow: /\n\nSitemap: ${A.site}/sitemap.xml\n`);
fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['', 'vercors/', 'william/', 'emilie/', ...A.services.map((s) => `services/${s.slug}/`), ...cas.map((c) => `projets/${c.slug}/`)].map((u) => `  <url><loc>${A.site}/${u}</loc><lastmod>${A.mis_a_jour}</lastmod></url>`).join('\n')}\n</urlset>\n`);

/* ---------- Pages d'étude de cas ---------- */
const casMain = (c, root, img) => {
  const d = shot(c.slug, 'desktop'), m = shot(c.slug, 'mobile');
  return `<main class="case">
  <div class="wrap">
    <div class="prose">
      <a class="back" href="${root}#projets">← Tous les projets</a>
      <p class="kicker">${esc(c.secteur)}</p>
      <h1>${esc(c.client)}</h1>
      <p class="case__lede">${esc(c.resume)}</p>
    </div>
    ${RELECTURE ? `<aside class="review"><strong>Relecture · confiance ${esc(c.confiance)}.</strong> Ce cadre n'apparaîtra pas en ligne.${(c.a_verifier || []).length ? `<ul>${c.a_verifier.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}${(c.depots || []).length ? `<p>Dépôts lus : ${esc(c.depots.join(', '))}</p>` : ''}</aside>` : ''}
    <dl class="facts">
      ${c.periode ? `<div><dt>Période</dt><dd>${esc(c.periode)}</dd></div>` : ''}
      <div><dt>Plateformes</dt><dd>${esc((c.plateformes || []).join(', '))}</dd></div>
      ${c.url ? `<div><dt>Site</dt><dd><a href="${esc(c.url)}" rel="noopener">${esc(c.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></dd></div>` : ''}
    </dl>
    ${d ? `<div class="case__shots"><img src="${img(d)}" alt="La page d'accueil de ${esc(c.client)} sur ordinateur" loading="lazy">${m ? `<img src="${img(m)}" alt="La page d'accueil de ${esc(c.client)} sur téléphone" loading="lazy">` : ''}</div>` : ''}
    <div class="prose"><h2>Le besoin</h2><p>${esc(c.problematique)}</p></div>
    <div>
      <div class="prose"><h2>Ce qu'on a fait</h2></div>
      <div class="case__blocks" style="margin-top:24px">${(c.solution || []).map((s) => `<div><h3>${esc(s.titre)}</h3><p>${esc(s.texte)}</p></div>`).join('')}</div>
    </div>
    ${(c.technique || []).length ? `<div class="prose"><h2 class="h2--small">Sous le capot</h2><ul class="case__tech">${c.technique.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
    ${c.resultat ? `<div class="prose"><h2 class="h2--small">Ce que ça a changé</h2><p>${esc(c.resultat)}</p></div>` : ''}
    <div class="prose"><p><a class="btn" href="${root}#contact">Un projet du même genre ? Nous écrire</a></p></div>
  </div>
</main>`;
};
fs.rmSync('projets', { recursive: true, force: true });
for (const c of cas) {
  const root = '../../';
  const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(c.client)} · Étude de cas Azuweb</title>
<meta name="description" content="${esc(c.resume)}">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}assets/css/site.css">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: `${c.client} : étude de cas`, about: c.secteur, description: c.resume, author: { '@type': 'Organization', name: A.nom, url: A.site } })}</script>
</head>
<body>
${nav.replaceAll('href="#', `href="${root}#`).replaceAll('src="assets/', `src="${root}assets/`)}
${casMain(c, root, (f) => root + f)}
${foot}
<script src="${root}assets/js/site.js" defer></script>
</body>
</html>
`;
  fs.mkdirSync(`projets/${c.slug}`, { recursive: true });
  fs.writeFileSync(`projets/${c.slug}/index.html`, page);
}

/* ---------- Pages métier et page Vercors ---------- */
const shell = (root, title, description, main, scripts = '') => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}assets/css/site.css">
</head>
<body>
${nav.replaceAll('href="#', `href="${root}#`).replaceAll('src="assets/', `src="${root}assets/`)}
${main}
${foot}
${scripts}<script src="${root}assets/js/site.js" defer></script>
</body>
</html>
`;
// Chaque métier de la page d'accueil (forme en points, titre, texte, liste) devient une page à part entière.
const metiers = [...html.matchAll(/<article class="metier">([\s\S]*?)<\/article>/g)].map((m) => ({
  icon: m[1].match(/data-icon="(\w+)"/)[1],
  tag: m[1].match(/<span class="metier__tag">([^<]*)<\/span>/)[1],
  titre: m[1].match(/<\/span>([^<]*)<\/h3>/)[1],
  texte: m[1].match(/<p>([\s\S]*?)<\/p>/)[1],
  points: [...m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1]),
}));
const PLATEFORME = { shopify: 'Shopify', amazon: 'Amazon' };
const serviceMain = (s, m, root, casHref) => {
  const lies = cas.filter((c) => (s.slug === 'amazon' ? /amazon/i.test(c.slug + c.resume) : PLATEFORME[s.slug] && (c.plateformes || []).includes(PLATEFORME[s.slug]))).slice(0, 8);
  return `<main class="case">
  <div class="wrap">
    <div class="hero hero--metier">
      <div class="hero__text">
        <a class="back" href="${root}#metiers">← Tous nos métiers</a>
        <p class="kicker">${esc(m.tag)}</p>
        <h1>${m.titre}</h1>
        <p class="case__lede">${m.texte}</p>
      </div>
      <div class="hero__stage" id="stage" data-shape="${m.icon}" title="Cliquez pour disperser les points"><canvas id="scene" aria-hidden="true"></canvas></div>
    </div>
    ${demos[s.slug] || ''}
    <div class="prose"><h2 class="h2--small">C'est pour vous si…</h2><ul class="checks">${s.pour_qui.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>
    <div class="prose"><h2 class="h2--small">Ce qu'on livre</h2><ul class="case__tech">${m.points.map((q) => `<li>${q}</li>`).join('')}</ul></div>
    <div class="prose"><h2 class="h2--small">Comment ça se passe</h2><ol class="steps">${A.methode.map((x) => { const [a, b] = x.split(' : '); return `<li><strong>${esc(a)}.</strong> ${esc(b.charAt(0).toUpperCase() + b.slice(1))}.</li>`; }).join('')}</ol></div>
    ${lies.length ? `<div><div class="prose"><h2 class="h2--small">Des projets de ce genre</h2></div><ul class="work">${lies.map((c) => `<li><span class="work__name"><a href="${casHref(c)}">${esc(c.client)}</a></span><span class="work__kind">${esc(c.secteur)}</span><span class="work__what">${esc(c.resume)}</span></li>`).join('')}</ul></div>` : ''}
    <div class="prose"><h2 class="h2--small">Nos autres métiers</h2><p class="others">${A.services.filter((o) => o.slug !== s.slug).map((o) => `<a href="${root === '../../' ? `../${o.slug}/` : `${root}pages/${o.slug}`}">${esc(o.nom)}</a>`).join('')}</p></div>
    <div class="prose"><p><a class="btn" href="${root}#contact">Parler de votre projet</a></p></div>
  </div>
</main>`;
};
fs.rmSync('services', { recursive: true, force: true });
A.services.forEach((s, i) => {
  fs.mkdirSync(`services/${s.slug}`, { recursive: true });
  fs.writeFileSync(`services/${s.slug}/index.html`, shell('../../', `${s.nom} · Azuweb`, s.resume, serviceMain(s, metiers[i], '../../', (c) => `../../projets/${c.slug}/`), `<script type="module" src="../../assets/js/scene.js"></script>\n<script src="../../assets/js/metier.js" defer></script>\n`));
});
const vercorsMain = (root) => `<main>
  <section class="section" style="padding-bottom:clamp(28px,5vh,56px)">
    <div class="wrap"><div class="prose">
      <a class="back" href="${root}#nous">← Retour</a>
      <p class="kicker">Là où on travaille</p>
      <h1>Le Vercors.</h1>
      <p class="case__lede">On vit et on travaille à Autrans, dans le nord du Vercors : un val à mille mètres d'altitude, juste au-dessus de Grenoble. Nos clients, eux, sont à Paris, à Lyon ou de l'autre côté de l'Atlantique.</p>
    </div></div>
  </section>
  <div class="relief" id="relief">
    <canvas id="relief-canvas" aria-label="Relief stylisé du nord du Vercors, autour d'Autrans, en points d'encre"></canvas>
    <p class="relief__label relief__label--home" data-at="-0.36,-0.34">Autrans<small>c'est ici qu'on travaille</small></p>
    <p class="relief__label" data-at="-0.4,0.14">Méaudre</p>
    <p class="relief__label" data-at="-0.03,-0.3">la Molière</p>
    <p class="relief__label" data-at="0.52,-0.22">le Moucherotte<small>1 901 m, au-dessus de Grenoble</small></p>
    <p class="relief__label" data-at="0.27,0.42">Villard-de-Lans</p>
    <p class="relief__label" data-at="-0.15,0.62">les gorges de la Bourne</p>
    <p class="relief__hint">Faites glisser pour tourner autour</p>
  </div>
  <section class="section">
    <div class="wrap"><div class="prose">
      <p>Ce relief est dessiné par le code, point par point. C'est une évocation, pas une carte : les vals, les crêtes et les villages sont à peu près à leur place, le reste est de mémoire.</p>
      <h2 class="h2--small">Pourquoi ça compte pour vous</h2>
      <p>Travailler loin des grandes villes nous oblige à bien faire deux choses : écrire clairement, et tenir nos délais sans réunion inutile. Un message précis le matin, une visio quand il faut se parler, et le reste du temps on avance.</p>
      <p>On n'a pas de bureau à vous faire visiter. On a un tableau partagé où vous voyez chaque tâche, et deux personnes qui répondent.</p>
      <p><a class="btn" href="${root}#contact">Nous écrire</a></p>
    </div></div>
  </section>
</main>`;
// Les deux pages personnelles. La machine à remonter le temps vit sur celle de William.
const machine = fs.readFileSync('content/fragments/machine.html', 'utf8');
const mails = html.match(/<div class="mails">[\s\S]*?<\/figure>\s*<\/div>/)[0].match(/<figure[\s\S]*?<\/figure>/g);
const svc = (root, slug) => (root === '../' ? `../services/${slug}/` : `${root}pages/${slug}`);
const icons = (root, list) => `<p class="person__icons">${list.map(([icon, slug, label]) => `<a href="${svc(root, slug)}"><canvas data-icon="${icon}" aria-hidden="true"></canvas>${label} →</a>`).join('')}</p>`;
const photo = (root) => `<img class="duo__photo" src="${root.startsWith('{{') ? "{{ 'william-emilie.webp' | asset_url }}" : `${root}assets/img/william-emilie.webp`}" alt="William Hutter et Emilie Dupré, dos à dos" width="741" height="650">`;
const williamMain = (root) => `<main>
  <section class="section" style="padding-bottom:clamp(28px,5vh,56px)">
    <div class="wrap person__head"><div class="prose">
      <a class="back" href="${root}#nous">← L'atelier</a>
      <p class="kicker">Design et développement</p>
      <h1>William Hutter.</h1>
      <p class="case__lede">William fait des sites depuis l'époque où on les mettait en page avec des tableaux. Il dessine ce qu'il code et code ce qu'il dessine : thèmes Shopify, applications sur mesure, tableaux de bord.</p>
    </div>${photo(root)}</div>
  </section>
  <section class="era-section" id="histoire">
    <div class="wrap">
      <div class="prose">
        <h2>Il a commencé quand les sites se mettaient en page avec des <span data-draw="underline">tableaux.</span></h2>
        <p>Des <code>&lt;table&gt;</code>, des images transparentes d'un pixel pour caler les colonnes, et un compteur de visites en bas de page. Depuis, il a refait le même métier avec chaque nouvelle façon de faire.</p>
        <p>Voici la même boutique en ligne, construite comme on la construisait à chaque époque. Essayez.</p>
      </div>
${machine}
      <div class="prose">
        <p>Les outils changent tous les cinq ans. Ce qu'on demande à une page n'a pas bougé : <mark>se charger vite, se lire sans effort, donner envie d'acheter.</mark></p>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap split">
      <div class="prose">
        <h2 class="h2--small">Ce dont il s'occupe</h2>
        ${icons(root, [['bag', 'shopify', 'Boutiques Shopify'], ['bars', 'donnees', 'Données'], ['network', 'agents-ia', 'Agents IA']])}
        <p>C'est à lui que vous parlez quand il s'agit du site : une page qui casse, une nouvelle fiche produit, une application à écrire.</p>
        <p><a class="btn" href="${root}#contact">Nous écrire</a></p>
      </div>
      ${mails[0]}
    </div>
  </section>
</main>`;
const emilieMain = (root) => `<main>
  <section class="section" style="padding-bottom:clamp(28px,5vh,56px)">
    <div class="wrap person__head"><div class="prose">
      <a class="back" href="${root}#nous">← L'atelier</a>
      <p class="kicker">Marketing et commerce international</p>
      <h1>Emilie Dupré.</h1>
      <p class="case__lede">Emilie vient du commerce international, qu'elle a étudié en école, et du marketing en ligne. Elle suit ce que chaque euro dépensé rapporte : Amazon, publicité, e-mails, marges.</p>
    </div>${photo(root)}</div>
  </section>
  <section class="band">
    <div class="wrap split">
      <div class="prose">
        <h2 class="h2--small">Ce dont elle s'occupe</h2>
        ${icons(root, [['box', 'amazon', 'Amazon Seller Central'], ['megaphone', 'publicite-meta', 'Publicité Meta'], ['envelope', 'emails-klaviyo', 'E-mails Klaviyo']])}
        <p>C'est à elle que vous parlez quand il s'agit de vendre : un compte Amazon à tenir, des campagnes à suivre, une liste e-mail à faire vivre.</p>
        <ul class="plain">
          <li><strong>Chaque matin,</strong> le relevé des dépenses et des achats de la veille.</li>
          <li><strong>Chaque semaine,</strong> un compte de résultat : ventes, publicité, marge.</li>
          <li><strong>Avant chaque temps fort,</strong> un plan jour par jour.</li>
        </ul>
        <p><a class="btn" href="${root}#contact">Nous écrire</a></p>
      </div>
      ${mails[1]}
    </div>
  </section>
  <section class="section">
    <div class="wrap"><div class="prose">
      <h2 class="h2--small">Vendre à l'étranger</h2>
      <p>Ouvrir un marché, ce n'est pas traduire un site. Ce sont des prix, des taxes, des délais de livraison et une publicité à repenser pour chaque pays. Plusieurs de nos clients vendent aujourd'hui en Amérique du Nord, sur leur boutique ou sur Amazon.</p>
    </div></div>
  </section>
</main>`;
const modules = (root) => `<script type="module" src="${root}assets/js/scene.js"></script>\n`;
for (const [slug, title, desc, main] of [
  ['william', 'William Hutter · Azuweb', "William Hutter, design et développement chez Azuweb : des sites depuis l'époque des tableaux, des boutiques Shopify aujourd'hui.", williamMain],
  ['emilie', 'Emilie Dupré · Azuweb', 'Emilie Dupré, marketing et commerce international chez Azuweb : Amazon, publicité Meta, e-mails Klaviyo.', emilieMain],
]) { fs.mkdirSync(slug, { recursive: true }); fs.writeFileSync(`${slug}/index.html`, shell('../', title, desc, main('../'), modules('../'))); }

fs.mkdirSync('vercors', { recursive: true });
fs.writeFileSync('vercors/index.html', shell('../', 'Le Vercors · Azuweb', "Azuweb travaille depuis Autrans, dans le Vercors. Un relief en 3D, dessiné point par point, et ce que ça change dans notre façon de travailler.", vercorsMain('../'), '<script type="module" src="../assets/js/vercors.js"></script>\n'));

/* ---------- Thème Shopify ---------- */
const out = 'theme';
fs.rmSync(out, { recursive: true, force: true });
for (const d of ['layout', 'templates', 'sections', 'assets', 'config', 'locales']) fs.mkdirSync(path.join(out, d), { recursive: true });
const copy = (from, to) => fs.copyFileSync(from, path.join(out, 'assets', to)); // Shopify range tout à plat dans assets/
copy('assets/vendor/three.module.min.js', 'three.module.min.js');
copy('assets/fonts/inter.woff2', 'inter.woff2');
copy('assets/js/site.js', 'azuweb-site.js');
copy('assets/js/metier.js', 'azuweb-metier.js');
fs.writeFileSync(path.join(out, 'assets/azuweb-vercors.js'), fs.readFileSync('assets/js/vercors.js', 'utf8').replace('../vendor/three.module.min.js', './three.module.min.js'));
copy('favicon.svg', 'favicon.svg');
copy('assets/img/logo.png', 'logo.png');
copy('assets/img/william-emilie.webp', 'william-emilie.webp');
if (cas.length && fs.existsSync('assets/img/cas')) for (const f of fs.readdirSync('assets/img/cas')) copy(`assets/img/cas/${f}`, `cas-${f}`);
fs.writeFileSync(path.join(out, 'assets/azuweb-site.css'), fs.readFileSync('assets/css/site.css', 'utf8').replaceAll('../fonts/', ''));
fs.writeFileSync(path.join(out, 'assets/azuweb-scene.js'), fs.readFileSync('assets/js/scene.js', 'utf8').replace('../vendor/three.module.min.js', './three.module.min.js'));

const description = html.match(/<meta name="description" content="([^"]*)"/)[1];
const head = (html.match(/<!-- build:jsonld -->([\s\S]*?)<!-- \/build:jsonld -->/) || [, ''])[1];
fs.writeFileSync(path.join(out, 'layout/theme.liquid'), `<!doctype html>
<html lang="{{ request.locale.iso_code }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{{ page_title }}{% unless page_title contains shop.name %} · {{ shop.name }}{% endunless %}</title>
<meta name="description" content="{{ page_description | default: ${JSON.stringify(description)} | escape }}">
<meta name="theme-color" content="#fffbf8">
<link rel="canonical" href="{{ canonical_url }}">
<link rel="icon" href="{{ 'favicon.svg' | asset_url }}" type="image/svg+xml">
<link rel="preload" href="{{ 'inter.woff2' | asset_url }}" as="font" type="font/woff2" crossorigin>
{{ 'azuweb-site.css' | asset_url | stylesheet_tag }}
{% if template.name == 'index' %}{% raw %}${head}{% endraw %}{% endif %}
{{ content_for_header }}
</head>
<body>
{{ content_for_layout }}
<script type="module" src="{{ 'azuweb-scene.js' | asset_url }}"></script>
<script src="{{ 'azuweb-site.js' | asset_url }}" defer></script>
</body>
</html>
`);
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>\s*/g, '');
const liquid = (s) => s.replaceAll('src="assets/img/william-emilie.webp"', 'src="{{ \'william-emilie.webp\' | asset_url }}"').replaceAll('src="assets/img/logo.png"', 'src="{{ \'logo.png\' | asset_url }}"').replaceAll('href="#', 'href="{{ routes.root_url }}#').replaceAll('href="llms.txt"', 'href="{{ routes.root_url }}pages/llms"').replace(/href="projets\/([\w-]+)\/"/g, 'href="{{ routes.root_url }}pages/$1"').replace(/href="services\/([\w-]+)\/"/g, 'href="{{ routes.root_url }}pages/$1"').replaceAll('href="vercors/"', 'href="{{ routes.root_url }}pages/vercors"').replaceAll('href="william/"', 'href="{{ routes.root_url }}pages/william"').replaceAll('href="emilie/"', 'href="{{ routes.root_url }}pages/emilie"');
const section = (file, name, content) => fs.writeFileSync(path.join(out, 'sections', file), `${content}\n{% schema %}\n{ "name": ${JSON.stringify(name)}, "settings": [] }\n{% endschema %}\n`);
const tpl = (type) => JSON.stringify({ sections: { main: { type, settings: {} } }, order: ['main'] }, null, 2);
const lNav = liquid(nav), lFoot = foot;
section('azuweb-home.liquid', 'Azuweb · Accueil', liquid(body));
section('azuweb-page.liquid', 'Azuweb · Page', `${lNav}\n<main class="section"><div class="wrap"><div class="prose"><h1 style="font-size:var(--t-h2)">{{ page.title | default: page_title }}</h1></div><div class="rte" style="margin-top:28px">{{ page.content }}</div></div></main>\n${lFoot}`);
fs.writeFileSync(path.join(out, 'templates/index.json'), tpl('azuweb-home'));
fs.writeFileSync(path.join(out, 'templates/page.json'), tpl('azuweb-page'));
fs.writeFileSync(path.join(out, 'templates/404.json'), tpl('azuweb-page'));
// Une page Shopify par étude de cas : créer la page dans l'admin avec le modèle « cas-<slug> ».
for (const c of cas) {
  const main = casMain(c, '{{ routes.root_url }}', (f) => `{{ 'cas-${path.basename(f)}' | asset_url }}`);
  section(`azuweb-cas-${c.slug}.liquid`, `Cas · ${c.client}`.slice(0, 25), `${lNav}\n${main}\n${lFoot}`);
  fs.writeFileSync(path.join(out, `templates/page.cas-${c.slug}.json`), tpl(`azuweb-cas-${c.slug}`));
}
// Pages métier et Vercors : créer chaque page dans l'admin avec le modèle du même nom.
const R = '{{ routes.root_url }}';
A.services.forEach((s, i) => {
  section(`azuweb-metier-${s.slug}.liquid`, `Métier · ${s.nom}`.slice(0, 25), `${lNav}\n${serviceMain(s, metiers[i], R, (c) => `${R}pages/${c.slug}`)}\n${lFoot}\n<script src="{{ 'azuweb-metier.js' | asset_url }}" defer></script>`);
  fs.writeFileSync(path.join(out, `templates/page.metier-${s.slug}.json`), tpl(`azuweb-metier-${s.slug}`));
});
section('azuweb-vercors.liquid', 'Azuweb · Vercors', `${lNav}\n${vercorsMain(R)}\n${lFoot}\n<script type="module" src="{{ 'azuweb-vercors.js' | asset_url }}"></script>`);
fs.writeFileSync(path.join(out, 'templates/page.vercors.json'), tpl('azuweb-vercors'));
section('azuweb-william.liquid', 'Azuweb · William', `${lNav}\n${williamMain(R)}\n${lFoot}`);
fs.writeFileSync(path.join(out, 'templates/page.william.json'), tpl('azuweb-william'));
section('azuweb-emilie.liquid', 'Azuweb · Emilie', `${lNav}\n${emilieMain(R)}\n${lFoot}`);
fs.writeFileSync(path.join(out, 'templates/page.emilie.json'), tpl('azuweb-emilie'));
// La version texte pour les IA : créer une page « llms » dans l'admin avec le modèle « llms ».
fs.writeFileSync(path.join(out, 'templates/page.llms.liquid'), `{% layout none %}<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Azuweb, version texte</title></head><body><pre style="white-space:pre-wrap;font:16px/1.5 ui-monospace,monospace;max-width:80ch;margin:2rem auto;padding:0 1rem">{% raw %}${esc(long)}{% endraw %}</pre></body></html>\n`);
fs.writeFileSync(path.join(out, 'config/settings_schema.json'), JSON.stringify([{ name: 'theme_info', theme_name: 'Azuweb', theme_version: '1.1.0', theme_author: 'Azuweb', theme_documentation_url: A.site, theme_support_url: A.site }], null, 2));
fs.writeFileSync(path.join(out, 'config/settings_data.json'), JSON.stringify({ current: {} }, null, 2));
fs.writeFileSync(path.join(out, 'locales/fr.default.json'), '{}\n');

console.log(`Construit : index.html, llms.txt, llms-full.txt, ${cas.length} étude(s) de cas, thème Shopify.`);
