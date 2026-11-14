// Le Vercors en points d'encre : un relief dessiné par le code (une évocation, pas une carte).
// Un grand plateau incliné, une falaise à l'est, le Grand Veymont sur la crête et le Mont Aiguille détaché.
import * as THREE from './three.module.min.js';

const stage = document.getElementById('relief');
const canvas = document.getElementById('relief-canvas');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false }); } catch (e) { stage.classList.add('is-flat'); }

if (renderer) {
  /* ---------- Le relief ---------- */
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const smooth = (t) => t * t * (3 - 2 * t);
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  }
  const fbm = (x, y) => noise(x, y) * 0.5 + noise(x * 2.1, y * 2.1) * 0.25 + noise(x * 4.3, y * 4.3) * 0.125 + noise(x * 8.7, y * 8.7) * 0.0625;
  const step = (a, b, x) => smooth(Math.min(1, Math.max(0, (x - a) / (b - a))));
  const VEYMONT = [0.3, 0.16], AIGUILLE = [0.72, -0.28];
  function height(x, z) {
    const edge = 0.42 + Math.sin(z * 3.1) * 0.05 + (noise(z * 4 + 9, 3) - 0.5) * 0.08;   // la ligne de falaise, sinueuse
    const plateau = 0.3 + x * 0.16 + (fbm(x * 3 + 5, z * 3 + 2) - 0.47) * 0.2;            // les Hauts Plateaux, inclinés vers l'ouest
    const crest = Math.exp(-Math.pow((x - edge + 0.06) / 0.09, 2)) * 0.13;                // la crête qui borde le vide
    const veymont = Math.exp(-(Math.pow((x - VEYMONT[0]) / 0.1, 2) + Math.pow((z - VEYMONT[1]) / 0.2, 2))) * 0.22;
    const valley = 0.04 + (fbm(x * 4 + 1, z * 4 + 7) - 0.5) * 0.07;                       // le Trièves, en contrebas
    let h = plateau + crest + veymont;
    h = h + (valley - h) * step(edge, edge + 0.045, x);                                    // la falaise : presque verticale
    // Les gorges de la Bourne : une entaille qui serpente dans le plateau.
    const gorge = Math.abs(z - (-0.55 + Math.sin(x * 4.2) * 0.12));
    if (x < edge - 0.1) h -= Math.exp(-Math.pow(gorge / 0.035, 2)) * 0.2 * step(-0.95, -0.65, x) * (1 - step(0.05, 0.3, x));
    // Le Mont Aiguille : une table de calcaire posée seule devant la falaise.
    const dx = (x - AIGUILLE[0]) / 0.07, dz = (z - AIGUILLE[1]) / 0.13, d = Math.sqrt(dx * dx + dz * dz);
    h = Math.max(h, 0.56 * (1 - step(0.82, 1.0, d)) + (1 - step(0.82, 1.0, d)) * (noise(x * 30, z * 30) - 0.5) * 0.03 + valley * step(0.82, 1.0, d));
    return h * (1 - step(0.92, 1.0, Math.max(Math.abs(x), Math.abs(z))) * 0.5);
  }

  const UP = 2.1; // le relief est exagéré, comme sur une maquette
  const N = window.innerWidth < 860 ? 140 : 210, P = [], Rn = [];
  const put = (x, y, z, slope) => { P.push(x * 2.4, y * UP, z * 2.4); Rn.push(Math.random(), Math.random(), slope); };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = (i + Math.random()) / N * 2 - 1, z = (j + Math.random()) / N * 2 - 1, h = height(x, z), d = 2 / N;
    const hx = height(x + d, z), hz = height(x, z + d);
    put(x, h, z, Math.min(1, Math.hypot(hx - h, hz - h) * 9));
    // Une grille vue du dessus laisse les parois vides : on les remplit point par point, de haut en bas.
    for (const [x2, z2, h2] of [[x + d, z, hx], [x, z + d, hz]]) {
      const drop = Math.abs(h2 - h);
      if (drop < 0.03) continue;
      for (let n = Math.min(40, Math.round(drop * UP / 0.018)); n > 0; n--) { const t = Math.random(); put(x + (x2 - x) * t, h + (h2 - h) * t, z + (z2 - z) * t, 1); }
    }
  }
  const COUNT = P.length / 3, pos = new Float32Array(P), rnd = new Float32Array(Rn);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 3));
  const uniforms = { uSize: { value: 10 }, uTime: { value: 0 }, uIn: { value: 0 } };
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `
      attribute vec3 aRand; uniform float uSize, uTime, uIn; varying float vLine; varying float vSlope; varying float vFade;
      void main() {
        vec3 p = position;
        float rise = smoothstep(0.0, 1.0, clamp(uIn * 1.6 - aRand.x * 0.6, 0.0, 1.0));   // le relief sort du papier
        p.y *= rise;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        // Les courbes de niveau, comme sur une carte de randonnée.
        vLine = 1.0 - smoothstep(0.0, 0.1, abs(fract(position.y * 5.0) - 0.5) * 2.0 - 0.86 + 0.86 * step(0.5, fract(position.y * 5.0)) * 0.0);
        vLine = step(0.9, fract(position.y * 5.0));
        vSlope = aRand.z;
        gl_PointSize = uSize * (0.6 + aRand.y * 0.5 + aRand.z * 0.45 + vLine * 0.3) / -mv.z;
        vFade = smoothstep(-14.0, -4.0, mv.z);
      }`,
    fragmentShader: `
      varying float vLine; varying float vSlope; varying float vFade;
      void main() {
        float a = smoothstep(0.5, 0.3, length(gl_PointCoord - 0.5));
        vec3 ink = mix(vec3(0.063, 0.082, 0.122), vec3(0.0, 0.48, 0.97), vLine * (1.0 - vSlope));
        gl_FragColor = vec4(ink, a * (0.3 + 0.7 * vFade) * (0.34 + 0.45 * vLine + 0.66 * vSlope));
      }`,
  }));
  const scene = new THREE.Scene(), rig = new THREE.Group();
  rig.add(points); scene.add(rig);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

  /* ---------- Étiquettes : des points du relief suivis à l'écran ---------- */
  const labels = [...stage.querySelectorAll('[data-at]')].map((el) => {
    const [x, z] = el.dataset.at.split(',').map(Number);
    return { el, v: new THREE.Vector3(x * 2.4, height(x, z) * UP + 0.1, z * 2.4) };
  });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    uniforms.uSize.value = (w < 700 ? 11 : 9) * renderer.getPixelRatio() * (h / 600);
  }
  new ResizeObserver(resize).observe(stage); resize();

  // On tourne autour en glissant ; sinon le relief pivote lentement tout seul.
  let yaw = 1.05, pitch = 0.42, drag = null, auto = true, visible = true;
  stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; auto = false; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    yaw = drag.yaw + (e.clientX - drag.x) * 0.006;
    pitch = Math.min(1.2, Math.max(0.12, drag.pitch + (e.clientY - drag.y) * 0.004));
  });
  stage.addEventListener('pointerup', () => { drag = null; });
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(stage);

  const clock = new THREE.Clock(), tmp = new THREE.Vector3();
  (function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    if (auto && !reduced) yaw += 0.0016;
    uniforms.uTime.value = reduced ? 0 : t;
    uniforms.uIn.value = reduced ? 1 : Math.min(1, t / 2.6);
    const dist = camera.aspect < 0.9 ? 10.5 : 7.2;
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist + 0.2, Math.cos(yaw) * Math.cos(pitch) * dist);
    camera.lookAt(0, 0.45, 0);
    renderer.render(scene, camera);
    const w = stage.clientWidth, h = stage.clientHeight;
    for (const l of labels) {
      tmp.copy(l.v).project(camera);
      l.el.style.transform = `translate(${((tmp.x + 1) / 2 * w).toFixed(1)}px, ${((1 - tmp.y) / 2 * h).toFixed(1)}px) translate(-50%, -100%)`;
      l.el.style.opacity = tmp.z < 1 && uniforms.uIn.value > 0.8 ? 1 : 0;
    }
  })();
}
