/* Капи-жизнь · основная логика: уход, занятия, взросление, магазин, семья, друзья, онлайн */
'use strict';
(function (G) {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      let q = Array.isArray(r) ? r[0] : r || 0;
      q = Math.min(q, Math.abs(w) / 2, Math.abs(h) / 2);
      this.moveTo(x + q, y); this.arcTo(x + w, y, x + w, y + h, q); this.arcTo(x + w, y + h, x, y + h, q);
      this.arcTo(x, y + h, x, y, q); this.arcTo(x, y, x + w, y, q); this.closePath();
    };
  }

  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const now = () => Date.now();
  const LS = 'capylife.save.v1';
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* хранилище недоступно */ } };
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    return e;
  }
  const fmtDur = (ms) => { const m = Math.round(ms / 60000); if (m < 60) return m + ' мин'; const hh = Math.floor(m / 60); return hh < 24 ? hh + ' ч' : Math.floor(hh / 24) + ' дн'; };
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  /* ================= Звук ================= */
  const Sound = {
    on: lsGet('capylife.sound') !== '0', ctx: null,
    ensure() {
      if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) try { this.ctx = new AC(); } catch (e) { this.ctx = null; } }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    },
    tone(f, dur, type, vol, f2, delay) {
      const c = this.ctx; if (!c) return;
      const t0 = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    },
    noise(dur, vol, delay) {
      const c = this.ctx; if (!c) return;
      const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1800; g.gain.value = vol || 0.08;
      s.buffer = buf; s.connect(f).connect(g).connect(c.destination); s.start(c.currentTime + (delay || 0));
    },
    play(name) {
      if (!Sound.on) return;
      Sound.ensure(); if (!Sound.ctx) return;
      const T = Sound.tone.bind(Sound);
      switch (name) {
        case 'pop': T(660, 0.09, 'triangle', 0.07, 990); break;
        case 'bump': T(220, 0.14, 'square', 0.03, 140); break;
        case 'coin': T(988, 0.07, 'square', 0.035); T(1319, 0.14, 'square', 0.035, null, 0.07); break;
        case 'level': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.16, 'triangle', 0.07, null, i * 0.09)); break;
        case 'squeak': T(1150, 0.07, 'sine', 0.05, 1650); T(1500, 0.08, 'sine', 0.04, 1100, 0.08); break;
        case 'purr': for (let i = 0; i < 6; i++) T(62, 0.09, 'sawtooth', 0.02, 58, i * 0.1); break;
        case 'crunch': Sound.noise(0.05, 0.06); Sound.noise(0.05, 0.05, 0.12); Sound.noise(0.05, 0.05, 0.24); break;
        case 'note0': T(196, 0.35, 'sawtooth', 0.04, 194); break;
        case 'note1': T(247, 0.35, 'sawtooth', 0.04, 245); break;
        case 'note2': T(294, 0.35, 'sawtooth', 0.04, 292); break;
        case 'click': T(520, 0.04, 'triangle', 0.04); break;
        default: break;
      }
    },
  };

  /* ================= Состояние ================= */
  let S = null;
  const V = {
    tab: 'here', shopCat: 'food', busy: null, t: 0, parts: [], preview: null, W: 0, H: 0, dpr: 1,
    me: { x: 0.42, tx: null, sy: 0.55, ty: null, dir: 1, walk: 0, walking: false, hr: 0, earRot: 0, blink: 0, blinkAt: 2, hop: 0, hopV: 0, lie: 0, mouth: 0, look: 0, lookT: 0, sniff: 0, happyT: 0, idleT: 3, yawnT: 0, wheel: 0, rideV: 1, danceDir: 1 },
    dirty: false, cloudDirty: false, lastCloud: 0, createdAt: 0, started: false, modal: null,
    sqPeers: new Map(), sqNpcs: [], emote: null, say: null, lastPanel: 0, movie: '', hero: null,
  };
  const stage = () => G.stageOf(S.lvl).id;
  const g = (m, f) => (S && S.gender === 'm' ? m : f);
  const placeById = (id) => G.PLACES.find((p) => p.id === id) || G.PLACES[0];

  function fresh(name, gender, fur) {
    return {
      v: 1, created: now(), updated: now(), lastTick: now(),
      name, gender, fur, gen: 1, lvl: 1, xp: 0, coins: 120,
      needs: { food: 80, fun: 85, energy: 90, clean: 90, health: 100 },
      skills: { mind: 0, sport: 0, art: 0, music: 0, social: 0 },
      outfit: { hat: null, eyes: null, neck: null, body: null }, vehicle: null,
      inv: { food: { milk: 3, carrot: 2, mandarin: 2 }, clothes: ['yuzu'], toys: ['ball'], vehicles: [], gifts: {} },
      received: {}, place: 'home', sleeping: false, job: null, shifts: 0,
      partner: null, kids: [], friends: {}, ancestors: [],
      paintings: [], homePainting: null, diary: [], firsts: {}, cool: {}, daily: 0,
      stats: { acts: 0, pets: 0, games: 0 }, inbox: [], mailDone: [],
    };
  }
  function migrate(s) {
    const base = fresh(s.name || 'Кэпи', s.gender || 'f', s.fur || 'classic');
    for (const k in base) if (s[k] === undefined || s[k] === null && base[k] !== null) s[k] = base[k];
    for (const k of ['needs', 'skills', 'outfit', 'stats', 'inv']) for (const kk in base[k]) if (s[k][kk] === undefined) s[k][kk] = base[k][kk];
    if (!G.FURS[s.fur]) s.fur = 'classic';
    return s;
  }
  function loadLocal() { try { const raw = lsGet(LS); return raw ? migrate(JSON.parse(raw)) : null; } catch (e) { return null; } }
  function save() { if (!S) return; S.updated = now(); lsSet(LS, JSON.stringify(S)); V.cloudDirty = true; }
  const touch = () => { V.dirty = true; };

  function appOf() {
    const o = Object.assign({}, S.outfit);
    if (V.preview && V.preview.until > performance.now()) o[V.preview.slot] = V.preview.id;
    return { name: S.name, fur: S.fur, gender: S.gender, stage: stage(), outfit: o, vehicle: S.vehicle };
  }
  function addDiary(text) { S.diary.unshift({ ts: now(), text }); if (S.diary.length > 80) S.diary.length = 80; }

  /* ================= Потребности ================= */
  function tick(sec, offline) {
    const n = S.needs, m = sec / 60;
    const k = stage() === 'baby' ? 1.25 : stage() === 'elder' ? 0.9 : 1;
    if (S.sleeping) { n.energy += 6 * m; n.food -= 0.45 * m * k; n.fun -= 0.15 * m; n.clean -= 0.25 * m; }
    else { n.food -= 1.1 * m * k; n.fun -= 0.9 * m; n.energy -= 0.7 * m; n.clean -= 0.55 * m; }
    const low = (n.food < 10 ? 1 : 0) + (n.clean < 10 ? 1 : 0) + (n.fun < 5 ? 1 : 0) + (n.energy < 5 ? 1 : 0);
    if (low) n.health -= 0.6 * low * m; else if (n.food > 50 && n.clean > 40) n.health += 0.3 * m;
    for (const key in n) n[key] = clamp(n[key], 0, 100);
    if (offline) { n.food = Math.max(n.food, 12); n.fun = Math.max(n.fun, 12); n.clean = Math.max(n.clean, 12); n.energy = Math.max(n.energy, 15); n.health = Math.max(n.health, 35); }
    if (S.sleeping && n.energy >= 99.5) wake(true);
  }
  function catchUp() {
    const el = now() - S.lastTick;
    if (el > 5000) {
      tick(Math.min(el, 8 * 3600e3) / 1000, true);
      if (el > 30 * 60e3) toast(`${S.name} ${g('соскучился', 'соскучилась')}! Тебя не было ${fmtDur(el)}`);
    }
    S.lastTick = now();
  }

  /* ================= Опыт и взросление ================= */
  function addXP(x) {
    if (S.lvl >= G.MAX_LVL || x <= 0) return 0;
    const before = stage();
    S.xp += x;
    let ups = 0, bonus = 0;
    while (S.lvl < G.MAX_LVL && S.xp >= G.xpNeed(S.lvl)) { S.xp -= G.xpNeed(S.lvl); S.lvl++; ups++; bonus += 10 + S.lvl * 5; }
    if (S.lvl >= G.MAX_LVL) S.xp = 0;
    if (ups) {
      S.coins += bonus;
      Sound.play('level');
      burst('confetti', 40);
      toast(`Уровень ${S.lvl}! Подарок: +${bonus} 🍊`, 'good');
      const after = stage();
      if (after !== before) setTimeout(() => growUp(before, after), 600);
    }
    return x;
  }
  function growUp(from, to) {
    const name = G.stageName(to, S.gender);
    addDiary(`${S.name} ${g('вырос', 'выросла')}: теперь ${name.toLowerCase()}.`);
    const opened = G.PLACES.filter((p) => p.st.includes(to) && !p.st.includes(from)).map((p) => p.name);
    if (!placeById(S.place).st.includes(to)) S.place = 'home';
    const tips = {
      kid: 'Пора в школу! Открылись спорткомплекс, музыкальная школа и библиотека. Можно кататься на самокате и велосипеде.',
      teen: 'Подростковый возраст: вечеринки, университетские лекции, группа и концерты.',
      adult: 'Взрослая жизнь! Выбери профессию в университете, ходи на работу. Можно пожениться и завести малышей.',
      elder: `${g('Дедушка', 'Бабушка')} на пенсии: дача, рыбалка, внуки. А ещё можно передать эстафету своему ребёнку.`,
    };
    const cv = h('canvas', { class: 'hero-canvas', width: 480, height: 190 });
    openModal(`${S.name} — ${name.toLowerCase()}!`, [
      cv,
      h('p', { text: tips[to] || '' }),
      opened.length ? h('p', { class: 'muted', text: 'Новые места: ' + opened.join(', ') }) : null,
      h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-main', onclick: closeModal, text: 'Ура!' })),
    ]);
    V.hero = { cv, draw: (c, w, hh, t) => { c.clearRect(0, 0, w, hh); G.drawCapy(c, appOf(), { t, mood: 'happy', hop: -Math.abs(Math.sin(t * 3)) * 30 }, w * 0.42, hh * 0.9, Math.min(w / 700, hh / 300), 1); } };
    burst('confetti', 60);
    renderAll();
  }

  /* ================= Выгоды и расходы ================= */
  function applyDelta(obj, mult) {
    const out = [];
    for (const [k, v0] of Object.entries(obj || {})) {
      if (!v0) continue;
      const v = Math.round(v0 > 0 ? v0 * mult : v0);
      if (k in S.needs) { const b = S.needs[k]; S.needs[k] = clamp(b + v, 0, 100); const d = Math.round(S.needs[k] - b); if (d) out.push([k, d]); }
      else if (k in S.skills) { const b = S.skills[k]; S.skills[k] = clamp(b + v, 0, 100); const d = S.skills[k] - b; if (d) out.push([k, d]); }
      else if (k === 'coins') { S.coins = Math.max(0, S.coins + v); out.push([k, v]); }
    }
    return out;
  }
  function pay(cost) { const neg = {}; for (const [k, v] of Object.entries(cost || {})) neg[k] = -v; applyDelta(neg, 1); }
  function gainsText(list, xp) {
    const parts = list.filter(([, v]) => v > 0).map(([k, v]) => `+${v} ${G.ICON[k]}`);
    if (xp) parts.push(`+${xp} ⭐`);
    return parts.join(' · ');
  }

  /* ================= Проверки занятий ================= */
  const FOODISH = ['feed', 'sleep', 'doctor_visit', 'vitamins', 'cafe_eat', 'picnic', 'icecream', 'date', 'kg_nap', 'massage', 'onsen', 'banya', 'bath'];
  function check(a, friend) {
    if (!a.st.includes(stage())) return 'Не для этого возраста';
    if (S.sleeping) return `${S.name} спит`;
    if (V.busy) return 'Сейчас занята делом';
    const need = a.need || {};
    if (need.vehicle && !S.vehicle) return 'Нужен транспорт — загляни в магазин';
    if (need.job && !S.job) return 'Сначала выбери профессию в университете';
    if (need.partner && !S.partner) return 'Нужна вторая половинка';
    if (need.kids && !S.kids.length) return 'Нужны детки';
    if (need.skill && S.skills[need.skill[0]] < need.skill[1]) return `Нужно: ${G.LABEL[need.skill[0]]} ${need.skill[1]}`;
    const c = a.cost || {};
    if (c.coins && S.coins < c.coins && !(friend && friend.treat)) return `Не хватает мандаринок (нужно ${c.coins})`;
    if (c.energy && S.needs.energy < c.energy) return 'Мало энергии — надо отдохнуть';
    if (a.cooldown) { const left = (S.cool[a.id] || 0) - now(); if (left > 0) return 'Можно через ' + fmtDur(Math.max(60000, left)); }
    if (!FOODISH.includes(a.id) && S.needs.food < 6 && (c.energy || 0) > 4) return `${S.name} ${g('голодный', 'голодная')} — покорми`;
    if (!FOODISH.includes(a.id) && a.place !== 'clinic' && S.needs.health < 15 && (c.energy || 0) > 4) return `${S.name} ${g('приболел', 'приболела')} — сходи в клинику`;
    return null;
  }

  /* ================= Занятия ================= */
  function startBusy(b) {
    V.busy = Object.assign({ start: performance.now(), dur: 4 }, b);
    if (b.variant) V.variant = b.variant;
    V.me.tx = null;
    if (b.anim === 'ride' || b.anim === 'walk') V.me.x = 0.2;
    else if (b.friend) { V.me.x = 0.3; V.me.dir = 1; }
    $('#busy').hidden = false;
    $('#busyText').textContent = b.label || '';
    renderPanel();
  }
  function finishBusy() {
    const b = V.busy; V.busy = null;
    $('#busy').hidden = true;
    if (b && b.done) b.done();
    touch(); renderAll();
  }
  function doAct(id, friend) {
    const a = G.actById(id);
    const why = check(a, friend);
    if (why) return toast(why, 'warn');
    Sound.play('click');
    if (a.special) return SPECIAL[a.special](a, friend);
    if (a.mini) return runMini(a, friend);
    if (!(friend && friend.treat)) pay(a.cost);
    startBusy({ label: a.name + (friend ? ' · 👫 ' + friend.name : ''), anim: a.anim, dur: a.dur, friend, variant: a.variant, done: () => finish(a, friend, 1) });
  }
  function finish(a, friend, mult, note) {
    let m = mult;
    const gain = Object.assign({}, a.gain);
    if (friend) { m *= 1.25; gain.social = (gain.social || 0) + 2; addFriendPts(friend, 6); }
    if (a.toy && S.inv.toys.includes(a.toy)) m *= 1.25;
    const list = applyDelta(gain, m);
    const xp = addXP(Math.round((a.xp || 8) * mult * (friend ? 1.2 : 1)));
    if (a.cooldown) S.cool[a.id] = now() + a.cooldown * 1000;
    S.stats.acts++;
    firsts(a);
    const txt = gainsText(list, xp);
    toast((note ? note + '. ' : '') + (txt || 'Готово!'), 'good');
    burst(a.anim === 'eat' ? 'heart' : 'sparkle', 8);
    touch();
  }
  function firsts(a) {
    const F = { lesson: 'Первый урок в школе', kg_play: 'Первый день в детском саду', shift: 'Первая рабочая смена', tennis: 'Первая тренировка по теннису', skating: 'Первый раз на коньках', guitar: 'Первые аккорды на электрогитаре', onsen: 'Первый онсэн с мандарином на голове', banya: 'Первый поход в баню', dance: 'Первая вечеринка', movie: 'Первый поход в кино', show: 'Первый раз в цирке', paint: 'Первая картина' };
    if (F[a.id] && !S.firsts[a.id]) { S.firsts[a.id] = now(); addDiary(F[a.id] + '!'); }
  }
  async function runMini(a, friend) {
    pay(a.cost);
    const body = h('div');
    openModal(a.icon + ' ' + a.name, [body], { locked: true, wide: true });
    const res = await G.Games[a.mini](body, { app: appOf(), boost: a.quizBoost || 0, hasToy: !!(a.toy && S.inv.toys.includes(a.toy)), sound: Sound.play });
    closeModal();
    S.stats.games++;
    finish(a, friend, 0.35 + res.ratio * 0.9, res.text);
    renderAll();
  }

  const JOB_SKILL = { barista: 'social', lifeguard: 'sport', cook: 'art', teacher: 'mind', firefighter: 'sport', blogger: 'social', artist: 'art', skater: 'sport', musician: 'music', jeweler: 'art', tennis: 'sport', doctor: 'mind', coder: 'mind', business: 'social', astronaut: 'mind' };
  const rankOf = () => Math.min(G.RANKS.length - 1, Math.floor(S.shifts / 6));
  const SPECIAL = {
    feed() { openFridge(); },
    sleep() {
      if (S.sleeping) return wake();
      S.sleeping = true; S.place = 'home';
      addParticle('zzz', 1);
      toast(`${S.name} ${g('уснул', 'уснула')}. Сладких снов!`);
      touch(); renderAll();
    },
    toy() { openToys(); },
    ride(a, friend) {
      const veh = G.VEHICLES.find((v) => v.id === S.vehicle);
      pay(a.cost);
      startBusy({ label: 'Катается: ' + veh.name.toLowerCase(), anim: 'ride', dur: 7, friend, done: () => finish(a, friend, 1) });
    },
    job() { openJobs(); },
    shift(a) {
      const job = G.JOBS.find((j) => j.id === S.job);
      pay(a.cost);
      const r = rankOf();
      const payout = Math.round(job.pay * (1 + r * 0.25) * (a.mult || 1));
      startBusy({
        label: `${G.jobName(job, S.gender)}: ${a.name.toLowerCase()}`, anim: 'work', dur: 5, prop: job.icon,
        done: () => {
          const list = applyDelta({ coins: payout, [JOB_SKILL[job.id]]: 2 }, 1);
          const xp = addXP(a.xp);
          if (a.id === 'shift') {
            S.shifts++;
            if (S.shifts === 1) addDiary(`Первая зарплата: ${payout} мандаринок!`);
            if (S.shifts % 6 === 0 && rankOf() > r) { toast(`Повышение! Теперь ты ${G.RANKS[rankOf()].toLowerCase()}`, 'good'); addDiary(`Повышение на работе: ${G.RANKS[rankOf()]}.`); burst('confetti', 30); }
          }
          if (a.cooldown) S.cool[a.id] = now() + a.cooldown * 1000;
          firsts(a);
          toast(gainsText(list, xp), 'good'); Sound.play('coin');
        },
      });
    },
    paint(a) {
      pay(a.cost);
      startBusy({
        label: 'Пишет картину', anim: 'art', dur: a.dur,
        done: () => {
          finish(a, null, 1);
          const [title, author] = pick(G.PAINTINGS);
          const p = { id: 'p' + now().toString(36), title, author, seed: Math.floor(Math.random() * 1e6), value: Math.round(12 + S.skills.art * 0.8 + (S.inv.toys.includes('easel') ? 15 : 0) + rnd(0, 10)), ts: now() };
          S.paintings.unshift(p); if (S.paintings.length > 24) S.paintings.length = 24;
          showPainting(p, true);
        },
      });
    },
    movie(a, friend) {
      if (!(friend && friend.treat)) pay(a.cost);
      V.movie = pick(G.MOVIES);
      startBusy({ label: `Кино: «${V.movie}»`, anim: 'watch', dur: a.dur, friend, done: () => finish(a, friend, 1, `Посмотрели «${V.movie}»`) });
    },
    garden(a) {
      pay(a.cost);
      startBusy({
        label: 'Работает в огороде', anim: 'work', dur: a.dur, prop: '🥕',
        done: () => {
          finish(a, null, 1);
          const crop = [['carrot', 2], [pick(['pumpkin', 'corn', 'salad', 'apple']), 1], [pick(['grass', 'carrot', 'apple']), 1]];
          const got = {};
          crop.forEach(([id, n]) => { S.inv.food[id] = (S.inv.food[id] || 0) + n; got[id] = (got[id] || 0) + n; });
          toast('Урожай: ' + Object.entries(got).map(([id, n]) => G.FOODS.find((f) => f.id === id).icon + '×' + n).join(' '), 'good');
        },
      });
    },
    pension(a) {
      const sum = 60 + S.lvl * 3;
      S.coins += sum; S.cool[a.id] = now() + a.cooldown * 1000;
      Sound.play('coin'); toast(`Пенсия: +${sum} 🍊`, 'good'); touch(); renderAll();
    },
  };
  function wake(auto) {
    S.sleeping = false;
    toast(auto ? `${S.name} ${g('выспался и полон сил', 'выспалась и полна сил')}!` : `${S.name} ${g('проснулся', 'проснулась')}`);
    Sound.play('squeak');
    touch(); renderAll();
  }

  /* ================= Холодильник, игрушки, профессии ================= */
  function openFridge() {
    const owned = G.FOODS.filter((f) => (S.inv.food[f.id] || 0) > 0);
    const list = h('div', { class: 'items' });
    owned.forEach((f) => list.append(h('div', { class: 'item' },
      h('div', { class: 'ic', text: f.icon }), h('div', { class: 'nm', text: f.name }),
      h('div', { class: 'ds', text: foodFx(f) }),
      h('div', { class: 'row' }, h('span', { class: 'muted', text: '× ' + S.inv.food[f.id] }), h('button', { class: 'btn btn-main btn-sm', text: 'Дать', onclick: () => { closeModal(); eat(f.id); } })))));
    openModal('Холодильник', [
      owned.length ? list : h('p', { text: 'Пусто! Купи вкусняшек в магазине.' }),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', text: 'В магазин за едой', onclick: () => { closeModal(); V.tab = 'shop'; V.shopCat = 'food'; renderPanel(); } })),
    ]);
  }
  const foodFx = (f) => ['food', 'fun', 'energy', 'health'].filter((k) => f[k]).map((k) => `${f[k] > 0 ? '+' : ''}${f[k]} ${G.ICON[k]}`).join(' ');
  function eat(id) {
    if (S.sleeping) return toast(`${S.name} спит`, 'warn');
    if (V.busy) return toast('Сейчас занята делом', 'warn');
    const f = G.FOODS.find((x) => x.id === id);
    if (!f || !(S.inv.food[id] > 0)) return;
    S.inv.food[id]--;
    if (!S.inv.food[id]) delete S.inv.food[id];
    Sound.play('crunch');
    startBusy({
      label: 'Кушает: ' + f.name.toLowerCase(), anim: 'eat', dur: 3, prop: f.icon,
      done: () => {
        const mult = f.babyBonus && stage() === 'baby' ? 1.5 : 1;
        const list = applyDelta({ food: f.food, fun: f.fun, energy: f.energy, health: f.health }, mult);
        const xp = addXP(4);
        toast('Ням! ' + gainsText(list, xp), 'good');
        burst('heart', 5);
      },
    });
  }
  function openToys() {
    const owned = G.TOYS.filter((t) => S.inv.toys.includes(t.id));
    const list = h('div', { class: 'items' });
    owned.forEach((t) => list.append(h('button', { class: 'item', style: 'cursor:pointer;text-align:left', onclick: () => { closeModal(); playToy(t); } },
      h('div', { class: 'ic', text: t.icon }), h('div', { class: 'nm', text: t.name }),
      h('div', { class: 'ds', text: ['fun', 'mind', 'sport', 'art', 'music', 'health'].filter((k) => t[k]).map((k) => `+${t[k]} ${G.ICON[k]}`).join(' ') }))));
    openModal('Во что поиграем?', [owned.length ? list : h('p', { text: 'Игрушек пока нет. Загляни в магазин!' })]);
  }
  function playToy(t) {
    const why = V.busy ? 'Сейчас занята делом' : S.sleeping ? `${S.name} спит` : S.needs.energy < 4 ? 'Мало энергии — надо отдохнуть' : null;
    if (why) return toast(why, 'warn');
    pay({ energy: 4 });
    startBusy({
      label: 'Играет: ' + t.name.toLowerCase(), anim: t.id === 'guitar' || t.id === 'piano' ? 'music' : t.id === 'book' || t.id === 'telescope' || t.id === 'boardgame' ? 'study' : t.id === 'yogamat' ? 'yoga' : 'play', dur: 4, prop: t.icon,
      done: () => {
        const list = applyDelta({ fun: t.fun, mind: t.mind, sport: t.sport, art: t.art, music: t.music, health: t.health }, 1);
        const xp = addXP(6);
        toast(gainsText(list, xp), 'good'); burst('heart', 4);
      },
    });
  }
  function openJobs() {
    const list = h('div', { class: 'items' });
    G.JOBS.forEach((j) => {
      const miss = Object.entries(j.req).filter(([k, v]) => S.skills[k] < v);
      const cur = S.job === j.id;
      list.append(h('div', { class: 'item' + (cur ? ' on' : '') },
        h('div', { class: 'ic', text: j.icon }), h('div', { class: 'nm', text: G.jobName(j, S.gender) }),
        h('div', { class: 'ds', text: `Зарплата от ${j.pay} 🍊 за смену` }),
        h('div', { class: 'ds', text: Object.keys(j.req).length ? 'Нужно: ' + Object.entries(j.req).map(([k, v]) => `${G.LABEL[k]} ${v}`).join(', ') : 'Можно без опыта' }),
        cur ? h('span', { class: 'tag', text: 'Твоя работа' }) : h('button', {
          class: 'btn btn-sm' + (miss.length ? '' : ' btn-main'), disabled: miss.length ? true : null, text: miss.length ? 'Подкачай навыки' : 'Выбрать',
          onclick: () => {
            S.job = j.id; S.shifts = 0;
            addDiary(`Выбрана профессия: ${G.jobName(j, S.gender).toLowerCase()}.`);
            toast(`Теперь ты ${G.jobName(j, S.gender).toLowerCase()}! Загляни на работу.`, 'good');
            closeModal(); touch(); renderAll(); publishCard();
          },
        })));
    });
    openModal('Кем стать?', [h('p', { class: 'muted', text: 'Навыки растут от школы, секций, кружков и книг. Сменить профессию можно в любой момент.' }), list]);
  }
  function showPainting(p, fresh_) {
    const cv = h('canvas', { width: 360, height: 280, style: 'width:100%;max-width:360px;justify-self:center' });
    const c = cv.getContext('2d');
    c.fillStyle = '#e9e2d4'; c.fillRect(0, 0, 360, 280);
    G.Scenes.painting(c, 50, 36, 260, 200, p.seed);
    openModal(fresh_ ? 'Картина готова!' : 'Картина', [
      cv,
      h('p', { text: `«${p.title}» — в духе: ${p.author}.` }),
      h('p', { class: 'muted', text: `Коллекционеры готовы дать ${p.value} мандаринок.` }),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-main', text: 'Повесить дома', onclick: () => { S.homePainting = p.seed; closeModal(); toast('Картина висит в гостиной'); touch(); renderAll(); } }),
        h('button', { class: 'btn', text: `Продать за ${p.value} 🍊`, onclick: () => { sellPainting(p.id); closeModal(); } }),
        h('button', { class: 'btn btn-ghost', text: 'В галерею', onclick: closeModal })),
    ]);
  }
  function sellPainting(id) {
    const i = S.paintings.findIndex((x) => x.id === id);
    if (i < 0) return;
    const p = S.paintings[i];
    S.paintings.splice(i, 1); S.coins += p.value;
    if (S.homePainting === p.seed) S.homePainting = null;
    Sound.play('coin'); toast(`Продано! +${p.value} 🍊`, 'good'); touch(); renderAll();
  }

  /* ================= Перемещение ================= */
  function goTo(id, silent) {
    const p = placeById(id);
    if (S.sleeping) return toast('Сначала разбуди капибару', 'warn');
    if (V.busy) return toast('Сейчас занята делом', 'warn');
    if (!p.st.includes(stage())) return toast('Сюда пока рано или уже поздно', 'warn');
    S.place = id; V.variant = null; V.me.tx = null; V.me.ty = null;
    if (id === 'square') { V.me.x = rnd(0.15, 0.85); V.me.sy = rnd(0.25, 0.95); } else { V.me.x = 0.42; V.me.sy = 0.55; }
    if (!silent) { V.tab = 'here'; Sound.play('click'); }
    touch(); renderAll(); updatePresence();
  }

  /* ================= Магазин ================= */
  const CATS = [
    { id: 'food', name: 'Еда', list: () => G.FOODS },
    { id: 'clothes', name: 'Одежда', list: () => G.CLOTHES },
    { id: 'toys', name: 'Игрушки', list: () => G.TOYS },
    { id: 'vehicles', name: 'Транспорт', list: () => G.VEHICLES },
    { id: 'gifts', name: 'Подарки', list: () => G.GIFTS },
  ];
  function owned(cat, id) {
    if (cat === 'food') return S.inv.food[id] || 0;
    if (cat === 'gifts') return S.inv.gifts[id] || 0;
    return S.inv[cat].includes(id);
  }
  function buy(cat, item, n) {
    n = n || 1;
    const price = item.price * n;
    if (item.st && !item.st.includes(stage())) return toast('Пока не по возрасту', 'warn');
    if (S.coins < price) return toast('Не хватает мандаринок', 'warn');
    S.coins -= price;
    if (cat === 'food') S.inv.food[item.id] = (S.inv.food[item.id] || 0) + n;
    else if (cat === 'gifts') S.inv.gifts[item.id] = (S.inv.gifts[item.id] || 0) + n;
    else if (!S.inv[cat].includes(item.id)) S.inv[cat].push(item.id);
    if (cat === 'clothes') S.outfit[item.slot] = item.id;
    if (cat === 'vehicles') { S.vehicle = item.id; if (!S.firsts['veh_' + item.id]) { S.firsts['veh_' + item.id] = now(); addDiary(`Новый транспорт: ${item.name.toLowerCase()}!`); } }
    Sound.play('coin');
    toast(`Куплено: ${item.icon} ${item.name}` + (cat === 'clothes' ? ' — уже надето' : cat === 'vehicles' ? ' — кататься можно в парке' : ''), 'good');
    V.preview = null;
    touch(); renderAll(); publishCard();
  }

  /* ================= Друзья, семья, почта ================= */
  function npcList() {
    return G.NPCS.map((n) => ({ id: n.id, kind: 'npc', name: n.name, app: { name: n.name, fur: n.fur, gender: n.gender, stage: n.stage || stage(), outfit: Object.assign({ hat: null, eyes: null, neck: null, body: null }, n.outfit), vehicle: null } }));
  }
  function playerList() {
    return Object.entries(G.Online.players).map(([id, c]) => ({ id, kind: 'player', name: c.name, card: c, app: { name: c.name, fur: c.fur, gender: c.gender, stage: c.stage, outfit: c.outfit, vehicle: c.vehicle } }));
  }
  function findFriend(id) { return npcList().concat(playerList()).find((f) => f.id === id) || null; }
  function fr(id) { if (!S.friends[id]) S.friends[id] = { pts: id.startsWith('npc_') ? 10 : 0, ok: id.startsWith('npc_') }; return S.friends[id]; }
  function addFriendPts(f, n) { const x = fr(f.id); x.pts = clamp(x.pts + n, 0, 100); x.name = f.name; }
  const isAdult = (st) => st === 'adult' || st === 'elder';

  function giveGift(f, gift) {
    if (!(S.inv.gifts[gift.id] > 0)) return;
    if (gift.id === 'ring') return toast('Кольцо — для предложения руки и сердца', 'warn');
    S.inv.gifts[gift.id]--;
    addFriendPts(f, gift.pts);
    if (f.kind === 'player') { G.Online.send(f.id, 'gift', { id: gift.id }); toast(`Подарок ${gift.icon} отправлен: ${f.name}`, 'good'); }
    else toast(`${f.name} в восторге от подарка ${gift.icon}!`, 'good');
    applyDelta({ fun: 6, social: 1 }, 1);
    Sound.play('pop'); touch(); closeModal(); renderAll();
  }
  function canPropose(f) {
    if (!isAdult(stage())) return 'Жениться можно взрослым';
    if (!isAdult(f.app.stage)) return `${f.name} ещё не ${f.app.gender === 'm' ? 'взрослый' : 'взрослая'}`;
    if (S.partner) return 'У тебя уже есть вторая половинка';
    if (f.kind === 'player' && f.card && f.card.partner) return `${f.name} уже в браке`;
    if (f.kind === 'npc' && fr(f.id).pts < 40) return 'Нужно подружиться сильнее (40+)';
    if (f.kind === 'player' && !fr(f.id).ok) return 'Сначала подружитесь';
    if (!(S.inv.gifts.ring > 0)) return 'Нужно кольцо (магазин → Подарки)';
    return null;
  }
  function propose(f) {
    const why = canPropose(f);
    if (why) return toast(why, 'warn');
    S.inv.gifts.ring--;
    if (f.kind === 'npc') { marry(f); return; }
    G.Online.send(f.id, 'propose', {}).then((it) => toast(it ? `Предложение отправлено: ${f.name}. Ждём ответа…` : 'Не получилось отправить — проверь доступ', it ? 'good' : 'warn'));
    touch(); closeModal(); renderAll();
  }
  function marry(f) {
    S.partner = { id: f.id, name: f.name, kind: f.kind, app: f.app };
    S.coins += 100;
    addDiary(`Свадьба! ${S.name} + ${f.name} = семья. Гости подарили 100 мандаринок.`);
    const cv = h('canvas', { class: 'hero-canvas', width: 480, height: 190 });
    openModal('Свадьба!', [cv, h('p', { text: `${S.name} и ${f.name} теперь семья. Можно ходить на свидания и завести малышей.` }), h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-main', text: 'Горько!', onclick: closeModal }))]);
    V.hero = { cv, draw: (c, w, hh, t) => heroPair(c, w, hh, t, appOf(), f.app, true) };
    burst('heart', 30); burst('confetti', 40); Sound.play('level');
    touch(); renderAll(); publishCard();
  }
  function heroPair(c, w, hh, t, a1, a2, arch) {
    c.clearRect(0, 0, w, hh);
    if (arch) {
      c.strokeStyle = '#8fc16a'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, hh * 0.95, hh * 0.72, Math.PI, 0); c.stroke();
      for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; G.Scenes.emo(c, i % 2 ? '🌸' : '🌼', w / 2 + Math.cos(a) * hh * 0.72, hh * 0.95 + Math.sin(a) * hh * 0.72, 18); }
    }
    const s = Math.min(w / 900, hh / 330);
    G.drawCapy(c, a1, { t, mood: 'happy', hop: -Math.abs(Math.sin(t * 2.5)) * 14 }, w * 0.3, hh * 0.93, s, 1);
    G.drawCapy(c, a2, { t: t + 0.4, mood: 'happy', hop: -Math.abs(Math.sin(t * 2.5 + 1)) * 14 }, w * 0.7, hh * 0.93, s, -1);
    G.Scenes.emo(c, '❤️', w / 2, hh * 0.3 + Math.sin(t * 3) * 6, 26);
  }
  function openBaby(adopt) {
    const p = S.partner;
    let name = pick(G.NAMES), gender = Math.random() < 0.5 ? 'm' : 'f';
    let fur = adopt ? pick(Object.keys(G.FURS)) : pick([S.fur, (p && p.app && p.app.fur) || S.fur]);
    const inp = h('input', { type: 'text', id: 'babyName', maxlength: 20, value: name });
    const gsel = h('div', { class: 'seg' });
    const renderG = () => { gsel.replaceChildren(...[['f', 'Девочка'], ['m', 'Мальчик']].map(([id, t]) => h('button', { 'aria-pressed': gender === id ? 'true' : 'false', text: t, onclick: () => { gender = id; renderG(); } }))); };
    renderG();
    const cv = h('canvas', { class: 'hero-canvas', width: 480, height: 190 });
    openModal(adopt ? 'Капи-приют' : 'У нас будет малыш!', [
      cv,
      adopt ? h('p', { text: 'В приюте ждут любящую семью. Семья — это те, кого любишь.' }) : h('p', { text: p.kind === 'player' ? `${p.name} получит приглашение и сможет согласиться.` : `${p.name} очень ${p.app.gender === 'm' ? 'рад' : 'рада'}!` }),
      h('div', { class: 'field' }, h('label', { for: 'babyName', text: 'Имя малыша' }), inp),
      gsel,
      h('div', { class: 'btn-row' }, h('button', {
        class: 'btn btn-main', text: adopt ? 'Забрать домой (100 🍊)' : 'Готово',
        onclick: () => {
          const kid = { id: 'k' + now().toString(36), name: (inp.value.trim() || name).slice(0, 20), gender, fur, lvl: 1, xp: 0, born: now(), with: adopt ? '' : p.name };
          if (adopt) { if (S.coins < 100) return toast('Не хватает мандаринок', 'warn'); S.coins -= 100; addKid(kid, 'Малыш из капи-приюта: ' + kid.name + '. Добро пожаловать домой!'); return; }
          if (p.kind === 'player') { G.Online.send(p.id, 'baby', { kid }).then((it) => toast(it ? 'Отправлено! Ждём ответа' : 'Не получилось отправить', it ? 'good' : 'warn')); closeModal(); return; }
          addKid(kid);
        },
      })),
    ]);
    V.hero = { cv, draw: (c, w, hh, t) => { c.clearRect(0, 0, w, hh); G.drawCapy(c, { fur, stage: 'baby', outfit: {} }, { t, mood: 'happy', blink: (t % 3) < 0.12 ? 1 : 0 }, w * 0.4, hh * 0.92, Math.min(w / 500, hh / 190), 1); } };
  }
  function addKid(kid, text) {
    if (S.kids.some((k) => k.id === kid.id)) return;
    if (S.kids.length >= 5) return toast('В семье уже пятеро деток — это много счастья!', 'warn');
    S.kids.push(kid);
    addDiary(text || `${kid.gender === 'm' ? 'Родился сын' : 'Родилась дочка'} — ${kid.name}!`);
    const cv = h('canvas', { class: 'hero-canvas', width: 480, height: 190 });
    openModal(kid.gender === 'm' ? `Родился ${kid.name}!` : `Родилась ${kid.name}!`, [cv, h('p', { text: 'Малыш живёт дома. Корми, играй и води в садик — он будет расти вместе с тобой.' }), h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-main', text: 'Какая прелесть', onclick: closeModal }))]);
    V.hero = { cv, draw: (c, w, hh, t) => heroPair(c, w, hh, t, appOf(), { fur: kid.fur, stage: 'baby', outfit: {} }, false) };
    burst('heart', 24); Sound.play('level');
    touch(); renderAll(); publishCard();
  }
  function kidAct(kid, kind) {
    if (V.busy || S.sleeping) return toast(S.sleeping ? `${S.name} спит` : 'Сейчас занята делом', 'warn');
    const kst = G.stageOf(kid.lvl).id;
    const costs = { feed: { coins: 6 }, play: { energy: 6 }, school: { energy: 8 } };
    const c = costs[kind];
    if (c.coins && S.coins < c.coins) return toast('Не хватает мандаринок', 'warn');
    if (c.energy && S.needs.energy < c.energy) return toast('Мало энергии', 'warn');
    const key = 'kid_' + kid.id + '_' + kind;
    if ((S.cool[key] || 0) > now()) return toast('Чуть позже', 'warn');
    pay(c);
    const xpK = { feed: 14, play: 12, school: 24 }[kind];
    kid.xp += xpK;
    let up = false;
    while (kid.lvl < G.MAX_LVL && kid.xp >= G.xpNeed(kid.lvl) * 0.6) { kid.xp -= Math.round(G.xpNeed(kid.lvl) * 0.6); kid.lvl++; up = true; }
    S.cool[key] = now() + (kind === 'school' ? 180 : 45) * 1000;
    const list = applyDelta(kind === 'play' ? { fun: 12, social: 1 } : kind === 'feed' ? { fun: 5 } : { social: 1, fun: 4 }, 1);
    const xp = addXP(5);
    toast(`${kid.name}: ${kind === 'feed' ? 'ням!' : kind === 'play' ? 'ура, играем!' : kst === 'baby' ? 'в садике весело' : 'в школе интересно'} ${gainsText(list, xp)}`, 'good');
    if (up && G.stageOf(kid.lvl).id !== kst) { addDiary(`${kid.name} ${kid.gender === 'm' ? 'подрос' : 'подросла'}: теперь ${G.stageName(G.stageOf(kid.lvl).id, kid.gender).toLowerCase()}.`); toast(`${kid.name} ${kid.gender === 'm' ? 'подрос' : 'подросла'}!`, 'good'); }
    burst('heart', 4); touch(); renderAll();
  }
  function continueAs(kid) {
    const old = S;
    const ns = fresh(kid.name, kid.gender, kid.fur);
    ns.gen = old.gen + 1; ns.lvl = Math.max(1, Math.min(kid.lvl, 19)); ns.coins = Math.round(old.coins * 0.6) + 50;
    ns.inv.clothes = old.inv.clothes.slice(); ns.inv.toys = old.inv.toys.slice(); ns.inv.vehicles = old.inv.vehicles.slice(); ns.inv.food = Object.assign({}, old.inv.food);
    for (const k in ns.skills) ns.skills[k] = Math.round(old.skills[k] * 0.25);
    ns.paintings = old.paintings; ns.homePainting = old.homePainting; ns.friends = old.friends; ns.mailDone = old.mailDone;
    ns.ancestors = old.ancestors.concat([{ name: old.name, gender: old.gender, fur: old.fur, gen: old.gen, job: old.job, lvl: old.lvl, partner: old.partner ? old.partner.name : '' }]);
    ns.kids = [];
    ns.diary = [{ ts: now(), text: `Поколение ${ns.gen}: ${kid.name} продолжает историю семьи. ${old.name} ${old.gender === 'm' ? 'переехал' : 'переехала'} на дачу и печёт пироги для внуков.` }].concat(old.diary.slice(0, 40));
    S = ns;
    closeModal(); save(); renderAll(); publishCard();
    toast(`Теперь ты — ${kid.name}! Жизнь продолжается`, 'good');
    burst('confetti', 50); Sound.play('level');
  }

  // ---------- Почта (онлайн) ----------
  const REQUESTS = ['friend', 'invite', 'propose', 'baby'];
  function onMail(items) {
    if (!S) return;
    let changed = false;
    for (const it of items) {
      if (S.mailDone.includes(it.id)) continue;
      S.mailDone.push(it.id); changed = true;
      if (S.mailDone.length > 400) S.mailDone.splice(0, S.mailDone.length - 400);
      if (it.ts < S.created - 60000 || now() - it.ts > 7 * 864e5) continue;
      const f = findFriend(it.from) || { id: it.from, kind: 'player', name: 'Капибара', app: G.sanitizeApp({}) };
      if (REQUESTS.includes(it.kind)) {
        if (it.kind === 'invite' && !G.actById(it.data.act)) continue;
        S.inbox.push({ id: it.id, from: it.from, kind: it.kind, data: it.data, ts: it.ts });
        toast(`${f.name}: ${reqText(it)}`, 'good'); Sound.play('squeak');
      } else if (it.kind === 'gift') {
        const gift = G.GIFTS.find((x) => x.id === it.data.id);
        if (gift && gift.id !== 'ring') { S.received[gift.id] = (S.received[gift.id] || 0) + 1; addFriendPts(f, gift.pts); applyDelta({ fun: 10 }, 1); toast(`${f.name} ${f.app.gender === 'm' ? 'подарил' : 'подарила'} тебе ${gift.icon} ${gift.name}!`, 'good'); Sound.play('pop'); }
      } else if (it.kind === 'accept') {
        onAccepted(it, f);
      } else if (it.kind === 'decline') {
        toast(`${f.name} пока не может — в другой раз!`);
      }
    }
    if (changed) { S.inbox = S.inbox.filter((x) => now() - x.ts < 3 * 864e5).slice(-30); touch(); renderTabs(); if (V.tab === 'friends' || V.tab === 'family') renderPanel(); }
  }
  function reqText(it) {
    if (it.kind === 'friend') return 'хочет дружить!';
    if (it.kind === 'invite') { const a = G.actById(it.data.act); return `зовёт: ${a ? a.name.toLowerCase() + ' (' + placeById(a.place).name + ')' : 'погулять'}`; }
    if (it.kind === 'propose') return 'делает тебе предложение! 💍';
    if (it.kind === 'baby') return `предлагает завести малыша по имени ${String(it.data.kid && it.data.kid.name || '').slice(0, 20)}`;
    return '';
  }
  function sanitizeKid(k) {
    k = k && typeof k === 'object' ? k : {};
    return { id: String(k.id || 'k' + now().toString(36)).slice(0, 30), name: String(k.name || 'Малыш').slice(0, 20), gender: k.gender === 'm' ? 'm' : 'f', fur: G.FURS[k.fur] ? k.fur : 'classic', lvl: 1, xp: 0, born: now(), with: '' };
  }
  function answer(req, yes) {
    S.inbox = S.inbox.filter((x) => x.id !== req.id);
    const f = findFriend(req.from) || { id: req.from, kind: 'player', name: 'Капибара', app: G.sanitizeApp({}) };
    if (!yes) { G.Online.send(req.from, 'decline', { ref: req.id, kind: req.kind }); touch(); renderAll(); return; }
    if (req.kind === 'friend') { fr(f.id).ok = true; addFriendPts(f, 10); addDiary(`Новая дружба: ${f.name}.`); toast(`Теперь вы друзья: ${f.name}!`, 'good'); }
    if (req.kind === 'invite') {
      const a = G.actById(req.data.act);
      if (!a || !a.st.includes(stage())) { toast('Это занятие тебе сейчас не подходит', 'warn'); G.Online.send(req.from, 'decline', { ref: req.id, kind: req.kind }); renderAll(); return; }
      jointRun(a, f);
    }
    if (req.kind === 'propose') {
      if (S.partner || !isAdult(stage())) { toast(S.partner ? 'Ты уже в браке' : 'Жениться можно только взрослым', 'warn'); G.Online.send(req.from, 'decline', { ref: req.id, kind: req.kind }); renderAll(); return; }
      marry(f);
    }
    if (req.kind === 'baby') {
      if (!S.partner || S.partner.id !== req.from) { toast('Малышей заводят вместе со второй половинкой', 'warn'); renderAll(); return; }
      const kid = sanitizeKid(req.data.kid); kid.with = f.name;
      addKid(kid);
    }
    G.Online.send(req.from, 'accept', { ref: req.id, kind: req.kind });
    touch(); renderAll();
  }
  function onAccepted(it, f) {
    const orig = G.Online.sent(it.data.ref);
    if (!orig || orig.to !== it.from) return;
    if (orig.kind === 'friend') { fr(f.id).ok = true; addFriendPts(f, 10); addDiary(`Новая дружба: ${f.name}.`); toast(`${f.name} теперь твой друг!`, 'good'); }
    if (orig.kind === 'invite') { const a = G.actById(orig.data.act); if (a) { toast(`${f.name} ${f.app.gender === 'm' ? 'согласился' : 'согласилась'}!`, 'good'); jointRun(a, f); } }
    if (orig.kind === 'propose' && !S.partner) marry(f);
    if (orig.kind === 'baby' && S.partner && S.partner.id === it.from) { const kid = sanitizeKid(orig.data.kid); kid.with = f.name; addKid(kid); }
    touch(); renderAll();
  }
  // Совместное занятие: бесплатно, с другом рядом
  function jointRun(a, f) {
    const friend = Object.assign({}, f, { treat: true });
    if (V.busy || S.sleeping || !a.st.includes(stage())) { finish(a, friend, 1, `Вместе: ${f.name}`); renderAll(); return; }
    const p = placeById(a.place);
    if (p.st.includes(stage())) { S.place = a.place; V.variant = null; }
    if (a.special === 'movie') { SPECIAL.movie(a, friend); return; }
    if (a.special === 'ride' && S.vehicle) { SPECIAL.ride({ cost: {}, gain: a.gain, xp: a.xp }, friend); return; }
    if (a.mini || a.special) { finish(a, friend, 1, `Вместе: ${f.name}`); renderAll(); return; }
    startBusy({ label: a.name + ' · 👫 ' + f.name, anim: a.anim, dur: a.dur, friend, variant: a.variant, done: () => finish(a, friend, 1) });
    V.tab = 'here'; renderAll();
  }
  function inviteFriend(f, a) {
    closeModal();
    if (f.kind === 'npc') {
      const why = check(a, f);
      if (why) return toast(why, 'warn');
      goTo(a.place, true);
      doAct(a.id, f);
      return;
    }
    G.Online.send(f.id, 'invite', { act: a.id }).then((it) => toast(it ? `Приглашение отправлено: ${f.name}` : 'Не получилось отправить — нужен доступ на редактирование', it ? 'good' : 'warn'));
  }
  function friendRequest(f) {
    G.Online.send(f.id, 'friend', {}).then((it) => { if (it) { fr(f.id).sent = now(); touch(); renderPanel(); } toast(it ? `Запрос дружбы отправлен: ${f.name}` : 'Не получилось отправить', it ? 'good' : 'warn'); });
  }

  /* ================= Частицы ================= */
  function addParticle(type, n, x, y, extra) {
    const pos = headPos();
    for (let i = 0; i < n; i++) {
      V.parts.push(Object.assign({ type, x: (x != null ? x : pos.x) + rnd(-20, 20), y: (y != null ? y : pos.y) + rnd(-10, 10), vx: rnd(-25, 25), vy: rnd(-70, -30), life: 0, max: rnd(1.2, 2), size: rnd(12, 20), rot: rnd(-0.5, 0.5), col: pick(['#e63946', '#f4a261', '#2a9d8f', '#8338ec', '#ffb703', '#3a86ff']) }, extra || {}));
    }
    if (V.parts.length > 220) V.parts.splice(0, V.parts.length - 220);
  }
  function burst(type, n) {
    if (type === 'confetti') { for (let i = 0; i < n; i++) V.parts.push({ type, x: rnd(0, V.W), y: rnd(-40, 0), vx: rnd(-30, 30), vy: rnd(60, 160), life: 0, max: rnd(2, 3.5), size: rnd(5, 9), rot: rnd(0, 6), col: pick(['#e63946', '#f4a261', '#2a9d8f', '#8338ec', '#ffb703', '#3a86ff']) }); return; }
    addParticle(type, n);
  }
  function drawParticles(c, dt) {
    for (const p of V.parts) {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.type === 'confetti') { p.rot += dt * 5; p.vx += Math.sin(p.life * 3) * 20 * dt; }
      else if (p.type === 'bubble' || p.type === 'steam') p.vy -= 10 * dt;
      else p.vy += (p.type === 'crumb' || p.type === 'drop' ? 260 : 8) * dt;
      const a = Math.max(0, 1 - p.life / p.max);
      c.globalAlpha = Math.min(1, a * 1.5);
      switch (p.type) {
        case 'heart': G.Scenes.emo(c, '❤️', p.x, p.y, p.size, p.rot); break;
        case 'sparkle': G.Scenes.emo(c, '✨', p.x, p.y, p.size); break;
        case 'note': G.Scenes.emo(c, p.e || (p.e = pick(['🎵', '🎶'])), p.x, p.y, p.size); break;
        case 'zzz': c.fillStyle = '#ffffff'; c.strokeStyle = 'rgba(40,60,90,0.6)'; c.lineWidth = 3; c.font = `${p.size}px "Marmelad", sans-serif`; c.strokeText('z', p.x, p.y); c.fillText('z', p.x, p.y); break;
        case 'bubble': c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.5; c.beginPath(); c.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2); c.stroke(); break;
        case 'steam': c.globalAlpha *= 0.45; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(p.x, p.y, p.size * (1 + p.life * 0.6), 0, Math.PI * 2); c.fill(); break;
        case 'crumb': c.fillStyle = '#c98c3c'; c.fillRect(p.x, p.y, 3, 3); break;
        case 'drop': c.fillStyle = '#7cc3f0'; c.beginPath(); c.ellipse(p.x, p.y, 2.5, 4, 0, 0, Math.PI * 2); c.fill(); break;
        case 'confetti': c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col; c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); c.restore(); break;
        case 'text': c.fillStyle = p.col || '#fff'; c.font = `700 ${p.size}px "Nunito", sans-serif`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.35)'; c.strokeText(p.text, p.x, p.y); c.fillText(p.text, p.x, p.y); break;
        case 'emoji': G.Scenes.emo(c, p.e, p.x, p.y, p.size, p.rot); break;
        default: break;
      }
    }
    c.globalAlpha = 1;
    V.parts = V.parts.filter((p) => p.life < p.max && p.y < V.H + 40);
  }

  /* ================= Сцена ================= */
  const cv = () => $('#scene');
  let ctx = null;
  function resize() {
    const wrap = $('#sceneWrap');
    const r = wrap.getBoundingClientRect();
    V.dpr = Math.min(2, window.devicePixelRatio || 1);
    V.W = Math.max(200, r.width); V.H = Math.max(150, r.height);
    const c = cv();
    c.width = Math.round(V.W * V.dpr); c.height = Math.round(V.H * V.dpr);
    ctx = c.getContext('2d');
    ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  }
  const sceneScale = () => Math.min(V.W / 800, V.H / 500);
  const groundY = () => V.H * G.Scenes.ground(S.place);
  function mePos() {
    const st = G.stageById(stage());
    let y = groundY(), k = 1;
    if (S.place === 'square') { y = groundY() + (V.H - groundY()) * (0.12 + 0.72 * V.me.sy); k = 0.55 + 0.3 * V.me.sy; }
    const s = sceneScale() * k;
    return { x: V.me.x * V.W, y, s, S2: s * st.scale, st };
  }
  function headPos() {
    if (!S) return { x: V.W / 2, y: V.H / 2 };
    const p = mePos();
    return { x: p.x + V.me.dir * 130 * p.S2 * p.st.head, y: p.y - (150 + 60 * p.st.head) * p.S2 };
  }

  function animPose(anim, t, extra) {
    const P = {};
    switch (anim) {
      case 'eat': P.headRot = 0.22 + Math.sin(t * 5) * 0.04; P.mouth = (Math.sin(t * 14) + 1) / 2; P.mood = t % 2 < 1 ? 'normal' : 'happy'; break;
      case 'play': P.hop = -Math.abs(Math.sin(t * 4)) * 40; P.mood = 'happy'; break;
      case 'study': P.headRot = 0.12; P.prop = { emoji: '📖', x: 200, y: -44, size: 56 }; break;
      case 'sport': P.walk = t * 14; P.hop = -Math.abs(Math.sin(t * 7)) * 16; break;
      case 'music': P.guitar = true; P.headRot = Math.sin(t * 6) * 0.08; P.mood = 'happy'; break;
      case 'art': P.prop = { emoji: '🖌️', x: 205, y: -70 + Math.sin(t * 6) * 12, rot: Math.sin(t * 6) * 0.4, size: 44 }; P.headRot = 0.08; break;
      case 'bath': case 'swim': P.mood = 'content'; P.headRot = -0.05; P.hop = anim === 'swim' ? Math.sin(t * 2) * 6 : 0; break;
      case 'onsen': P.mood = 'content'; P.forceHat = 'yuzu'; P.headRot = -0.05 + Math.sin(t) * 0.02; break;
      case 'banya': P.mood = 'content'; P.prop = { emoji: '🌿', x: -30, y: -240, size: 60, rot: Math.sin(t * 5) * 0.6 }; break;
      case 'walk': P.walk = t * 9; break;
      case 'ride': P.riding = true; P.wheel = t * 7; break;
      case 'work': P.headRot = 0.1 + Math.sin(t * 4) * 0.04; break;
      case 'dance': P.hop = -Math.abs(Math.sin(t * 5)) * 30; P.headRot = Math.sin(t * 5) * 0.1; P.mood = 'happy'; break;
      case 'watch': P.lie = 0.35; P.headRot = -0.14; P.prop = { emoji: '🍿', x: 196, y: -30, size: 46 }; P.mood = (t % 5) < 1.2 ? 'happy' : 'normal'; P.mouth = (t % 5) < 1.2 ? 0.6 : 0; break;
      case 'laugh': P.hop = -Math.abs(Math.sin(t * 6)) * 14; P.mood = 'happy'; P.mouth = 0.5 + Math.sin(t * 10) * 0.3; break;
      case 'heal': P.lie = 0.6; P.mood = 'content'; break;
      case 'nap': P.lie = 1; P.mood = 'sleep'; break;
      case 'yoga': P.lie = 0.45; P.headRot = -0.25 + Math.sin(t * 0.8) * 0.05; P.mood = 'content'; break;
      case 'birds': P.mood = 'happy'; P.headRot = -0.05; break;
      default: break;
    }
    if (extra && extra.prop && anim !== 'study') P.prop = { emoji: extra.prop, x: 205, y: anim === 'eat' ? -14 : -40, size: 46 };
    return P;
  }

  function updateMe(dt) {
    const m = V.me, t = V.t, b = V.busy;
    // моргание, ушки, носик
    m.blinkAt -= dt;
    if (m.blinkAt <= 0) { m.blink = 1; m.blinkAt = rnd(2.2, 5.5); }
    m.blink = Math.max(0, m.blink - dt * 7);
    if (Math.random() < dt * 0.25) m.earRot = -0.45;
    m.earRot *= Math.pow(0.02, dt);
    if (Math.random() < dt * 0.3) m.sniff = 1;
    m.sniff = Math.max(0, m.sniff - dt * 3);
    m.happyT = Math.max(0, m.happyT - dt);
    m.yawnT = Math.max(0, m.yawnT - dt);
    // взгляд за курсором
    if (V.pointer) { const hp = headPos(); m.look = clamp((V.pointer.x - hp.x) / 160, -1, 1) * m.dir; }
    else m.look *= 0.95;

    const lieTarget = S.sleeping ? 1 : b ? (animPose(b.anim, t).lie || 0) : (S.needs.energy < 18 ? 0.55 : 0);
    m.lie += (lieTarget - m.lie) * Math.min(1, dt * 3);
    m.walking = false;
    if (S.sleeping) { if (Math.random() < dt * 0.9) addParticle('zzz', 1, headPos().x + 20, headPos().y - 10, { vx: rnd(8, 20), vy: -25, size: rnd(14, 22), max: 2.2 }); return; }
    if (b) {
      const a = b.anim;
      if (a === 'ride') {
        const veh = G.VEHICLES.find((v) => v.id === S.vehicle) || { speed: 1.5 };
        m.x += m.rideV * dt * 0.09 * veh.speed; m.dir = m.rideV;
        if (m.x > 0.84) m.rideV = -1; if (m.x < 0.16) m.rideV = 1;
      } else if (a === 'walk') {
        m.x += m.dir * dt * 0.08; if (m.x > 0.8) m.dir = -1; if (m.x < 0.2) m.dir = 1;
      } else if (a === 'dance') {
        if (Math.random() < dt * 0.8) m.dir *= -1;
      } else m.dir = b.friend ? 1 : m.dir;
      const hp = headPos();
      if (a === 'eat' && Math.random() < dt * 5) addParticle('crumb', 1, hp.x + m.dir * 40, hp.y + 60, { vx: rnd(-40, 40), vy: rnd(-60, -10), max: 0.8 });
      if ((a === 'bath' || a === 'swim') && Math.random() < dt * 6) addParticle('bubble', 1, hp.x + rnd(-120, 60), hp.y + rnd(30, 90), { vy: rnd(-40, -15), max: 1.6 });
      if ((a === 'onsen' || a === 'banya') && Math.random() < dt * 1.6) addParticle('steam', 1, hp.x + rnd(-220, 160), hp.y + rnd(60, 110), { vy: rnd(-30, -15), vx: rnd(-8, 8), size: rnd(8, 14), max: 2.4 });
      if (a === 'music' && Math.random() < dt * 2.5) addParticle('note', 1, hp.x - m.dir * 60, hp.y + 40);
      if (a === 'sport' && Math.random() < dt * 3) addParticle('drop', 1, hp.x, hp.y, { vx: rnd(-40, 40), vy: rnd(-80, -40), max: 0.9 });
      if (a === 'art' && Math.random() < dt * 3) addParticle('emoji', 1, hp.x + m.dir * 60, hp.y + 40, { e: pick(['🟠', '🔵', '🟣', '🟢']), size: 8, max: 1 });
      if (a === 'study' && Math.random() < dt * 0.8) addParticle('emoji', 1, hp.x, hp.y - 20, { e: pick(['💡', '❓', '✏️']), size: 18, vy: -30, max: 1.6 });
      if (a === 'work' && Math.random() < dt * 0.8) addParticle('emoji', 1, hp.x, hp.y - 20, { e: b.prop || '💼', size: 18, vy: -30, max: 1.6 });
      if (a === 'dance' && Math.random() < dt * 3) addParticle('sparkle', 1, hp.x + rnd(-100, 100), hp.y + rnd(-20, 60));
      if (a === 'laugh' && Math.random() < dt * 1.2) addParticle('text', 1, hp.x + 30, hp.y - 10, { text: 'ха-ха', size: 16, col: '#fff7b0', vy: -40 });
      if (a === 'heal' && Math.random() < dt * 1.5) addParticle('emoji', 1, hp.x, hp.y, { e: pick(['💊', '➕', '💗']), size: 16, vy: -30 });
      if (a === 'birds' && Math.random() < dt * 1) addParticle('heart', 1);
      return;
    }
    // свободное поведение
    m.idleT -= dt;
    const roam = ['home', 'park', 'square', 'dacha', 'onsen', 'art', 'cafe', 'kindergarten', 'clinic'].includes(S.place);
    if (m.idleT <= 0) {
      m.idleT = rnd(3, 7);
      const r = Math.random();
      if (roam && r < 0.45 && m.lie < 0.3) m.tx = rnd(0.22, 0.78);
      else if (r < 0.62 && S.needs.fun > 65 && S.needs.energy > 25) { m.hopV = -220; Sound.play('squeak'); }
      else if (r < 0.75 && S.needs.energy < 35) { m.yawnT = 1.2; }
      else if (r < 0.9) { m.lookT = 1.5; }
    }
    if (m.tx != null) {
      const dx = m.tx - m.x;
      if (Math.abs(dx) < 0.01) m.tx = null;
      else { m.dir = dx > 0 ? 1 : -1; m.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 0.1); m.walking = true; m.walk += dt * 9; }
    }
    if (S.place === 'square' && m.ty != null) { const dy = m.ty - m.sy; if (Math.abs(dy) < 0.01) m.ty = null; else { m.sy += Math.sign(dy) * Math.min(Math.abs(dy), dt * 0.25); m.walking = true; m.walk += dt * 4; } }
    // попкорн-прыжок
    if (m.hopV || m.hop < 0) { m.hop += m.hopV * dt; m.hopV += 900 * dt; if (m.hop >= 0) { m.hop = 0; m.hopV = 0; } }
    if (m.lookT > 0) { m.lookT -= dt; m.hr = Math.sin(m.lookT * 3) * 0.15; } else m.hr *= 0.9;
  }

  function moodOf() {
    if (S.sleeping) return 'sleep';
    if (V.me.happyT > 0) return 'happy';
    const n = S.needs;
    if (n.health < 25) return 'sick';
    if (n.food < 20 || n.fun < 20 || n.clean < 15) return 'sad';
    if (n.energy < 20) return 'tired';
    if (n.fun > 75 && n.food > 50) return V.t % 9 < 4 ? 'happy' : 'normal';
    return 'normal';
  }
  function wish() {
    if (S.sleeping || V.busy) return null;
    const n = S.needs;
    const list = [['food', '🥕'], ['energy', '💤'], ['clean', '🛁'], ['fun', '🎈'], ['health', '🩺']].filter(([k]) => n[k] < 30).sort((a, b) => n[a[0]] - n[b[0]]);
    return list.length ? list[0][1] : null;
  }

  function drawName(c, name, x, y, you) {
    c.font = '700 12px "Nunito", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(name).width + 14;
    c.fillStyle = you ? 'rgba(239,138,16,0.92)' : 'rgba(29,50,49,0.78)';
    c.beginPath(); c.roundRect(x - w / 2, y - 9, w, 18, 9); c.fill();
    c.fillStyle = '#fff'; c.fillText(name, x, y + 0.5);
  }
  function bubble(c, x, y, text, isEmoji) {
    c.font = isEmoji ? '24px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' : '700 13px "Nunito", sans-serif';
    const w = Math.max(isEmoji ? 40 : 30, c.measureText(text).width + 18), hh = isEmoji ? 38 : 26;
    c.fillStyle = 'rgba(255,255,255,0.96)'; c.strokeStyle = 'rgba(29,50,49,0.25)'; c.lineWidth = 1;
    c.beginPath(); c.roundRect(x - w / 2, y - hh, w, hh, 13); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 6, y - 1); c.lineTo(x, y + 8); c.lineTo(x + 6, y - 1); c.fill();
    c.fillStyle = '#1d3231'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y - hh / 2 + 1);
  }

  function sceneEnv() {
    const hour = new Date().getHours();
    const job = G.JOBS.find((j) => j.id === S.job);
    return {
      hour, season: G.Scenes.season(), variant: V.variant || (V.busy && V.busy.variant) || null,
      toys: S.inv.toys, paintingSeed: S.homePainting, trophies: S.stats.games > 5, job: S.job,
      jobTitle: job ? G.jobName(job, S.gender) : '', movie: V.busy && V.busy.anim === 'watch' ? V.movie : '',
      key: S.place === 'home' ? S.inv.toys.join(',') + '|' + S.homePainting + '|' + (S.stats.games > 5) : S.place === 'work' ? S.job + S.gender : '',
      board: stage() === 'baby' ? '1 + 1 = 🍊🍊' : stage() === 'kid' ? '2 + 3 = 🍊🍊🍊🍊🍊' : '7 × 8 = 56',
    };
  }

  function drawScene(dt) {
    const c = ctx; if (!c || !S) return;
    const W = V.W, H = V.H, t = V.t;
    const env = sceneEnv();
    G.Scenes.draw(c, S.place, W, H, t, env);
    const me = mePos();
    const b = V.busy;
    const list = [];
    // друг рядом во время совместного занятия
    if (b && b.friend) {
      const fp = animPose(b.anim, t + 0.5, b);
      list.push({ app: b.friend.app, x: b.anim === 'ride' || b.anim === 'walk' ? me.x - V.me.dir * 260 * me.S2 : Math.min(V.W * 0.88, me.x + 400 * me.S2), y: me.y, s: me.s, dir: b.anim === 'ride' || b.anim === 'walk' ? V.me.dir : -1, pose: Object.assign({ t: t + 0.7, blink: (t + 1.3) % 4 < 0.1 ? 1 : 0, mood: 'happy' }, fp, b.anim === 'ride' ? { riding: false, walk: t * 12 } : {}), name: b.friend.name });
    }
    // семья дома
    if (S.place === 'home' && !b) {
      S.kids.slice(0, 3).forEach((k, i) => {
        const kx = (0.66 + i * 0.1 + Math.sin(t * 0.3 + i * 2) * 0.03) * W;
        list.push({ app: { fur: k.fur, stage: G.stageOf(k.lvl).id, outfit: {} }, x: kx, y: me.y + 6, s: me.s, dir: Math.cos(t * 0.3 + i * 2) > 0 ? 1 : -1, pose: { t: t + i, walk: t * 6 + i, blink: (t + i) % 3.7 < 0.1 ? 1 : 0, mood: S.sleeping ? 'sleep' : 'normal', lie: S.sleeping ? 1 : 0 }, name: k.name });
      });
      if (S.partner) list.push({ app: partnerApp(), x: 0.18 * W, y: me.y + 2, s: me.s, dir: 1, pose: { t: t + 2, blink: (t + 2) % 4.3 < 0.1 ? 1 : 0, mood: S.sleeping ? 'sleep' : 'normal', lie: S.sleeping ? 1 : 0 }, name: S.partner.name });
    }
    if (S.place === 'dacha' && !b && S.ancestors.length) {
      const an = S.ancestors[S.ancestors.length - 1];
      list.push({ app: { fur: an.fur, stage: 'elder', gender: an.gender, outfit: { eyes: 'roundglasses', hat: an.gender === 'm' ? 'panama' : 'wreath' } }, x: 0.2 * W, y: me.y, s: me.s, dir: 1, pose: { t: t + 3, blink: (t + 3) % 4 < 0.1 ? 1 : 0, mood: 'content', lie: 0.3 }, name: (an.gender === 'm' ? 'Дедушка ' : 'Бабушка ') + an.name });
    }
    if (S.place === 'square') squareActors(list, dt);
    const mood = moodOf();
    const myPose = Object.assign({ t, blink: V.me.blink, mood, look: V.me.look, headRot: V.me.hr, earRot: V.me.earRot, sniff: V.me.sniff, lie: V.me.lie, hop: V.me.hop, walk: V.me.walking ? V.me.walk : null, mouth: V.me.yawnT > 0 ? Math.sin((V.me.yawnT / 1.2) * Math.PI) : 0, blush: V.me.happyT > 0 ? 0.2 : 0 }, b ? animPose(b.anim, t, b) : {});
    if (b) { myPose.lie = V.me.lie; if (b.anim === 'walk' || b.anim === 'ride') myPose.walk = t * 9; if (b.anim === 'ride') { myPose.riding = true; myPose.wheel = t * 7 * V.me.rideV; } }
    let meDraw = { app: appOf(), x: me.x, y: me.y, s: me.s, dir: V.me.dir, pose: myPose, name: S.place === 'square' ? S.name : null, me: true };
    if (b && b.anim === 'ride' && S.vehicle === 'balloon') { meDraw.s = me.s * 0.55; meDraw.y = me.y - V.H * 0.28 + Math.sin(t) * 8; }
    if (S.place === 'square') meDraw.bubble = V.myBubble;
    list.push(meDraw);
    list.sort((a, bb) => a.y - bb.y);
    for (const it of list) {
      G.drawCapy(c, it.app, it.pose, it.x, it.y, it.s, it.dir);
      if (it.birds || (it.me && b && b.anim === 'birds')) { const hp = headPos(); G.Scenes.emo(c, '🐦', hp.x - 10, hp.y - 12 + Math.sin(t * 3) * 2, 26); G.Scenes.emo(c, '🐤', hp.x - 60, hp.y + 10, 20); }
      if (S.place === 'square' && it.name) drawName(c, it.name, it.x + (it.dir || 1) * 40 * it.s, it.y + 14, it.me);
      if (it.bubble) bubble(c, it.x + (it.dir || 1) * 110 * it.s, it.y - 250 * it.s, it.bubble.text, it.bubble.emoji);
    }
    // вода и ванна поверх
    const inOnsen = S.place === 'onsen' && env.variant !== 'banya';
    if ((b && (b.anim === 'onsen' || b.anim === 'swim' || b.anim === 'bath')) || inOnsen) {
      const soak = b && (b.anim === 'onsen' || b.anim === 'swim');
      const depthY = me.y - (soak ? 72 : 34) * me.S2;
      if (b && b.anim === 'bath') G.Scenes.tub(c, me.x + 30 * me.S2, me.y, me.S2 * 1.1, t);
      else G.Scenes.water(c, 0, W, depthY, H - depthY, t, inOnsen ? 'rgba(127,201,189,0.86)' : S.place === 'park' ? 'rgba(90,166,200,0.86)' : 'rgba(79,179,224,0.86)');
    }
    G.Scenes.front(c, S.place, W, H, t, env);
    if (S.sleeping) { c.fillStyle = 'rgba(20,24,60,0.25)'; c.fillRect(0, 0, W, H); }
    drawParticles(c, dt);
    const w = wish();
    if (w) { const hp = headPos(); const bx = hp.x + V.me.dir * 34, by = hp.y - 26 + Math.sin(t * 2) * 3; c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); c.arc(hp.x + V.me.dir * 10, hp.y + 2, 4, 0, 7); c.fill(); c.beginPath(); c.arc(hp.x + V.me.dir * 20, hp.y - 10, 6, 0, 7); c.fill(); c.beginPath(); c.arc(bx, by, 20, 0, 7); c.fill(); G.Scenes.emo(c, w, bx, by + 1, 22); }
  }
  function partnerApp() {
    const p = S.partner;
    if (p.kind === 'player' && G.Online.players[p.id]) { const c = G.Online.players[p.id]; return { fur: c.fur, gender: c.gender, stage: c.stage, outfit: c.outfit }; }
    if (p.kind === 'npc') { const n = npcList().find((x) => x.id === p.id); if (n) return n.app; }
    return G.sanitizeApp(p.app || {});
  }

  /* ---------- Площадь: живые игроки + капи-соседи ---------- */
  function squareActors(list, dt) {
    const me = mePos();
    const alive = new Set();
    for (const p of G.Online.onlinePeers()) {
      const pr = p.presence || {};
      if (pr.place !== 'square') continue;
      alive.add(p.peer);
      let a = V.sqPeers.get(p.peer);
      if (!a) { a = { x: +pr.x || 0.5, y: +pr.y || 0.5, seenE: pr.et, seenS: pr.st, eT: 0, sT: 0 }; V.sqPeers.set(p.peer, a); }
      a.tx = clamp(+pr.x || 0.5, 0.05, 0.95); a.ty = clamp(+pr.y || 0.5, 0, 1); a.dir = pr.d === -1 ? -1 : 1;
      a.app = G.sanitizeApp(pr.a || {}); a.by = p.by;
      if (pr.et !== a.seenE) { a.seenE = pr.et; if (pr.e && G.EMOTES.includes(pr.e)) { a.emote = pr.e; a.eT = 3.5; } }
      if (pr.st !== a.seenS) { a.seenS = pr.st; if (pr.s && G.PHRASES.includes(pr.s)) { a.say = pr.s; a.sT = 4; } }
    }
    for (const k of [...V.sqPeers.keys()]) if (!alive.has(k)) V.sqPeers.delete(k);
    const actors = [...V.sqPeers.values()];
    // капи-соседи, если людей мало
    const npcN = actors.length === 0 ? 3 : actors.length < 3 ? 1 : 0;
    if (npcN) {
      if (!V.sqNpcs.length) V.sqNpcs = npcList().slice(0, 3).map((n, i) => { const x = [0.12, 0.66, 0.86][i], y = [0.15, 0.05, 0.9][i]; return { npc: n, x, y, tx: x, ty: y, dir: i === 1 ? -1 : 1, eT: 0, sT: 0, next: rnd(2, 6) }; });
      for (const n of V.sqNpcs.slice(0, npcN)) {
        n.next -= dt;
        if (n.next <= 0) { n.next = rnd(4, 9); if (Math.random() < 0.6) { n.tx = rnd(0.1, 0.9); n.ty = rnd(0.05, 0.95); } else if (Math.random() < 0.5) { n.say = pick(G.PHRASES); n.sT = 3.5; } else { n.emote = pick(G.EMOTES.slice(0, 5)); n.eT = 3; } }
        actors.push(Object.assign(n, { app: n.npc.app, name: n.npc.name, npcId: n.npc.id }));
      }
    }
    V.sqActors = [];
    for (const a of actors) {
      const dx = a.tx - a.x, dy = a.ty - a.y;
      const moving = Math.abs(dx) > 0.004 || Math.abs(dy) > 0.004;
      a.x += dx * Math.min(1, dt * 1.6); a.y += dy * Math.min(1, dt * 1.6);
      if (Math.abs(dx) > 0.004) a.dir = dx > 0 ? 1 : -1;
      a.eT = Math.max(0, a.eT - dt); a.sT = Math.max(0, a.sT - dt);
      const gy = groundY(), yy = gy + (V.H - gy) * (0.12 + 0.72 * a.y), k = 0.55 + 0.3 * a.y, s = sceneScale() * k;
      const nm = a.name || (a.app && a.app.name) || 'Капибара';
      const item = { app: a.app, x: a.x * V.W, y: yy, s, dir: a.dir, pose: { t: V.t + a.x * 10, walk: moving ? V.t * 9 : null, blink: (V.t + a.x * 7) % 4 < 0.1 ? 1 : 0, mood: a.eT > 0 && a.emote === '😂' ? 'happy' : 'normal' }, name: nm, bubble: a.sT > 0 ? { text: a.say } : a.eT > 0 ? { text: a.emote, emoji: true } : null, ref: a };
      list.push(item);
      V.sqActors.push(item);
    }
    const myB = V.say && V.say.until > performance.now() ? { text: V.say.text } : V.emote && V.emote.until > performance.now() ? { text: V.emote.e, emoji: true } : null;
    if (myB) V.myBubble = myB; else V.myBubble = null;
    list.myBubble = myB;
    void me;
  }
  function updatePresence() {
    if (!S || !G.Online.room) return;
    const a = appOf();
    G.Online.presence({ place: S.place, x: +V.me.x.toFixed(3), y: +V.me.sy.toFixed(3), d: V.me.dir, a: { name: S.name, fur: a.fur, gender: a.gender, stage: a.stage, outfit: S.outfit, vehicle: S.vehicle }, e: V.emote ? V.emote.e : null, et: V.emote ? V.emote.at : 0, s: V.say ? V.say.text : null, st: V.say ? V.say.at : 0 });
  }
  function card() {
    return { name: S.name, fur: S.fur, gender: S.gender, stage: stage(), lvl: S.lvl, outfit: S.outfit, vehicle: S.vehicle, job: S.job, partner: S.partner && S.partner.kind === 'player' ? S.partner.id : null, partnerName: S.partner ? S.partner.name : '', kids: S.kids.length, gen: S.gen, place: S.place };
  }
  function publishCard() { if (S && G.Online.mode === 'online') G.Online.publishCard(card()); }

  /* ================= Ввод на сцене ================= */
  function onScenePointer(e) {
    Sound.ensure();
    if (!S || $('#modal').hidden === false) return;
    const r = cv().getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const me = mePos();
    const left = V.me.dir === 1 ? me.x - 150 * me.S2 : me.x - 240 * me.S2 * me.st.head;
    const right = V.me.dir === 1 ? me.x + 240 * me.S2 * me.st.head : me.x + 150 * me.S2;
    const top = me.y - (190 + 60 * me.st.head) * me.S2;
    if (x > left && x < right && y > top && y < me.y + 10) return pet();
    if (S.place === 'square' && V.sqActors) {
      for (const a of V.sqActors) {
        if (Math.abs(x - a.x) < 120 * a.s && y > a.y - 200 * a.s && y < a.y + 10) {
          const f = a.ref.npcId ? findFriend(a.ref.npcId) : a.ref.by ? findFriend(a.ref.by) || { id: a.ref.by, kind: 'player', name: a.name, app: a.app } : null;
          if (f) return openPerson(f);
        }
      }
    }
    if (V.busy || S.sleeping) return;
    const roam = ['home', 'park', 'square', 'dacha', 'onsen', 'art', 'cafe', 'kindergarten', 'clinic'].includes(S.place);
    if (roam && y > groundY() - 40) {
      V.me.tx = clamp(x / V.W, 0.1, 0.9);
      if (S.place === 'square') { const gy = groundY(); V.me.ty = clamp(((y - gy) / (V.H - gy) - 0.12) / 0.72, 0, 1); updatePresenceTarget(); }
    }
  }
  function updatePresenceTarget() {
    if (!G.Online.room || !S) return;
    const a = appOf();
    G.Online.presence({ place: S.place, x: +(V.me.tx != null ? V.me.tx : V.me.x).toFixed(3), y: +(V.me.ty != null ? V.me.ty : V.me.sy).toFixed(3), d: V.me.dir, a: { name: S.name, fur: a.fur, gender: a.gender, stage: a.stage, outfit: S.outfit, vehicle: S.vehicle }, e: V.emote ? V.emote.e : null, et: V.emote ? V.emote.at : 0, s: V.say ? V.say.text : null, st: V.say ? V.say.at : 0 });
  }
  function pet() {
    const nowp = performance.now();
    if (nowp - (V.lastPet || 0) < 350) return;
    V.lastPet = nowp;
    V.me.happyT = 1.6;
    addParticle('heart', 2);
    Sound.play(Math.random() < 0.5 ? 'purr' : 'squeak');
    if (!S.sleeping) { S.needs.fun = clamp(S.needs.fun + 1.5, 0, 100); }
    S.stats.pets++;
    if (S.stats.pets === 20) { toast(`${S.name} мурчит от счастья — капибары обожают, когда их гладят`, 'good'); addDiary('Научились мурчать от поглаживаний.'); }
    touch();
  }

  /* ================= Интерфейс ================= */
  function toast(msg, kind) {
    if (!msg) return;
    const box = $('#toasts');
    const t = h('div', { class: 'toast' + (kind ? ' ' + kind : ''), text: msg });
    box.append(t);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => t.remove(), 3200);
  }
  function openModal(title, nodes, opts) {
    opts = opts || {};
    $('#modalTitle').textContent = title;
    $('#modalBody').replaceChildren(...nodes.filter(Boolean));
    $('#modalX').hidden = !!opts.locked;
    $('#modalCard').classList.toggle('wide', !!opts.wide);
    $('#modal').hidden = false;
    V.modal = opts;
    if (!opts.keepHero) V.hero = null;
  }
  function closeModal() {
    $('#modal').hidden = true;
    const m = V.modal; V.modal = null; V.hero = null;
    if (m && m.onClose) m.onClose();
  }

  const TABS = [['here', 'Здесь'], ['city', 'Город'], ['shop', 'Магазин'], ['things', 'Вещи'], ['me', 'Я'], ['family', 'Семья'], ['friends', 'Друзья']];
  function renderTabs() {
    const nav = $('#tabs');
    nav.replaceChildren(...TABS.map(([id, label]) => h('button', { class: 'tab', role: 'tab', 'aria-selected': V.tab === id ? 'true' : 'false', onclick: () => { V.tab = id; Sound.play('click'); renderTabs(); renderPanel(); } }, label, id === 'friends' && S && S.inbox.length ? h('span', { class: 'dot' }) : null)));
  }
  function renderTop() {
    if (!S) return;
    $('#capyName').textContent = S.name;
    const job = G.JOBS.find((j) => j.id === S.job);
    $('#capyMeta').textContent = [G.stageName(stage(), S.gender), job ? G.jobName(job, S.gender) : null, S.gen > 1 ? `поколение ${S.gen}` : null].filter(Boolean).join(' · ');
    $('#lvlNum').textContent = S.lvl;
    $('#xpFill').style.width = (S.lvl >= G.MAX_LVL ? 100 : (S.xp / G.xpNeed(S.lvl)) * 100) + '%';
    $('#coinNum').textContent = S.coins;
    $('#dailyBtn').hidden = now() - S.daily < 20 * 3600e3;
    $('#soundBtn').textContent = Sound.on ? '🔊' : '🔇';
    $('#placeTag').textContent = placeById(S.place).icon + ' ' + placeById(S.place).name;
    const mini = $('#miniAvatar');
    const key = JSON.stringify([S.fur, stage(), S.outfit]);
    if (mini.dataset.k !== key) { mini.dataset.k = key; G.renderAvatar(mini, appOf()); }
    const net = $('#netTag');
    if (G.Online.mode === 'online') { net.hidden = false; const n = G.Online.onlinePeers().length; net.textContent = n ? `🟢 Онлайн: ещё ${n}` : '🟢 Онлайн-городок'; net.className = 'net-on'; }
    else net.hidden = true;
    document.title = `${S.name} · Капи-жизнь`;
  }
  function buildNeeds() {
    const box = $('#needs');
    box.replaceChildren(...G.NEEDS.map((n) => h('div', { class: 'need', id: 'need-' + n.id, title: n.name }, h('span', { class: 'ic', text: n.icon }), h('span', { class: 'nm', text: n.name }), h('span', { class: 'val' }), h('div', { class: 'bar' }, h('i')))));
  }
  function renderNeeds() {
    if (!S) return;
    for (const n of G.NEEDS) {
      const v = Math.round(S.needs[n.id]);
      const e = document.getElementById('need-' + n.id);
      if (!e) continue;
      e.className = 'need ' + (v < 25 ? 'low' : v < 55 ? 'mid' : 'ok');
      e.querySelector('.val').textContent = v;
      e.querySelector('.bar i').style.width = v + '%';
    }
  }
  function renderAll() { if (!S) return; renderTop(); renderNeeds(); renderTabs(); renderPanel(); }

  function fx(a) {
    const box = h('div', { class: 'fx' });
    for (const [k, v] of Object.entries(a.gain || {})) if (v) box.append(h('span', { class: v > 0 ? 'plus' : 'minus', text: `${v > 0 ? '+' : ''}${v} ${G.ICON[k]}` }));
    for (const [k, v] of Object.entries(a.cost || {})) if (v) box.append(h('span', { class: k === 'coins' ? 'cost' : 'minus', text: k === 'coins' ? `${v} 🍊` : `−${v} ${G.ICON[k]}` }));
    return box.childNodes.length ? box : null;
  }
  function actCard(a) {
    const why = check(a);
    const b = h('div', { class: 'act', role: 'button', tabindex: '0', 'aria-disabled': why ? 'true' : null, onclick: () => (why ? toast(why, 'warn') : doAct(a.id)), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } } },
      h('div', { class: 't' }, h('span', { class: 'e', text: a.icon }), h('span', { text: a.name })),
      fx(a),
      a.desc ? h('div', { class: 'muted', text: a.desc }) : null,
      why && !V.busy ? h('div', { class: 'why', text: why }) : null);
    if (a.social && !why) b.append(h('button', { class: 'with', text: '👫 С другом', onclick: (e) => { e.stopPropagation(); pickFriendFor(a); } }));
    return b;
  }
  function renderPanel() {
    if (!S) return;
    const body = $('#panelBody');
    const top = body.scrollTop;
    const fn = { here: panelHere, city: panelCity, shop: panelShop, things: panelThings, me: panelMe, family: panelFamily, friends: panelFriends }[V.tab] || panelHere;
    body.replaceChildren(...fn().filter(Boolean));
    body.scrollTop = top;
    V.lastPanel = performance.now();
  }

  function panelHere() {
    const pl = placeById(S.place);
    const out = [h('div', { class: 'sec-title' }, h('h2', { text: pl.name }), S.place !== 'home' ? h('button', { class: 'btn btn-sm', text: '🏠 Домой', onclick: () => goTo('home') }) : h('button', { class: 'btn btn-sm', text: '🗺️ В город', onclick: () => { V.tab = 'city'; renderTabs(); renderPanel(); } }))];
    if (S.sleeping) {
      out.push(h('div', { class: 'card' }, h('b', { text: `${S.name} сладко спит 💤` }), h('p', { class: 'muted', text: `Энергия ${Math.round(S.needs.energy)}%. Во сне силы восстанавливаются быстрее всего — проснётся сама, когда выспится.` }), h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-main', text: 'Разбудить', onclick: () => wake() }))));
      return out;
    }
    if (V.busy) out.push(h('p', { class: 'muted', text: `Сейчас: ${V.busy.label}. Остальное — чуть позже.` }));
    if (S.place === 'square') out.push(...squarePanel());
    const acts = G.ACTS.filter((a) => a.place === S.place && a.st.includes(stage()));
    const locked = G.ACTS.filter((a) => a.place === S.place && !a.st.includes(stage()));
    if (acts.length) out.push(h('div', { class: 'acts' }, acts.map(actCard)));
    if (S.place === 'work' && S.job) {
      const j = G.JOBS.find((x) => x.id === S.job);
      out.push(h('div', { class: 'card' }, h('b', { text: `${j.icon} ${G.jobName(j, S.gender)} · ${G.RANKS[rankOf()]}` }), h('p', { class: 'muted', text: `Смен отработано: ${S.shifts}. Зарплата за смену: ${Math.round(j.pay * (1 + rankOf() * 0.25))} 🍊. Повышение каждые 6 смен.` })));
    }
    if (S.place === 'home' && S.kids.length) out.push(h('p', { class: 'muted', text: 'Малыши живут с тобой — загляни во вкладку «Семья», чтобы покормить и поиграть.' }));
    if (locked.length) out.push(h('p', { class: 'muted', text: `Ещё ${locked.length} ${locked.length === 1 ? 'занятие откроется' : 'занятия откроются'} в другом возрасте.` }));
    out.push(h('p', { class: 'muted', text: 'Подсказка: нажми на капибару, чтобы погладить, или на пол — она подойдёт.' }));
    return out;
  }
  function squarePanel() {
    const peers = G.Online.onlinePeers().filter((p) => (p.presence || {}).place === 'square');
    const out = [];
    out.push(h('p', { class: 'muted', text: G.Online.room ? (peers.length ? `На площади ещё ${peers.length}. Нажми на капибару, чтобы подружиться или позвать гулять.` : 'Пока тут только капи-соседи. Как только друзья откроют игру, они появятся здесь.') : 'Живая площадь работает, когда игра открыта по ссылке claude.ai. Сейчас тут гуляют капи-соседи.' }));
    out.push(h('p', { class: 'eyebrow', text: 'Эмоции' }), h('div', { class: 'emotes' }, G.EMOTES.map((e) => h('button', { text: e, 'aria-label': 'Эмоция ' + e, onclick: () => { V.emote = { e, at: now(), until: performance.now() + 3500 }; updatePresenceTarget(); Sound.play('pop'); } }))));
    out.push(h('p', { class: 'eyebrow', text: 'Сказать' }), h('div', { class: 'phrases' }, G.PHRASES.map((p) => h('button', { text: p, onclick: () => { V.say = { text: p, at: now(), until: performance.now() + 4000 }; updatePresenceTarget(); Sound.play('squeak'); } }))));
    return out;
  }
  function panelCity() {
    const st = stage();
    return [
      h('div', { class: 'sec-title' }, h('h2', { text: 'Капи-городок' })),
      h('p', { class: 'muted', text: 'Куда пойдём? Некоторые места открываются с возрастом.' }),
      h('div', { class: 'places' }, G.PLACES.map((p) => {
        const ok = p.st.includes(st);
        const lock = !ok ? (G.stageIdx(p.st[0]) > G.stageIdx(st) ? `Откроется: ${G.stageName(p.st[0], S.gender).toLowerCase()}` : 'Для малышей') : p.desc;
        return h('button', { class: 'place' + (S.place === p.id ? ' cur' : ''), 'aria-disabled': ok ? null : 'true', onclick: () => (ok ? goTo(p.id) : toast(lock, 'warn')) }, h('span', { class: 'i', text: p.icon }), h('b', { text: p.name }), h('small', { text: lock }));
      })),
    ];
  }
  function panelShop() {
    const cat = CATS.find((c) => c.id === V.shopCat) || CATS[0];
    const st = stage();
    const items = h('div', { class: 'items' });
    for (const it of cat.list()) {
      const own = owned(cat.id, it.id);
      const stOk = !it.st || it.st.includes(st);
      const row = h('div', { class: 'row' });
      if (cat.id === 'food' || cat.id === 'gifts') {
        row.append(h('span', { class: 'price' }, h('span', { class: 'coin' }), String(it.price)), h('button', { class: 'btn btn-main btn-sm', disabled: S.coins < it.price || !stOk ? true : null, text: 'Купить', onclick: () => buy(cat.id, it) }));
        if (cat.id === 'food') row.append(h('button', { class: 'btn btn-sm', disabled: S.coins < it.price * 5 ? true : null, text: '×5', title: 'Купить пять', onclick: () => buy(cat.id, it, 5) }));
      } else if (own) {
        if (cat.id === 'clothes') { const on = S.outfit[it.slot] === it.id; row.append(h('button', { class: 'btn btn-sm', text: on ? 'Снять' : 'Надеть', onclick: () => { S.outfit[it.slot] = on ? null : it.id; touch(); renderAll(); publishCard(); } })); }
        else if (cat.id === 'vehicles') { const on = S.vehicle === it.id; row.append(h('button', { class: 'btn btn-sm', text: on ? 'Выбран' : 'Выбрать', disabled: on ? true : null, onclick: () => { S.vehicle = it.id; touch(); renderAll(); publishCard(); } })); }
        else row.append(h('span', { class: 'tag', text: 'Есть' }));
      } else {
        row.append(h('span', { class: 'price' }, h('span', { class: 'coin' }), String(it.price)));
        if (cat.id === 'clothes' && stOk) row.append(h('button', { class: 'btn btn-sm', text: 'Примерить', onclick: () => { V.preview = { slot: it.slot, id: it.id, until: performance.now() + 6000 }; Sound.play('pop'); } }));
        row.append(h('button', { class: 'btn btn-main btn-sm', disabled: S.coins < it.price || !stOk ? true : null, text: 'Купить', onclick: () => buy(cat.id, it) }));
      }
      let ds = '';
      if (cat.id === 'food') ds = foodFx(it) + (own ? ` · дома: ${own}` : '');
      else if (cat.id === 'toys') ds = (it.note ? it.note + '. ' : '') + ['fun', 'mind', 'sport', 'art', 'music', 'health'].filter((k) => it[k]).map((k) => `+${it[k]} ${G.ICON[k]}`).join(' ');
      else if (cat.id === 'vehicles') ds = it.water ? 'Плавает по пруду' : it.air ? 'Летает над парком' : 'Кататься в парке';
      else if (cat.id === 'gifts') ds = (it.note || `+${it.pts} к дружбе`) + (own ? ` · есть: ${own}` : '');
      else if (cat.id === 'clothes') ds = G.SLOTS.find((s) => s.id === it.slot).name;
      if (!stOk) ds = `С возраста: ${G.stageName(it.st[0], S.gender).toLowerCase()}`;
      items.append(h('div', { class: 'item' + (own && cat.id !== 'food' && cat.id !== 'gifts' ? ' on' : '') }, h('div', { class: 'ic', text: it.icon }), h('div', { class: 'nm', text: it.name }), ds ? h('div', { class: 'ds', text: ds }) : null, row));
    }
    return [
      h('div', { class: 'sec-title' }, h('h2', { text: 'Торговый центр' }), h('span', { class: 'chip' }, h('span', { class: 'coin' }), String(S.coins))),
      h('div', { class: 'seg' }, CATS.map((c) => h('button', { 'aria-pressed': c.id === cat.id ? 'true' : 'false', text: c.name, onclick: () => { V.shopCat = c.id; renderPanel(); } }))),
      items,
    ];
  }
  function panelThings() {
    const out = [h('div', { class: 'sec-title' }, h('h2', { text: 'Вещи' }))];
    out.push(h('h3', { text: 'Гардероб' }));
    for (const slot of G.SLOTS) {
      const own = G.CLOTHES.filter((c) => c.slot === slot.id && S.inv.clothes.includes(c.id));
      out.push(h('div', { class: 'card' }, h('p', { class: 'eyebrow', text: slot.name }), own.length ? h('div', { class: 'seg' },
        h('button', { 'aria-pressed': !S.outfit[slot.id] ? 'true' : 'false', text: 'Ничего', onclick: () => { S.outfit[slot.id] = null; touch(); renderAll(); publishCard(); } }),
        own.map((c) => h('button', { 'aria-pressed': S.outfit[slot.id] === c.id ? 'true' : 'false', text: c.icon + ' ' + c.name, onclick: () => { S.outfit[slot.id] = c.id; Sound.play('pop'); touch(); renderAll(); publishCard(); } }))) : h('p', { class: 'muted', text: 'Пока пусто — в магазине много красивого.' })));
    }
    const vehs = G.VEHICLES.filter((v) => S.inv.vehicles.includes(v.id));
    out.push(h('h3', { text: 'Транспорт' }), vehs.length ? h('div', { class: 'seg' }, vehs.map((v) => h('button', { 'aria-pressed': S.vehicle === v.id ? 'true' : 'false', text: v.icon + ' ' + v.name, onclick: () => { S.vehicle = v.id; touch(); renderAll(); publishCard(); } }))) : h('p', { class: 'muted', text: 'Самокат, велосипед, скейт, машина — всё в магазине. Кататься можно в парке.' }));
    const toys = G.TOYS.filter((t) => S.inv.toys.includes(t.id));
    out.push(h('h3', { text: 'Игрушки' }), h('div', { class: 'seg' }, toys.map((t) => h('button', { text: t.icon + ' ' + t.name, onclick: () => (S.place === 'home' ? playToy(t) : toast('Играть с игрушками можно дома', 'warn')) }))));
    const foods = G.FOODS.filter((f) => S.inv.food[f.id] > 0);
    out.push(h('h3', { text: 'Холодильник' }), foods.length ? h('div', { class: 'seg' }, foods.map((f) => h('button', { text: `${f.icon} ${f.name} ×${S.inv.food[f.id]}`, onclick: () => eat(f.id) }))) : h('p', { class: 'muted', text: 'Пусто. Еда продаётся в магазине.' }));
    const gifts = G.GIFTS.filter((x) => S.inv.gifts[x.id] > 0);
    const rec = G.GIFTS.filter((x) => S.received[x.id] > 0);
    out.push(h('h3', { text: 'Подарки' }), h('p', { class: 'muted', text: (gifts.length ? 'Для друзей: ' + gifts.map((x) => `${x.icon}×${S.inv.gifts[x.id]}`).join(' ') : 'Подарков для друзей нет.') + (rec.length ? ' · Подарили тебе: ' + rec.map((x) => `${x.icon}×${S.received[x.id]}`).join(' ') : '') }));
    return out;
  }
  function panelMe() {
    const j = G.JOBS.find((x) => x.id === S.job);
    const av = h('canvas', { width: 120, height: 96, style: 'width:120px;height:96px' });
    setTimeout(() => G.renderAvatar(av, appOf()), 0);
    const days = Math.max(1, Math.round((now() - S.created) / 864e5));
    const out = [
      h('div', { class: 'card person', style: 'grid-template-columns:120px minmax(0,1fr)' }, av, h('div', {},
        h('div', { class: 'nm' }, h('span', { style: 'font-family:var(--font-display);font-size:22px', text: S.name })),
        h('div', { class: 'sub', text: `${G.stageName(stage(), S.gender)} · уровень ${S.lvl} · ${G.FURS[S.fur].name.toLowerCase()} шёрстка` }),
        h('div', { class: 'sub', text: `В игре ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} · поколение ${S.gen}` }),
        j ? h('div', { class: 'sub', text: `${j.icon} ${G.jobName(j, S.gender)} · ${G.RANKS[rankOf()]} · смен: ${S.shifts}` }) : null)),
      h('h3', { text: 'Навыки' }),
      h('div', { class: 'skills' }, G.SKILLS.map((s) => h('div', { class: 'skill' }, h('span', { text: s.icon }), h('span', { text: s.name }), h('div', { class: 'bar' }, h('i', { style: `width:${S.skills[s.id]}%;background:var(--sky)` })), h('span', { class: 'v', text: Math.round(S.skills[s.id]) })))),
      h('p', { class: 'muted', text: 'Навыки открывают профессии: у врача и программиста много ума, у теннисистки — спорта, у рок-музыканта — музыки.' }),
    ];
    if (S.paintings.length) {
      out.push(h('h3', { text: 'Галерея' }));
      const gal = h('div', { class: 'gallery' });
      S.paintings.slice(0, 12).forEach((p) => {
        const c = h('canvas', { width: 150, height: 120 });
        const x = c.getContext('2d'); x.fillStyle = '#e9e2d4'; x.fillRect(0, 0, 150, 120); G.Scenes.painting(x, 18, 14, 114, 90, p.seed);
        gal.append(h('figure', { style: 'cursor:pointer', onclick: () => showPainting(p) }, c, h('figcaption', { text: `«${p.title}» · ${p.value} 🍊` })));
      });
      out.push(gal);
    }
    out.push(h('h3', { text: 'Дневник жизни' }), h('ul', { class: 'diary' }, S.diary.slice(0, 25).map((d) => h('li', {}, h('time', { text: fmtDate(d.ts) }), h('span', { text: d.text })))));
    const nameIn = h('input', { type: 'text', id: 'renameIn', maxlength: 20, value: S.name });
    const danger = h('div', { class: 'btn-row' });
    const askReset = () => danger.replaceChildren(h('span', { class: 'muted', text: 'Точно начать новую жизнь? Текущая капибара исчезнет.' }), h('button', { class: 'btn btn-sm', text: 'Да, заново', onclick: () => { lsSet(LS, ''); S = null; V.busy = null; openCreate(); } }), h('button', { class: 'btn btn-sm btn-ghost', text: 'Нет', onclick: () => danger.replaceChildren(h('button', { class: 'btn btn-sm btn-ghost', text: 'Начать заново', onclick: askReset })) }));
    danger.append(h('button', { class: 'btn btn-sm btn-ghost', text: 'Начать заново', onclick: askReset }));
    out.push(h('h3', { text: 'Настройки' }), h('div', { class: 'field' }, h('label', { for: 'renameIn', text: 'Имя капибары' }), h('div', { class: 'btn-row' }, nameIn, h('button', { class: 'btn btn-sm', text: 'Сохранить', onclick: () => { const v = nameIn.value.trim().slice(0, 20); if (v) { S.name = v; touch(); renderAll(); publishCard(); toast('Имя сохранено'); } } }))), danger);
    return out;
  }
  function personRow(f, extra) {
    const av = h('canvas', { width: 64, height: 52 });
    G.renderAvatar(av, f.app);
    const x = fr(f.id);
    const st = G.stageName(f.app.stage, f.app.gender);
    const job = f.card && f.card.job ? G.JOBS.find((j) => j.id === f.card.job) : null;
    return h('div', { class: 'card person' }, av, h('div', {},
      h('div', { class: 'nm' }, f.kind === 'player' && G.Online.isOnline(f.id) ? h('span', { class: 'online-dot', title: 'Сейчас онлайн' }) : null, h('span', { text: f.name }), S.partner && S.partner.id === f.id ? h('span', { class: 'tag', text: 'семья' }) : x.ok ? h('span', { class: 'tag', text: 'друг' }) : null),
      h('div', { class: 'sub', text: [st, f.card ? `ур. ${f.card.lvl}` : null, job ? G.jobName(job, f.app.gender) : null, f.card && f.card.partnerName ? `в браке: ${f.card.partnerName}` : null].filter(Boolean).join(' · ') }),
      h('div', { class: 'bar', style: 'margin-top:6px', title: 'Дружба' }, h('i', { style: `width:${x.pts}%;background:var(--berry)` }))),
      h('div', { class: 'btn-row' }, extra || personActions(f)));
  }
  function personActions(f) {
    const x = fr(f.id);
    const btns = [];
    if (f.kind === 'player' && !x.ok) btns.push(h('button', { class: 'btn btn-sm btn-main', text: x.sent ? 'Запрос отправлен' : 'Дружить', disabled: x.sent ? true : null, onclick: () => friendRequest(f) }));
    btns.push(h('button', { class: 'btn btn-sm', text: 'Позвать', onclick: () => pickActFor(f) }));
    btns.push(h('button', { class: 'btn btn-sm', text: 'Подарок', onclick: () => pickGiftFor(f) }));
    if (isAdult(stage()) && isAdult(f.app.stage) && !S.partner) btns.push(h('button', { class: 'btn btn-sm', text: '💍 Предложение', onclick: () => propose(f) }));
    return btns;
  }
  function openPerson(f) { openModal(f.name, [personRow(f)]); }
  function pickActFor(f) {
    const st = stage();
    const acts = G.ACTS.filter((a) => a.social && a.st.includes(st) && a.st.includes(f.app.stage) && (a.social !== 'partner' || (S.partner && S.partner.id === f.id)) && placeById(a.place).st.includes(st));
    openModal(`${f.name}: куда пойдём вместе?`, [
      h('p', { class: 'muted', text: f.kind === 'player' ? 'Друг получит приглашение. Когда согласится — вы окажетесь там вместе, бесплатно.' : 'Капи-соседи всегда рады компании. Вместе веселее: больше радости и дружбы.' }),
      h('div', { class: 'acts' }, acts.map((a) => h('button', { class: 'act', onclick: () => inviteFriend(f, a) }, h('div', { class: 't' }, h('span', { class: 'e', text: a.icon }), h('span', { text: a.name })), h('div', { class: 'muted', text: placeById(a.place).name })))),
    ]);
  }
  function pickFriendFor(a) {
    const fs = npcList().concat(playerList()).filter((f) => a.st.includes(f.app.stage) && (a.social !== 'partner' || (S.partner && S.partner.id === f.id)));
    openModal('С кем пойдём?', [h('div', { class: 'items' }, fs.map((f) => {
      const av = h('canvas', { width: 64, height: 52 }); G.renderAvatar(av, f.app);
      return h('button', { class: 'item', style: 'cursor:pointer;text-align:left', onclick: () => inviteFriend(f, a) }, av, h('div', { class: 'nm', text: f.name }), h('div', { class: 'ds', text: f.kind === 'player' ? (G.Online.isOnline(f.id) ? 'онлайн · получит приглашение' : 'получит приглашение') : 'капи-сосед' }));
    }))]);
  }
  function pickGiftFor(f) {
    const gifts = G.GIFTS.filter((x) => x.id !== 'ring' && S.inv.gifts[x.id] > 0);
    openModal(`Подарок: ${f.name}`, [gifts.length ? h('div', { class: 'items' }, gifts.map((x) => h('button', { class: 'item', style: 'cursor:pointer;text-align:left', onclick: () => giveGift(f, x) }, h('div', { class: 'ic', text: x.icon }), h('div', { class: 'nm', text: x.name }), h('div', { class: 'ds', text: `+${x.pts} к дружбе · есть ${S.inv.gifts[x.id]}` })))) : h('p', { text: 'Подарков нет. Открытки, шоколадки и букеты — в магазине, раздел «Подарки».' }),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', text: 'В магазин', onclick: () => { closeModal(); V.tab = 'shop'; V.shopCat = 'gifts'; renderAll(); } }))]);
  }
  function panelFamily() {
    const out = [h('div', { class: 'sec-title' }, h('h2', { text: 'Семья' }))];
    if (S.partner) {
      const f = findFriend(S.partner.id) || { id: S.partner.id, kind: S.partner.kind, name: S.partner.name, app: partnerApp() };
      f.app = partnerApp();
      out.push(h('h3', { text: 'Вторая половинка' }), personRow(f, [
        h('button', { class: 'btn btn-sm btn-main', text: '💞 Свидание в кафе', onclick: () => { const a = G.actById('date'); if (f.kind === 'player') inviteFriend(f, a); else { goTo('cafe', true); doAct('date', f); } } }),
        h('button', { class: 'btn btn-sm', text: 'Позвать', onclick: () => pickActFor(f) }),
        S.kids.length < 5 && isAdult(stage()) ? h('button', { class: 'btn btn-sm', text: '👶 Завести малыша', onclick: () => openBaby(false) }) : null,
      ]));
    } else {
      out.push(h('p', { class: 'muted', text: isAdult(stage()) ? 'Вторую половинку можно встретить среди друзей: дружите, дарите подарки и сделайте предложение с кольцом из магазина.' : 'Когда капибара вырастет, можно будет пожениться и завести малышей.' }));
    }
    out.push(h('h3', { text: 'Детки' }));
    if (!S.kids.length) out.push(h('p', { class: 'muted', text: 'Пока малышей нет.' }));
    S.kids.forEach((k) => {
      const kst = G.stageOf(k.lvl).id;
      const av = h('canvas', { width: 64, height: 52 }); G.renderAvatar(av, { fur: k.fur, stage: kst, outfit: {} });
      out.push(h('div', { class: 'card person' }, av, h('div', {}, h('div', { class: 'nm', text: k.name }), h('div', { class: 'sub', text: `${G.stageName(kst, k.gender)} · ур. ${k.lvl}` + (k.with ? ` · второй родитель: ${k.with}` : '') }), h('div', { class: 'bar', style: 'margin-top:6px' }, h('i', { style: `width:${Math.min(100, (k.xp / (G.xpNeed(k.lvl) * 0.6)) * 100)}%` }))),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn btn-sm', text: 'Покормить (6 🍊)', onclick: () => kidAct(k, 'feed') }),
          h('button', { class: 'btn btn-sm', text: 'Поиграть', onclick: () => kidAct(k, 'play') }),
          kst === 'baby' || kst === 'kid' || kst === 'teen' ? h('button', { class: 'btn btn-sm', text: kst === 'baby' ? 'В садик' : 'В школу', onclick: () => kidAct(k, 'school') }) : null,
          stage() === 'elder' ? h('button', { class: 'btn btn-sm btn-main', text: 'Продолжить жизнь: ' + k.name, onclick: () => confirmContinue(k) }) : null)));
    });
    if (isAdult(stage()) && S.kids.length < 5) out.push(h('div', { class: 'card' }, h('b', { text: '🏡 Капи-приют' }), h('p', { class: 'muted', text: 'Малыши ждут любящую семью — можно взять одного домой, даже без второй половинки.' }), h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-sm', text: 'Взять малыша (100 🍊)', onclick: () => openBaby(true) }))));
    if (stage() === 'elder' && S.kids.length) out.push(h('p', { class: 'muted', text: 'Бабушки и дедушки могут передать эстафету: продолжить игру за своего ребёнка. Вещи, часть мандаринок и навыков перейдут по наследству.' }));
    if (S.ancestors.length) out.push(h('h3', { text: 'Родословная' }), h('ul', { class: 'diary' }, S.ancestors.slice().reverse().map((a) => h('li', {}, h('time', { text: `Пок. ${a.gen}` }), h('span', { text: `${a.name}${a.job ? ', ' + G.jobName(G.JOBS.find((j) => j.id === a.job) || { name: a.job }, a.gender).toLowerCase() : ''}${a.partner ? ' — в браке с ' + a.partner : ''}` })))));
    return out;
  }
  function confirmContinue(k) {
    openModal('Передать эстафету?', [h('p', { text: `Дальше играем за ребёнка: ${k.name}. ${S.name} переедет на дачу — там можно ${g('его', 'её')} навещать. По наследству перейдут вещи, транспорт, картины, 60% мандаринок и четверть навыков.` }), h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-main', text: 'Продолжить', onclick: () => continueAs(k) }), h('button', { class: 'btn btn-ghost', text: 'Не сейчас', onclick: closeModal }))]);
  }
  function panelFriends() {
    const out = [h('div', { class: 'sec-title' }, h('h2', { text: 'Друзья' }), h('button', { class: 'btn btn-sm', text: '⛲ На площадь', onclick: () => goTo('square') }))];
    const O = G.Online;
    if (O.mode === 'online') out.push(h('p', { class: 'muted', text: O.canWrite ? 'Ты в онлайн-городке. Все, кому открыта эта игра, видят твою капибару, могут дружить, звать гулять, жениться и растить малышей.' : 'Ты видишь онлайн-городок, но пока только как гость: чтобы дружить и отправлять приглашения, владелец игры должен дать тебе доступ на редактирование.' }));
    else out.push(h('p', { class: 'muted', text: 'Онлайн-городок включается, когда игру открывают по ссылке claude.ai вместе с друзьями. А капи-соседи рядом всегда.' }));
    if (S.inbox.length) {
      out.push(h('h3', { text: 'Приглашения' }));
      S.inbox.forEach((r) => {
        const f = findFriend(r.from) || { name: 'Капибара', app: G.sanitizeApp({}) };
        out.push(h('div', { class: 'card' }, h('b', { text: `${f.name} ${reqText(r)}` }), h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-sm btn-main', text: 'Согласиться', onclick: () => answer(r, true) }), h('button', { class: 'btn btn-sm btn-ghost', text: 'Не сейчас', onclick: () => answer(r, false) }))));
      });
    }
    const players = playerList().sort((a, b) => (G.Online.isOnline(b.id) ? 1 : 0) - (G.Online.isOnline(a.id) ? 1 : 0) || (b.card.updated || 0) - (a.card.updated || 0));
    if (O.mode === 'online') {
      out.push(h('h3', { text: `Капибары городка${players.length ? ' · ' + players.length : ''}` }));
      if (!players.length) out.push(h('p', { class: 'muted', text: 'Пока никого. Поделись ссылкой на игру с друзьями — их капибары появятся здесь.' }));
      players.slice(0, 40).forEach((f) => out.push(personRow(f)));
    }
    out.push(h('h3', { text: 'Капи-соседи' }));
    npcList().forEach((f) => out.push(personRow(f)));
    return out;
  }

  /* ================= Новая капибара ================= */
  function openCreate() {
    let name = pick(G.NAMES), gender = 'f', fur = 'classic';
    const inp = h('input', { type: 'text', id: 'newName', maxlength: 20, value: name });
    const names = h('div', { class: 'names' }, G.NAMES.slice(0, 8).map((n) => h('button', { text: n, onclick: () => { inp.value = n; } })));
    const gsel = h('div', { class: 'seg' });
    const renderG = () => gsel.replaceChildren(...[['f', 'Девочка'], ['m', 'Мальчик']].map(([id, t]) => h('button', { 'aria-pressed': gender === id ? 'true' : 'false', text: t, onclick: () => { gender = id; renderG(); } })));
    renderG();
    const sw = h('div', { class: 'swatches' });
    const renderF = () => sw.replaceChildren(...Object.entries(G.FURS).map(([id, f]) => h('button', { class: 'swatch', 'aria-pressed': fur === id ? 'true' : 'false', onclick: () => { fur = id; renderF(); } }, h('i', { style: `background:radial-gradient(circle at 35% 30%, ${f.light}, ${f.base} 60%, ${f.dark})` }), f.name)));
    renderF();
    const cvH = h('canvas', { class: 'hero-canvas', width: 480, height: 190 });
    openModal('На свет появилась капибара!', [
      cvH,
      h('p', { class: 'muted', text: 'Корми, купай, играй и води в садик. Капибара будет расти: школа, секции, профессия, свадьба, свои малыши — целая жизнь.' }),
      h('div', { class: 'field' }, h('label', { for: 'newName', text: 'Как назовём?' }), inp, names),
      h('div', { class: 'field' }, h('label', { text: 'Кто это?' }), gsel),
      h('div', { class: 'field' }, h('label', { text: 'Шёрстка' }), sw),
      h('div', { class: 'btn-row' }, h('button', {
        class: 'btn btn-main', text: 'Начать жизнь',
        onclick: () => {
          const nm = inp.value.trim().slice(0, 20) || name;
          S = fresh(nm, gender, fur);
          V.createdAt = now();
          addDiary(`${gender === 'm' ? 'Родился' : 'Родилась'} ${nm}. Шёрстка ${G.FURS[fur].name.toLowerCase()}, характер золотой.`);
          closeModal(); save(); startGame();
          burst('heart', 16); Sound.play('squeak');
          toast(`Привет, ${nm}! Нажми на ${gender === 'm' ? 'него' : 'неё'}, чтобы погладить`, 'good');
        },
      })),
    ], { locked: true });
    V.hero = { cv: cvH, draw: (c, w, hh, t) => { c.clearRect(0, 0, w, hh); G.drawCapy(c, { fur, stage: 'baby', gender, outfit: {} }, { t, mood: (t % 6) < 2 ? 'happy' : 'normal', blink: (t % 3.3) < 0.12 ? 1 : 0, earRot: Math.sin(t * 3) > 0.95 ? -0.4 : 0 }, w * 0.4, hh * 0.92, Math.min(w / 480, hh / 190) * 1.1, 1); } };
  }

  function startGame() {
    V.started = true;
    if (S.place !== 'square') V.me.x = 0.42;
    buildNeeds(); renderAll();
    publishCard(); updatePresence();
  }

  /* ================= Главный цикл ================= */
  let last = performance.now();
  let secAcc = 0, presAcc = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    V.t += dt;
    if (S && V.started) {
      secAcc += dt;
      if (secAcc >= 1) {
        secAcc = 0;
        const el = now() - S.lastTick;
        if (el > 5000) catchUp(); else { tick(el / 1000); S.lastTick = now(); }
        renderNeeds();
        touch();
      }
      presAcc += dt;
      if (presAcc > 2) { presAcc = 0; if (S.place === 'square') updatePresence(); }
      if (V.busy) {
        const p = (performance.now() - V.busy.start) / (V.busy.dur * 1000);
        $('#busyFill').style.width = Math.min(100, p * 100) + '%';
        if (p >= 1) finishBusy();
      }
      updateMe(dt);
      drawScene(dt);
    } else if (ctx) {
      ctx.fillStyle = '#cfe3d4'; ctx.fillRect(0, 0, V.W, V.H);
    }
    if (V.hero && V.hero.cv && V.hero.cv.isConnected) {
      const hc = V.hero.cv, r = Math.min(2, window.devicePixelRatio || 1);
      const w = hc.clientWidth || 480, hh = hc.clientHeight || 190;
      if (hc.width !== Math.round(w * r)) { hc.width = Math.round(w * r); hc.height = Math.round(hh * r); }
      const c = hc.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0);
      V.hero.draw(c, w, hh, V.t);
    }
    requestAnimationFrame(frame);
  }

  function setup() {
    buildNeeds();
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => G.Scenes.clear());
    new ResizeObserver(() => resize()).observe($('#sceneWrap'));
    const c = cv();
    c.addEventListener('pointerdown', onScenePointer);
    c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); V.pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    c.addEventListener('pointerleave', () => { V.pointer = null; });
    document.addEventListener('pointerdown', () => Sound.ensure(), { once: true });
    $('#modalX').addEventListener('click', closeModal);
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && V.modal && !V.modal.locked) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden && V.modal && !V.modal.locked) closeModal(); });
    $('#soundBtn').addEventListener('click', () => { Sound.on = !Sound.on; lsSet('capylife.sound', Sound.on ? '1' : '0'); Sound.ensure(); Sound.play('pop'); renderTop(); });
    $('#dailyBtn').addEventListener('click', () => {
      if (!S || now() - S.daily < 20 * 3600e3) return;
      S.daily = now();
      const coins = 30 + S.lvl * 2;
      const f1 = pick(G.FOODS), f2 = pick(G.FOODS);
      S.coins += coins; S.inv.food[f1.id] = (S.inv.food[f1.id] || 0) + 1; S.inv.food[f2.id] = (S.inv.food[f2.id] || 0) + 1;
      Sound.play('coin'); burst('confetti', 30);
      toast(`Подарок дня: +${coins} 🍊, ${f1.icon} и ${f2.icon}`, 'good');
      touch(); renderAll();
    });
    setInterval(() => {
      if (!S) return;
      if (V.dirty) { V.dirty = false; save(); }
      if (G.Online.mode === 'online') {
        publishCard();
        if (V.cloudDirty && now() - V.lastCloud > 12000) { V.cloudDirty = false; V.lastCloud = now(); G.Online.saveCloud(S); }
      }
      if (V.tab === 'here' && !V.busy && performance.now() - V.lastPanel > 20000 && $('#modal').hidden) renderPanel();
      renderTop();
    }, 2000);
    document.addEventListener('visibilitychange', () => {
      if (!S) return;
      if (document.hidden) { save(); if (G.Online.mode === 'online') G.Online.saveCloud(S); }
      else { catchUp(); renderAll(); }
    });
    window.addEventListener('pagehide', () => { if (S) save(); });

    // онлайн
    G.Online.on('cloudSave', (cs) => {
      if (cs && cs.name && cs.needs) {
        const cloud = migrate(cs);
        const takeCloud = !S || (V.createdAt && now() - V.createdAt < 120000) || (cloud.updated || 0) > (S.updated || 0) + 2000;
        if (takeCloud) {
          S = cloud; V.busy = null; catchUp(); save();
          if (V.modal && V.modal.locked) closeModal();
          startGame();
          toast(`${S.name} ${g('ждал', 'ждала')} тебя!`, 'good');
          return;
        }
      }
      V.cloudDirty = true; V.lastCloud = 0;
    });
    G.Online.on('status', () => { if (S) { renderTop(); if (V.tab === 'friends') renderPanel(); publishCard(); updatePresence(); } });
    let pT = 0;
    const soon = () => { clearTimeout(pT); pT = setTimeout(() => { if (S && $('#modal').hidden && (V.tab === 'friends' || V.tab === 'family' || (V.tab === 'here' && S.place === 'square'))) renderPanel(); if (S) renderTop(); }, 800); };
    G.Online.on('players', soon);
    G.Online.on('peers', soon);
    G.Online.on('mail', onMail);
  }

  function start(data) {
    setup();
    const snap = data && data.S;
    S = snap ? migrate(snap) : loadLocal();
    if (S) { if (S.place === 'square') { V.me.x = rnd(0.15, 0.85); V.me.sy = rnd(0.25, 0.95); } catchUp(); startGame(); }
    else openCreate();
    requestAnimationFrame(frame);
    G.Online.init().catch(() => {});
  }
  try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({ S })); } catch (e) { /* нет горячей перезагрузки */ }
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})(window.CAPY);
