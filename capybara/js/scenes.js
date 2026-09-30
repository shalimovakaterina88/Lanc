/* Капи-жизнь · места: дом, парк, школа, онсэн, цирк и т.д. Небо и времена года — по настоящим часам */
'use strict';
(function (G) {
  const TAU = Math.PI * 2;
  const Scenes = (G.Scenes = {});

  const season = () => {
    const m = new Date().getMonth();
    return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
  };
  Scenes.season = season;
  function skyOf(h) {
    if (h < 5 || h >= 22) return { top: '#0c1a2b', bot: '#1f3a5c', night: true, sun: false };
    if (h < 7) return { top: '#6d86bd', bot: '#f6c39e', night: false, sun: true, low: true };
    if (h < 18) return { top: '#62b0dd', bot: '#d4ecf7', night: false, sun: true };
    if (h < 20) return { top: '#4b5694', bot: '#f2a372', night: false, sun: true, low: true };
    return { top: '#1f2657', bot: '#6c4c7c', night: true, sun: false };
  }
  Scenes.skyOf = skyOf;

  // ---------- помощники ----------
  const rr = (c, x, y, w, h, r, fill) => { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } };
  const ell = (c, x, y, rx, ry, fill) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } };
  const emo = (c, e, x, y, size, rot) => {
    c.save(); c.translate(x, y); if (rot) c.rotate(rot);
    c.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, 0, 0); c.restore();
  };
  Scenes.emo = emo;
  const txt = (c, s, x, y, size, col, font, align) => {
    c.fillStyle = col; c.font = `${size}px ${font || '"Marmelad", "Nunito", sans-serif'}`;
    c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y);
  };

  function sky(c, w, gy, env) {
    const s = skyOf(env.hour);
    const g = c.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, s.top); g.addColorStop(1, s.bot);
    c.fillStyle = g; c.fillRect(0, 0, w, gy + 2);
    if (s.night) {
      const r = G.rng(42);
      c.fillStyle = 'rgba(255,255,240,0.85)';
      for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * gy * 0.7; c.fillRect(x, y, r() < 0.2 ? 2 : 1.2, r() < 0.2 ? 2 : 1.2); }
      ell(c, w * 0.8, gy * 0.22, gy * 0.07, gy * 0.07, '#f4efd2');
      ell(c, w * 0.8 + gy * 0.03, gy * 0.2, gy * 0.06, gy * 0.06, s.top);
    } else if (s.sun) {
      const sy = s.low ? gy * 0.62 : gy * 0.2;
      const sg = c.createRadialGradient(w * 0.82, sy, 2, w * 0.82, sy, gy * 0.22);
      sg.addColorStop(0, 'rgba(255,248,210,1)'); sg.addColorStop(0.3, 'rgba(255,230,150,0.8)'); sg.addColorStop(1, 'rgba(255,230,150,0)');
      c.fillStyle = sg; c.fillRect(0, 0, w, gy);
      ell(c, w * 0.82, sy, gy * 0.06, gy * 0.06, s.low ? '#ffd08a' : '#fff6cf');
    }
    return s;
  }
  function clouds(c, w, gy, t, alpha) {
    c.fillStyle = `rgba(255,255,255,${alpha || 0.85})`;
    for (let i = 0; i < 4; i++) {
      const x = ((i * w * 0.37 + t * (6 + i * 3)) % (w + 200)) - 100, y = gy * (0.12 + (i % 3) * 0.1), k = gy * (0.05 + (i % 2) * 0.02);
      c.beginPath();
      c.arc(x, y, k, 0, TAU); c.arc(x + k * 1.1, y - k * 0.4, k * 1.2, 0, TAU); c.arc(x + k * 2.2, y, k * 0.9, 0, TAU);
      c.fill();
    }
  }
  function hills(c, w, gy, col1, col2) {
    c.fillStyle = col1; c.beginPath(); c.moveTo(0, gy);
    for (let x = 0; x <= w; x += w / 12) c.lineTo(x, gy - gy * (0.18 + 0.08 * Math.sin(x / w * 5 + 1)));
    c.lineTo(w, gy); c.fill();
    c.fillStyle = col2; c.beginPath(); c.moveTo(0, gy);
    for (let x = 0; x <= w; x += w / 10) c.lineTo(x, gy - gy * (0.08 + 0.06 * Math.sin(x / w * 7 + 3)));
    c.lineTo(w, gy); c.fill();
  }
  const LEAF = { spring: ['#7fbf5a', '#f5b8cf'], summer: ['#5d9e44', '#4f8a3a'], autumn: ['#e8912c', '#d9642b'], winter: ['#dfe9ef', '#c7d6de'] };
  function tree(c, x, y, s, se) {
    c.fillStyle = '#6b4a31'; c.beginPath(); c.moveTo(x - s * 0.08, y); c.lineTo(x - s * 0.05, y - s * 0.7); c.lineTo(x + s * 0.05, y - s * 0.7); c.lineTo(x + s * 0.08, y); c.fill();
    const [a, b] = LEAF[se];
    const blobs = [[0, -0.95, 0.42], [-0.3, -0.75, 0.32], [0.32, -0.78, 0.33], [0, -1.25, 0.32], [-0.18, -1.1, 0.28], [0.2, -1.12, 0.28]];
    blobs.forEach(([dx, dy, r], i) => ell(c, x + dx * s, y + dy * s, r * s, r * s * 0.92, i % 2 ? a : b));
    if (se === 'winter') { c.fillStyle = '#fff'; blobs.slice(3).forEach(([dx, dy, r]) => ell(c, x + dx * s, y + dy * s - r * s * 0.4, r * s * 0.8, r * s * 0.35, '#ffffff')); }
    if (se === 'spring') { for (let i = 0; i < 10; i++) ell(c, x + Math.cos(i * 2.3) * s * 0.4, y - s + Math.sin(i * 1.7) * s * 0.3, s * 0.03, s * 0.03, '#fff0f5'); }
    if (se === 'autumn' || se === 'summer') { for (let i = 0; i < 5; i++) ell(c, x + Math.cos(i * 2.1) * s * 0.35, y - s * 0.95 + Math.sin(i * 1.3) * s * 0.3, s * 0.035, s * 0.035, se === 'autumn' ? '#f6c64a' : '#e94f37'); }
  }
  function grass(c, w, h, gy, se) {
    const col = se === 'winter' ? ['#e9f1f5', '#d2e0e8'] : se === 'autumn' ? ['#9fb45a', '#86a04a'] : ['#8cc766', '#74b152'];
    const g = c.createLinearGradient(0, gy, 0, h);
    g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
    c.fillStyle = g; c.fillRect(0, gy - 1, w, h - gy + 1);
    const r = G.rng(9);
    c.strokeStyle = se === 'winter' ? 'rgba(170,190,200,0.6)' : 'rgba(60,110,40,0.45)'; c.lineWidth = 1.4;
    for (let i = 0; i < 140; i++) {
      const x = r() * w, y = gy + 4 + r() * (h - gy);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y - 6 - r() * 5); c.moveTo(x, y); c.lineTo(x + 3, y - 5 - r() * 5); c.stroke();
    }
  }
  function flowers(c, w, h, gy, se) {
    if (se === 'winter') return;
    const r = G.rng(3);
    const cols = se === 'autumn' ? ['#f2a541', '#d9642b', '#f6d55c'] : ['#f7f7f7', '#f5b8cf', '#f6d55c', '#b388eb'];
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = gy + 8 + r() * (h - gy - 12), s = 2.2 + r() * 2;
      c.fillStyle = cols[i % cols.length];
      for (let k = 0; k < 5; k++) ell(c, x + Math.cos(k * 1.26) * s, y + Math.sin(k * 1.26) * s, s * 0.7, s * 0.7);
      ell(c, x, y, s * 0.6, s * 0.6, '#f5c518');
    }
  }
  function wall(c, w, gy, col, stripe) {
    c.fillStyle = col; c.fillRect(0, 0, w, gy);
    if (stripe) { c.fillStyle = stripe; for (let x = 0; x < w; x += 28) c.fillRect(x, 0, 12, gy); }
    const g = c.createLinearGradient(0, gy - 40, 0, gy);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.08)');
    c.fillStyle = g; c.fillRect(0, gy - 40, w, 40);
  }
  function floorWood(c, w, h, gy, col) {
    c.fillStyle = col; c.fillRect(0, gy, w, h - gy);
    c.strokeStyle = 'rgba(70,40,20,0.18)'; c.lineWidth = 1;
    const rows = 6;
    for (let i = 1; i <= rows; i++) {
      const y = gy + ((h - gy) * i) / rows;
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
      for (let x = (i % 2) * 60; x < w; x += 120) { c.beginPath(); c.moveTo(x, y - (h - gy) / rows); c.lineTo(x, y); c.stroke(); }
    }
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, gy, w, 4);
  }
  function windowSky(c, x, y, ww, wh, env, curtain) {
    rr(c, x - 6, y - 6, ww + 12, wh + 12, 6, '#f7f3ea');
    c.save(); c.beginPath(); c.rect(x, y, ww, wh); c.clip();
    const s = skyOf(env.hour);
    const g = c.createLinearGradient(0, y, 0, y + wh); g.addColorStop(0, s.top); g.addColorStop(1, s.bot);
    c.fillStyle = g; c.fillRect(x, y, ww, wh);
    if (s.night) { ell(c, x + ww * 0.7, y + wh * 0.3, ww * 0.08, ww * 0.08, '#f4efd2'); }
    else { ell(c, x + ww * 0.25, y + wh * 0.72, ww * 0.35, wh * 0.18, 'rgba(255,255,255,0.8)'); ell(c, x + ww * 0.7, y + wh * 0.25, ww * 0.09, ww * 0.09, '#fff4c4'); }
    tree(c, x + ww * 0.8, y + wh * 1.05, wh * 0.6, env.season);
    c.restore();
    c.fillStyle = '#f7f3ea'; c.fillRect(x + ww / 2 - 3, y, 6, wh); c.fillRect(x, y + wh / 2 - 3, ww, 6);
    if (curtain) {
      c.fillStyle = curtain;
      c.beginPath(); c.moveTo(x - 14, y - 12); c.lineTo(x + ww * 0.22, y - 12); c.quadraticCurveTo(x + ww * 0.05, y + wh * 0.5, x + ww * 0.12, y + wh + 16); c.lineTo(x - 14, y + wh + 16); c.fill();
      c.beginPath(); c.moveTo(x + ww + 14, y - 12); c.lineTo(x + ww * 0.78, y - 12); c.quadraticCurveTo(x + ww * 0.95, y + wh * 0.5, x + ww * 0.88, y + wh + 16); c.lineTo(x + ww + 14, y + wh + 16); c.fill();
      rr(c, x - 20, y - 18, ww + 40, 8, 4, '#8a5a3c');
    }
  }
  // Картина: «шедевр» по зерну
  function painting(c, x, y, pw, ph, seed) {
    rr(c, x - 7, y - 7, pw + 14, ph + 14, 3, '#b8862f');
    rr(c, x - 3, y - 3, pw + 6, ph + 6, 2, '#e3c06e');
    const r = G.rng(seed || 5);
    const kind = Math.floor(r() * 4);
    c.save(); c.beginPath(); c.rect(x, y, pw, ph); c.clip();
    if (kind === 0) { // звёздная ночь
      c.fillStyle = '#1d3b72'; c.fillRect(x, y, pw, ph);
      c.strokeStyle = '#8fb8e8'; c.lineWidth = 2;
      for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(x + r() * pw, y + r() * ph * 0.6, 4 + r() * 10, 0, 4.5); c.stroke(); }
      for (let i = 0; i < 6; i++) ell(c, x + r() * pw, y + r() * ph * 0.5, 3, 3, '#f7e36a');
      c.fillStyle = '#12222d'; c.beginPath(); c.moveTo(x + pw * 0.15, y + ph); c.quadraticCurveTo(x + pw * 0.2, y + ph * 0.2, x + pw * 0.28, y + ph); c.fill();
    } else if (kind === 1) { // подсолнухи
      c.fillStyle = '#e9c46a'; c.fillRect(x, y, pw, ph); c.fillStyle = '#3d7ea6'; c.fillRect(x, y + ph * 0.6, pw, ph);
      for (let i = 0; i < 4; i++) { const fx = x + pw * (0.2 + i * 0.2), fy = y + ph * (0.3 + (i % 2) * 0.15); for (let k = 0; k < 10; k++) ell(c, fx + Math.cos(k * 0.63) * 6, fy + Math.sin(k * 0.63) * 6, 3, 3, '#f4a300'); ell(c, fx, fy, 4, 4, '#6b3e1f'); }
    } else if (kind === 2) { // композиция
      c.fillStyle = '#f5f1e8'; c.fillRect(x, y, pw, ph);
      const cols = ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#e9c46a'];
      for (let i = 0; i < 7; i++) { c.fillStyle = cols[i % 5]; c.beginPath(); c.arc(x + r() * pw, y + r() * ph, 3 + r() * 10, 0, TAU); c.fill(); }
      c.strokeStyle = '#1d1d1d'; c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + r() * pw, y + r() * ph); c.lineTo(x + r() * pw, y + r() * ph); c.stroke(); }
    } else { // портрет капибары
      c.fillStyle = '#5b6b4a'; c.fillRect(x, y, pw, ph);
      ell(c, x + pw * 0.5, y + ph * 0.62, pw * 0.3, ph * 0.3, '#a0703f');
      ell(c, x + pw * 0.56, y + ph * 0.42, pw * 0.22, ph * 0.18, '#9a6a3c');
      ell(c, x + pw * 0.6, y + ph * 0.38, 1.8, 1.8, '#1d130d');
    }
    c.restore();
  }
  Scenes.painting = painting;
  function lampGlow(c, x, y, r, a) {
    const g = c.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(255,214,140,${a})`); g.addColorStop(1, 'rgba(255,214,140,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function fallers(c, w, h, t, se, n) {
    if (se === 'autumn') {
      for (let i = 0; i < (n || 8); i++) {
        const x = (i * 97 + t * 18 + Math.sin(t + i) * 20) % w, y = (i * 53 + t * (22 + i * 3)) % h;
        c.save(); c.translate(x, y); c.rotate(t * 2 + i);
        c.fillStyle = i % 2 ? '#e8912c' : '#d9642b'; c.beginPath(); c.ellipse(0, 0, 5, 2.6, 0, 0, TAU); c.fill(); c.restore();
      }
    } else if (se === 'winter') {
      c.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < (n || 30); i++) { const x = (i * 73 + Math.sin(t * 0.7 + i) * 18 + t * 5) % w, y = (i * 41 + t * (20 + (i % 5) * 6)) % h; c.beginPath(); c.arc(x, y, 1.5 + (i % 3), 0, TAU); c.fill(); }
    } else if (se === 'spring') {
      c.fillStyle = 'rgba(255,200,220,0.9)';
      for (let i = 0; i < (n || 8); i++) { const x = (i * 97 + t * 14) % w, y = (i * 61 + t * (16 + i * 2)) % h; c.beginPath(); c.ellipse(x, y, 3, 2, t + i, 0, TAU); c.fill(); }
    }
  }
  function tiles(c, w, h, gy, a, b) {
    c.fillStyle = a; c.fillRect(0, gy, w, h - gy);
    c.strokeStyle = b; c.lineWidth = 1;
    for (let y = gy; y < h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (let x = -w; x < w * 2; x += 36) { c.beginPath(); c.moveTo(w / 2 + (x - w / 2) * 0.55, gy); c.lineTo(x, h); c.stroke(); }
  }
  function sign(c, x, y, text, bg, fg, size) {
    c.font = `${size}px "Marmelad", "Nunito", sans-serif`;
    const tw = c.measureText(text).width + size * 1.4;
    rr(c, x - tw / 2, y - size * 0.9, tw, size * 1.8, size * 0.5, bg);
    txt(c, text, x, y + 1, size, fg);
  }

  // ---------- сцены ----------
  const DEF = {};
  DEF.home = {
    ground: 0.78,
    static(c, w, h, gy, env) {
      wall(c, w, gy, '#d6e6d8', '#cbdfce');
      c.fillStyle = '#b9d2bf'; c.fillRect(0, gy - h * 0.12, w, h * 0.12);
      c.fillStyle = '#a7c4ae'; c.fillRect(0, gy - h * 0.12, w, 4);
      windowSky(c, w * 0.07, h * 0.1, w * 0.22, h * 0.34, env, '#f2a541');
      if (env.paintingSeed) painting(c, w * 0.42, h * 0.12, w * 0.13, h * 0.17, env.paintingSeed);
      else { rr(c, w * 0.42 - 6, h * 0.12 - 6, w * 0.13 + 12, h * 0.17 + 12, 3, '#8a5a3c'); rr(c, w * 0.42, h * 0.12, w * 0.13, h * 0.17, 2, '#f4efe6'); emo(c, '🍊', w * 0.485, h * 0.205, h * 0.08); }
      // полка
      rr(c, w * 0.66, h * 0.3, w * 0.24, 8, 3, '#8a5a3c');
      emo(c, '🪴', w * 0.69, h * 0.26, h * 0.07);
      emo(c, '📚', w * 0.77, h * 0.265, h * 0.06);
      if (env.trophies) emo(c, '🏆', w * 0.85, h * 0.265, h * 0.06);
      floorWood(c, w, h, gy, '#c99d6e');
      ell(c, w * 0.5, gy + (h - gy) * 0.5, w * 0.32, (h - gy) * 0.36, '#e07a5f');
      ell(c, w * 0.5, gy + (h - gy) * 0.5, w * 0.26, (h - gy) * 0.27, '#f2cc8f');
      ell(c, w * 0.5, gy + (h - gy) * 0.5, w * 0.2, (h - gy) * 0.18, '#e07a5f');
      // лежанка
      ell(c, w * 0.88, gy + (h - gy) * 0.3, w * 0.1, (h - gy) * 0.22, '#7d5ba6');
      ell(c, w * 0.88, gy + (h - gy) * 0.26, w * 0.075, (h - gy) * 0.13, '#a58cd0');
      // миска
      ell(c, w * 0.14, gy + (h - gy) * 0.3, w * 0.04, 7, '#4f86c6'); ell(c, w * 0.14, gy + (h - gy) * 0.28, w * 0.03, 4, '#8cb3e2');
      // игрушки
      const spots = { ball: [0.23, 0.62, 0.05], teddy: [0.79, 0.12, 0.08], blocks: [0.3, 0.85, 0.05], book: [0.62, 0.75, 0.045], guitar: [0.97, -0.3, 0.1], skates: [0.6, -0.55, 0.06], easel: [0.36, -0.12, 0.1], piano: [0.95, 0.6, 0.07], telescope: [0.04, -0.2, 0.09], kite: [0.32, -1.9, 0.07], racket: [0.66, 0.9, 0.05], yogamat: [0.72, 0.9, 0.05], boardgame: [0.2, 0.92, 0.05] };
      for (const id of env.toys || []) {
        const sp = spots[id]; const toy = G.TOYS.find((t) => t.id === id);
        if (!sp || !toy) continue;
        emo(c, toy.icon, w * sp[0], gy + (h - gy) * sp[1], h * sp[2]);
      }
    },
    dyn(c, w, h, gy, t, env) {
      if (skyOf(env.hour).night) {
        c.fillStyle = 'rgba(15,20,50,0.28)'; c.fillRect(0, 0, w, h);
        rr(c, w * 0.6 - 3, gy - h * 0.34, 6, h * 0.34, 2, '#5b4636');
        c.fillStyle = '#f7d488'; c.beginPath(); c.moveTo(w * 0.6 - 18, gy - h * 0.34); c.lineTo(w * 0.6 + 18, gy - h * 0.34); c.lineTo(w * 0.6 + 12, gy - h * 0.42); c.lineTo(w * 0.6 - 12, gy - h * 0.42); c.fill();
        lampGlow(c, w * 0.6, gy - h * 0.34, h * 0.45, 0.35);
      } else {
        c.fillStyle = 'rgba(255,240,200,0.12)';
        c.beginPath(); c.moveTo(w * 0.07, h * 0.1); c.lineTo(w * 0.29, h * 0.1); c.lineTo(w * 0.62, h); c.lineTo(w * 0.24, h); c.fill();
        for (let i = 0; i < 12; i++) { const x = w * 0.2 + ((i * 37 + t * 4) % (w * 0.3)), y = h * 0.3 + ((i * 53 + t * 3) % (h * 0.5)); ell(c, x, y, 1.2, 1.2, 'rgba(255,250,220,0.6)'); }
      }
    },
  };
  DEF.park = {
    ground: 0.72,
    static(c, w, h, gy, env) {
      const s = sky(c, w, gy, env);
      hills(c, w, gy, s.night ? '#27405a' : '#9cc9a0', s.night ? '#1f3549' : '#7fb685');
      tree(c, w * 0.1, gy + 6, h * 0.42, env.season); tree(c, w * 0.3, gy - 4, h * 0.3, env.season); tree(c, w * 0.93, gy + 8, h * 0.46, env.season);
      grass(c, w, h, gy, env.season);
      ell(c, w * 0.72, gy + (h - gy) * 0.3, w * 0.2, (h - gy) * 0.2, env.season === 'winter' ? '#cfe4ef' : '#5aa6c8');
      ell(c, w * 0.7, gy + (h - gy) * 0.26, w * 0.13, (h - gy) * 0.07, 'rgba(255,255,255,0.25)');
      c.fillStyle = '#d8c3a0'; c.beginPath(); c.moveTo(w * 0.36, h); c.quadraticCurveTo(w * 0.45, gy + 20, w * 0.52, gy); c.lineTo(w * 0.56, gy); c.quadraticCurveTo(w * 0.52, gy + 30, w * 0.5, h); c.fill();
      rr(c, w * 0.12, gy + 8, w * 0.14, 8, 3, '#8a5a3c'); rr(c, w * 0.12, gy - 10, w * 0.14, 6, 3, '#8a5a3c');
      rr(c, w * 0.13, gy + 14, 5, 16, 2, '#5b4636'); rr(c, w * 0.25, gy + 14, 5, 16, 2, '#5b4636');
      flowers(c, w, h, gy, env.season);
      if (s.night) { c.fillStyle = 'rgba(10,20,50,0.3)'; c.fillRect(0, 0, w, h); }
    },
    dyn(c, w, h, gy, t, env) {
      const s = skyOf(env.hour);
      clouds(c, w, gy, t, s.night ? 0.15 : 0.85);
      if (env.season !== 'winter') {
        const dx = w * 0.72 + Math.sin(t * 0.3) * w * 0.12, dy = gy + (h - gy) * 0.3;
        emo(c, '🦆', dx, dy - 6, h * 0.05);
      }
      if (s.night) for (let i = 0; i < 10; i++) { const a = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7); ell(c, (i * 97 + Math.sin(t * 0.5 + i) * 30) % w, gy - 20 + Math.sin(t + i) * 30, 2, 2, `rgba(220,255,140,${a})`); }
      fallers(c, w, h, t, env.season);
    },
  };
  DEF.kindergarten = {
    ground: 0.76,
    static(c, w, h, gy, env) {
      wall(c, w, gy, '#fbe7a1', '#f7df8c');
      windowSky(c, w * 0.72, h * 0.12, w * 0.2, h * 0.3, env, '#8fd694');
      const letters = ['А', 'Б', 'В', 'Г', 'Д'], cols = ['#e63946', '#2a9d8f', '#457b9d', '#f4a261', '#9b5de5'];
      letters.forEach((l, i) => { rr(c, w * (0.08 + i * 0.1), h * 0.14, w * 0.07, w * 0.07, 6, cols[i]); txt(c, l, w * (0.115 + i * 0.1), h * 0.14 + w * 0.035, w * 0.045, '#fff'); });
      floorWood(c, w, h, gy, '#d9b27c');
      rr(c, w * 0.18, gy + 10, w * 0.64, (h - gy) * 0.8, 14, '#7cc6a3');
      c.strokeStyle = '#fff'; c.setLineDash([10, 8]); c.lineWidth = 3; c.beginPath(); c.moveTo(w * 0.22, gy + (h - gy) * 0.5); c.lineTo(w * 0.78, gy + (h - gy) * 0.5); c.stroke(); c.setLineDash([]);
      emo(c, '🧸', w * 0.1, gy - 10, h * 0.1); emo(c, '🪀', w * 0.9, gy + 20, h * 0.07); emo(c, '🧩', w * 0.26, gy + 26, h * 0.06);
    },
  };
  DEF.school = {
    ground: 0.76,
    static(c, w, h, gy, env) {
      wall(c, w, gy, '#cfe7e4');
      rr(c, w * 0.2, h * 0.08, w * 0.5, h * 0.36, 8, '#7a5335');
      rr(c, w * 0.21, h * 0.095, w * 0.48, h * 0.33, 4, '#2f5d4a');
      txt(c, env.board || '2 + 3 = 🍊🍊🍊🍊🍊', w * 0.45, h * 0.2, h * 0.055, '#f1f1e6');
      txt(c, 'Урок капибаристики', w * 0.45, h * 0.32, h * 0.04, 'rgba(241,241,230,0.8)');
      windowSky(c, w * 0.8, h * 0.12, w * 0.14, h * 0.28, env);
      emo(c, '🌍', w * 0.1, h * 0.36, h * 0.09);
      emo(c, '🕰️', w * 0.1, h * 0.14, h * 0.07);
      floorWood(c, w, h, gy, '#c39a6b');
      rr(c, w * 0.72, gy - h * 0.12, w * 0.22, h * 0.14, 4, '#9c6b43'); rr(c, w * 0.74, gy + 2, 6, h * 0.1, 2, '#6b4a31'); rr(c, w * 0.91, gy + 2, 6, h * 0.1, 2, '#6b4a31');
      emo(c, '🍎', w * 0.8, gy - h * 0.15, h * 0.05); emo(c, '📚', w * 0.87, gy - h * 0.15, h * 0.05);
    },
  };
  DEF.college = {
    ground: 0.78,
    static(c, w, h, gy, env) {
      wall(c, w, gy, '#8a6446');
      c.fillStyle = '#7a563a'; for (let x = 0; x < w; x += 60) c.fillRect(x, 0, 4, gy);
      rr(c, w * 0.12, h * 0.07, w * 0.76, h * 0.34, 6, '#e9e4d8');
      txt(c, 'E = m·🍊²', w * 0.3, h * 0.17, h * 0.06, '#26415e', '"Nunito", sans-serif');
      txt(c, '∫ капибара dx = счастье', w * 0.62, h * 0.29, h * 0.045, '#26415e', '"Nunito", sans-serif');
      sign(c, w * 0.5, h * 0.48, 'Капи-университет', '#26415e', '#f3e9d2', h * 0.04);
      c.fillStyle = '#5b3f2b';
      for (let i = 0; i < 3; i++) rr(c, 0, gy - h * (0.08 + i * 0.07), w, h * 0.03, 3, '#6e4c33');
      floorWood(c, w, h, gy, '#a7784d');
    },
  };
  DEF.work = {
    ground: 0.78,
    static(c, w, h, gy, env) {
      const job = G.JOBS.find((j) => j.id === env.job) || { color: '#6b8f9c', icon: '💼' };
      wall(c, w, gy, G.shade(job.color, 0.72), G.shade(job.color, 0.66));
      windowSky(c, w * 0.06, h * 0.1, w * 0.2, h * 0.32, env);
      rr(c, w * 0.36, h * 0.08, w * 0.3, h * 0.3, 16, G.shade(job.color, 0.2));
      emo(c, job.icon, w * 0.51, h * 0.2, h * 0.14);
      txt(c, env.jobTitle || 'Работа', w * 0.51, h * 0.33, h * 0.04, '#fff');
      for (let i = 0; i < 3; i++) emo(c, job.icon, w * (0.76 + i * 0.07), h * 0.3, h * 0.05);
      rr(c, w * 0.72, h * 0.34, w * 0.24, 7, 3, '#6b4a31');
      floorWood(c, w, h, gy, '#b98f68');
      rr(c, w * 0.7, gy - h * 0.1, w * 0.26, h * 0.12, 6, '#5c4838');
      emo(c, job.id === 'coder' ? '💻' : job.id === 'jeweler' ? '💍' : '🗂️', w * 0.8, gy - h * 0.14, h * 0.06);
      emo(c, '☕', w * 0.9, gy - h * 0.13, h * 0.045);
    },
  };
  DEF.sport = {
    ground: 0.72,
    static(c, w, h, gy, env) {
      const v = env.variant || 'court';
      if (v === 'rink') {
        wall(c, w, gy, '#d9ecf7');
        for (let i = 0; i < 6; i++) rr(c, w * (0.03 + i * 0.165), h * 0.1, w * 0.14, h * 0.12, 4, ['#e63946', '#1d3557', '#f4a261', '#2a9d8f', '#8338ec', '#ffb703'][i]);
        txt(c, 'Каток «Лёд и мандарин»', w * 0.5, h * 0.34, h * 0.05, '#1d3557');
        c.fillStyle = '#f4fbff'; c.fillRect(0, gy, w, h - gy);
        c.strokeStyle = 'rgba(120,170,210,0.35)'; c.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse(w * 0.5, gy + (h - gy) * 0.6, w * (0.1 + i * 0.07), (h - gy) * (0.1 + i * 0.05), 0, 0, TAU); c.stroke(); }
        c.fillStyle = '#e8f1f7'; c.fillRect(0, gy - 22, w, 22); c.fillStyle = '#1d3557'; c.fillRect(0, gy - 22, w, 4);
      } else if (v === 'pool') {
        wall(c, w, gy, '#e3f2f5');
        c.strokeStyle = 'rgba(80,140,160,0.2)'; for (let x = 0; x < w; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, gy); c.stroke(); } for (let y = 0; y < gy; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
        txt(c, 'Бассейн', w * 0.5, h * 0.14, h * 0.06, '#26667a');
        c.fillStyle = '#4fb3e0'; c.fillRect(0, gy - 10, w, h - gy + 10);
        for (let i = 1; i < 4; i++) { c.fillStyle = i % 2 ? '#e63946' : '#fff'; for (let x = 0; x < w; x += 18) ell(c, x, gy + (h - gy) * i * 0.25, 5, 3); }
      } else if (v === 'gym') {
        wall(c, w, gy, '#e7e5ee');
        rr(c, w * 0.08, h * 0.1, w * 0.4, h * 0.4, 6, '#c9d7e3'); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.moveTo(w * 0.12, h * 0.12); c.lineTo(w * 0.2, h * 0.12); c.lineTo(w * 0.12, h * 0.3); c.fill();
        txt(c, 'Фитнес', w * 0.72, h * 0.16, h * 0.06, '#3d405b');
        c.fillStyle = '#3d405b'; c.fillRect(0, gy, w, h - gy);
        emo(c, '🏋️', w * 0.66, gy - h * 0.12, h * 0.12); emo(c, '🚴', w * 0.86, gy - h * 0.1, h * 0.1);
      } else if (v === 'yoga') {
        wall(c, w, gy, '#f1e9dc');
        windowSky(c, w * 0.08, h * 0.1, w * 0.26, h * 0.34, env);
        emo(c, '🪴', w * 0.84, gy - h * 0.1, h * 0.14); emo(c, '🕯️', w * 0.66, gy - h * 0.06, h * 0.06);
        floorWood(c, w, h, gy, '#d8b58e');
        rr(c, w * 0.26, gy + (h - gy) * 0.35, w * 0.48, (h - gy) * 0.3, 8, '#8fc1a9');
      } else {
        wall(c, w, gy, '#b8d8e8');
        c.fillStyle = '#2f6e57'; c.fillRect(0, gy - h * 0.18, w, h * 0.18);
        for (let x = 0; x < w; x += 10) { c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(x, gy - h * 0.18, 2, h * 0.18); }
        txt(c, 'Корт', w * 0.12, h * 0.14, h * 0.06, '#1d3557');
        c.fillStyle = '#3f8f6b'; c.fillRect(0, gy, w, h - gy);
        c.fillStyle = '#4b73b8'; c.beginPath(); c.moveTo(w * 0.06, h); c.lineTo(w * 0.2, gy + 6); c.lineTo(w * 0.8, gy + 6); c.lineTo(w * 0.94, h); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(w * 0.06, h); c.lineTo(w * 0.2, gy + 6); c.lineTo(w * 0.8, gy + 6); c.lineTo(w * 0.94, h); c.stroke();
        c.beginPath(); c.moveTo(w * 0.5, gy + 6); c.lineTo(w * 0.5, h); c.stroke();
        c.strokeStyle = '#eee'; c.lineWidth = 1;
        for (let x = w * 0.74; x < w * 0.8; x += 4) { c.beginPath(); c.moveTo(x, gy - h * 0.1); c.lineTo(x + w * 0.1, h); c.stroke(); }
        c.fillStyle = '#fff'; c.fillRect(w * 0.73, gy - h * 0.12, 4, h * 0.3);
      }
    },
  };
  DEF.music = {
    ground: 0.74,
    static(c, w, h, gy, env) {
      wall(c, w, gy, '#2a1f36');
      c.fillStyle = '#8b1e2d';
      for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(i * w / 8, 0); c.quadraticCurveTo(i * w / 8 + w / 16, gy * 0.5, i * w / 8, gy); c.lineTo(i * w / 8 + w / 8, gy); c.quadraticCurveTo(i * w / 8 + w / 16, gy * 0.5, i * w / 8 + w / 8, 0); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 8; i++) c.fillRect(i * w / 8 + w / 16 - 2, 0, 4, gy);
      c.fillStyle = '#4a3627'; c.fillRect(0, gy, w, h - gy); c.fillStyle = '#6b4f3a'; c.fillRect(0, gy, w, 6);
      rr(c, w * 0.04, gy - h * 0.22, w * 0.12, h * 0.24, 4, '#1b1b1b'); rr(c, w * 0.055, gy - h * 0.2, w * 0.09, h * 0.14, 4, '#333'); ell(c, w * 0.1, gy - h * 0.13, w * 0.03, w * 0.03, '#111');
      ell(c, w * 0.86, gy - h * 0.06, w * 0.06, h * 0.07, '#c0392b'); ell(c, w * 0.86, gy - h * 0.06, w * 0.045, h * 0.05, '#ecf0f1');
      ell(c, w * 0.94, gy - h * 0.14, w * 0.035, h * 0.015, '#d4a017'); rr(c, w * 0.94 - 1, gy - h * 0.14, 2, h * 0.14, 1, '#aaa');
      txt(c, 'Музыкальная школа «Рок-капи»', w * 0.5, h * 0.1, h * 0.045, '#ffd166');
    },
    dyn(c, w, h, gy, t) {
      for (let i = 0; i < 3; i++) {
        const x = w * (0.25 + i * 0.25) + Math.sin(t * 0.8 + i * 2) * w * 0.06;
        c.fillStyle = ['rgba(255,209,102,0.18)', 'rgba(239,71,111,0.16)', 'rgba(6,214,160,0.16)'][i];
        c.beginPath(); c.moveTo(w * (0.25 + i * 0.25) - 8, 0); c.lineTo(w * (0.25 + i * 0.25) + 8, 0); c.lineTo(x + w * 0.1, gy + 30); c.lineTo(x - w * 0.1, gy + 30); c.fill();
      }
    },
  };
  DEF.art = {
    ground: 0.76,
    static(c, w, h, gy, env) {
      wall(c, w, gy, '#f4f1ea');
      windowSky(c, w * 0.04, h * 0.08, w * 0.22, h * 0.38, env);
      painting(c, w * 0.34, h * 0.1, w * 0.14, h * 0.18, 11);
      painting(c, w * 0.54, h * 0.08, w * 0.12, h * 0.22, 12);
      painting(c, w * 0.72, h * 0.12, w * 0.16, h * 0.15, 21);
      floorWood(c, w, h, gy, '#d7c2a4');
      const r = G.rng(8); const cols = ['#e63946', '#2a9d8f', '#f4a261', '#8338ec', '#ffb703'];
      for (let i = 0; i < 14; i++) ell(c, r() * w, gy + 8 + r() * (h - gy - 10), 4 + r() * 8, 2 + r() * 4, cols[i % 5]);
      c.strokeStyle = '#8a5a3c'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(w * 0.86, gy + 10); c.lineTo(w * 0.9, gy - h * 0.34); c.lineTo(w * 0.94, gy + 10); c.stroke();
      rr(c, w * 0.83, gy - h * 0.3, w * 0.14, h * 0.18, 2, '#fff'); painting(c, w * 0.845, gy - h * 0.285, w * 0.11, h * 0.15, 33);
    },
  };
  DEF.library = {
    ground: 0.78,
    static(c, w, h, gy, env) {
      wall(c, w, gy, '#6d4c3d');
      const r = G.rng(4); const cols = ['#9b2226', '#005f73', '#ee9b00', '#0a9396', '#ae2012', '#94d2bd', '#3d405b', '#e9d8a6'];
      for (let row = 0; row < 4; row++) {
        const y = h * 0.06 + row * gy * 0.22;
        c.fillStyle = '#4a3024'; c.fillRect(0, y + gy * 0.18, w, 6);
        for (let x = 4; x < w - 10;) { const bw = 8 + r() * 10, bh = gy * (0.12 + r() * 0.05); c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(x, y + gy * 0.18 - bh, bw, bh); x += bw + 1 + (r() < 0.08 ? 20 : 0); }
      }
      floorWood(c, w, h, gy, '#8c5f43');
      ell(c, w * 0.5, gy + (h - gy) * 0.5, w * 0.3, (h - gy) * 0.3, '#7a2e2e');
      rr(c, w * 0.82, gy - h * 0.14, w * 0.14, h * 0.18, 12, '#2f5d4a');
      rr(c, w * 0.08, gy - h * 0.26, 4, h * 0.28, 2, '#333');
      c.fillStyle = '#2e7d32'; c.beginPath(); c.moveTo(w * 0.08 - 18, gy - h * 0.24); c.lineTo(w * 0.08 + 22, gy - h * 0.24); c.lineTo(w * 0.08 + 12, gy - h * 0.3); c.lineTo(w * 0.08 - 8, gy - h * 0.3); c.fill();
    },
    dyn(c, w, h, gy) { lampGlow(c, w * 0.08, gy - h * 0.24, h * 0.35, 0.3); },
  };
  DEF.onsen = {
    ground: 0.8,
    static(c, w, h, gy, env) {
      if (env.variant === 'banya') {
        c.fillStyle = '#b07a4a'; c.fillRect(0, 0, w, gy);
        for (let y = 0; y < gy; y += 26) { rr(c, -10, y, w + 20, 24, 12, y % 52 ? '#a36d3f' : '#b98352'); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, y + 22, w, 2); }
        rr(c, w * 0.06, gy - h * 0.36, w * 0.18, h * 0.38, 8, '#3a3a3a'); c.fillStyle = '#7d7d7d'; for (let i = 0; i < 6; i++) ell(c, w * (0.09 + (i % 3) * 0.05), gy - h * 0.38 - Math.floor(i / 3) * 10, 12, 8);
        emo(c, '🌿', w * 0.4, h * 0.2, h * 0.12, 0.6); emo(c, '🪣', w * 0.32, gy - 10, h * 0.08);
        c.fillStyle = '#c99561'; c.fillRect(w * 0.5, gy - h * 0.22, w * 0.5, h * 0.05); c.fillRect(w * 0.55, gy - h * 0.17, 8, h * 0.17); c.fillRect(w * 0.95, gy - h * 0.17, 8, h * 0.17);
        c.fillStyle = '#9a6a3f'; c.fillRect(0, gy, w, h - gy);
        txt(c, 'Русская баня', w * 0.72, h * 0.12, h * 0.05, '#fff1dc');
      } else {
        const s = sky(c, w, gy, env);
        c.fillStyle = '#6b8f4e'; for (let x = 0; x < w; x += 18) { rr(c, x, gy - h * 0.46, 14, h * 0.46, 7, x % 36 ? '#7fa65c' : '#6b8f4e'); }
        c.fillStyle = '#4e6b39'; c.fillRect(0, gy - h * 0.34, w, 5); c.fillRect(0, gy - h * 0.16, w, 5);
        tree(c, w * 0.9, gy - h * 0.3, h * 0.3, env.season);
        c.fillStyle = '#8c8c86'; c.fillRect(0, gy - h * 0.06, w, h);
        const r = G.rng(6);
        for (let i = 0; i < 14; i++) ell(c, (i / 13) * w, gy - h * 0.06 + (r() - 0.5) * 8, 30 + r() * 20, 14 + r() * 6, i % 2 ? '#9a9a93' : '#7c7c76');
        c.fillStyle = '#7fc9bd'; c.fillRect(0, gy - h * 0.02, w, h);
        c.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 6; i++) ell(c, r() * w, gy + r() * (h - gy), 30, 4);
        c.fillStyle = '#9a9a93'; c.fillRect(0, h - 12, w, 12);
        sign(c, w * 0.18, h * 0.12, 'Онсэн ♨', '#8b2f2f', '#fff3e0', h * 0.045);
        if (s.night) { c.fillStyle = 'rgba(10,20,50,0.3)'; c.fillRect(0, 0, w, h); }
      }
    },
    dyn(c, w, h, gy, t, env) {
      for (let i = 0; i < 9; i++) {
        const x = (i / 8) * w + Math.sin(t * 0.6 + i) * 20, y = gy - ((t * 18 + i * 40) % (h * 0.6));
        const a = 0.22 * (1 - ((t * 18 + i * 40) % (h * 0.6)) / (h * 0.6));
        ell(c, x, y, 26, 14, `rgba(255,255,255,${a})`);
      }
      if (env.variant !== 'banya') {
        for (let i = 0; i < 4; i++) G.drawFruit(c, w * (0.12 + i * 0.26) + Math.sin(t * 0.5 + i) * 10, gy + (h - gy) * 0.5 + Math.sin(t * 1.3 + i) * 3, h * 0.025);
        fallers(c, w, h, t, env.season, 6);
      }
    },
  };
  DEF.cafe = {
    ground: 0.76,
    static(c, w, h, gy, env) {
      wall(c, w, gy, '#2f6f73');
      c.fillStyle = '#e8d6b0'; c.fillRect(0, gy - h * 0.2, w, h * 0.2);
      c.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = 0; x < w; x += 22) c.fillRect(x, gy - h * 0.2, 2, h * 0.2);
      sign(c, w * 0.5, h * 0.1, 'Кафе «Мандарин»', '#f2a541', '#2b2118', h * 0.05);
      rr(c, w * 0.06, h * 0.2, w * 0.24, h * 0.3, 6, '#1f2a2c');
      ['Салат ...... 11', 'Суп .......... 13', 'Смузи ....... 14', 'Торт ......... 30'].forEach((s, i) => txt(c, s, w * 0.18, h * (0.26 + i * 0.06), h * 0.032, '#f1e3c6', '"Nunito", sans-serif'));
      rr(c, w * 0.64, gy - h * 0.3, w * 0.33, h * 0.12, 6, '#f7f1e3');
      ['🥐', '🧁', '🍩', '🍰'].forEach((e, i) => emo(c, e, w * (0.68 + i * 0.075), gy - h * 0.24, h * 0.06));
      floorWood(c, w, h, gy, '#b17f59');
      for (let i = 0; i < 3; i++) { c.strokeStyle = '#333'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(w * (0.35 + i * 0.12), 0); c.lineTo(w * (0.35 + i * 0.12), h * 0.2); c.stroke(); c.fillStyle = '#f2a541'; c.beginPath(); c.moveTo(w * (0.35 + i * 0.12) - 14, h * 0.26); c.lineTo(w * (0.35 + i * 0.12) + 14, h * 0.26); c.lineTo(w * (0.35 + i * 0.12) + 6, h * 0.2); c.lineTo(w * (0.35 + i * 0.12) - 6, h * 0.2); c.fill(); }
    },
    dyn(c, w, h) { for (let i = 0; i < 3; i++) lampGlow(c, w * (0.35 + i * 0.12), h * 0.27, h * 0.16, 0.35); },
    front(c, w, h, gy) {
      rr(c, w * 0.84, gy - h * 0.02, w * 0.14, 8, 4, '#6b4a31'); rr(c, w * 0.905, gy + 4, 6, h * 0.2, 2, '#4a3222');
      emo(c, '☕', w * 0.88, gy - h * 0.05, h * 0.06); emo(c, '🍊', w * 0.94, gy - h * 0.045, h * 0.05);
    },
  };
  DEF.cinema = {
    ground: 0.8,
    static(c, w, h, gy) {
      c.fillStyle = '#15121f'; c.fillRect(0, 0, w, h);
      rr(c, w * 0.12, h * 0.06, w * 0.76, h * 0.42, 6, '#dfe6ee');
      c.fillStyle = '#6b1d2a'; c.fillRect(0, 0, w * 0.1, h); c.fillRect(w * 0.9, 0, w * 0.1, h);
      c.fillStyle = '#261e33'; c.fillRect(0, gy, w, h - gy);
    },
    dyn(c, w, h, gy, t, env) {
      c.save(); c.beginPath(); c.rect(w * 0.13, h * 0.07, w * 0.74, h * 0.4); c.clip();
      const g = c.createLinearGradient(w * 0.13, 0, w * 0.87, 0);
      g.addColorStop(0, `hsl(${(t * 20) % 360},70%,65%)`); g.addColorStop(1, `hsl(${(t * 20 + 120) % 360},70%,60%)`);
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const px = w * 0.13 + ((t * 40) % (w * 0.9));
      ell(c, px, h * 0.36, w * 0.06, h * 0.05, 'rgba(60,30,20,0.8)'); ell(c, px + w * 0.05, h * 0.31, w * 0.03, h * 0.03, 'rgba(60,30,20,0.8)');
      G.drawFruit(c, w * 0.6 + Math.sin(t) * w * 0.1, h * 0.18 + Math.abs(Math.sin(t * 2)) * h * 0.08, h * 0.04);
      if (env.movie) txt(c, env.movie, w * 0.5, h * 0.44, h * 0.032, 'rgba(255,255,255,0.9)', '"Nunito", sans-serif');
      c.restore();
      const lg = c.createLinearGradient(0, h * 0.48, 0, h);
      lg.addColorStop(0, 'rgba(200,220,255,0.12)'); lg.addColorStop(1, 'rgba(200,220,255,0)');
      c.fillStyle = lg; c.fillRect(0, h * 0.48, w, h);
    },
    front(c, w, h) {
      c.fillStyle = '#7a1f2e';
      for (let i = 0; i < 7; i++) rr(c, i * w / 6 - w / 14, h * 0.9, w / 7, h * 0.14, 12, '#7a1f2e');
      emo(c, '🍿', w * 0.9, h * 0.86, h * 0.09);
    },
  };
  DEF.circus = {
    ground: 0.78,
    static(c, w, h, gy) {
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#c1121f' : '#fdf0d5'; c.beginPath(); c.moveTo(w / 2, -h * 0.2); c.lineTo((i / 16) * w * 1.6 - w * 0.3, gy); c.lineTo(((i + 1) / 16) * w * 1.6 - w * 0.3, gy); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 0, w, gy);
      c.fillStyle = '#3b1f2b'; c.fillRect(0, gy, w, h - gy);
      ell(c, w * 0.5, gy + (h - gy) * 0.5, w * 0.46, (h - gy) * 0.42, '#f4a300'); ell(c, w * 0.5, gy + (h - gy) * 0.5, w * 0.43, (h - gy) * 0.36, '#c1121f');
      ell(c, w * 0.5, gy + (h - gy) * 0.5, w * 0.4, (h - gy) * 0.3, '#e9d5a1');
      for (let i = 0; i < 12; i++) { c.fillStyle = ['#e63946', '#ffb703', '#2a9d8f'][i % 3]; c.beginPath(); c.moveTo(i * w / 12, h * 0.04); c.lineTo(i * w / 12 + w / 24, h * 0.12); c.lineTo((i + 1) * w / 12, h * 0.04); c.fill(); }
      c.strokeStyle = '#ffe8a3'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, h * 0.04); c.lineTo(w, h * 0.04); c.stroke();
    },
    dyn(c, w, h, gy, t) {
      const sw = Math.sin(t * 1.4) * 0.6;
      c.save(); c.translate(w * 0.3, 0); c.rotate(sw);
      c.strokeStyle = '#ddd'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-12, 0); c.lineTo(-12, h * 0.3); c.moveTo(12, 0); c.lineTo(12, h * 0.3); c.stroke();
      c.fillStyle = '#aaa'; c.fillRect(-16, h * 0.3, 32, 4);
      emo(c, '🤸', 0, h * 0.34, h * 0.07);
      c.restore();
      for (let i = 0; i < 3; i++) { const p = (t * 1.6 + i / 3) % 1; ell(c, w * 0.78 + Math.cos(p * TAU) * w * 0.05, h * 0.36 - Math.abs(Math.sin(p * Math.PI)) * h * 0.18, 6, 6, ['#e63946', '#ffb703', '#2a9d8f'][i]); }
      emo(c, '🤡', w * 0.78, h * 0.45, h * 0.1);
      for (let i = 0; i < 2; i++) { const x = w * (0.3 + i * 0.4) + Math.sin(t * 0.7 + i * 3) * w * 0.15; const g = c.createRadialGradient(x, gy, 4, x, gy, w * 0.14); g.addColorStop(0, 'rgba(255,245,200,0.35)'); g.addColorStop(1, 'rgba(255,245,200,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    },
  };
  DEF.party = {
    ground: 0.78,
    static(c, w, h, gy) {
      c.fillStyle = '#1b1035'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#281a4a'; c.fillRect(0, gy, w, h - gy);
      for (let x = 0; x < w; x += 40) for (let y = gy; y < h; y += 20) { c.fillStyle = ((x / 40 + (y - gy) / 20) % 2) ? '#35235f' : '#2a1b4c'; c.fillRect(x, y, 40, 20); }
      rr(c, w * 0.7, gy - h * 0.2, w * 0.26, h * 0.2, 6, '#111');
      txt(c, 'DJ КАПИ', w * 0.83, gy - h * 0.1, h * 0.05, '#06d6a0');
      c.strokeStyle = '#999'; c.lineWidth = 1; c.beginPath(); c.moveTo(w * 0.5, 0); c.lineTo(w * 0.5, h * 0.1); c.stroke();
    },
    dyn(c, w, h, gy, t) {
      const cols = ['rgba(255,0,110,0.18)', 'rgba(58,134,255,0.18)', 'rgba(255,190,11,0.18)', 'rgba(131,56,236,0.18)'];
      for (let i = 0; i < 4; i++) { const a = Math.sin(t * 0.9 + i * 1.6) * 0.7; c.save(); c.translate(w * (0.15 + i * 0.23), 0); c.rotate(a); c.fillStyle = cols[i]; c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 0); c.lineTo(w * 0.12, h * 1.1); c.lineTo(-w * 0.12, h * 1.1); c.fill(); c.restore(); }
      c.save(); c.translate(w * 0.5, h * 0.14);
      const g = c.createRadialGradient(-5, -5, 2, 0, 0, h * 0.06); g.addColorStop(0, '#fff'); g.addColorStop(1, '#8a8fa3'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, h * 0.06, 0, TAU); c.fill();
      c.restore();
      for (let i = 0; i < 26; i++) { const a = t * 0.8 + i * 0.9; const x = w * 0.5 + Math.cos(a) * w * (0.2 + (i % 5) * 0.08), y = h * 0.14 + Math.abs(Math.sin(a * 0.7 + i)) * h * 0.7; ell(c, x, y, 2.5, 2.5, `hsla(${(i * 40 + t * 60) % 360},90%,70%,0.8)`); }
      for (let i = 0; i < 6; i++) ell(c, w * (0.74 + i * 0.035), gy - h * 0.16, 3, 3, `hsl(${(t * 200 + i * 50) % 360},90%,60%)`);
    },
  };
  DEF.clinic = {
    ground: 0.78,
    static(c, w, h, gy, env) {
      wall(c, w, gy, '#e3f4ef');
      rr(c, w * 0.08, h * 0.1, w * 0.1, w * 0.1, 8, '#fff'); c.fillStyle = '#e63946'; c.fillRect(w * 0.115, h * 0.1 + w * 0.035, w * 0.03, w * 0.03); c.fillRect(w * 0.1, h * 0.1 + w * 0.05 - w * 0.01, w * 0.06, w * 0.02); c.fillRect(w * 0.12, h * 0.1 + w * 0.02, w * 0.02, w * 0.06);
      rr(c, w * 0.3, h * 0.1, w * 0.2, h * 0.24, 6, '#fff'); txt(c, 'Мойте лапки!', w * 0.4, h * 0.16, h * 0.035, '#2a9d8f'); emo(c, '🧼', w * 0.4, h * 0.26, h * 0.08);
      windowSky(c, w * 0.62, h * 0.1, w * 0.16, h * 0.26, env);
      c.fillStyle = '#cfe3dc'; c.fillRect(0, gy, w, h - gy);
      rr(c, w * 0.72, gy - h * 0.12, w * 0.26, h * 0.1, 8, '#fff'); rr(c, w * 0.72, gy - h * 0.18, w * 0.06, h * 0.08, 6, '#f1faee'); rr(c, w * 0.73, gy - h * 0.02, 6, h * 0.1, 2, '#9aa'); rr(c, w * 0.95, gy - h * 0.02, 6, h * 0.1, 2, '#9aa');
      emo(c, '🪴', w * 0.04, gy - 18, h * 0.1);
    },
  };
  DEF.dacha = {
    ground: 0.7,
    static(c, w, h, gy, env) {
      const s = sky(c, w, gy, env);
      c.fillStyle = '#9a6b43'; c.fillRect(w * 0.04, gy - h * 0.34, w * 0.3, h * 0.34);
      for (let y = gy - h * 0.34; y < gy; y += 12) { c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(w * 0.04, y, w * 0.3, 2); }
      c.fillStyle = '#7b3f2e'; c.beginPath(); c.moveTo(w * 0.01, gy - h * 0.33); c.lineTo(w * 0.19, gy - h * 0.52); c.lineTo(w * 0.37, gy - h * 0.33); c.fill();
      rr(c, w * 0.12, gy - h * 0.26, w * 0.08, h * 0.1, 3, '#cfe8f5'); c.strokeStyle = '#f7f3ea'; c.lineWidth = 3; c.strokeRect(w * 0.12, gy - h * 0.26, w * 0.08, h * 0.1);
      tree(c, w * 0.88, gy + 4, h * 0.4, env.season);
      grass(c, w, h, gy, env.season);
      c.fillStyle = '#8f6a45'; for (let x = w * 0.4; x < w; x += 16) rr(c, x, gy - h * 0.1, 10, h * 0.12, 3, '#c49a6c');
      c.fillStyle = '#b08968'; c.fillRect(w * 0.4, gy - h * 0.07, w * 0.6, 4);
      for (let row = 0; row < 2; row++) { rr(c, w * 0.42, gy + (h - gy) * (0.2 + row * 0.35), w * 0.5, (h - gy) * 0.22, 8, '#6b4a31'); for (let i = 0; i < 6; i++) emo(c, row ? '🥬' : (env.season === 'autumn' ? '🎃' : '🥕'), w * (0.46 + i * 0.08), gy + (h - gy) * (0.28 + row * 0.35), h * 0.05); }
      if (env.season !== 'winter') for (let i = 0; i < 3; i++) emo(c, '🌻', w * (0.36 + i * 0.03), gy - h * 0.06, h * 0.07);
      if (s.night) { c.fillStyle = 'rgba(10,20,50,0.3)'; c.fillRect(0, 0, w, h); }
    },
    dyn(c, w, h, gy, t, env) {
      clouds(c, w, gy, t, skyOf(env.hour).night ? 0.15 : 0.8);
      if (env.season !== 'winter') for (let i = 0; i < 2; i++) emo(c, '🦋', w * (0.5 + i * 0.2) + Math.sin(t * 0.8 + i) * w * 0.1, gy - h * 0.1 + Math.sin(t * 2.3 + i) * h * 0.06, h * 0.04);
      fallers(c, w, h, t, env.season, 5);
    },
  };
  DEF.square = {
    ground: 0.62,
    static(c, w, h, gy, env) {
      const s = sky(c, w, gy, env);
      const r = G.rng(12);
      for (let i = 0; i < 9; i++) { const bw = w * (0.08 + r() * 0.06), bh = gy * (0.35 + r() * 0.35), x = (i / 9) * w; rr(c, x, gy - bh, bw, bh + 2, 3, ['#c9ada7', '#9a8c98', '#b7b7a4', '#a5a58d', '#cb997e'][i % 5]); c.fillStyle = s.night ? 'rgba(255,220,140,0.8)' : 'rgba(255,255,255,0.55)'; for (let yy = gy - bh + 10; yy < gy - 10; yy += 18) for (let xx = x + 6; xx < x + bw - 8; xx += 14) c.fillRect(xx, yy, 7, 9); }
      tiles(c, w, h, gy, s.night ? '#6f6a74' : '#d9cfc1', s.night ? '#5d5862' : '#c4b8a8');
      ell(c, w * 0.5, gy + (h - gy) * 0.12, w * 0.16, (h - gy) * 0.1, '#9aa7ae'); ell(c, w * 0.5, gy + (h - gy) * 0.1, w * 0.14, (h - gy) * 0.07, '#6fb6d6');
      rr(c, w * 0.495, gy - h * 0.14, w * 0.01, h * 0.16, 2, '#9aa7ae'); ell(c, w * 0.5, gy - h * 0.14, w * 0.04, h * 0.012, '#9aa7ae');
      for (const x of [0.06, 0.94]) { rr(c, w * x - 2, gy - h * 0.3, 4, h * 0.34, 2, '#333'); ell(c, w * x, gy - h * 0.31, 8, 10, s.night ? '#ffe39a' : '#eee'); }
      if (s.night) { c.fillStyle = 'rgba(10,20,50,0.25)'; c.fillRect(0, 0, w, h); }
    },
    dyn(c, w, h, gy, t, env) {
      c.strokeStyle = 'rgba(200,235,255,0.8)'; c.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; const dx = Math.cos(a) * w * 0.07; c.beginPath(); c.moveTo(w * 0.5, gy - h * 0.14); c.quadraticCurveTo(w * 0.5 + dx * 0.6, gy - h * 0.22 - Math.sin(t * 3 + i) * 3, w * 0.5 + dx, gy + (h - gy) * 0.08); c.stroke(); }
      if (skyOf(env.hour).night) for (const x of [0.06, 0.94]) lampGlow(c, w * x, gy - h * 0.31, h * 0.25, 0.4);
      else clouds(c, w, gy * 0.6, t, 0.7);
      fallers(c, w, h, t, env.season, 6);
    },
  };

  // ---------- кэш статичного фона ----------
  const cache = new Map();
  Scenes.ground = (place) => (DEF[place] || DEF.home).ground;
  Scenes.draw = function (ctx, place, w, h, t, env) {
    const d = DEF[place] || DEF.home;
    const gy = h * d.ground;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const key = [place, env.variant || '', Math.round(w), Math.round(h), env.hour, env.season, env.key || ''].join('|');
    let cv = cache.get(key);
    if (!cv) {
      cv = document.createElement('canvas');
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      const c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      d.static(c, w, h, gy, env);
      if (cache.size > 12) cache.delete(cache.keys().next().value);
      cache.set(key, cv);
    }
    ctx.drawImage(cv, 0, 0, w, h);
    if (d.dyn) d.dyn(ctx, w, h, gy, t, env);
  };
  Scenes.front = function (ctx, place, w, h, t, env) {
    const d = DEF[place] || DEF.home;
    if (d.front) d.front(ctx, w, h, h * d.ground, t, env);
  };
  Scenes.clear = () => cache.clear();

  // Вода поверх капибары (онсэн, бассейн, пруд)
  Scenes.water = function (c, x0, x1, y, depth, t, col) {
    c.save();
    c.fillStyle = col || 'rgba(120,200,190,0.82)';
    c.beginPath(); c.moveTo(x0, y);
    for (let x = x0; x <= x1; x += 8) c.lineTo(x, y + Math.sin(x * 0.05 + t * 2) * 3);
    c.lineTo(x1, y + depth); c.lineTo(x0, y + depth); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; c.beginPath();
    for (let x = x0; x <= x1; x += 8) (x === x0 ? c.moveTo(x, y + Math.sin(x * 0.05 + t * 2) * 3) : c.lineTo(x, y + Math.sin(x * 0.05 + t * 2) * 3));
    c.stroke();
    c.restore();
  };
  Scenes.tub = function (c, cx, y, s, t) {
    c.save();
    c.fillStyle = '#9ad1e8'; c.fillRect(cx - 180 * s, y - 70 * s, 380 * s, 20 * s);
    for (let i = 0; i < 16; i++) { const a = t * 1.5 + i; ell(c, cx - 160 * s + ((i * 27) % 360) * s, y - 76 * s + Math.sin(a) * 4 * s, (8 + (i % 3) * 4) * s, (7 + (i % 3) * 3) * s, 'rgba(255,255,255,0.92)'); }
    c.fillStyle = '#f5f7fa'; c.beginPath(); c.roundRect(cx - 190 * s, y - 64 * s, 400 * s, 70 * s, [6 * s, 6 * s, 40 * s, 40 * s]); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(cx - 190 * s, y - 20 * s, 400 * s, 26 * s);
    rr(c, cx - 150 * s, y + 4 * s, 18 * s, 14 * s, 5 * s, '#d4a017'); rr(c, cx + 150 * s, y + 4 * s, 18 * s, 14 * s, 5 * s, '#d4a017');
    c.restore();
  };
})(window.CAPY);
