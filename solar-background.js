
(function () {
  "use strict";
  if (typeof THREE === "undefined") { console.warn("solar-background: Three.js not loaded"); return; }

  var CYCLE_MS = 10 * 1000; // har 5 minute mein naya planet
  var START_INDEX = 5;          // 5 = Saturn pehle
  var FIT = 1.15;               // bada number = planet door (chhota) dikhega

  /* ---------- noise (seamless) ---------- */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(ix, iy, s) { var h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(s, 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h = h ^ (h >>> 16); return (h >>> 0) / 4294967295; }
  function vnoise(x, y, px, s) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    var x0 = ((ix % px) + px) % px, x1 = (x0 + 1) % px;
    var a = hash(x0, iy, s), b = hash(x1, iy, s), c = hash(x0, iy + 1, s), d = hash(x1, iy + 1, s);
    var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, px, oct, s) {
    var sum = 0, amp = 0.5, tot = 0;
    for (var i = 0; i < oct; i++) { sum += amp * vnoise(x, y, px, s + i * 17); tot += amp; x *= 2; y *= 2; px *= 2; amp *= 0.5; }
    return sum / tot;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rampInto(stops, t, out) {
    t = clamp(t, 0, 1);
    for (var i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        var a = stops[i - 1], b = stops[i], k = (t - a[0]) / ((b[0] - a[0]) || 1);
        k = k * k * (3 - 2 * k);
        out[0] = a[1][0] + (b[1][0] - a[1][0]) * k; out[1] = a[1][1] + (b[1][1] - a[1][1]) * k; out[2] = a[1][2] + (b[1][2] - a[1][2]) * k;
        return;
      }
    }
    var l = stops[stops.length - 1][1]; out[0] = l[0]; out[1] = l[1]; out[2] = l[2];
  }
  function makeCanvas(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function toTex(canvas) { var t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

  /* ---------- procedural textures ---------- */
  function bandedCanvas(o) {
    var W = 768, H = 384, c = makeCanvas(W, H), ctx = c.getContext("2d");
    var img = ctx.createImageData(W, H), d = img.data, col = [0, 0, 0];
    for (var y = 0; y < H; y++) {
      var lat = y / H;
      for (var x = 0; x < W; x++) {
        var u = x / W;
        var w1 = fbm(u * 5, lat * 9, 5, 3, o.seed) - 0.5;
        rampInto(o.stops, lat + w1 * o.warp, col);
        var k = 1 + (fbm(u * 14, lat * 70, 14, 3, o.seed + 31) - 0.5) * o.detail;
        var i = (y * W + x) * 4;
        d[i] = clamp(col[0] * k, 0, 255); d[i + 1] = clamp(col[1] * k, 0, 255); d[i + 2] = clamp(col[2] * k, 0, 255); d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (o.spot) {
      ctx.save(); ctx.translate(o.spot.x * W, o.spot.y * H); ctx.scale(o.spot.sx, 1);
      var r = o.spot.r * H, g = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
      g.addColorStop(0, o.spot.c0); g.addColorStop(0.55, o.spot.c1); g.addColorStop(1, o.spot.c2);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    return c;
  }

  function rockyCanvas(o) {
    var W = o.w || 768, H = o.h || 384, c = makeCanvas(W, H), ctx = c.getContext("2d");
    var img = ctx.createImageData(W, H), d = img.data, rnd = mulberry32(o.seed);
    for (var y = 0; y < H; y++) {
      var lat = y / H, pole = o.poles ? clamp((0.09 - Math.min(lat, 1 - lat)) / 0.05, 0, 1) : 0;
      for (var x = 0; x < W; x++) {
        var u = x / W;
        var n = clamp((fbm(u * 6, lat * 3, 6, 4, o.seed) - 0.3) * 1.8, 0, 1);
        var f = 0.82 + 0.36 * fbm(u * 40, lat * 20, 40, 3, o.seed + 9);
        var r = (o.dark[0] + (o.base[0] - o.dark[0]) * n) * f, g = (o.dark[1] + (o.base[1] - o.dark[1]) * n) * f, b = (o.dark[2] + (o.base[2] - o.dark[2]) * n) * f;
        if (pole > 0) { r += (240 - r) * pole; g += (240 - g) * pole; b += (245 - b) * pole; }
        var i = (y * W + x) * 4; d[i] = clamp(r, 0, 255); d[i + 1] = clamp(g, 0, 255); d[i + 2] = clamp(b, 0, 255); d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    for (var k = 0; k < o.craters; k++) {
      var cx = rnd() * W, cy = rnd() * H, rr = 2 + Math.pow(rnd(), 3) * (o.maxCrater || 26);
      var sx = 1 / Math.max(0.25, Math.sin(Math.PI * cy / H));
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, 1);
      var gr = ctx.createRadialGradient(0, 0, rr * 0.2, 0, 0, rr);
      gr.addColorStop(0, "rgba(0,0,0,0.38)"); gr.addColorStop(0.8, "rgba(0,0,0,0.16)");
      gr.addColorStop(0.92, "rgba(255,255,255,0.28)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rr, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    return c;
  }

  function earthCanvases() {
    var W = 768, H = 384, c = makeCanvas(W, H), ctx = c.getContext("2d"), img = ctx.createImageData(W, H), d = img.data;
    var cc = makeCanvas(W, H), cctx = cc.getContext("2d"), cimg = cctx.createImageData(W, H), cd = cimg.data;
    for (var y = 0; y < H; y++) {
      var lat = y / H, polar = clamp((0.1 - Math.min(lat, 1 - lat)) / 0.04, 0, 1);
      for (var x = 0; x < W; x++) {
        var u = x / W, h = fbm(u * 4, lat * 3, 4, 6, 11), r, g, b;
        if (h < 0.52) { var dp = clamp((0.52 - h) / 0.16, 0, 1); r = 34 - 26 * dp; g = 100 - 66 * dp; b = 172 - 80 * dp; }
        else {
          var e = clamp((h - 0.52) / 0.16, 0, 1), m = fbm(u * 8, lat * 6, 8, 3, 23);
          if (m < 0.46) { r = 178; g = 150; b = 100; } else { r = 58; g = 114; b = 54; }
          if (e > 0.55) { var q = (e - 0.55) / 0.45; r += (130 - r) * q; g += (112 - g) * q; b += (96 - b) * q; }
          if (e > 0.92) { r = 235; g = 238; b = 240; }
        }
        r += (244 - r) * polar; g += (246 - g) * polar; b += (250 - b) * polar;
        var i = (y * W + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
        var a = clamp((fbm(u * 6, lat * 4, 6, 5, 41) - 0.47) * 4, 0, 1);
        cd[i] = 255; cd[i + 1] = 255; cd[i + 2] = 255; cd[i + 3] = a * 235;
      }
    }
    ctx.putImageData(img, 0, 0); cctx.putImageData(cimg, 0, 0);
    return { surface: c, clouds: cc };
  }

  function ringCanvas(kind) {
    var W = 1024, H = 4, c = makeCanvas(W, H), ctx = c.getContext("2d"), img = ctx.createImageData(W, H), d = img.data;
    for (var x = 0; x < W; x++) {
      var t = x / (W - 1), a, tone, rl = 0.7 + 0.6 * (0.6 * vnoise(t * 140, 3.1, 100000, 7) + 0.4 * vnoise(t * 520, 1.3, 100000, 9));
      if (kind === "saturn") {
        if (t < 0.28) { a = 0.2 * rl; tone = 0.55; }
        else if (t < 0.69) { a = Math.min(1, 0.9 * rl); tone = 1.0; }
        else if (t < 0.77) { a = 0.05; tone = 0.7; }
        else { a = 0.66 * rl; tone = 0.85; if (t > 0.935 && t < 0.946) a = 0.04; }
        a *= clamp(t / 0.03, 0, 1) * clamp((1 - t) / 0.02, 0, 1);
      } else {
        a = 0; tone = 0.55;
        [0.08, 0.2, 0.34, 0.5, 0.66, 0.82, 0.95].forEach(function (p) { if (Math.abs(t - p) < 0.012) a = 0.38; });
      }
      var col = [236 * tone, 220 * tone, 188 * tone];
      for (var y = 0; y < H; y++) { var i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = clamp(a, 0, 1) * 255; }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  function glowCanvas() {
    var c = makeCanvas(256, 256), ctx = c.getContext("2d"), g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,0.35)"); g.addColorStop(0.7, "rgba(255,255,255,0.08)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    return c;
  }

  /* ---------- planet data ---------- */
  var STOPS = {
    jupiter: [[0, [183, 160, 128]], [0.12, [205, 170, 130]], [0.2, [150, 110, 80]], [0.28, [226, 200, 165]], [0.38, [176, 125, 90]], [0.46, [232, 214, 184]], [0.54, [190, 140, 100]], [0.62, [225, 200, 170]], [0.72, [160, 115, 85]], [0.82, [214, 188, 156]], [0.92, [170, 150, 125]], [1, [150, 135, 115]]],
    saturn: [[0, [160, 150, 120]], [0.15, [198, 176, 130]], [0.3, [224, 203, 152]], [0.42, [205, 180, 130]], [0.5, [236, 218, 170]], [0.62, [210, 188, 140]], [0.75, [226, 205, 158]], [0.88, [190, 170, 125]], [1, [150, 140, 115]]],
    uranus: [[0, [150, 215, 222]], [0.5, [170, 230, 234]], [1, [150, 215, 222]]],
    neptune: [[0, [50, 80, 200]], [0.3, [62, 104, 228]], [0.5, [45, 80, 205]], [0.7, [66, 108, 232]], [1, [45, 75, 190]]],
    venus: [[0, [222, 190, 128]], [0.5, [242, 218, 165]], [1, [222, 190, 128]]]
  };

  var PLANETS = [
    { name: "Mercury", size: 2.2, fit: 4.2, tilt: 0.03, spin: 0.05, moons: [], tex: function () { return { map: rockyCanvas({ base: [150, 144, 138], dark: [78, 74, 70], seed: 3, craters: 220, maxCrater: 22 }), bump: true }; } },
    { name: "Venus", size: 3.0, fit: 3.5, tilt: 0.05, spin: 0.03, glow: [255, 205, 130], moons: [], tex: function () { return { map: bandedCanvas({ stops: STOPS.venus, warp: 0.12, detail: 0.2, seed: 5 }) }; } },
    { name: "Earth", size: 3.1, fit: 3.5, tilt: 0.41, spin: 0.08, glow: [90, 150, 255], clouds: true, moons: [{ d: 2.2, s: 0.27, v: 0.12, c: 0xffffff }], tex: function () { return { earth: earthCanvases() }; } },
    { name: "Mars", size: 2.5, fit: 3.8, tilt: 0.44, spin: 0.07, glow: [255, 150, 100], moons: [{ d: 1.9, s: 0.07, v: 0.25, c: 0xbbb0a5 }, { d: 2.4, s: 0.05, v: 0.18, c: 0xaaa095 }], tex: function () { return { map: rockyCanvas({ base: [186, 100, 60], dark: [105, 56, 38], seed: 8, craters: 90, maxCrater: 20, poles: true }), bump: true }; } },
    { name: "Jupiter", size: 5.5, fit: 2.6, tilt: 0.05, spin: 0.12, glow: [235, 195, 150], moons: [{ d: 1.6, s: 0.075, v: 0.2, c: 0xffe08a }, { d: 1.85, s: 0.065, v: 0.15, c: 0xe8e0d0 }, { d: 2.15, s: 0.11, v: 0.11, c: 0xb8a898 }, { d: 2.5, s: 0.1, v: 0.08, c: 0x8a7e72 }], tex: function () { return { map: bandedCanvas({ stops: STOPS.jupiter, warp: 0.07, detail: 0.35, seed: 13, spot: { x: 0.62, y: 0.62, sx: 2.1, r: 0.035, c0: "rgba(170,70,50,0.95)", c1: "rgba(200,110,80,0.8)", c2: "rgba(200,110,80,0)" } }) }; } },
    { name: "Saturn", size: 4.0, fit: 2.9, tilt: 0.47, tiltX: 0.2, spin: 0.1, glow: [235, 215, 160], ring: { i: 1.24, o: 2.27, kind: "saturn" }, moons: [{ d: 2.55, s: 0.05, v: 0.2, c: 0xffffff }, { d: 2.85, s: 0.06, v: 0.16, c: 0xeeeeee }, { d: 3.15, s: 0.075, v: 0.12, c: 0xdddddd }, { d: 3.5, s: 0.12, v: 0.09, c: 0xd9a85a }], tex: function () { return { map: bandedCanvas({ stops: STOPS.saturn, warp: 0.02, detail: 0.1, seed: 17 }) }; } },
    { name: "Uranus", size: 3.5, fit: 3.2, tilt: 1.71, spin: 0.06, glow: [150, 225, 230], ring: { i: 1.55, o: 2.0, kind: "uranus" }, moons: [{ d: 2.0, s: 0.06, v: 0.2, c: 0xcccccc }, { d: 2.4, s: 0.07, v: 0.15, c: 0xbbbbbb }, { d: 2.8, s: 0.08, v: 0.1, c: 0xaaaaaa }], tex: function () { return { map: bandedCanvas({ stops: STOPS.uranus, warp: 0.01, detail: 0.05, seed: 19 }) }; } },
    { name: "Neptune", size: 3.4, fit: 3.3, tilt: 0.49, spin: 0.08, glow: [70, 110, 255], moons: [{ d: 2.2, s: 0.1, v: 0.14, c: 0xd8d8e0 }, { d: 2.7, s: 0.05, v: 0.2, c: 0xbbbbbb }], tex: function () { return { map: bandedCanvas({ stops: STOPS.neptune, warp: 0.05, detail: 0.25, seed: 23, spot: { x: 0.4, y: 0.45, sx: 1.8, r: 0.04, c0: "rgba(15,25,90,0.9)", c1: "rgba(25,45,140,0.6)", c2: "rgba(30,50,150,0)" } }) }; } }
  ];

  /* ---------- scene ---------- */
  var scene, camera, renderer, sun, container, glowTex, moonTex;
  var current = null, index = START_INDEX % PLANETS.length;
  var phase = "in", phaseT = 0, clockT = 0, last = 0, camDist = 40;
  var TAN = Math.tan(22.5 * Math.PI / 180);

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function getMoonTex() {
    if (!moonTex) moonTex = toTex(rockyCanvas({ base: [158, 156, 152], dark: [74, 72, 70], seed: 29, craters: 90, maxCrater: 16, w: 512, h: 256 }));
    return moonTex;
  }

  function disposeObject(o) {
    o.traverse(function (n) {
      if (n.geometry) n.geometry.dispose();
      if (n.material) {
        var ms = Array.isArray(n.material) ? n.material : [n.material];
        ms.forEach(function (m) { ["map", "bumpMap"].forEach(function (k) { if (m[k]) m[k].dispose(); }); m.dispose(); });
      }
    });
  }

  function buildPlanet(i) {
    var P = PLANETS[i], R = P.size;
    var holder = new THREE.Group(), root = new THREE.Group();
    root.rotation.z = P.tilt; root.rotation.x = P.tiltX || 0;
    holder.add(root);

    var t = P.tex(), mat, clouds = null;
    if (t.earth) {
      mat = new THREE.MeshStandardMaterial({ map: toTex(t.earth.surface), roughness: 0.85, metalness: 0 });
    } else {
      var map = toTex(t.map);
      mat = new THREE.MeshStandardMaterial({ map: map, roughness: 0.95, metalness: 0 });
      if (t.bump) { mat.bumpMap = map; mat.bumpScale = 1.0; }
    }
    var planet = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 96), mat);
    planet.castShadow = true; planet.receiveShadow = true;
    root.add(planet);

    if (t.earth) {
      clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 96, 96),
        new THREE.MeshStandardMaterial({ map: toTex(t.earth.clouds), transparent: true, depthWrite: false, roughness: 1, metalness: 0 }));
      root.add(clouds);
    }

    if (P.ring) {
      var inner = R * P.ring.i, outer = R * P.ring.o;
      var rg = new THREE.RingGeometry(inner, outer, 160, 1), pos = rg.attributes.position, uv = rg.attributes.uv, v = new THREE.Vector3();
      for (var k = 0; k < pos.count; k++) { v.fromBufferAttribute(pos, k); uv.setXY(k, (v.length() - inner) / (outer - inner), 0.5); }
      var ring = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: toTex(ringCanvas(P.ring.kind)), transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, roughness: 1, metalness: 0, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.castShadow = true; ring.receiveShadow = true;
      root.add(ring);
    }

    var moons = [];
    P.moons.forEach(function (m) {
      var pivot = new THREE.Object3D();
      pivot.rotation.y = Math.random() * 6.283; pivot.rotation.x = (Math.random() - 0.5) * 0.2;
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(R * m.s, 32, 32),
        new THREE.MeshStandardMaterial({ map: getMoonTex(), bumpMap: getMoonTex(), bumpScale: 1.0, color: m.c, roughness: 1, metalness: 0 }));
      mesh.position.x = R * m.d; mesh.rotation.y = Math.random() * 6.283;
      mesh.castShadow = true; mesh.receiveShadow = true;
      pivot.add(mesh); root.add(pivot); moons.push({ pivot: pivot, v: m.v });
    });

    if (P.glow) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(P.glow[0] / 255, P.glow[1] / 255, P.glow[2] / 255), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 }));
      sp.scale.set(R * 3.4, R * 3.4, 1); sp.renderOrder = -1;
      holder.add(sp);
    }

    var core = P.fit * R;
    sun.shadow.camera.left = -core * 1.2; sun.shadow.camera.right = core * 1.2;
    sun.shadow.camera.top = core * 1.2; sun.shadow.camera.bottom = -core * 1.2;
    sun.shadow.camera.updateProjectionMatrix();

    scene.add(holder);
    return { holder: holder, planet: planet, clouds: clouds, moons: moons, core: core, spin: P.spin };
  }

  function fitCamera() {
    if (!current) return;
    var aspect = window.innerWidth / window.innerHeight;
    camDist = current.core / (FIT * TAN * Math.min(1, aspect));
    camera.position.set(0, camDist * 0.2, camDist);
    camera.lookAt(0, 0, 0);
    current.holder.position.x = aspect > 1.2 ? camDist * TAN * aspect * 0.3 : 0;
  }

  function startTransition() { if (phase === "idle") { phase = "out"; phaseT = 0; } }

  function swap() {
    if (current) { scene.remove(current.holder); disposeObject(current.holder); }
    index = (index + 1) % PLANETS.length;
    current = buildPlanet(index);
    fitCamera();
    current.holder.scale.setScalar(0.001);
  }

  function addStars() {
    var n = 2500, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var u = Math.random() * 2 - 1, th = Math.random() * 6.283, s = Math.sqrt(1 - u * u), r = 900;
      pos[i * 3] = r * s * Math.cos(th); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * s * Math.sin(th);
      var b = 0.35 + Math.random() * 0.65, tint = Math.random();
      col[i * 3] = b * (tint > 0.8 ? 1 : 0.9); col[i * 3 + 1] = b * 0.92; col[i * 3 + 2] = b * (tint < 0.25 ? 1 : 0.95);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false })));
  }

  function init() {
    container = document.getElementById("solar-bg");
    if (!container) { console.error("solar-background: #solar-bg not found"); return; }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { console.warn("solar-background: WebGL not available", e); return; }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);

    scene.add(new THREE.AmbientLight(0x7788aa, 0.6));
    sun = new THREE.DirectionalLight(0xfff4e6, 3);
    sun.position.set(-40, 18, 32);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 200;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
    scene.add(sun);

    glowTex = toTex(glowCanvas());
    addStars();

    current = buildPlanet(index);
    current.holder.scale.setScalar(0.001);
    fitCamera();

    window.addEventListener("resize", function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      fitCamera();
    });
    setInterval(startTransition, CYCLE_MS);
    last = performance.now();
    requestAnimationFrame(animate);
  }

  function animate(now) {
    requestAnimationFrame(animate);
    var dt = Math.min(0.1, (now - last) / 1000); last = now; clockT += dt;

    if (phase === "in") {
      phaseT += dt / 2.2; var s = ease(Math.min(phaseT, 1)); current.holder.scale.setScalar(Math.max(s, 0.001));
      if (phaseT >= 1) phase = "idle";
    } else if (phase === "out") {
      phaseT += dt / 1.4; var s2 = 1 - ease(Math.min(phaseT, 1)); current.holder.scale.setScalar(Math.max(s2, 0.001));
      if (phaseT >= 1) { swap(); phase = "in"; phaseT = 0; }
    }

    if (current) {
      current.planet.rotation.y += current.spin * dt;
      if (current.clouds) current.clouds.rotation.y += current.spin * 1.3 * dt;
      for (var i = 0; i < current.moons.length; i++) current.moons[i].pivot.rotation.y += current.moons[i].v * dt;
    }
    camera.position.x = Math.sin(clockT * 0.07) * camDist * 0.03;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  function start() { setTimeout(init, 30); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
