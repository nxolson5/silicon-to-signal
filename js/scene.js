// ============================================================
// scene.js — persistent Three.js stage
// Seven procedurally built era artifacts share one scene and
// crossfade as the story scrolls. No external models/textures.
// ============================================================

import * as THREE from "three";

const ACCENT_FLAG = "isAccent";

let renderer, scene, camera, clock;
let starfield, glowSprite, accentLight;
let artifacts = {};
let activeName = null;
let accentColor = new THREE.Color("#00ff9d");
let wireframe = false;
let drift = 0;                       // 0..1 scroll progress → camera orbit
const pointer = { x: 0, y: 0 };

// ---- material helpers --------------------------------------

function accentMat(opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: 0x0a0d10,
    emissive: accentColor.clone(),
    emissiveIntensity: opts.glow ?? 1.4,
    roughness: 0.35,
    metalness: 0.6,
    transparent: true,
    ...opts.params,
  });
  m.userData[ACCENT_FLAG] = true;
  m.userData.baseOpacity = opts.opacity ?? 1;
  m.opacity = 0;
  return m;
}

function bodyMat(opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: opts.color ?? 0x12161b,
    roughness: opts.roughness ?? 0.45,
    metalness: opts.metalness ?? 0.7,
    transparent: true,
    ...opts.params,
  });
  m.userData.baseOpacity = opts.opacity ?? 1;
  m.opacity = 0;
  return m;
}

function accentLineMat(opacity = 0.85) {
  const m = new THREE.LineBasicMaterial({ color: accentColor.clone(), transparent: true });
  m.userData[ACCENT_FLAG] = true;
  m.userData.baseOpacity = opacity;
  m.opacity = 0;
  return m;
}

function accentPointsMat(size = 0.045, opacity = 0.9) {
  const m = new THREE.PointsMaterial({
    color: accentColor.clone(), size, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  m.userData[ACCENT_FLAG] = true;
  m.userData.baseOpacity = opacity;
  m.opacity = 0;
  return m;
}

function eachMaterial(root, fn) {
  root.traverse((o) => {
    if (!o.material) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(fn);
  });
}

// ---- artifacts ---------------------------------------------

function buildVacuumTube() {
  const g = new THREE.Group();

  const glass = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.55, 1.1, 12, 24),
    bodyMat({ color: 0x1a2128, roughness: 0.08, metalness: 0.1, opacity: 0.28 })
  );
  glass.position.y = 0.45;
  g.add(glass);

  // filament — glowing helix inside the envelope
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    pts.push(new THREE.Vector3(
      Math.cos(t * Math.PI * 10) * 0.16,
      -0.15 + t * 1.25,
      Math.sin(t * Math.PI * 10) * 0.16
    ));
  }
  const filament = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.018, 6),
    accentMat({ glow: 2.4 })
  );
  g.add(filament);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.46, 0.42, 24),
    bodyMat({ color: 0x0d0f12, metalness: 0.85 })
  );
  base.position.y = -0.75;
  g.add(base);

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.3, 6),
      bodyMat({ color: 0x3a4148, metalness: 1, roughness: 0.25 })
    );
    pin.position.set(Math.cos(a) * 0.24, -1.05, Math.sin(a) * 0.24);
    g.add(pin);
  }

  g.userData.update = (t, group) => {
    filament.material.emissiveIntensity = 2.0 + Math.sin(t * 7) * 0.5 + Math.sin(t * 23) * 0.2;
    group.rotation.y = t * 0.25;
  };
  return g;
}

function buildTransistor() {
  const g = new THREE.Group();

  const can = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.7, 32),
    bodyMat({ color: 0x262d34, metalness: 0.95, roughness: 0.3 })
  );
  can.position.y = 0.35;
  g.add(can);

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    bodyMat({ color: 0x262d34, metalness: 0.95, roughness: 0.3 })
  );
  cap.position.y = 0.7;
  g.add(cap);

  const flange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.07, 32),
    bodyMat({ color: 0x171c21, metalness: 0.9 })
  );
  g.add(flange);

  // junction window — the germanium crystal glows through
  const crystal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.22, 1),
    accentMat({ glow: 2.0 })
  );
  crystal.position.y = 0.42;
  g.add(crystal);

  const legNames = [-0.3, 0, 0.3];
  legNames.forEach((x, i) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8),
      bodyMat({ color: 0x3a4148, metalness: 1, roughness: 0.2 })
    );
    leg.position.set(x, -0.6, i === 1 ? 0.08 : -0.08);
    g.add(leg);
  });

  g.userData.update = (t, group) => {
    crystal.rotation.y = t * 0.9;
    crystal.rotation.x = t * 0.4;
    group.rotation.y = Math.sin(t * 0.3) * 0.6;
  };
  return g;
}

function buildChip() {
  const g = new THREE.Group();

  const pkg = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.16, 1.5),
    bodyMat({ color: 0x0e1115, roughness: 0.5, metalness: 0.3 })
  );
  g.add(pkg);

  const die = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.05, 0.55),
    accentMat({ glow: 1.8 })
  );
  die.position.y = 0.1;
  g.add(die);

  // circuit traces radiating from the die
  const traceMat = accentLineMat(0.6);
  const traces = new THREE.Group();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const r1 = 0.32, r2 = 0.62 + Math.random() * 0.1;
    const x1 = Math.cos(a) * r1, z1 = Math.sin(a) * r1;
    // manhattan-style elbow
    const xm = Math.cos(a) * (r1 + (r2 - r1) * 0.5), zm = Math.sin(a) * r1;
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, 0.085, z1),
      new THREE.Vector3(xm, 0.085, zm),
      new THREE.Vector3(Math.cos(a) * r2, 0.085, Math.sin(a) * r2),
    ]);
    traces.add(new THREE.Line(geo, traceMat));
  }
  g.add(traces);

  // gold pins on all four edges
  const pinMat = bodyMat({ color: 0x8a7340, metalness: 1, roughness: 0.25 });
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < 12; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.16), pinMat);
      const off = -0.66 + (i / 11) * 1.32;
      if (s === 0) pin.position.set(off, 0, 0.83);
      if (s === 1) pin.position.set(off, 0, -0.83);
      if (s === 2) { pin.position.set(0.83, 0, off); pin.rotation.y = Math.PI / 2; }
      if (s === 3) { pin.position.set(-0.83, 0, off); pin.rotation.y = Math.PI / 2; }
      g.add(pin);
    }
  }

  g.rotation.x = 0.5;
  g.userData.update = (t, group) => {
    die.material.emissiveIntensity = 1.5 + Math.sin(t * 3) * 0.45;
    group.rotation.y = t * 0.35;
  };
  return g;
}

function buildPC() {
  const g = new THREE.Group();

  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 1.3, 1.1),
    bodyMat({ color: 0x20242a, roughness: 0.6, metalness: 0.2 })
  );
  shell.position.y = 0.45;
  g.add(shell);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.95),
    accentMat({ glow: 1.1, params: { roughness: 0.9, metalness: 0 } })
  );
  screen.position.set(0, 0.48, 0.56);
  g.add(screen);

  // scanline texture feel: thin dark bars over the screen
  const barMat = bodyMat({ color: 0x000000, opacity: 0.35, roughness: 1, metalness: 0 });
  for (let i = 0; i < 9; i++) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.012), barMat);
    bar.position.set(0, 0.1 + i * 0.095, 0.565);
    g.add(bar);
  }

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.18, 1.4),
    bodyMat({ color: 0x191d22, roughness: 0.6 })
  );
  base.position.y = -0.5;
  g.add(base);

  const kb = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.1, 0.55),
    bodyMat({ color: 0x23282e, roughness: 0.7 })
  );
  kb.position.set(0, -0.36, 0.35);
  kb.rotation.x = -0.08;
  g.add(kb);

  g.userData.update = (t, group) => {
    screen.material.emissiveIntensity = 1.0 + Math.sin(t * 1.7) * 0.18 + Math.sin(t * 31) * 0.05;
    group.rotation.y = Math.sin(t * 0.28) * 0.45;
  };
  return g;
}

function arcBetween(a, b, lift = 1.45) {
  const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(lift);
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

function buildGlobe() {
  const g = new THREE.Group();
  const R = 1.15;

  const sphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(R, 3),
    new THREE.MeshBasicMaterial({
      color: 0x18222b, wireframe: true, transparent: true,
    })
  );
  sphere.material.userData.baseOpacity = 0.5;
  sphere.material.userData.lockWireframe = true;
  sphere.material.opacity = 0;
  g.add(sphere);

  // surface nodes + great-circle arcs between random pairs
  const nodes = [];
  for (let i = 0; i < 18; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(R);
    nodes.push(v);
  }
  const nodeGeo = new THREE.BufferGeometry().setFromPoints(nodes);
  g.add(new THREE.Points(nodeGeo, accentPointsMat(0.07)));

  const arcMat = accentLineMat(0.4);
  const packets = [];
  const packetMat = accentMat({ glow: 3.2 });
  for (let i = 0; i < 12; i++) {
    const a = nodes[Math.floor(Math.random() * nodes.length)];
    let b = nodes[Math.floor(Math.random() * nodes.length)];
    if (a.equals(b)) b = nodes[(nodes.indexOf(a) + 5) % nodes.length];
    const curve = arcBetween(a, b, R * 1.35);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
    g.add(new THREE.Line(geo, arcMat));

    const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), packetMat);
    p.userData.curve = curve;
    p.userData.phase = Math.random();
    p.userData.speed = 0.25 + Math.random() * 0.35;
    packets.push(p);
    g.add(p);
  }

  g.userData.update = (t, group) => {
    group.rotation.y = t * 0.12;
    packets.forEach((p) => {
      const u = (t * p.userData.speed + p.userData.phase) % 1;
      p.userData.curve.getPoint(u, p.position);
      p.scale.setScalar(0.7 + Math.sin(u * Math.PI) * 0.8);
    });
  };
  return g;
}

function buildRack() {
  const g = new THREE.Group();

  const ledMats = [];
  for (let r = -1; r <= 1; r++) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 2.3, 0.7),
      bodyMat({ color: 0x10141a, roughness: 0.5, metalness: 0.6 })
    );
    frame.position.x = r * 1.05;
    g.add(frame);

    for (let i = 0; i < 9; i++) {
      const unit = new THREE.Mesh(
        new THREE.BoxGeometry(0.74, 0.16, 0.04),
        bodyMat({ color: 0x1c2127, metalness: 0.8, roughness: 0.35 })
      );
      unit.position.set(r * 1.05, -1.0 + i * 0.25, 0.36);
      g.add(unit);

      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.05, 0.02),
        accentMat({ glow: 2.2 })
      );
      led.position.set(r * 1.05 + 0.28, -1.0 + i * 0.25, 0.385);
      led.userData.seed = Math.random() * 100;
      ledMats.push(led);
      g.add(led);
    }
  }

  g.userData.update = (t, group) => {
    group.rotation.y = Math.sin(t * 0.22) * 0.5 - 0.2;
    // blinkenlights — each LED flickers on its own clock
    ledMats.forEach((led) => {
      const s = led.userData.seed;
      led.visible = Math.sin(t * (3 + (s % 5)) + s) > -0.55;
    });
  };
  return g;
}

function buildCore() {
  const g = new THREE.Group();

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.62, 0.18, 160, 24),
    accentMat({ glow: 1.3, params: { roughness: 0.2, metalness: 0.85 } })
  );
  g.add(knot);

  // neural halo — orbiting point cloud
  const N = 900;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(1.5 + Math.random() * 0.6);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const haloGeo = new THREE.BufferGeometry();
  haloGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const halo = new THREE.Points(haloGeo, accentPointsMat(0.022, 0.7));
  g.add(halo);

  const ringMat = accentLineMat(0.5);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        new THREE.EllipseCurve(0, 0, 1.3 + i * 0.25, 1.3 + i * 0.25).getPoints(90)
      ),
      ringMat
    );
    ring.rotation.x = Math.PI / 2 + (i - 1) * 0.5;
    ring.rotation.y = i * 0.8;
    g.add(ring);
  }

  g.userData.update = (t, group) => {
    knot.rotation.x = t * 0.3;
    knot.rotation.y = t * 0.45;
    halo.rotation.y = -t * 0.08;
    group.rotation.z = Math.sin(t * 0.15) * 0.1;
  };
  return g;
}

// ---- starfield & glow ---------------------------------------

function buildStarfield() {
  const N = 1400;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(14 + Math.random() * 26);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x5a6b7a, size: 0.05, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.12)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// ---- public API ---------------------------------------------

export function initScene(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050608, 0.028);

  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.2, 6);

  scene.add(new THREE.AmbientLight(0x404a55, 0.9));
  const key = new THREE.DirectionalLight(0xbfd4e8, 1.1);
  key.position.set(3, 4, 5);
  scene.add(key);
  accentLight = new THREE.PointLight(accentColor.clone(), 14, 18);
  accentLight.position.set(0, 0.5, 2.2);
  scene.add(accentLight);

  starfield = buildStarfield();
  scene.add(starfield);

  glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(), color: accentColor.clone(),
    transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glowSprite.scale.setScalar(7);
  glowSprite.position.z = -1.5;
  scene.add(glowSprite);

  artifacts = {
    tube: buildVacuumTube(),
    transistor: buildTransistor(),
    chip: buildChip(),
    pc: buildPC(),
    globe: buildGlobe(),
    rack: buildRack(),
    core: buildCore(),
  };
  Object.values(artifacts).forEach((g) => {
    g.visible = false;
    g.scale.setScalar(0.85);
    scene.add(g);
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  clock = new THREE.Clock();
  renderer.setAnimationLoop(tick);

  return { showArtifact, setAccent, setWireframe, setDrift };
}

function tick() {
  const t = clock.getElapsedTime();
  Object.values(artifacts).forEach((g) => {
    if (g.visible && g.userData.update) g.userData.update(t, g);
  });
  starfield.rotation.y = t * 0.008 + drift * 1.2;

  // mouse parallax + scroll drift
  camera.position.x += (pointer.x * 0.45 - camera.position.x) * 0.04;
  camera.position.y += (-pointer.y * 0.3 + 0.2 + Math.sin(drift * Math.PI) * 0.3 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

export function showArtifact(name, side = 0) {
  const targetX = side * 1.5;
  const next = artifacts[name];
  if (!next) return;

  if (activeName === name) {
    gsap.to(next.position, { x: targetX, duration: 1.2, ease: "power2.inOut" });
    return;
  }

  const prev = artifacts[activeName];
  activeName = name;

  if (prev) {
    eachMaterial(prev, (m) =>
      gsap.to(m, { opacity: 0, duration: 0.55, ease: "power2.in" })
    );
    gsap.to(prev.scale, {
      x: 0.7, y: 0.7, z: 0.7, duration: 0.55, ease: "power2.in",
      onComplete: () => (prev.visible = false),
    });
  }

  next.visible = true;
  next.position.x = targetX;
  eachMaterial(next, (m) =>
    gsap.to(m, {
      opacity: m.userData.baseOpacity ?? 1,
      duration: 0.9, delay: 0.25, ease: "power2.out",
    })
  );
  gsap.fromTo(next.scale,
    { x: 0.7, y: 0.7, z: 0.7 },
    { x: 1, y: 1, z: 1, duration: 1.1, delay: 0.2, ease: "power3.out" }
  );
  gsap.to(glowSprite.position, { x: targetX, duration: 1.2, ease: "power2.inOut" });
  gsap.to(accentLight.position, { x: targetX, duration: 1.2, ease: "power2.inOut" });
}

export function setAccent(hex) {
  accentColor.set(hex);
  Object.values(artifacts).forEach((g) =>
    eachMaterial(g, (m) => {
      if (!m.userData[ACCENT_FLAG]) return;
      if (m.emissive) gsap.to(m.emissive, { r: accentColor.r, g: accentColor.g, b: accentColor.b, duration: 0.6 });
      else gsap.to(m.color, { r: accentColor.r, g: accentColor.g, b: accentColor.b, duration: 0.6 });
    })
  );
  gsap.to(accentLight.color, { r: accentColor.r, g: accentColor.g, b: accentColor.b, duration: 0.6 });
  gsap.to(glowSprite.material.color, { r: accentColor.r, g: accentColor.g, b: accentColor.b, duration: 0.6 });
}

export function setWireframe(on) {
  wireframe = on;
  Object.values(artifacts).forEach((g) =>
    eachMaterial(g, (m) => {
      if (m.userData.lockWireframe) return;
      if ("wireframe" in m && !(m instanceof THREE.PointsMaterial)) m.wireframe = on;
    })
  );
}

export function setDrift(p) {
  drift = p;
}
