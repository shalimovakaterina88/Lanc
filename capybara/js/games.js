/* Капи-жизнь · мини-игры: мандаринки, урок, теннис, электрогитара, фигурное катание */
'use strict';
(function (G) {
  const Games = (G.Games = {});
  const W = 360, H = 400;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  function makeCanvas(host) {
    const cv = el('canvas', 'mg-canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.setAttribute('role', 'img');
    host.appendChild(cv);
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const toLocal = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; };
    return { cv, c, toLocal };
  }
  function hud(c, left, right) {
    c.fillStyle = 'rgba(20,30,30,0.55)';
    c.beginPath(); c.roundRect(8, 8, W - 16, 30, 15); c.fill();
    c.fillStyle = '#fff'; c.font = '600 15px "Nunito", sans-serif'; c.textBaseline = 'middle';
    c.textAlign = 'left'; c.fillText(left, 20, 23);
    c.textAlign = 'right'; c.fillText(right, W - 20, 23);
  }
  function banner(c, text, col) {
    c.fillStyle = col || '#fff'; c.font = '26px "Marmelad", "Nunito", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,0.35)'; c.strokeText(text, W / 2, H * 0.4); c.fillText(text, W / 2, H * 0.4);
  }

  // Общий каркас: цикл анимации, выход, результат
  function runLoop(host, opts, game) {
    return new Promise((resolve) => {
      const wrap = el('div', 'mg');
      host.appendChild(wrap);
      const top = el('div', 'mg-top');
      const hint = el('p', 'mg-hint', game.hint);
      const quit = el('button', 'btn btn-ghost btn-sm', 'Закончить');
      top.append(hint, quit);
      wrap.appendChild(top);
      const k = makeCanvas(wrap);
      const extra = el('div', 'mg-extra'); wrap.appendChild(extra);
      let done = false, last = performance.now(), raf = 0;
      const api = { c: k.c, cv: k.cv, toLocal: k.toLocal, extra, opts, t: 0, end };
      function end() {
        if (done) return;
        done = true; cancelAnimationFrame(raf);
        game.cleanup && game.cleanup(api);
        const res = game.result(api);
        resolve(res);
      }
      quit.addEventListener('click', end);
      game.init(api);
      const frame = (now) => {
        if (done) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; api.t += dt;
        game.update(api, dt);
        game.draw(api);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
  }

  /* ---------- 1. Лови мандаринки ---------- */
  Games.catch = (host, opts) => runLoop(host, opts, {
    hint: 'Води капибару пальцем или стрелками. Лови фрукты, уворачивайся от пчёл!',
    init(a) {
      a.x = W / 2; a.tx = W / 2; a.items = []; a.score = 0; a.time = 30; a.spawn = 0; a.stun = 0; a.dir = 1; a.pops = [];
      const move = (e) => { a.tx = Math.max(40, Math.min(W - 40, a.toLocal(e).x)); };
      a.cv.addEventListener('pointermove', move); a.cv.addEventListener('pointerdown', move);
      a.key = (e) => { if (e.key === 'ArrowLeft') a.tx = Math.max(40, a.x - 70); if (e.key === 'ArrowRight') a.tx = Math.min(W - 40, a.x + 70); };
      window.addEventListener('keydown', a.key);
    },
    cleanup(a) { window.removeEventListener('keydown', a.key); },
    update(a, dt) {
      a.time -= dt;
      if (a.time <= 0) return a.end();
      if (a.stun > 0) a.stun -= dt; else { const dx = a.tx - a.x; a.x += dx * Math.min(1, dt * 9); if (Math.abs(dx) > 2) a.dir = dx > 0 ? 1 : -1; }
      a.spawn -= dt;
      if (a.spawn <= 0) {
        a.spawn = 0.45 + Math.random() * 0.35 - (30 - a.time) * 0.006;
        const r = Math.random();
        const type = r < 0.5 ? ['🍊', 1] : r < 0.68 ? ['🍎', 2] : r < 0.78 ? ['🍉', 3] : r < 0.88 ? ['🥕', 1] : ['🐝', -2];
        a.items.push({ x: 20 + Math.random() * (W - 40), y: -20, vy: 90 + Math.random() * 60 + (30 - a.time) * 3, e: type[0], v: type[1], wob: Math.random() * 6 });
      }
      for (const it of a.items) {
        it.y += it.vy * dt; if (it.e === '🐝') it.x += Math.sin(a.t * 4 + it.wob) * 60 * dt;
        if (!it.gone && it.y > H - 110 && it.y < H - 60 && Math.abs(it.x - a.x) < 52) {
          it.gone = true; a.score = Math.max(0, a.score + it.v);
          a.pops.push({ x: it.x, y: it.y, s: it.v > 0 ? '+' + it.v : String(it.v), life: 0.8, col: it.v > 0 ? '#fff3b0' : '#ffb3b3' });
          if (it.v < 0) a.stun = 0.6;
          opts.sound && opts.sound(it.v > 0 ? 'pop' : 'bump');
        }
      }
      a.items = a.items.filter((i) => !i.gone && i.y < H + 30);
      for (const p of a.pops) { p.life -= dt; p.y -= 40 * dt; }
      a.pops = a.pops.filter((p) => p.life > 0);
    },
    draw(a) {
      const c = a.c;
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fd0f0'); g.addColorStop(0.72, '#dff3fb'); g.addColorStop(0.72, '#8cc766'); g.addColorStop(1, '#6aa84f');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      G.drawCapy(c, opts.app, { t: a.t, mood: a.stun > 0 ? 'sad' : 'happy', walk: a.t * 10, headRot: -0.15 }, a.x - 20 * a.dir, H - 30, 0.42 / G.stageById(opts.app.stage).scale * 0.8, a.dir);
      c.font = '30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const it of a.items) c.fillText(it.e, it.x, it.y);
      for (const p of a.pops) { c.globalAlpha = Math.max(0, p.life / 0.8); c.fillStyle = p.col; c.font = '700 20px "Nunito", sans-serif'; c.fillText(p.s, p.x, p.y); c.globalAlpha = 1; }
      hud(c, `🍊 ${a.score}`, `⏱ ${Math.ceil(a.time)}`);
    },
    result(a) { return { score: a.score, ratio: Math.min(1, a.score / 28), text: `Поймано очков: ${a.score}` }; },
  });

  /* ---------- 2. Урок (викторина) ---------- */
  function qCount() { const n = ri(2, 6); const e = ['🍊', '🥕', '🍎', '🌽', '🧸'][ri(0, 4)]; return { q: `Сколько тут? ${e.repeat(n)}`, a: [n, n + 1, n - 1].map(String), c: 0 }; }
  function qAdd(max) { const x = ri(1, max), y = ri(1, max); return { q: `${x} + ${y} = ?`, a: [x + y, x + y + 1, x + y - 2].map(String), c: 0 }; }
  function qSub(max) { const x = ri(5, max), y = ri(1, x - 1); return { q: `${x} − ${y} = ?`, a: [x - y, x - y + 2, x - y - 1].map(String), c: 0 }; }
  function qMul() { const x = ri(2, 9), y = ri(2, 9); return { q: `${x} × ${y} = ?`, a: [x * y, x * y + x, x * y - y].map(String), c: 0 }; }
  function qEq() { const x = ri(3, 20), b = ri(2, 15); return { q: `x + ${b} = ${x + b}. Чему равен x?`, a: [x, x + 1, b].map(String), c: 0 }; }
  function qPct() { const p = [10, 20, 25, 50][ri(0, 3)], n = [40, 80, 120, 200, 360][ri(0, 4)]; return { q: `${p}% от ${n} — это сколько?`, a: [n * p / 100, n * p / 100 + 10, n / 2 + 5].map(String), c: 0 }; }
  const FACTS = {
    baby: [
      { q: 'Какого цвета мандарин?', a: ['Оранжевый', 'Синий', 'Зелёный'], c: 0 },
      { q: 'Кто говорит «мяу»?', a: ['Кошка', 'Корова', 'Рыбка'], c: 0 },
      { q: 'Что капибары любят больше всего?', a: ['Травку и воду', 'Снег', 'Шум'], c: 0 },
      { q: 'Сколько лапок у капибары?', a: ['4', '2', '6'], c: 0 },
      { q: 'Какая фигура круглая?', a: ['Мячик ⚽', 'Кубик 🧱', 'Книжка 📖'], c: 0 },
    ],
    kid: [
      { q: 'Капибары отлично умеют…', a: ['плавать', 'летать', 'лазать по деревьям'], c: 0 },
      { q: 'Какой месяц идёт после марта?', a: ['Апрель', 'Май', 'Февраль'], c: 0 },
      { q: 'Сколько дней в неделе?', a: ['7', '5', '10'], c: 0 },
      { q: 'Где в природе живут капибары?', a: ['В Южной Америке', 'В Антарктиде', 'На Луне'], c: 0 },
      { q: 'Какой инструмент с шестью струнами?', a: ['Гитара', 'Барабан', 'Флейта'], c: 0 },
      { q: 'Что нужно, чтобы кататься на льду?', a: ['Коньки', 'Ласты', 'Зонтик'], c: 0 },
      { q: 'Сколько очков нужно, чтобы выиграть гейм в теннисе после 40?', a: ['Ещё одно', 'Ещё десять', 'Нисколько'], c: 0 },
    ],
    teen: [
      { q: 'Капибара — самый крупный…', a: ['грызун', 'кот', 'кенгуру'], c: 0 },
      { q: 'Кто написал «Звёздную ночь»?', a: ['Ван Гог', 'Моне', 'Шишкин'], c: 0 },
      { q: '«Чёрный квадрат» — картина…', a: ['Малевича', 'Репина', 'Дали'], c: 0 },
      { q: 'Сколько игроков на корте в одиночном теннисе?', a: ['2', '4', '6'], c: 0 },
      { q: 'Какой элемент в фигурном катании называют «ласточкой»?', a: ['Спираль', 'Тулуп', 'Аксель'], c: 0 },
      { q: 'Какая часть мозга отвечает за равновесие?', a: ['Мозжечок', 'Хрусталик', 'Печень'], c: 0 },
      { q: 'Что помогает закрепить новую привычку?', a: ['Повторение', 'Случайность', 'Скука'], c: 0 },
    ],
    adult: [
      { q: 'Кто написал «Девочку с персиками»?', a: ['Серов', 'Левитан', 'Айвазовский'], c: 0 },
      { q: 'Проба серебра 925 означает…', a: ['92,5% серебра', '925 грамм', '9 карат'], c: 0 },
      { q: 'Сколько примерно нейронов в мозге человека?', a: ['86 миллиардов', '86 тысяч', '86 штук'], c: 0 },
      { q: 'Столица Бразилии, родины капибар?', a: ['Бразилиа', 'Рио-де-Жанейро', 'Сан-Паулу'], c: 0 },
      { q: 'Что такое нейропластичность?', a: ['Способность мозга меняться', 'Вид пластилина', 'Болезнь кожи'], c: 0 },
      { q: 'Импрессионизм начался в…', a: ['Франции', 'Японии', 'Бразилии'], c: 0 },
      { q: '«Мышление роста» — идея психолога…', a: ['Кэрол Дуэк', 'Зигмунда Фрейда', 'Ивана Павлова'], c: 0 },
    ],
  };
  function makeQuiz(stage, boost) {
    const lvl = Math.min(4, G.stageIdx(stage) + (boost || 0));
    const pool = [];
    const facts = FACTS[['baby', 'kid', 'teen', 'adult', 'adult'][lvl]].slice();
    shuffle(facts);
    for (let i = 0; i < 5; i++) {
      const useFact = i % 2 === 1 && facts.length;
      if (useFact) { pool.push(facts.pop()); continue; }
      if (lvl === 0) pool.push(qCount());
      else if (lvl === 1) pool.push(Math.random() < 0.5 ? qAdd(9) : qSub(15));
      else if (lvl === 2) pool.push([qMul, () => qAdd(50), qEq][ri(0, 2)]());
      else pool.push([qPct, qEq, qMul][ri(0, 2)]());
    }
    return pool.map((q) => { const opts = q.a.map((t, i) => ({ t, ok: i === q.c })); const uniq = []; for (const o of opts) if (!uniq.some((u) => u.t === o.t)) uniq.push(o); return { q: q.q, opts: shuffle(uniq) }; });
  }
  Games.quiz = (host, opts) => new Promise((resolve) => {
    const qs = makeQuiz(opts.app.stage, opts.boost);
    let i = 0, score = 0;
    const wrap = el('div', 'quiz'); host.appendChild(wrap);
    const prog = el('div', 'quiz-prog'); const qEl = el('p', 'quiz-q'); const ans = el('div', 'quiz-ans'); const fb = el('p', 'quiz-fb');
    wrap.append(prog, qEl, ans, fb);
    const show = () => {
      if (i >= qs.length) return resolve({ score, ratio: score / qs.length, text: `Правильных ответов: ${score} из ${qs.length}` });
      prog.textContent = `Вопрос ${i + 1} из ${qs.length} · верно: ${score}`;
      qEl.textContent = qs[i].q; ans.innerHTML = ''; fb.textContent = '';
      qs[i].opts.forEach((o) => {
        const b = el('button', 'btn quiz-btn', o.t);
        b.addEventListener('click', () => {
          [...ans.children].forEach((x) => (x.disabled = true));
          if (o.ok) { score++; b.classList.add('ok'); fb.textContent = ['Верно!', 'Умница!', 'Точно!', 'Отлично!'][ri(0, 3)]; opts.sound && opts.sound('pop'); }
          else { b.classList.add('bad'); fb.textContent = 'Почти! Правильный ответ: ' + qs[i].opts.find((x) => x.ok).t; [...ans.children].find((x) => x.textContent === qs[i].opts.find((y) => y.ok).t).classList.add('ok'); opts.sound && opts.sound('bump'); }
          setTimeout(() => { i++; show(); }, o.ok ? 700 : 1500);
        });
        ans.appendChild(b);
      });
    };
    show();
  });

  /* ---------- 3. Теннис ---------- */
  Games.tennis = (host, opts) => runLoop(host, opts, {
    hint: 'Жми по экрану или пробел, когда мяч у ракетки. 10 подач.',
    init(a) {
      a.ball = 0; a.score = 0; a.p = -0.3; a.dur = 1.35; a.msg = ''; a.msgT = 0; a.back = 0; a.swing = 0;
      const pw = opts.hasToy ? 0.05 : 0.035, gw = opts.hasToy ? 0.11 : 0.08;
      a.hit = () => {
        if (a.p < 0.55 || a.back > 0) return;
        a.swing = 0.25;
        const d = Math.abs(a.p - 0.92);
        if (d < pw) { a.score += 2; a.msg = 'Эйс! +2'; } else if (d < gw) { a.score += 1; a.msg = 'Хорошо! +1'; } else { a.msg = 'Мимо'; }
        a.msgT = 0.8; opts.sound && opts.sound(d < gw ? 'pop' : 'bump');
        if (d < gw) a.back = 0.001; else next(a);
      };
      a.cv.addEventListener('pointerdown', a.hit);
      a.key = (e) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); a.hit(); } };
      window.addEventListener('keydown', a.key);
      function next(b) { b.ball++; b.p = -0.4; b.dur = Math.max(0.75, 1.35 - b.ball * 0.06); if (b.ball >= 10) b.end(); }
      a.next = next;
    },
    cleanup(a) { window.removeEventListener('keydown', a.key); },
    update(a, dt) {
      if (a.msgT > 0) a.msgT -= dt;
      if (a.swing > 0) a.swing -= dt;
      if (a.back > 0) { a.back += dt * 1.6; if (a.back >= 1) { a.back = 0; a.next(a); } return; }
      a.p += dt / a.dur;
      if (a.p > 1.06) { a.msg = 'Мимо'; a.msgT = 0.8; a.next(a); }
    },
    draw(a) {
      const c = a.c;
      c.fillStyle = '#b8d8e8'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#4b73b8'; c.fillRect(0, H * 0.62, W, H);
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, H * 0.62); c.lineTo(W, H * 0.62); c.stroke();
      c.fillStyle = '#eee'; c.fillRect(W * 0.62, H * 0.45, 3, H * 0.2);
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; for (let y = H * 0.47; y < H * 0.62; y += 6) { c.beginPath(); c.moveTo(W * 0.62, y); c.lineTo(W * 0.64, y + 8); c.stroke(); }
      const cx = 70;
      G.drawCapy(c, opts.app, { t: a.t, mood: a.msg.startsWith('Мимо') && a.msgT > 0 ? 'sad' : 'normal', headRot: -0.1, prop: { emoji: '🏸', x: 210, y: -230 - (a.swing > 0 ? 40 : 0), size: 70, rot: a.swing > 0 ? -1.4 : -0.4 } }, cx, H * 0.78, 0.46 / G.stageById(opts.app.stage).scale * 0.8, 1);
      // мяч
      let bx, by;
      if (a.back > 0) { bx = 150 + a.back * (W - 150); by = H * 0.62 - Math.sin(a.back * Math.PI) * 150; }
      else { const p = Math.max(0, a.p); bx = W - 20 - p * (W - 150); by = H * 0.66 - Math.sin(Math.min(1, p) * Math.PI) * 150; }
      c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(bx, H * 0.64, 8, 3, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#d7f542'; c.beginPath(); c.arc(bx, by, 9, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.arc(bx - 4, by, 7, -1, 1); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.setLineDash([4, 4]); c.beginPath(); c.arc(150, H * 0.66 - 38, 26, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      if (a.msgT > 0) banner(c, a.msg, a.msg.startsWith('Мимо') ? '#ffd0d0' : '#fff7b0');
      hud(c, `🎾 ${a.score}`, `Подача ${Math.min(10, a.ball + 1)}/10`);
    },
    result(a) { return { score: a.score, ratio: Math.min(1, a.score / 14), text: `Очков в матче: ${a.score}` }; },
  });

  /* ---------- 4. Электрогитара (ритм) ---------- */
  Games.guitar = (host, opts) => runLoop(host, opts, {
    hint: 'Жми на струну, когда нота на линии. Клавиши: A S D или ← ↓ →',
    init(a) {
      a.notes = []; a.score = 0; a.combo = 0; a.time = 25; a.beat = 0; a.flash = [0, 0, 0]; a.msg = ''; a.msgT = 0;
      const lanes = el('div', 'mg-lanes');
      const cols = ['#ef476f', '#ffd166', '#06d6a0'];
      a.hitLane = (i) => {
        a.flash[i] = 0.15;
        const hy = H - 70, win = opts.hasToy ? 30 : 22;
        let best = null;
        for (const n of a.notes) if (n.lane === i && !n.hit && Math.abs(n.y - hy) < win) if (!best || Math.abs(n.y - hy) < Math.abs(best.y - hy)) best = n;
        if (best) { best.hit = true; a.combo++; const pts = Math.abs(best.y - hy) < 10 ? 2 : 1; a.score += pts; a.msg = pts === 2 ? 'Идеально!' : 'Есть!'; a.msgT = 0.4; opts.sound && opts.sound('note' + i); }
        else { a.combo = 0; opts.sound && opts.sound('bump'); }
      };
      cols.forEach((col, i) => { const b = el('button', 'lane-btn'); b.style.setProperty('--lane', col); b.setAttribute('aria-label', 'Струна ' + (i + 1)); b.addEventListener('pointerdown', (e) => { e.preventDefault(); a.hitLane(i); }); lanes.appendChild(b); });
      a.extra.appendChild(lanes);
      a.key = (e) => { const m = { a: 0, s: 1, d: 2, ф: 0, ы: 1, в: 2, ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2, j: 0, k: 1, l: 2 }; const k = m[e.key]; if (k != null) { e.preventDefault(); a.hitLane(k); } };
      window.addEventListener('keydown', a.key);
      a.cols = cols;
    },
    cleanup(a) { window.removeEventListener('keydown', a.key); },
    update(a, dt) {
      a.time -= dt; if (a.time <= 0) return a.end();
      a.beat -= dt;
      if (a.beat <= 0) { a.beat = 0.5 - Math.min(0.15, (25 - a.time) * 0.006); a.notes.push({ lane: ri(0, 2), y: -10 }); if (Math.random() < 0.15) a.notes.push({ lane: ri(0, 2), y: -40 }); }
      for (const n of a.notes) { n.y += 190 * dt; if (!n.hit && !n.missed && n.y > H - 40) { n.missed = true; a.combo = 0; } }
      a.notes = a.notes.filter((n) => n.y < H + 20 && !n.hit);
      a.flash = a.flash.map((f) => Math.max(0, f - dt));
      if (a.msgT > 0) a.msgT -= dt;
    },
    draw(a) {
      const c = a.c;
      c.fillStyle = '#1e1530'; c.fillRect(0, 0, W, H);
      G.drawCapy(c, opts.app, { t: a.t, mood: 'happy', guitar: true, headRot: Math.sin(a.t * 8) * 0.06 }, W * 0.2, H * 0.36, 0.3 / G.stageById(opts.app.stage).scale * 0.8, 1);
      const lw = W / 3;
      for (let i = 0; i < 3; i++) {
        c.fillStyle = a.flash[i] > 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)'; c.fillRect(i * lw + 6, 40, lw - 12, H - 40);
        c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(i * lw + lw / 2, 40); c.lineTo(i * lw + lw / 2, H); c.stroke();
      }
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, H - 70); c.lineTo(W, H - 70); c.stroke();
      for (const n of a.notes) { c.fillStyle = a.cols[n.lane]; c.beginPath(); c.arc(n.lane * lw + lw / 2, n.y, 15, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(n.lane * lw + lw / 2 - 4, n.y - 4, 4, 0, Math.PI * 2); c.fill(); }
      if (a.msgT > 0) banner(c, a.msg, '#fff7b0');
      hud(c, `🎸 ${a.score}  ×${a.combo}`, `⏱ ${Math.ceil(a.time)}`);
    },
    result(a) { return { score: a.score, ratio: Math.min(1, a.score / 60), text: `Очков за концерт: ${a.score}` }; },
  });

  /* ---------- 5. Фигурное катание (повтори программу) ---------- */
  const MOVES = [
    { id: 'jump', name: 'Прыжок', icon: '⤴' },
    { id: 'spin', name: 'Вращение', icon: '⟳' },
    { id: 'spiral', name: 'Ласточка', icon: '➶' },
    { id: 'step', name: 'Дорожка', icon: '〰' },
  ];
  Games.skate = (host, opts) => runLoop(host, opts, {
    hint: 'Запомни программу тренера и повтори её кнопками.',
    init(a) {
      a.seq = []; a.round = 0; a.phase = 'show'; a.showI = 0; a.showT = 0; a.input = 0; a.move = null; a.moveT = 0; a.lives = opts.hasToy ? 2 : 1; a.msg = ''; a.msgT = 0; a.best = 0; a.x = W / 2;
      const bar = el('div', 'mg-moves');
      a.btns = MOVES.map((m, i) => {
        const b = el('button', 'btn move-btn'); b.innerHTML = `<span class="mv-i"></span><span class="mv-n"></span>`; b.querySelector('.mv-i').textContent = m.icon; b.querySelector('.mv-n').textContent = m.name;
        b.addEventListener('click', () => a.press(i)); bar.appendChild(b); return b;
      });
      a.extra.appendChild(bar);
      a.newRound = () => { a.round++; a.seq.push(ri(0, 3)); if (a.round === 1) { a.seq.push(ri(0, 3)); a.seq.push(ri(0, 3)); } a.phase = 'show'; a.showI = 0; a.showT = 0.6; a.input = 0; a.btns.forEach((b) => (b.disabled = true)); };
      a.play = (i) => { a.move = MOVES[i].id; a.moveT = 0.55; a.btns[i].classList.add('lit'); setTimeout(() => a.btns[i].classList.remove('lit'), 300); opts.sound && opts.sound('note' + (i % 3)); };
      a.press = (i) => {
        if (a.phase !== 'input') return;
        a.play(i);
        if (i === a.seq[a.input]) {
          a.input++;
          if (a.input >= a.seq.length) { a.best = a.round; a.msg = 'Чисто!'; a.msgT = 0.9; a.phase = 'wait'; setTimeout(() => (a.round >= 7 ? a.end() : a.newRound()), 900); }
        } else {
          a.lives--; a.msg = a.lives > 0 ? 'Ой! Ещё попытка' : 'Падение…'; a.msgT = 1; opts.sound && opts.sound('bump');
          if (a.lives > 0) { a.phase = 'wait'; setTimeout(() => { a.phase = 'show'; a.showI = 0; a.showT = 0.6; a.input = 0; a.btns.forEach((b) => (b.disabled = true)); }, 1000); }
          else { a.phase = 'over'; setTimeout(() => a.end(), 1000); }
        }
      };
      a.newRound();
    },
    update(a, dt) {
      if (a.moveT > 0) a.moveT -= dt; else a.move = null;
      if (a.msgT > 0) a.msgT -= dt;
      if (a.phase === 'show') {
        a.showT -= dt;
        if (a.showT <= 0) {
          if (a.showI < a.seq.length) { a.play(a.seq[a.showI]); a.showI++; a.showT = 0.75; }
          else { a.phase = 'input'; a.btns.forEach((b) => (b.disabled = false)); a.msg = 'Твоя очередь!'; a.msgT = 0.7; }
        }
      }
    },
    draw(a) {
      const c = a.c;
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#dcecf7'); g.addColorStop(0.5, '#f4fbff'); g.addColorStop(1, '#e3f1fa');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(120,170,210,0.3)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(W / 2, H * 0.72, 40 + i * 30, 12 + i * 8, 0, 0, Math.PI * 2); c.stroke(); }
      const p = a.moveT > 0 ? 1 - a.moveT / 0.55 : 0;
      let hop = 0, dir = 1, headRot = 0, x = W / 2;
      if (a.move === 'jump') hop = -Math.sin(p * Math.PI) * 120;
      if (a.move === 'spin') dir = Math.sin(p * Math.PI * 6) > 0 ? 1 : -1;
      if (a.move === 'spiral') headRot = -0.35 * Math.sin(p * Math.PI);
      if (a.move === 'step') x = W / 2 + Math.sin(p * Math.PI * 2) * 60;
      const app = Object.assign({}, opts.app, { outfit: Object.assign({}, opts.app.outfit, opts.app.outfit && opts.app.outfit.body ? {} : { body: 'tutu' }) });
      G.drawCapy(c, app, { t: a.t, mood: a.msg === 'Падение…' && a.msgT > 0 ? 'sad' : 'happy', hop, headRot, walk: a.move === 'step' ? p * 20 : null }, x - 20, H * 0.75, 0.36 / G.stageById(opts.app.stage).scale * 0.8, dir);
      if (a.msgT > 0) banner(c, a.msg, '#1d3557');
      hud(c, `⛸ Раунд ${a.round}`, a.phase === 'show' ? 'Смотри…' : a.phase === 'input' ? `${a.input}/${a.seq.length}` : '');
    },
    result(a) { return { score: a.best, ratio: Math.min(1, a.best / 5), text: `Чистых программ: ${a.best}` }; },
  });
})(window.CAPY);
