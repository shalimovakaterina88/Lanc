/* Капи-жизнь · рисуем пушистую капибару: мех, мимика, одежда, транспорт */
'use strict';
(function (G) {
  const TAU = Math.PI * 2;
  const DPR = () => Math.min(3, window.devicePixelRatio || 1);

  // Базовая геометрия взрослой капибары в «единицах». Земля — y = 0, вверх — отрицательный y, морда смотрит вправо.
  const D = {
    body: 'M -128 -72 C -142 -124 -108 -170 -44 -174 C 22 -178 76 -166 104 -142 C 126 -118 118 -74 88 -54 C 44 -36 -40 -34 -92 -44 C -116 -50 -126 -60 -128 -72 Z',
    head: 'M 66 -168 C 84 -200 150 -204 190 -182 C 214 -170 226 -152 226 -130 C 226 -110 214 -96 198 -94 C 172 -91 142 -92 120 -100 C 100 -107 78 -118 68 -134 C 61 -146 60 -158 66 -168 Z',
    ear: 'M 78 -181 C 70 -205 90 -217 103 -203 C 109 -195 103 -185 93 -179 Z',
    earIn: 'M 84 -185 C 80 -200 91 -207 98 -199 C 101 -194 97 -189 91 -186 Z',
    legF: 'M 52 -76 C 48 -46 52 -18 50 -7 C 50 1 80 1 82 -5 C 84 -20 86 -50 90 -76 Z',
    legB: 'M -114 -76 C -116 -46 -102 -18 -100 -7 C -100 1 -70 1 -68 -5 C -66 -22 -60 -50 -56 -76 Z',
  };
  const BB = {
    body: { x: -145, y: -182, w: 275, h: 150 },
    head: { x: 58, y: -208, w: 172, h: 120 },
    ear: { x: 66, y: -220, w: 46, h: 44 },
    legF: { x: 44, y: -80, w: 50, h: 84 },
    legB: { x: -120, y: -80, w: 68, h: 84 },
  };
  const P = {};
  for (const k in D) P[k] = new Path2D(D[k]);
  G.PATHS = P;
  const NECK = { x: 96, y: -146 };
  const HIP = { F: { x: 70, y: -70 }, B: { x: -86, y: -70 } };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  G.rng = mulberry32;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; } else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  G.shade = shade;

  /* ---------- мех: рисуем часть один раз во внеэкранный холст ---------- */
  function furPart(key, pal, res, opt) {
    const bb = BB[key], m = 12;
    const W = Math.ceil((bb.w + 2 * m) * res), H = Math.ceil((bb.h + 2 * m) * res);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.setTransform(res, 0, 0, res, (-bb.x + m) * res, (-bb.y + m) * res);
    const path = P[key];
    const top = opt.dark ? shade(pal.dark, -0.12) : pal.dark;
    const base = opt.dark ? shade(pal.base, -0.14) : pal.base;
    const belly = opt.dark ? shade(pal.belly, -0.14) : pal.belly;
    const g = c.createLinearGradient(0, bb.y, 0, bb.y + bb.h);
    g.addColorStop(0, top); g.addColorStop(0.42, base); g.addColorStop(1, belly);
    c.fillStyle = g;
    c.fill(path);
    if (opt.muzzle) {
      const mg = c.createRadialGradient(214, -136, 4, 206, -136, 40);
      mg.addColorStop(0, pal.muzzle); mg.addColorStop(0.55, shade(pal.muzzle, 0.12)); mg.addColorStop(1, 'rgba(0,0,0,0)');
      c.save(); c.clip(path); c.globalAlpha = 0.9; c.fillStyle = mg; c.fillRect(160, -200, 80, 120); c.restore();
    }
    // маска для быстрых проверок «внутри ли точка»
    const mask = c.getImageData(0, 0, W, H).data;
    const inside = (x, y) => {
      const px = Math.round((x - bb.x + m) * res), py = Math.round((y - bb.y + m) * res);
      if (px < 0 || py < 0 || px >= W || py >= H) return false;
      return mask[(py * W + px) * 4 + 3] > 120;
    };
    const rand = mulberry32(opt.seed || 7);
    const light = opt.dark ? shade(pal.light, -0.15) : pal.light;
    const dark = opt.dark ? shade(pal.dark, -0.15) : pal.dark;
    const cols = [dark, base, light, belly];
    c.lineCap = 'round';
    const n = Math.floor((bb.w * bb.h) / (opt.density || 8));
    for (let i = 0; i < n; i++) {
      const x = bb.x + rand() * bb.w, y = bb.y + rand() * bb.h;
      if (!inside(x, y)) continue;
      const fy = (y - bb.y) / bb.h;
      const a = opt.flow(x, y, fy) + (rand() - 0.5) * 0.8;
      const len = (opt.len || 8) * (0.55 + rand() * 0.9);
      const tone = rand();
      let col;
      if (fy < 0.3) col = tone < 0.5 ? cols[0] : tone < 0.85 ? cols[1] : cols[2];
      else if (fy > 0.72) col = tone < 0.45 ? cols[3] : tone < 0.8 ? cols[2] : cols[1];
      else col = tone < 0.3 ? cols[0] : tone < 0.7 ? cols[1] : cols[2];
      c.strokeStyle = col;
      c.globalAlpha = 0.3 + rand() * 0.55;
      c.lineWidth = 0.7 + rand() * 0.9;
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      const bend = (rand() - 0.5) * len * 0.5;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo((x + ex) / 2 + Math.cos(a + 1.57) * bend, (y + ey) / 2 + Math.sin(a + 1.57) * bend, ex, ey);
      c.stroke();
    }
    // пушистый край: волоски, торчащие наружу
    const dirs = [];
    for (let k = 0; k < 12; k++) dirs.push([Math.cos((k / 12) * TAU), Math.sin((k / 12) * TAU)]);
    const edgeN = Math.floor(n * 1.6);
    for (let i = 0; i < edgeN; i++) {
      const x = bb.x + rand() * bb.w, y = bb.y + rand() * bb.h;
      if (!inside(x, y)) continue;
      let ox = 0, oy = 0, hits = 0;
      for (const [dx, dy] of dirs) if (!inside(x + dx * 4.5, y + dy * 4.5)) { ox += dx; oy += dy; hits++; }
      if (!hits) continue;
      const flow = opt.flow(x, y, (y - bb.y) / bb.h);
      let a = Math.atan2(oy, ox);
      a = a * 0.65 + (Math.abs(flow - a) < Math.PI ? flow : a) * 0.35 + (rand() - 0.5) * 0.6;
      const len = (opt.edge || 6) * (0.5 + rand() * 0.9);
      c.strokeStyle = rand() < 0.55 ? base : rand() < 0.5 ? dark : light;
      c.globalAlpha = 0.45 + rand() * 0.45;
      c.lineWidth = 0.7 + rand() * 0.8;
      c.beginPath();
      c.moveTo(x - Math.cos(a) * 2, y - Math.sin(a) * 2);
      c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      c.stroke();
    }
    // седина у бабушек и дедушек
    if (opt.grey) {
      for (let i = 0; i < 900; i++) {
        const x = 140 + rand() * 90, y = bb.y + rand() * bb.h;
        const w = (x - 140) / 90;
        if (!inside(x, y) || rand() > 0.35 + w * 0.6) continue;
        c.strokeStyle = rand() < 0.5 ? '#e4ddd2' : '#cfc6b8';
        c.globalAlpha = 0.35 + rand() * 0.4;
        c.lineWidth = 0.8;
        const a = Math.PI + 0.2 + (rand() - 0.5);
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); c.stroke();
      }
    }
    // объём: блик сверху, тень снизу (только поверх уже нарисованного меха)
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-atop';
    const sh = c.createLinearGradient(0, bb.y, 0, bb.y + bb.h);
    sh.addColorStop(0, 'rgba(255,236,210,0.22)');
    sh.addColorStop(0.28, 'rgba(255,236,210,0)');
    sh.addColorStop(0.7, 'rgba(30,15,5,0)');
    sh.addColorStop(1, 'rgba(30,15,5,0.32)');
    c.fillStyle = sh;
    c.fillRect(bb.x - m, bb.y - m, bb.w + 2 * m, bb.h + 2 * m);
    if (key === 'body') {
      const sg = c.createLinearGradient(bb.x, 0, bb.x + bb.w, 0);
      sg.addColorStop(0, 'rgba(30,15,5,0.22)'); sg.addColorStop(0.3, 'rgba(30,15,5,0)'); sg.addColorStop(0.85, 'rgba(255,236,210,0)'); sg.addColorStop(1, 'rgba(255,236,210,0.12)');
      c.fillStyle = sg; c.fillRect(bb.x - m, bb.y - m, bb.w + 2 * m, bb.h + 2 * m);
    }
    c.globalCompositeOperation = 'source-over';
    return { cv, x: bb.x - m, y: bb.y - m, w: bb.w + 2 * m, h: bb.h + 2 * m };
  }

  const CACHE = new Map();
  function parts(fur, res, grey) {
    const key = fur + '|' + res + '|' + (grey ? 1 : 0);
    let p = CACHE.get(key);
    if (p) return p;
    const pal = G.FURS[fur] || G.FURS.classic;
    const seed = fur.length * 97 + 11;
    p = {
      body: furPart('body', pal, res, { seed, len: 9, edge: 7, flow: (x, y, fy) => Math.PI - 0.2 - fy * 0.75 }),
      head: furPart('head', pal, res, { seed: seed + 1, len: 6, edge: 5, density: 6, muzzle: true, grey, flow: (x, y, fy) => (x > 190 ? Math.PI * 0.62 : Math.PI + 0.12 - fy * 0.45) }),
      ear: furPart('ear', pal, res, { seed: seed + 2, len: 4, edge: 3, density: 5, flow: () => -Math.PI / 2 }),
      legF: furPart('legF', pal, res, { seed: seed + 3, len: 6, edge: 4, density: 7, flow: () => Math.PI / 2 + 0.12 }),
      legB: furPart('legB', pal, res, { seed: seed + 4, len: 6, edge: 4, density: 7, flow: () => Math.PI / 2 + 0.2 }),
      legFd: furPart('legF', pal, res, { seed: seed + 5, len: 6, edge: 4, density: 7, dark: true, flow: () => Math.PI / 2 + 0.12 }),
      legBd: furPart('legB', pal, res, { seed: seed + 6, len: 6, edge: 4, density: 7, dark: true, flow: () => Math.PI / 2 + 0.2 }),
    };
    if (CACHE.size > 24) CACHE.delete(CACHE.keys().next().value);
    CACHE.set(key, p);
    return p;
  }
  const blit = (c, part) => c.drawImage(part.cv, part.x, part.y, part.w, part.h);

  /* ---------- мелкие помощники ---------- */
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); }
  function fruit(c, x, y, r) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffc15a'); g.addColorStop(0.6, '#f39419'); g.addColorStop(1, '#cf6d0a');
    c.fillStyle = g; circ(c, x, y, r); c.fill();
    c.fillStyle = 'rgba(160,70,0,0.25)';
    for (let i = 0; i < 9; i++) { circ(c, x + Math.cos(i * 2.1) * r * 0.55, y + Math.sin(i * 2.7) * r * 0.5, 0.9); c.fill(); }
    c.fillStyle = '#5a3a16'; circ(c, x, y - r * 0.92, 1.8); c.fill();
    c.fillStyle = '#4f8f3a';
    c.beginPath(); c.moveTo(x, y - r * 0.95); c.quadraticCurveTo(x + r * 0.6, y - r * 1.5, x + r * 1.05, y - r * 1.05); c.quadraticCurveTo(x + r * 0.45, y - r * 0.8, x, y - r * 0.95); c.fill();
  }
  G.drawFruit = fruit;
  function wheel(c, x, y, r, rot, rim) {
    c.fillStyle = '#26221f'; circ(c, x, y, r); c.fill();
    c.fillStyle = rim || '#cfd6d8'; circ(c, x, y, r * 0.78); c.fill();
    c.fillStyle = '#26221f'; circ(c, x, y, r * 0.7); c.fill();
    c.strokeStyle = rim || '#cfd6d8'; c.lineWidth = Math.max(1, r * 0.05);
    for (let i = 0; i < 6; i++) {
      const a = rot + (i / 6) * TAU;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); c.stroke();
    }
    c.fillStyle = '#8c9497'; circ(c, x, y, r * 0.14); c.fill();
  }
  function tube(c, pts, w, col) {
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.stroke();
  }
  function fabricShade(c, x, y, w, h) {
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    c.fillStyle = g; c.fillRect(x, y, w, h);
  }

  /* ---------- транспорт ---------- */
  const VEH = {
    tricycle: {
      lift: 34, tuck: true,
      back(c, r) {
        wheel(c, -96, -22, 22, r); tube(c, [-96, -22, -20, -58, 106, -40], 9, '#d8433b');
        c.fillStyle = '#2d2a28'; ell(c, -20, -62, 30, 8); c.fill();
      },
      front(c, r) {
        wheel(c, 108, -36, 36, r);
        tube(c, [108, -36, 102, -136], 8, '#d8433b'); tube(c, [102, -136, 80, -140], 7, '#2d2a28');
        c.fillStyle = '#f2c14e'; circ(c, 108 + Math.cos(r) * 14, -36 + Math.sin(r) * 14, 6); c.fill();
      },
    },
    bike: {
      lift: 58, tuck: true,
      back(c, r) {
        wheel(c, -104, -44, 44, r); wheel(c, 126, -44, 44, r);
        tube(c, [-104, -44, 0, -40, -22, -96, -104, -44], 7, '#1f8a8a');
        tube(c, [0, -40, 96, -92, 126, -44], 7, '#1f8a8a');
        tube(c, [-22, -96, 94, -108, 96, -92], 7, '#1f8a8a');
        c.fillStyle = '#2d2a28'; ell(c, -22, -100, 30, 7); c.fill();
      },
      front(c, r) {
        tube(c, [94, -108, 98, -168], 6, '#1f8a8a'); tube(c, [98, -168, 80, -170], 7, '#2d2a28');
        tube(c, [0, -40, Math.cos(r) * 18, -40 + Math.sin(r) * 18], 5, '#555');
        c.fillStyle = '#333'; ell(c, Math.cos(r) * 18, -40 + Math.sin(r) * 18, 9, 3); c.fill();
      },
    },
    scooter: {
      lift: 16, tuck: false,
      back(c, r) {
        wheel(c, -100, -9, 10, r); wheel(c, 150, -9, 10, r);
        c.fillStyle = '#4b9fd6'; c.beginPath(); c.roundRect(-116, -20, 272, 9, 4); c.fill();
      },
      front(c) { tube(c, [150, -9, 164, -98], 7, '#9aa5ad'); tube(c, [150, -100, 180, -98], 7, '#2d2a28'); },
    },
    escooter: {
      lift: 18, tuck: false,
      back(c, r) {
        wheel(c, -100, -11, 12, r); wheel(c, 150, -11, 12, r);
        c.fillStyle = '#2f3437'; c.beginPath(); c.roundRect(-116, -24, 272, 12, 5); c.fill();
        c.fillStyle = '#52d1b0'; c.fillRect(-80, -20, 180, 3);
      },
      front(c) {
        tube(c, [150, -11, 166, -100], 8, '#2f3437'); tube(c, [152, -102, 184, -100], 7, '#2f3437');
        c.fillStyle = '#fff6b0'; circ(c, 168, -80, 5); c.fill();
      },
    },
    skateboard: {
      lift: 15, tuck: false,
      back(c, r) {
        c.fillStyle = '#26221f'; circ(c, -84, -6, 7); c.fill(); circ(c, 84, -6, 7); c.fill();
        c.fillStyle = '#e0503a'; c.beginPath();
        c.moveTo(-128, -24); c.quadraticCurveTo(-120, -14, -100, -14); c.lineTo(100, -14); c.quadraticCurveTo(120, -14, 128, -24);
        c.lineTo(126, -18); c.quadraticCurveTo(118, -8, 100, -8); c.lineTo(-100, -8); c.quadraticCurveTo(-118, -8, -126, -18); c.closePath(); c.fill();
        c.fillStyle = '#f6c64a'; c.fillRect(-60, -13, 120, 2);
      },
      front() {},
    },
    rollers: {
      lift: 12, tuck: false, still: true,
      back(c, r) { for (const x of [84, -66]) boot(c, x + 2, r, 0.85); },
      front(c, r) { for (const x of [66, -84]) boot(c, x, r, 1); },
    },
    moped: {
      lift: 56, tuck: true,
      back(c, r) {
        wheel(c, -100, -34, 34, r); wheel(c, 134, -34, 34, r);
        c.fillStyle = '#6cc3b3'; c.beginPath(); c.moveTo(-120, -50); c.quadraticCurveTo(-110, -96, -40, -96); c.lineTo(20, -96); c.quadraticCurveTo(40, -60, 60, -46); c.lineTo(-120, -46); c.closePath(); c.fill();
        c.fillStyle = '#2d2a28'; ell(c, -40, -100, 42, 8); c.fill();
      },
      front(c) {
        c.fillStyle = '#6cc3b3'; c.beginPath(); c.moveTo(90, -40); c.quadraticCurveTo(128, -90, 110, -164); c.lineTo(124, -166); c.quadraticCurveTo(150, -80, 112, -36); c.closePath(); c.fill();
        tube(c, [112, -162, 88, -166], 7, '#2d2a28');
        c.fillStyle = '#fff4a8'; circ(c, 126, -140, 7); c.fill();
      },
    },
    car: {
      lift: 26, tuck: true,
      back(c) {
        c.fillStyle = 'rgba(190,225,240,0.5)'; c.beginPath(); c.moveTo(-150, -118); c.lineTo(-118, -236); c.lineTo(160, -238); c.lineTo(214, -118); c.closePath(); c.fill();
        tube(c, [-150, -118, -118, -236, 160, -238, 214, -118], 9, '#c9302c');
      },
      front(c, r) {
        c.fillStyle = '#d9413b'; c.beginPath();
        c.moveTo(-176, -26); c.lineTo(-178, -104); c.quadraticCurveTo(-176, -122, -156, -122); c.lineTo(210, -122); c.quadraticCurveTo(244, -118, 250, -80); c.lineTo(252, -26); c.closePath(); c.fill();
        fabricShade(c, -178, -122, 430, 100);
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-150, -112, 330, 5);
        c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(40, -118); c.lineTo(40, -30); c.stroke();
        c.fillStyle = '#eee'; c.fillRect(60, -92, 22, 5);
        c.fillStyle = '#fff4a8'; ell(c, 244, -84, 7, 10); c.fill();
        wheel(c, -110, -26, 30, r, '#d0d0d0'); wheel(c, 176, -26, 30, r, '#d0d0d0');
      },
    },
    boat: {
      lift: 10, tuck: true,
      back(c) { tube(c, [-186, -60, -196, -20], 8, '#555'); c.fillStyle = '#444'; c.fillRect(-206, -76, 22, 26); },
      front(c) {
        c.fillStyle = '#f4f1ea'; c.beginPath(); c.moveTo(-184, -78); c.lineTo(214, -78); c.quadraticCurveTo(250, -80, 262, -98); c.lineTo(236, -14); c.quadraticCurveTo(40, 8, -170, -12); c.closePath(); c.fill();
        c.fillStyle = '#2b6ea6'; c.fillRect(-176, -62, 420, 10);
        fabricShade(c, -190, -100, 460, 100);
      },
    },
    balloon: {
      lift: 70, tuck: true, air: true,
      back(c, r, t) {
        const y0 = -420;
        const cols = ['#e94f37', '#f6c64a', '#44bba4', '#f6c64a'];
        for (let i = 0; i < 4; i++) {
          c.fillStyle = cols[i]; c.beginPath();
          c.ellipse(0, y0, 150 - i * 36, 160, 0, 0, TAU); c.fill();
        }
        c.strokeStyle = '#7a5a3a'; c.lineWidth = 2;
        for (const x of [-120, 150]) { c.beginPath(); c.moveTo(x, -130); c.lineTo(x * 0.5, y0 + 150); c.stroke(); }
      },
      front(c) {
        c.fillStyle = '#b98b52'; c.beginPath(); c.roundRect(-140, -150, 300, 90, 10); c.fill();
        c.strokeStyle = 'rgba(80,50,20,0.45)'; c.lineWidth = 2;
        for (let x = -130; x < 160; x += 14) { c.beginPath(); c.moveTo(x, -148); c.lineTo(x + 6, -62); c.stroke(); }
        for (let y = -140; y < -60; y += 14) { c.beginPath(); c.moveTo(-138, y); c.lineTo(158, y); c.stroke(); }
      },
    },
  };
  function boot(c, x, r, k) {
    c.fillStyle = k < 1 ? '#b8456b' : '#e2658f';
    c.beginPath(); c.roundRect(x - 18, -22, 38, 14, 5); c.fill();
    c.fillStyle = '#26221f'; circ(c, x - 9, -5, 5.5); c.fill(); circ(c, x + 11, -5, 5.5); c.fill();
    c.fillStyle = '#f6c64a'; circ(c, x - 9, -5, 2); c.fill(); circ(c, x + 11, -5, 2); c.fill();
  }
  G.VEH_DRAW = VEH;

  /* ---------- шапки и очки (в координатах головы) ---------- */
  const HAT = {
    yuzu(c) { fruit(c, 128, -214, 18); },
    bow(c) {
      c.save(); c.translate(94, -210); c.rotate(-0.3);
      c.fillStyle = '#ef6f9a';
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-24, -20, -22, 6); c.quadraticCurveTo(-12, 10, 0, 0); c.fill();
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(24, -20, 22, 6); c.quadraticCurveTo(12, 10, 0, 0); c.fill();
      c.fillStyle = '#d24d7c'; circ(c, 0, 0, 5); c.fill();
      c.restore();
    },
    partyhat(c) {
      c.save();
      c.beginPath(); c.moveTo(104, -194); c.lineTo(130, -254); c.lineTo(158, -192); c.closePath();
      c.fillStyle = '#5bc0eb'; c.fill(); c.clip();
      c.fillStyle = '#fde74c';
      for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(90, -200 - i * 14); c.lineTo(170, -214 - i * 14); c.lineTo(170, -206 - i * 14); c.lineTo(90, -192 - i * 14); c.fill(); }
      c.restore();
      c.fillStyle = '#e55934'; circ(c, 130, -256, 8); c.fill();
    },
    panama(c) {
      c.fillStyle = '#f0e0c0'; ell(c, 132, -192, 54, 10); c.fill();
      c.beginPath(); c.moveTo(100, -194); c.bezierCurveTo(100, -228, 164, -228, 164, -194); c.closePath(); c.fill();
      c.fillStyle = '#6fb1a0'; c.fillRect(100, -202, 64, 7);
      fabricShade(c, 78, -226, 110, 44);
    },
    cap(c) {
      c.fillStyle = '#e04f3a';
      c.beginPath(); c.moveTo(94, -190); c.bezierCurveTo(96, -228, 160, -230, 164, -188); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(152, -194); c.bezierCurveTo(176, -200, 204, -194, 210, -184); c.bezierCurveTo(192, -180, 170, -184, 150, -186); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(129, -222); c.lineTo(124, -190); c.stroke();
      c.fillStyle = '#fff'; circ(c, 129, -223, 3.5); c.fill();
      fabricShade(c, 90, -230, 124, 50);
    },
    beanie(c) {
      c.save();
      c.beginPath(); c.moveTo(90, -186); c.bezierCurveTo(90, -236, 170, -238, 170, -186); c.closePath();
      c.fillStyle = '#3e7cb1'; c.fill(); c.clip();
      c.fillStyle = '#f2f2f2'; for (let y = -236; y < -186; y += 14) c.fillRect(80, y, 100, 6);
      fabricShade(c, 86, -240, 90, 56);
      c.restore();
      c.fillStyle = '#2f628f'; c.beginPath(); c.roundRect(86, -198, 88, 15, 6); c.fill();
      c.fillStyle = '#f2f2f2';
      for (let i = 0; i < 14; i++) { circ(c, 130 + Math.cos(i * 0.45) * 9, -238 + Math.sin(i * 0.9) * 8, 6); c.fill(); }
    },
    wreath(c) {
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, x = (1 - t) * (1 - t) * 80 + 2 * (1 - t) * t * 130 + t * t * 184, y = (1 - t) * (1 - t) * -186 + 2 * (1 - t) * t * -216 + t * t * -184;
        c.fillStyle = '#5c9e45'; ell(c, x + 6, y + 3, 7, 3, 0.5); c.fill();
        c.fillStyle = '#fff';
        for (let k = 0; k < 6; k++) { ell(c, x + Math.cos(k * 1.05) * 5, y + Math.sin(k * 1.05) * 5, 4.4, 2.6, k * 1.05); c.fill(); }
        c.fillStyle = '#f5c518'; circ(c, x, y, 3.2); c.fill();
      }
    },
    helmet(c) {
      const g = c.createLinearGradient(0, -236, 0, -186);
      g.addColorStop(0, '#6ed3cf'); g.addColorStop(1, '#2a9d8f');
      c.fillStyle = g; c.beginPath(); c.moveTo(86, -186); c.bezierCurveTo(86, -240, 178, -240, 178, -186); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.35)';
      for (let i = 0; i < 3; i++) { c.beginPath(); c.roundRect(104 + i * 22, -226 + Math.abs(i - 1) * 4, 12, 26, 5); c.fill(); }
      c.fillStyle = '#264653'; c.fillRect(84, -190, 96, 6);
    },
    headphones(c) {
      c.strokeStyle = '#2b2d42'; c.lineWidth = 7; c.beginPath(); c.moveTo(96, -186); c.bezierCurveTo(100, -236, 160, -236, 160, -192); c.stroke();
      c.fillStyle = '#2b2d42'; c.beginPath(); c.roundRect(82, -200, 26, 34, 10); c.fill();
      c.fillStyle = '#ef476f'; c.beginPath(); c.roundRect(86, -196, 18, 26, 8); c.fill();
    },
    gradcap(c) {
      c.fillStyle = '#1d1d24';
      c.beginPath(); c.moveTo(100, -190); c.bezierCurveTo(102, -212, 158, -212, 160, -190); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(88, -212); c.lineTo(130, -226); c.lineTo(176, -212); c.lineTo(132, -198); c.closePath(); c.fill();
      c.strokeStyle = '#e9c46a'; c.lineWidth = 2; c.beginPath(); c.moveTo(131, -212); c.lineTo(170, -210); c.lineTo(172, -186); c.stroke();
      c.fillStyle = '#e9c46a'; c.beginPath(); c.moveTo(168, -188); c.lineTo(176, -188); c.lineTo(178, -172); c.lineTo(166, -172); c.fill();
    },
    tophat(c) {
      c.fillStyle = '#1f1d22'; ell(c, 128, -194, 42, 7); c.fill();
      c.beginPath(); c.moveTo(104, -196); c.lineTo(106, -252); c.lineTo(152, -252); c.lineTo(154, -196); c.closePath(); c.fill();
      c.fillStyle = '#b5302a'; c.fillRect(104, -212, 50, 10);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(110, -250, 8, 36);
    },
    boater(c) {
      c.fillStyle = '#e8cf8e'; ell(c, 130, -194, 52, 9); c.fill();
      c.fillRect(106, -218, 48, 24); ell(c, 130, -218, 24, 5); c.fill();
      c.fillStyle = '#2d3a6b'; c.fillRect(106, -206, 48, 8);
      c.strokeStyle = 'rgba(120,90,30,0.35)'; c.lineWidth = 1;
      for (let x = 84; x < 180; x += 7) { c.beginPath(); c.moveTo(x, -198); c.lineTo(x + 3, -190); c.stroke(); }
    },
    crown(c) {
      const g = c.createLinearGradient(0, -232, 0, -192);
      g.addColorStop(0, '#ffe38a'); g.addColorStop(1, '#d4a017');
      c.fillStyle = g; c.beginPath();
      c.moveTo(102, -192); c.lineTo(104, -226); c.lineTo(116, -206); c.lineTo(128, -234); c.lineTo(140, -206); c.lineTo(152, -226); c.lineTo(156, -192); c.closePath(); c.fill();
      c.fillStyle = '#e63946'; circ(c, 128, -202, 4); c.fill();
      c.fillStyle = '#4cc9f0'; circ(c, 112, -200, 3); c.fill(); circ(c, 145, -200, 3); c.fill();
    },
  };
  const EYES = {
    roundglasses(c, E) {
      const r = 7 * E + 6;
      c.strokeStyle = '#3b2f2a'; c.lineWidth = 2.6;
      c.fillStyle = 'rgba(210,235,255,0.25)'; circ(c, 129, -170, r); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(129 - r, -172); c.lineTo(94, -178); c.stroke();
      c.beginPath(); c.moveTo(129 + r, -170); c.lineTo(129 + r + 8, -166); c.stroke();
    },
    sunglasses(c, E) {
      const r = 7 * E + 7;
      c.fillStyle = '#16161c'; ell(c, 131, -170, r * 1.15, r * 0.85); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(126, -178); c.lineTo(138, -172); c.stroke();
      c.strokeStyle = '#16161c'; c.lineWidth = 3; c.beginPath(); c.moveTo(131 - r, -173); c.lineTo(94, -178); c.stroke();
    },
    monocle(c, E) {
      const r = 7 * E + 5;
      c.strokeStyle = '#d4a017'; c.lineWidth = 2.4; c.fillStyle = 'rgba(210,235,255,0.2)'; circ(c, 129, -170, r); c.fill(); c.stroke();
      c.lineWidth = 1.2; c.beginPath(); c.moveTo(129, -170 + r); c.bezierCurveTo(124, -140, 110, -128, 112, -110); c.stroke();
    },
  };

  /* ---------- украшения на шее (в координатах тела) ---------- */
  const NECK_ITEMS = {
    scarf(c) {
      c.save();
      c.beginPath(); c.moveTo(70, -166); c.bezierCurveTo(88, -178, 108, -168, 120, -148); c.bezierCurveTo(130, -132, 128, -112, 120, -98); c.bezierCurveTo(108, -94, 100, -106, 96, -118); c.bezierCurveTo(90, -134, 80, -146, 66, -150); c.closePath();
      c.fillStyle = '#d64545'; c.fill(); c.clip();
      c.strokeStyle = '#f2e8cf'; c.lineWidth = 5;
      for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(60 + i * 12, -190); c.lineTo(40 + i * 12, -90); c.stroke(); }
      fabricShade(c, 60, -180, 80, 90);
      c.restore();
      c.fillStyle = '#c23b3b'; c.beginPath(); c.moveTo(100, -112); c.lineTo(114, -56); c.lineTo(94, -52); c.lineTo(88, -108); c.closePath(); c.fill();
      c.strokeStyle = '#f2e8cf'; c.lineWidth = 4; c.beginPath(); c.moveTo(92, -90); c.lineTo(108, -94); c.stroke(); c.beginPath(); c.moveTo(94, -72); c.lineTo(111, -76); c.stroke();
      c.strokeStyle = '#c23b3b'; c.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(95 + i * 3.4, -54); c.lineTo(95 + i * 3.4, -44); c.stroke(); }
    },
    bandana(c) {
      c.fillStyle = '#3a6ea5'; c.beginPath(); c.moveTo(86, -140); c.lineTo(128, -124); c.lineTo(110, -84); c.closePath(); c.fill();
      c.fillStyle = '#fff'; for (const [x, y] of [[100, -126], [112, -114], [106, -100], [118, -126], [96, -136]]) { circ(c, x, y, 2.2); c.fill(); }
    },
    bowtie(c) {
      c.fillStyle = '#b5302a';
      c.beginPath(); c.moveTo(122, -102); c.lineTo(106, -114); c.lineTo(106, -90); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(122, -102); c.lineTo(138, -114); c.lineTo(138, -90); c.closePath(); c.fill();
      c.fillStyle = '#8d231e'; circ(c, 122, -102, 5); c.fill();
    },
    tie(c) {
      c.fillStyle = '#2d4e8a';
      c.beginPath(); c.moveTo(114, -106); c.lineTo(126, -106); c.lineTo(123, -96); c.lineTo(117, -96); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(117, -96); c.lineTo(123, -96); c.lineTo(128, -58); c.lineTo(119, -46); c.lineTo(111, -58); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(114, -80); c.lineTo(126, -86); c.stroke(); c.beginPath(); c.moveTo(113, -66); c.lineTo(127, -72); c.stroke();
    },
    pearls(c, t) {
      const pts = [];
      for (let i = 0; i <= 13; i++) {
        const u = i / 13;
        pts.push([(1 - u) * (1 - u) * 74 + 2 * (1 - u) * u * 98 + u * u * 128, (1 - u) * (1 - u) * -160 + 2 * (1 - u) * u * -70 + u * u * -126]);
      }
      c.strokeStyle = 'rgba(180,180,190,0.7)'; c.lineWidth = 1; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
      for (const [x, y] of pts) {
        const g = c.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, 4.6);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#ece6dc'); g.addColorStop(1, '#bdb6aa');
        c.fillStyle = g; circ(c, x, y, 4.4); c.fill();
      }
      // серебряная подвеска с кристаллом
      const low = pts[7];
      c.strokeStyle = '#c9ced6'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(low[0], low[1] + 3); c.lineTo(low[0], low[1] + 9); c.stroke();
      c.fillStyle = '#dfe4ea'; c.beginPath(); c.moveTo(low[0], low[1] + 8); c.lineTo(low[0] + 7, low[1] + 17); c.lineTo(low[0], low[1] + 28); c.lineTo(low[0] - 7, low[1] + 17); c.closePath(); c.fill();
      c.fillStyle = '#9fd8ff'; c.beginPath(); c.moveTo(low[0], low[1] + 11); c.lineTo(low[0] + 4, low[1] + 17); c.lineTo(low[0], low[1] + 24); c.lineTo(low[0] - 4, low[1] + 17); c.closePath(); c.fill();
      const tw = 0.5 + 0.5 * Math.sin((t || 0) * 3);
      c.fillStyle = `rgba(255,255,255,${0.4 + tw * 0.6})`;
      c.beginPath(); c.moveTo(low[0] + 3, low[1] + 13); c.lineTo(low[0] + 4, low[1] + 10); c.lineTo(low[0] + 5, low[1] + 13); c.lineTo(low[0] + 8, low[1] + 14); c.lineTo(low[0] + 5, low[1] + 15); c.lineTo(low[0] + 4, low[1] + 18); c.lineTo(low[0] + 3, low[1] + 15); c.lineTo(low[0], low[1] + 14); c.closePath(); c.fill();
    },
    medal(c) {
      c.fillStyle = '#2a6fdb'; c.beginPath(); c.moveTo(84, -154); c.lineTo(96, -154); c.lineTo(110, -86); c.lineTo(102, -86); c.closePath(); c.fill();
      c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(126, -128); c.lineTo(118, -126); c.lineTo(104, -86); c.lineTo(112, -86); c.closePath(); c.fill();
      const g = c.createRadialGradient(104, -76, 2, 106, -72, 13);
      g.addColorStop(0, '#fff2b0'); g.addColorStop(1, '#d4a017');
      c.fillStyle = g; circ(c, 106, -72, 12); c.fill();
      c.fillStyle = '#b8860b'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1', 106, -71);
    },
  };

  /* ---------- одежда на теле ---------- */
  const FRONT = (c) => { c.beginPath(); c.moveTo(-46, -200); c.bezierCurveTo(-28, -130, -58, -80, -40, -20); c.lineTo(160, -20); c.lineTo(160, -200); c.closePath(); };
  const GARMENT = {
    sweater: { color: '#e9c46a', sleeve: true, draw(c) { FRONT(c); c.fillStyle = '#e9c46a'; c.fill(); c.save(); FRONT(c); c.clip(); c.fillStyle = '#2a9d8f'; for (let y = -186; y < -20; y += 18) c.fillRect(-60, y, 220, 8); c.restore(); rib(c); } },
    hoodie: {
      color: '#8e7dbe', sleeve: true,
      draw(c) { FRONT(c); c.fillStyle = '#8e7dbe'; c.fill(); c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.roundRect(0, -92, 70, 34, 10); c.fill(); rib(c); },
      over(c) { c.fillStyle = '#7a69aa'; ell(c, 70, -168, 22, 15, -0.4); c.fill(); c.strokeStyle = '#f0f0f0'; c.lineWidth = 2; c.beginPath(); c.moveTo(112, -118); c.lineTo(110, -92); c.moveTo(118, -114); c.lineTo(118, -90); c.stroke(); },
    },
    sport: { color: '#2b59c3', sleeve: true, draw(c) { FRONT(c); c.fillStyle = '#2b59c3'; c.fill(); c.fillStyle = '#fff'; c.fillRect(-60, -118, 220, 5); c.fillRect(-60, -108, 220, 5); c.strokeStyle = '#ddd'; c.lineWidth = 2; c.beginPath(); c.moveTo(116, -140); c.lineTo(100, -50); c.stroke(); } },
    rocker: {
      color: '#1f1f22', sleeve: true,
      draw(c) {
        FRONT(c); c.fillStyle = '#1f1f22'; c.fill();
        c.strokeStyle = '#c7ccd1'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(110, -146); c.lineTo(40, -44); c.stroke();
        c.fillStyle = '#c7ccd1'; for (let i = 0; i < 6; i++) { circ(c, 20 + i * 14, -164 + Math.abs(i - 2) * 2, 2.6); c.fill(); }
        c.fillStyle = '#34343a'; c.beginPath(); c.moveTo(86, -160); c.lineTo(118, -140); c.lineTo(96, -124); c.closePath(); c.fill();
      },
    },
    raincoat: { color: '#f6c63d', sleeve: true, full: true, draw(c) { c.fillStyle = '#f6c63d'; c.fillRect(-160, -200, 320, 190); c.fillStyle = '#d9a91b'; for (const y of [-130, -100, -70]) { circ(c, 104, y, 3.5); c.fill(); } }, over(c) { c.fillStyle = '#f0bb2c'; ell(c, 70, -170, 24, 17, -0.4); c.fill(); } },
    robe: {
      color: '#f3efe6', sleeve: true, full: true,
      draw(c) {
        c.fillStyle = '#f3efe6'; c.fillRect(-160, -200, 320, 190);
        c.fillStyle = '#9fc5c1'; c.beginPath(); c.moveTo(-6, -200); c.lineTo(10, -200); c.lineTo(2, -20); c.lineTo(-14, -20); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 3; c.beginPath(); c.moveTo(80, -164); c.lineTo(114, -104); c.stroke();
        c.strokeStyle = 'rgba(0,0,0,0.06)'; c.lineWidth = 1; for (let x = -150; x < 160; x += 6) { c.beginPath(); c.moveTo(x, -200); c.lineTo(x, -20); c.stroke(); }
      },
    },
    tutu: {
      color: '#f7a8c4',
      draw(c) { FRONT(c); c.fillStyle = '#f7a8c4'; c.fill(); c.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 8; i++) { circ(c, 20 + i * 11, -150 + Math.sin(i) * 6, 1.8); c.fill(); } },
      skirt(c) {
        for (let layer = 0; layer < 2; layer++) {
          c.fillStyle = layer ? 'rgba(252,196,216,0.92)' : 'rgba(240,150,185,0.9)';
          const y0 = -78 + layer * 6, w = 108 - layer * 8;
          c.beginPath(); c.moveTo(-w, y0);
          c.bezierCurveTo(-w * 0.4, y0 - 16, w * 0.4, y0 - 16, w, y0);
          for (let i = 0; i <= 10; i++) { const x = w - (i / 10) * 2 * w; c.quadraticCurveTo(x + w / 10, y0 + 30 - layer * 4, x, y0 + 20 - layer * 4); }
          c.closePath(); c.fill();
        }
      },
    },
    dress: {
      color: '#3558b8', full: true,
      draw(c) {
        const g = c.createLinearGradient(-140, 0, 130, 0);
        g.addColorStop(0, '#223a7d'); g.addColorStop(0.55, '#3a5fc0'); g.addColorStop(1, '#2a47a0');
        c.fillStyle = g; c.fillRect(-160, -200, 320, 190);
        c.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 5; i++) { ell(c, -90 + i * 48, -118, 9, 62, 0.25); c.fill(); }
        c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(66, -172); c.quadraticCurveTo(98, -128, 124, -118); c.stroke();
      },
      skirt(c, t) {
        const g = c.createLinearGradient(0, -84, 0, -30);
        g.addColorStop(0, '#3a5fc0'); g.addColorStop(1, '#1f357a');
        c.fillStyle = g;
        c.beginPath(); c.moveTo(-116, -72); c.bezierCurveTo(-50, -86, 60, -86, 116, -72); c.lineTo(136, -36);
        for (let i = 0; i < 8; i++) { const x = 136 - i * 34; c.quadraticCurveTo(x - 17, -24 - (i % 2) * 4, x - 34, -34); }
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 3;
        for (let i = 0; i < 7; i++) { const x = -96 + i * 32; c.beginPath(); c.moveTo(x * 0.85, -76); c.quadraticCurveTo(x * 0.95, -56, x * 1.08, -34); c.stroke(); }
        for (let i = 0; i < 14; i++) { const a = 0.5 + 0.5 * Math.sin((t || 0) * 2 + i * 1.7); c.fillStyle = `rgba(255,255,255,${0.2 + a * 0.6})`; circ(c, -100 + ((i * 53) % 220), -70 + ((i * 29) % 36), 1.5); c.fill(); }
      },
    },
    tailcoat: {
      color: '#1d1d24', sleeve: true,
      draw(c) { FRONT(c); c.fillStyle = '#1d1d24'; c.fill(); c.fillStyle = '#f7f7f7'; c.beginPath(); c.moveTo(96, -160); c.lineTo(130, -130); c.lineTo(118, -70); c.lineTo(96, -96); c.closePath(); c.fill(); c.fillStyle = '#222'; circ(c, 112, -112, 2); c.fill(); circ(c, 110, -96, 2); c.fill(); },
      back(c) { c.fillStyle = '#1d1d24'; c.beginPath(); c.moveTo(-100, -92); c.lineTo(-150, -22); c.lineTo(-122, -24); c.lineTo(-86, -70); c.closePath(); c.fill(); },
    },
  };
  function clothShade(c) {
    let g = c.createLinearGradient(0, -182, 0, -32);
    g.addColorStop(0, 'rgba(255,255,255,0.24)'); g.addColorStop(0.32, 'rgba(255,255,255,0)'); g.addColorStop(0.68, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.3)');
    c.fillStyle = g; c.fillRect(-160, -200, 320, 190);
    g = c.createLinearGradient(-145, 0, 130, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.26)'); g.addColorStop(0.32, 'rgba(0,0,0,0)'); g.addColorStop(0.9, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.1)');
    c.fillStyle = g; c.fillRect(-160, -200, 320, 190);
  }
  function rib(c) {
    c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(-46, -200); c.bezierCurveTo(-28, -130, -58, -80, -40, -20); c.stroke();
  }
  G.GARMENT = GARMENT;

  /* ---------- лицо ---------- */
  function face(c, pal, st, pose, elder) {
    const E = st.eye;
    const ex = 128, ey = -170;
    const mood = pose.mood || 'normal';
    const look = pose.look || 0;
    // глазная впадинка
    c.fillStyle = 'rgba(35,18,8,0.28)'; ell(c, ex, ey + 1, 9.5 * E, 8 * E); c.fill();
    const closed = mood === 'happy' || mood === 'sleep' || mood === 'content' || (pose.blink || 0) > 0.92;
    if (closed) {
      c.strokeStyle = '#1d130d'; c.lineWidth = 2.6 * Math.sqrt(E); c.lineCap = 'round';
      c.beginPath();
      if (mood === 'happy') { c.moveTo(ex - 7 * E, ey + 2); c.quadraticCurveTo(ex, ey - 7 * E, ex + 7 * E, ey + 2); }
      else { c.moveTo(ex - 7 * E, ey - 1); c.quadraticCurveTo(ex, ey + 5 * E, ex + 7 * E, ey - 1); }
      c.stroke();
      if (mood === 'sleep' || mood === 'content') { c.lineWidth = 1.2; c.beginPath(); c.moveTo(ex - 6 * E, ey + 2 * E); c.lineTo(ex - 8 * E, ey + 4 * E); c.stroke(); }
    } else {
      const g = c.createRadialGradient(ex + look * 1.5, ey + 2 * E, 0.5, ex + look * 1.5, ey, 7 * E);
      g.addColorStop(0, '#4a2f1d'); g.addColorStop(0.55, '#20140c'); g.addColorStop(1, '#0d0806');
      c.fillStyle = g; ell(c, ex + look * 1.5, ey, 6.4 * E, 7 * E); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.95)'; circ(c, ex + 2.2 * E + look, ey - 2.6 * E, 2.1 * E); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)'; circ(c, ex - 2 * E + look, ey + 2.6 * E, 0.95 * E); c.fill();
      let lid = pose.blink || 0;
      if (mood === 'tired' || mood === 'sick') lid = Math.max(lid, 0.45);
      if (lid > 0.02) {
        c.save(); ell(c, ex, ey, 7.6 * E, 8.2 * E); c.clip();
        c.fillStyle = pal.base; c.fillRect(ex - 10 * E, ey - 9 * E, 20 * E, 17 * E * lid);
        c.strokeStyle = '#1d130d'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ex - 8 * E, ey - 9 * E + 17 * E * lid); c.lineTo(ex + 8 * E, ey - 9 * E + 17 * E * lid); c.stroke();
        c.restore();
      }
      if (mood === 'sad' || mood === 'sick') {
        c.strokeStyle = shade(pal.dark, -0.3); c.lineWidth = 2.2; c.beginPath(); c.moveTo(ex - 8 * E, ey - 9 * E); c.lineTo(ex + 6 * E, ey - 12 * E); c.stroke();
      }
    }
    if (elder) {
      c.strokeStyle = '#e8e2d8'; c.lineWidth = 2.2; c.lineCap = 'round';
      for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(ex - 7 + i * 3.5, ey - 10 * E); c.lineTo(ex - 3 + i * 4, ey - 15 * E - (i % 2) * 2); c.stroke(); }
    }
    // ноздря
    const fl = 1 + (pose.sniff || 0) * 0.35;
    c.strokeStyle = '#1b110b'; c.lineWidth = 3.4 * fl; c.lineCap = 'round';
    c.beginPath(); c.moveTo(209, -157); c.quadraticCurveTo(216, -154, 217, -145); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.18)'; ell(c, 214, -160, 6, 2.5, 0.2); c.fill();
    // рот
    const m = pose.mouth || 0;
    c.strokeStyle = '#2a1a10'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(218, -122); c.lineTo(216, -112); c.stroke();
    c.beginPath();
    if (mood === 'happy' || mood === 'content') { c.moveTo(216, -112); c.quadraticCurveTo(206, -100, 190, -110); }
    else if (mood === 'sad' || mood === 'sick') { c.moveTo(216, -110); c.quadraticCurveTo(204, -110, 192, -103); }
    else { c.moveTo(216, -112); c.quadraticCurveTo(206, -104, 192, -106); }
    c.stroke();
    if (m > 0.15) {
      c.fillStyle = '#5a2a22'; ell(c, 206, -106 + m * 3, 8, 3 + m * 5); c.fill();
      c.fillStyle = '#fbf4e4'; c.fillRect(211, -112, 4, 3 + m * 2);
    }
    // усы
    c.strokeStyle = 'rgba(30,18,10,0.5)'; c.lineWidth = 0.9;
    for (const [dx, dy] of [[34, -12], [36, -2], [32, 8]]) { c.beginPath(); c.moveTo(208, -130); c.quadraticCurveTo(208 + dx * 0.6, -130 + dy * 0.4, 208 + dx, -130 + dy); c.stroke(); }
    // румянец
    const blush = (mood === 'happy' ? 0.42 : 0.24) + (pose.blush || 0);
    c.fillStyle = `rgba(240,120,130,${Math.min(0.6, blush)})`; ell(c, 158, -128, 13, 7.5); c.fill();
    if (mood === 'sick') { c.fillStyle = 'rgba(120,200,120,0.25)'; ell(c, 170, -150, 26, 18); c.fill(); }
  }

  /* ---------- главная функция: нарисовать капибару ---------- */
  // app: {fur, stage, outfit:{hat,eyes,neck,body}, vehicle}
  // pose: {t, blink, mood, look, headRot, earRot, walk, lie, hop, mouth, sniff, riding, wheel, prop, forceHat}
  G.drawCapy = function (ctx, app, pose, x, y, s, dir) {
    const st = G.stageById(app.stage);
    const furId = G.FURS[app.fur] ? app.fur : 'classic';
    const pal = G.FURS[furId];
    const S = s * st.scale;
    const res = Math.max(1, Math.min(4, Math.ceil(S * st.head * DPR() * 1.05)));
    const Pt = parts(furId, res, app.stage === 'elder');
    const t = pose.t || 0;
    const lie = pose.lie || 0;
    const outfit = app.outfit || {};
    const veh = pose.riding && app.vehicle ? VEH[app.vehicle] : null;
    const L = st.leg, bx = st.bx, by = st.by, H = st.head;
    let drop = (1 - L) * 52;
    drop += lie * Math.max(0, 30 - drop);
    const lift = veh ? veh.lift : 0;
    const hop = pose.hop || 0;
    const wr = pose.wheel || 0;
    const walk = veh && (veh.tuck || veh.still) ? null : pose.walk;
    const garment = GARMENT[outfit.body];

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(S * (dir || 1), S);

    // тень
    const sh = Math.max(0.35, 1 + hop / 160);
    ctx.fillStyle = 'rgba(20,20,10,0.22)';
    ell(ctx, 30, 2, 150 * sh * bx, 12 * sh); ctx.fill();

    ctx.translate(0, -lift + hop);
    if (veh) veh.back(ctx, wr, t);
    if (garment && garment.back) { ctx.save(); ctx.translate(0, drop); garment.back(ctx); ctx.restore(); }

    const legTuck = veh && veh.tuck ? 1 : lie * 0.85;
    const legSY = L * (1 - legTuck);
    const drawLeg = (partName, hip, phase, sleeve) => {
      if (legSY < 0.05) return;
      ctx.save();
      ctx.scale(bx, legSY);
      if (walk != null) { ctx.translate(hip.x, hip.y); ctx.rotate(Math.sin(walk + phase) * 0.38); ctx.translate(-hip.x, -hip.y); }
      blit(ctx, Pt[partName]);
      const isF = partName.startsWith('legF');
      const fx = isF ? 66 : -84;
      ctx.fillStyle = shade(pal.muzzle, -0.2);
      for (let k = 0; k < (isF ? 4 : 3); k++) { ell(ctx, fx - 11 + k * (isF ? 7.5 : 10), -3, 3.4, 2.4); ctx.fill(); }
      if (sleeve && garment && garment.sleeve) {
        ctx.save(); ctx.clip(isF ? P.legF : P.legB);
        ctx.fillStyle = garment.color; ctx.fillRect(-130, -90, 260, 42);
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-130, -52, 260, 5);
        ctx.restore();
      }
      ctx.restore();
    };
    // дальние лапки
    ctx.save(); ctx.translate(18 * bx, -3);
    drawLeg('legBd', HIP.B, Math.PI, false);
    drawLeg('legFd', HIP.F, 0, false);
    ctx.restore();

    // тело (дышит)
    const breath = Math.sin(t * TAU * (pose.mood === 'sleep' ? 0.16 : 0.28));
    ctx.save();
    ctx.translate(0, -100 + drop);
    ctx.scale(bx, by * (1 + breath * 0.013));
    ctx.translate(0, 100);
    blit(ctx, Pt.body);
    if (garment) {
      ctx.save(); ctx.clip(P.body);
      garment.draw(ctx, t);
      ctx.save(); if (!garment.full) { FRONT(ctx); ctx.clip(); } clothShade(ctx); ctx.restore();
      ctx.restore();
    }
    ctx.restore();

    // ближние лапки
    drawLeg('legB', HIP.B, 0, true);
    drawLeg('legF', HIP.F, Math.PI, true);
    if (garment && garment.skirt) { ctx.save(); ctx.translate(0, drop); garment.skirt(ctx, t); ctx.restore(); }
    if (garment && garment.over) { ctx.save(); ctx.translate(0, drop); garment.over(ctx); ctx.restore(); }

    if (veh) veh.front(ctx, wr, t);

    // голова
    const neckX = NECK.x * bx, neckY = (NECK.y + 100) * by - 100 + drop;
    let hr = (pose.headRot || 0) + lie * 0.1 + (app.stage === 'elder' ? 0.05 : 0) + breath * 0.012;
    ctx.save();
    ctx.translate(neckX, neckY);
    ctx.rotate(hr);
    ctx.scale(H, H);
    ctx.translate(-NECK.x, -NECK.y);
    // ухо (шевелится)
    ctx.save();
    ctx.translate(90, -182); ctx.rotate(pose.earRot || 0); ctx.translate(-90, 182);
    blit(ctx, Pt.ear);
    ctx.fillStyle = shade(pal.muzzle, 0.05); ctx.fill(P.earIn);
    ctx.restore();
    blit(ctx, Pt.head);
    face(ctx, pal, st, pose, app.stage === 'elder');
    const eyes = EYES[outfit.eyes];
    if (eyes) eyes(ctx, st.eye);
    const hatId = pose.forceHat || outfit.hat;
    if (HAT[hatId]) {
      ctx.save(); ctx.translate(128, -196); ctx.rotate(-0.06); ctx.translate(-128, 196);
      HAT[hatId](ctx, t);
      ctx.restore();
    }
    ctx.restore();

    // шея: шарф, колье, бабочка — чуть следуют за головой
    const nk = NECK_ITEMS[outfit.neck];
    if (nk) {
      ctx.save();
      ctx.translate(neckX, neckY); ctx.rotate(hr * 0.5); ctx.scale(bx * Math.sqrt(H), by * Math.sqrt(H)); ctx.translate(-NECK.x, -NECK.y);
      nk(ctx, t);
      ctx.restore();
    }

    // предмет в лапках
    if (pose.prop) {
      const pr = pose.prop;
      ctx.save();
      ctx.translate(pr.x != null ? pr.x : 160, (pr.y != null ? pr.y : -40) + drop);
      ctx.rotate(pr.rot || 0);
      if (dir === -1) ctx.scale(-1, 1);
      ctx.font = `${pr.size || 46}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(pr.emoji, 0, 0);
      ctx.restore();
    }
    if (pose.guitar) drawGuitar(ctx, drop, t);
    ctx.restore();
  };

  function drawGuitar(c, drop, t) {
    c.save();
    c.translate(40, -84 + drop);
    c.rotate(-0.45 + Math.sin(t * 8) * 0.03);
    c.fillStyle = '#c1121f';
    c.beginPath(); c.moveTo(-40, 0); c.bezierCurveTo(-46, -26, -18, -30, -10, -18); c.bezierCurveTo(0, -30, 26, -24, 20, 0); c.bezierCurveTo(26, 24, -2, 30, -10, 18); c.bezierCurveTo(-20, 30, -48, 24, -40, 0); c.fill();
    c.fillStyle = '#f1f1f1'; c.beginPath(); c.roundRect(-24, -8, 22, 16, 3); c.fill();
    c.fillStyle = '#3d2b1f'; c.fillRect(16, -4, 130, 8);
    c.fillStyle = '#222'; c.beginPath(); c.roundRect(144, -9, 22, 18, 4); c.fill();
    c.strokeStyle = 'rgba(230,230,230,0.8)'; c.lineWidth = 0.7;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(-20, i * 1.6); c.lineTo(150, i * 1.6); c.stroke(); }
    c.restore();
  }

  // Мини-портрет (для списков друзей)
  G.renderAvatar = function (canvas, app, opts) {
    const r = Math.min(2, DPR());
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    canvas.width = Math.round(w * r); canvas.height = Math.round(h * r);
    const c = canvas.getContext('2d');
    c.setTransform(r, 0, 0, r, 0, 0);
    c.clearRect(0, 0, w, h);
    const st = G.stageById(app.stage);
    const s = (w / 430) / st.scale * (st.head > 1.2 ? 0.86 : 0.95) * (opts && opts.zoom ? opts.zoom : 1);
    G.drawCapy(c, app, { t: 1, mood: (opts && opts.mood) || 'normal', blink: 0 }, w * 0.38, h * 0.92, s, 1);
  };

  G.HAT_IDS = Object.keys(HAT);
})(window.CAPY);
