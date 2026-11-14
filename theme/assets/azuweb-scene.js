// Scène 3D d'Azuweb : des points d'encre qui dessinent chaque métier en volume
// (sac, colis, mégaphone, enveloppe, colonnes, réseau) et se réarrangent au défilement.
import * as THREE from './three.module.min.js';

const canvas = document.getElementById('scene');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage = document.getElementById('stage');
const small = window.matchMedia('(max-width: 860px)');
const COUNT = small.matches ? 6000 : 13000;

/* ---------- Générateurs de formes (chaque fonction renvoie un point) ---------- */
const R = Math.random;
const pick = (a) => a[(R() * a.length) | 0];
const lerp = (a, b, t) => a + (b - a) * t;
const jitter = (p, j) => [p[0] + (R() - 0.5) * j, p[1] + (R() - 0.5) * j, p[2] + (R() - 0.5) * j];
const seg = (a, b) => { const t = R(); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };

function onSphere(r) {
  const u = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - u * u);
  return [r * s * Math.cos(a), r * u, r * s * Math.sin(a)];
}

// Boîte : faces peu denses, arêtes marquées pour que le volume se lise.
function onBox(w, h, d, edge = 0.45) {
  const x = w / 2, y = h / 2, z = d / 2;
  if (R() < edge) {
    const axis = (R() * 3) | 0, s1 = R() < 0.5 ? -1 : 1, s2 = R() < 0.5 ? -1 : 1, t = R() * 2 - 1;
    if (axis === 0) return [t * x, s1 * y, s2 * z];
    if (axis === 1) return [s1 * x, t * y, s2 * z];
    return [s1 * x, s2 * y, t * z];
  }
  const f = (R() * 3) | 0, s = R() < 0.5 ? -1 : 1, a = R() * 2 - 1, b = R() * 2 - 1;
  if (f === 0) return [s * x, a * y, b * z];
  if (f === 1) return [a * x, s * y, b * z];
  return [a * x, b * y, s * z];
}

const shapes = {
  // Accueil : un astre et ses orbites, une par canal de vente.
  orb() {
    const k = R();
    if (k < 0.5) return onSphere(1.0 + (R() - 0.5) * 0.04);
    const ring = (k * 40 | 0) % 4, a = R() * Math.PI * 2;
    const r = 1.28 + ring * 0.17 + (R() - 0.5) * 0.03;
    const tilt = [0.35, -0.5, 0.9, -1.15][ring];
    const x = r * Math.cos(a), z = r * Math.sin(a);
    return [x, z * Math.sin(tilt), z * Math.cos(tilt)];
  },
  // Shopify : un sac de boutique.
  bag() {
    const k = R();
    if (k < 0.74) {
      const p = onBox(1.5, 1.75, 0.72);
      const flare = 1 + (p[1] + 0.875) * 0.06; // légèrement évasé vers le haut
      return [p[0] * flare, p[1] - 0.3, p[2] * flare];
    }
    const a = R() * Math.PI, front = k < 0.87 ? 0.36 : -0.36; // deux anses
    return jitter([0.42 * Math.cos(a), 0.575 + 0.55 * Math.sin(a), front], 0.03);
  },
  // Amazon : un colis, avec sa bande adhésive.
  box() {
    const k = R();
    if (k < 0.8) return onBox(1.9, 1.35, 1.5);
    const t = R() * 2 - 1, side = R();
    if (side < 0.5) return [(R() - 0.5) * 0.24, 0.675, t * 0.75];
    if (side < 0.75) return [(R() - 0.5) * 0.24, 0.675 - R() * 0.5, 0.75];
    return [(R() - 0.5) * 0.24, 0.675 - R() * 0.5, -0.75];
  },
  // Meta Ads : un mégaphone et les ondes qu'il diffuse.
  megaphone() {
    const k = R();
    if (k < 0.55) {
      const t = R(), a = R() * Math.PI * 2, r = lerp(0.2, 0.95, t * t);
      return [lerp(-1.75, -0.05, t), r * Math.cos(a), r * Math.sin(a)];
    }
    if (k < 0.65) { const a = R() * Math.PI * 2; return [-0.05, 0.95 * Math.cos(a), 0.95 * Math.sin(a)]; }
    const w = (R() * 3) | 0, a = (R() - 0.5) * 1.5, b = R() * Math.PI * 2, r = 1.1 + w * 0.3;
    return [r * Math.cos(a) - 0.6, r * Math.sin(a) * Math.cos(b), r * Math.sin(a) * Math.sin(b)];
  },
  // Klaviyo : une enveloppe.
  envelope() {
    const w = 1.25, h = 0.82, k = R();
    const c = [[-w, h, 0], [w, h, 0], [w, -h, 0], [-w, -h, 0]];
    let p;
    if (k < 0.34) { const i = (R() * 4) | 0; p = seg(c[i], c[(i + 1) % 4]); }
    else if (k < 0.6) p = seg(pick([c[0], c[1]]), [0, -0.08, 0]);
    else if (k < 0.74) p = R() < 0.5 ? seg(c[3], [-0.42, 0.14, 0]) : seg(c[2], [0.42, 0.14, 0]);
    else p = [(R() * 2 - 1) * w, (R() * 2 - 1) * h, 0];
    return [p[0], p[1], p[2] + (R() - 0.5) * 0.14];
  },
  // Données : des colonnes qui montent et leur courbe de tendance.
  bars() {
    const hs = [0.5, 0.85, 0.7, 1.3, 1.9], k = R();
    if (k < 0.8) {
      const i = (R() * 5) | 0, p = onBox(0.38, hs[i], 0.38, 0.5);
      return [p[0] - 1.2 + i * 0.6, p[1] - 0.95 + hs[i] / 2, p[2]];
    }
    if (k < 0.9) return [(R() * 2 - 1) * 1.55, -0.95, (R() - 0.5) * 0.6];
    const i = (R() * 4) | 0;
    const a = [-1.2 + i * 0.6, -0.95 + hs[i] + 0.28, 0], b = [-1.2 + (i + 1) * 0.6, -0.95 + hs[i + 1] + 0.28, 0];
    return jitter(seg(a, b), 0.03);
  },
  // IA : un réseau de nœuds reliés entre eux.
  network: (() => {
    const nodes = Array.from({ length: 34 }, () => onSphere(0.5 + R() * 1.0));
    const links = [];
    nodes.forEach((n, i) => {
      nodes.map((m, j) => [j, Math.hypot(n[0] - m[0], n[1] - m[1], n[2] - m[2])])
        .filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 3)
        .forEach(([j]) => links.push([n, nodes[j]]));
    });
    return () => {
      if (R() < 0.42) return jitter(pick(nodes), 0.16);
      const l = pick(links); return jitter(seg(l[0], l[1]), 0.012);
    };
  })(),
};

function build(name) {
  const out = new Float32Array(COUNT * 3), fn = shapes[name] || shapes.orb;
  for (let i = 0; i < COUNT; i++) { const p = fn(); out[i * 3] = p[0]; out[i * 3 + 1] = p[1]; out[i * 3 + 2] = p[2]; }
  return out;
}

/* ---------- Rendu ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  canvas.remove(); // pas de WebGL : la page reste entièrement lisible sans la scène
}

if (renderer) {
  const cache = {};
  const target = (n) => (cache[n] ||= build(n));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.z = 8;

  const geo = new THREE.BufferGeometry();
  const from = new Float32Array(target('bag'));
  const to = new Float32Array(target('bag'));
  const rand = new Float32Array(COUNT * 4).map(() => R());
  geo.setAttribute('position', new THREE.BufferAttribute(to, 3));
  geo.setAttribute('aFrom', new THREE.BufferAttribute(from, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));

  const uniforms = {
    uMix: { value: 1 }, uTime: { value: 0 }, uSize: { value: 30 }, uAlpha: { value: 1 },
    uA: { value: new THREE.Color('#10151f') }, uB: { value: new THREE.Color('#1456d9') }, uC: { value: new THREE.Color('#1456d9') },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.NormalBlending,
    vertexShader: `
      attribute vec3 aFrom; attribute vec4 aRand;
      uniform float uMix, uTime, uSize;
      varying float vTone; varying float vGold; varying float vDepth;
      void main() {
        float m = smoothstep(0.0, 1.0, clamp(uMix * 1.4 - aRand.x * 0.4, 0.0, 1.0));
        vec3 p = mix(aFrom, position, m);
        vec3 sw = vec3(sin(aRand.y * 40.0 + uTime * 0.6), cos(aRand.z * 37.0 + uTime * 0.5), sin(aRand.w * 31.0 + uTime * 0.7));
        p += sw * sin(m * 3.14159) * (0.25 + aRand.w * 0.9);
        p += sw * 0.014;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.5 + aRand.z * 0.8) / -mv.z;
        vTone = aRand.y; vGold = step(0.8, aRand.w); vDepth = smoothstep(-10.5, -5.5, mv.z);
      }`,
    fragmentShader: `
      uniform vec3 uA, uB, uC; uniform float uAlpha;
      varying float vTone; varying float vGold; varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.32, d);
        vec3 c = mix(uA, uC, vGold);
        gl_FragColor = vec4(c, a * uAlpha * (0.3 + 0.7 * vDepth));
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const rig = new THREE.Group();
  rig.add(points);
  scene.add(rig);

  /* ---------- Changement de forme ---------- */
  let current = 'bag', mixStart = -10;
  const DURATION = reduced ? 0.001 : 1.7;
  function morph(name, now) {
    if (name === current || !shapes[name]) return;
    // On repart de la position réellement affichée, même en pleine transition.
    const u = uniforms.uMix.value;
    for (let i = 0; i < COUNT; i++) {
      const x = Math.min(1, Math.max(0, u * 1.4 - rand[i * 4] * 0.4)), m = x * x * (3 - 2 * x);
      for (let k = 0; k < 3; k++) from[i * 3 + k] = lerp(from[i * 3 + k], to[i * 3 + k], m);
    }
    to.set(target(name));
    geo.attributes.aFrom.needsUpdate = true;
    geo.attributes.position.needsUpdate = true;
    current = name; mixStart = now; uniforms.uMix.value = 0;
  }

  const stages = [...document.querySelectorAll('[data-shape]')];
  function activeShape() {
    const mid = window.innerHeight * 0.55;
    let name = stages.length ? stages[0].dataset.shape : 'bag';
    for (const el of stages) if (el.getBoundingClientRect().top < mid) name = el.dataset.shape;
    return name;
  }

  /* ---------- Cadrage ---------- */
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    rig.scale.setScalar(Math.min(halfH, halfH * camera.aspect) / 1.55);
    uniforms.uSize.value = 23 * renderer.getPixelRatio() * (h / 600) * (small.matches ? 1.5 : 1);
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / window.innerWidth - 0.5;
    pointer.y = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  // On ne dessine que lorsque la scène est à l'écran.
  let visible = false;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(stage);

  const clock = new THREE.Clock();
  let rx = 0, ry = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    morph(activeShape(), t);
    const p = Math.min(1, (t - mixStart) / DURATION);
    uniforms.uMix.value = p;
    uniforms.uTime.value = reduced ? 0 : t;
    rx += (pointer.y * 0.35 - rx) * 0.05;
    ry += (pointer.x * 0.6 - ry) * 0.05;
    const spin = reduced ? 0.5 : t * 0.2;
    // L'enveloppe et les colonnes se lisent de face : on les fait osciller au lieu de tourner.
    const flat = current === 'envelope' || current === 'bars' || current === 'megaphone';
    const goal = flat ? Math.sin(t * 0.5) * 0.45 : spin;
    rig.userData.y = rig.userData.y === undefined ? goal : rig.userData.y + shortest(goal - rig.userData.y) * 0.04;
    rig.rotation.set(rx + 0.12, rig.userData.y + ry, 0);
    rig.position.set(0, reduced ? 0 : Math.sin(t * 0.7) * 0.04, 0);
    renderer.render(scene, camera);
  }
  function shortest(d) { return Math.atan2(Math.sin(d), Math.cos(d)); }
  frame();
  document.documentElement.classList.add('has-scene');
}
