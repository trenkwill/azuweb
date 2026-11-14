// Fabrique le thème Shopify (dossier theme/) à partir de index.html et de assets/.
// Usage : node tools/build-theme.mjs
import fs from 'fs';
import path from 'path';

const out = 'theme';
fs.rmSync(out, { recursive: true, force: true });
for (const d of ['layout', 'templates', 'sections', 'assets', 'config', 'locales']) fs.mkdirSync(path.join(out, d), { recursive: true });

const html = fs.readFileSync('index.html', 'utf8');
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>\s*/g, '');
const [, description] = html.match(/<meta name="description" content="([^"]*)"/);

// Shopify range tous les fichiers à plat dans assets/.
const copy = (from, to) => fs.copyFileSync(from, path.join(out, 'assets', to));
copy('assets/vendor/three.module.min.js', 'three.module.min.js');
copy('assets/fonts/bricolage.woff2', 'bricolage.woff2');
copy('assets/fonts/instrument-italic.woff2', 'instrument-italic.woff2');
copy('assets/js/site.js', 'azuweb-site.js');
copy('favicon.svg', 'favicon.svg');
fs.writeFileSync(path.join(out, 'assets/azuweb-site.css'), fs.readFileSync('assets/css/site.css', 'utf8').replaceAll('../fonts/', ''));
fs.writeFileSync(path.join(out, 'assets/azuweb-scene.js'), fs.readFileSync('assets/js/scene.js', 'utf8').replace('../vendor/three.module.min.js', './three.module.min.js'));

fs.writeFileSync(path.join(out, 'layout/theme.liquid'), `<!doctype html>
<html lang="{{ request.locale.iso_code }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{{ page_title }}{% unless page_title contains shop.name %} · {{ shop.name }}{% endunless %}</title>
<meta name="description" content="{{ page_description | default: ${JSON.stringify(description)} | escape }}">
<meta name="theme-color" content="#050a16">
<link rel="canonical" href="{{ canonical_url }}">
<link rel="icon" href="{{ 'favicon.svg' | asset_url }}" type="image/svg+xml">
<link rel="preload" href="{{ 'bricolage.woff2' | asset_url }}" as="font" type="font/woff2" crossorigin>
{{ 'azuweb-site.css' | asset_url | stylesheet_tag }}
{{ content_for_header }}
</head>
<body>
{{ content_for_layout }}
<script type="module" src="{{ 'azuweb-scene.js' | asset_url }}"></script>
<script src="{{ 'azuweb-site.js' | asset_url }}" defer></script>
</body>
</html>
`);

const page = body.replaceAll('href="#', 'href="{{ routes.root_url }}#');
const [top, rest] = page.split('<main id="top">');
const [main, foot] = rest.split('</main>');
const chrome = (inner) => `${top}<main id="top">${inner}</main>${foot}`;

fs.writeFileSync(path.join(out, 'sections/azuweb-home.liquid'), `${chrome(main)}
{% schema %}
{ "name": "Azuweb · Accueil", "settings": [] }
{% endschema %}
`);
fs.writeFileSync(path.join(out, 'sections/azuweb-page.liquid'), `${chrome(`
  <section class="panel panel--deep" style="padding-top:160px">
    <div class="wrap">
      <div class="head"><h1 class="display" style="font-size:var(--t-2xl)">{{ page.title | default: page_title }}</h1></div>
      <div class="rte">{{ page.content }}</div>
    </div>
  </section>`)}
{% schema %}
{ "name": "Azuweb · Page", "settings": [] }
{% endschema %}
`);
const tpl = (type) => JSON.stringify({ sections: { main: { type, settings: {} } }, order: ['main'] }, null, 2);
fs.writeFileSync(path.join(out, 'templates/index.json'), tpl('azuweb-home'));
fs.writeFileSync(path.join(out, 'templates/page.json'), tpl('azuweb-page'));
fs.writeFileSync(path.join(out, 'templates/404.json'), tpl('azuweb-page'));
fs.writeFileSync(path.join(out, 'config/settings_schema.json'), JSON.stringify([{ name: 'theme_info', theme_name: 'Azuweb', theme_version: '1.0.0', theme_author: 'Azuweb', theme_documentation_url: 'https://azuweb.net', theme_support_url: 'https://azuweb.net' }], null, 2));
fs.writeFileSync(path.join(out, 'config/settings_data.json'), JSON.stringify({ current: {} }, null, 2));
fs.writeFileSync(path.join(out, 'locales/fr.default.json'), '{}\n');
console.log('Thème écrit dans', out);
