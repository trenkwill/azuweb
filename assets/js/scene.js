// Les points d'encre d'Azuweb.
// - Dans l'accueil : une grande forme en 3D (WebGL) qui se réarrange d'un métier à l'autre
//   et s'écarte au passage du pointeur.
// - Devant chaque métier : la même forme en petit, dessinée en 2D, qui tourne doucement.
import * as THREE from '../vendor/three.module.min.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = window.matchMedia('(max-width: 860px)');

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
function onBox(w, h, d, edge = 0.5) {
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
  // Shopify : un sac de boutique.
  bag() {
    const k = R();
    if (k < 0.74) {
      const p = onBox(1.5, 1.75, 0.72), flare = 1 + (p[1] + 0.875) * 0.06;
      return [p[0] * flare, p[1] - 0.3, p[2] * flare];
    }
    const a = R() * Math.PI, front = k < 0.87 ? 0.36 : -0.36;
    return jitter([0.42 * Math.cos(a), 0.575 + 0.55 * Math.sin(a), front], 0.03);
  },
  // Amazon : un colis, avec sa bande adhésive.
  box() {
    const k = R();
    if (k < 0.8) return onBox(1.9, 1.35, 1.5);
    const t = R() * 2 - 1, side = R();
    if (side < 0.5) return [(R() - 0.5) * 0.24, 0.675, t * 0.75];
    return [(R() - 0.5) * 0.24, 0.675 - R() * 0.5, side < 0.75 ? 0.75 : -0.75];
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
      const i = (R() * 5) | 0, p = onBox(0.38, hs[i], 0.38, 0.55);
      return [p[0] - 1.2 + i * 0.6, p[1] - 0.95 + hs[i] / 2, p[2]];
    }
    if (k < 0.9) return [(R() * 2 - 1) * 1.55, -0.95, (R() - 0.5) * 0.6];
    const i = (R() * 4) | 0;
    return jitter(seg([-1.2 + i * 0.6, -0.67 + hs[i], 0], [-0.6 + i * 0.6, -0.67 + hs[i + 1], 0]), 0.03);
  },
  // IA : un réseau de nœuds reliés entre eux.
  network: (() => {
    const nodes = Array.from({ length: 30 }, () => onSphere(0.5 + R() * 1.0));
    const links = [];
    nodes.forEach((n, i) => {
      nodes.map((m, j) => [j, Math.hypot(n[0] - m[0], n[1] - m[1], n[2] - m[2])])
        .filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 3)
        .forEach(([j]) => links.push([n, nodes[j]]));
    });
    return () => (R() < 0.42 ? jitter(pick(nodes), 0.16) : jitter(seg(...pick(links)), 0.012));
  })(),
};
// Ces formes se lisent de face : elles oscillent au lieu de tourner.
const FLAT = { envelope: 1, bars: 1, megaphone: 1 };

function build(name, count) {
  const out = new Float32Array(count * 3), fn = shapes[name];
  for (let i = 0; i < count; i++) { const p = fn(); out[i * 3] = p[0]; out[i * 3 + 1] = p[1]; out[i * 3 + 2] = p[2]; }
  return out;
}
const angle = (name, t, phase = 0) => (FLAT[name] ? Math.sin(t * 0.5 + phase) * 0.5 : t * 0.25 + phase);

/* ---------- Petites icônes en 2D ---------- */
const INK = '#10151f', AZUR = '#007bf7';
document.querySelectorAll('canvas[data-icon]').forEach((cv, n) => {
  const name = cv.dataset.icon, N = 1100, pts = build(name, N), ctx = cv.getContext('2d');
  let on = false, last = 0;
  function draw(t) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const a = angle(name, t, n), ca = Math.cos(a), sa = Math.sin(a), tilt = 0.28, ct = Math.cos(tilt), st = Math.sin(tilt);
    const s = Math.min(w, h) / 4.3;
    for (let i = 0; i < N; i++) {
      const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca, y1 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      ctx.globalAlpha = 0.35 + 0.65 * Math.min(1, Math.max(0, (z2 + 1.4) / 2.8));
      ctx.fillStyle = i % 5 === 0 ? AZUR : INK;
      ctx.fillRect(w / 2 + x1 * s, h / 2 - y1 * s, 1.5, 1.5);
    }
  }
  function loop(ms) {
    if (!on) return;
    if (ms - last > 40) { last = ms; draw(ms / 1000); }
    requestAnimationFrame(loop);
  }
  draw(0);
  if (!reduced) new IntersectionObserver((e) => { const was = on; on = e[0].isIntersecting; if (on && !was) requestAnimationFrame(loop); }).observe(cv);
});

/* ---------- La grande forme de l'accueil ---------- */
const stage = document.getElementById('stage');
const canvas = document.getElementById('scene');
const label = document.getElementById('stage-label');
let renderer;
try {
  if (canvas) renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
} catch (e) { /* pas de WebGL : la page reste entièrement lisible sans la scène */ }
if (!renderer && stage) stage.hidden = true;

if (renderer) {
  const COUNT = small.matches ? 7000 : 14000;
  const ORDER = ['bag', 'box', 'megaphone', 'envelope', 'bars', 'network'];
  const LABELS = { bag: 'une boutique', box: 'un colis Amazon', megaphone: 'une annonce', envelope: 'un e-mail', bars: 'des chiffres', network: 'des agents IA' };
  const cache = {};
  const target = (n) => (cache[n] ||= build(n, COUNT));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.z = 8;

  const geo = new THREE.BufferGeometry();
  const from = new Float32Array(target('bag')), to = new Float32Array(target('bag'));
  const rand = new Float32Array(COUNT * 4).map(() => R());
  geo.setAttribute('position', new THREE.BufferAttribute(to, 3));
  geo.setAttribute('aFrom', new THREE.BufferAttribute(from, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));

  const uniforms = {
    uMix: { value: 1 }, uTime: { value: 0 }, uSize: { value: 20 }, uPointer: { value: new THREE.Vector3(99, 99, 0) },
    uInk: { value: new THREE.Color(INK) }, uAzur: { value: new THREE.Color(AZUR) },
  };
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: false,
    vertexShader: `
      attribute vec3 aFrom; attribute vec4 aRand;
      uniform float uMix, uTime, uSize; uniform vec3 uPointer;
      varying float vBlue; varying float vDepth;
      void main() {
        float m = smoothstep(0.0, 1.0, clamp(uMix * 1.4 - aRand.x * 0.4, 0.0, 1.0));
        vec3 p = mix(aFrom, position, m);
        vec3 sw = vec3(sin(aRand.y * 40.0 + uTime * 0.6), cos(aRand.z * 37.0 + uTime * 0.5), sin(aRand.w * 31.0 + uTime * 0.7));
        p += sw * sin(m * 3.14159) * (0.25 + aRand.w * 0.9) + sw * 0.012;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        // Le pointeur écarte les points, comme un doigt dans du sable.
        vec2 away = mv.xy - uPointer.xy;
        float push = smoothstep(1.1, 0.0, length(away)) * uPointer.z;
        mv.xy += normalize(away + 0.0001) * push * (0.35 + aRand.y * 0.5);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.5 + aRand.z * 0.8) / -mv.z;
        vBlue = step(0.8, aRand.w); vDepth = smoothstep(-10.5, -5.5, mv.z);
      }`,
    fragmentShader: `
      uniform vec3 uInk, uAzur; varying float vBlue; varying float vDepth;
      void main() {
        float a = smoothstep(0.5, 0.32, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(mix(uInk, uAzur, vBlue), a * (0.3 + 0.7 * vDepth));
      }`,
  }));
  points.frustumCulled = false;
  const rig = new THREE.Group();
  rig.add(points);
  scene.add(rig);

  let current = 'bag', mixStart = -10, halfW = 1, halfH = 1;
  const DURATION = reduced ? 0.001 : 1.7;
  function morph(name, now) {
    if (name === current) return;
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
    if (label) label.textContent = LABELS[name];
  }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z; halfW = halfH * camera.aspect;
    rig.scale.setScalar(Math.min(halfH, halfW) / 1.5);
    uniforms.uSize.value = 21 * renderer.getPixelRatio() * (Math.min(w, h) / 520);
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  const pointer = { x: 0, y: 0, inside: 0 };
  window.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    pointer.inside = Math.abs(pointer.x) < 1.15 && Math.abs(pointer.y) < 1.15 ? 1 : 0;
  }, { passive: true });

  // La forme change toute seule ; un clic passe à la suivante.
  let index = 0, nextAt = 4.2, visible = false, force = false;
  stage.addEventListener('click', () => { force = true; });
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(stage);

  const clock = new THREE.Clock();
  let rx = 0, ry = 0, rot, strength = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    if (force || (!reduced && t > nextAt)) { force = false; index = (index + 1) % ORDER.length; nextAt = t + 4.6; morph(ORDER[index], t); }
    uniforms.uMix.value = Math.min(1, (t - mixStart) / DURATION);
    uniforms.uTime.value = reduced ? 0 : t;
    strength += (pointer.inside - strength) * 0.08;
    uniforms.uPointer.value.set(pointer.x * halfW, pointer.y * halfH, strength);
    rx += (-pointer.y * 0.12 - rx) * 0.05; ry += (pointer.x * 0.25 - ry) * 0.05;
    const goal = reduced ? 0.5 : angle(current, t);
    rot = rot === undefined ? goal : rot + Math.atan2(Math.sin(goal - rot), Math.cos(goal - rot)) * 0.04;
    rig.rotation.set(rx + 0.14, rot + ry, 0);
    renderer.render(scene, camera);
  }
  frame();
}
