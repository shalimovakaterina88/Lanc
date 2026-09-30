/* Капи-жизнь · онлайн: облачное сохранение, карточки игроков, почта (дружба, приглашения, свадьбы, малыши), живая площадь */
'use strict';
(function (G) {
  const O = (G.Online = { mode: 'offline', uid: null, db: null, room: null, user: null, players: {}, peers: [], outbox: [], canWrite: true, connected: false });
  const hs = {};
  O.on = (ev, fn) => { (hs[ev] = hs[ev] || []).push(fn); };
  const emit = (ev, data) => (hs[ev] || []).forEach((f) => { try { f(data); } catch (e) { console.error(e); } });

  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  const inIds = (v, list) => (list.some((x) => x.id === v) ? v : null);
  G.sanitizeApp = function (a) {
    a = a && typeof a === 'object' ? a : {};
    const o = a.outfit && typeof a.outfit === 'object' ? a.outfit : {};
    const cl = (id, slot) => { const it = G.CLOTHES.find((c) => c.id === id); return it && it.slot === slot ? id : null; };
    return {
      name: str(a.name, 24) || 'Капибара',
      fur: G.FURS[a.fur] ? a.fur : 'classic',
      gender: a.gender === 'm' ? 'm' : 'f',
      stage: G.STAGES.some((s) => s.id === a.stage) ? a.stage : 'adult',
      outfit: { hat: cl(o.hat, 'hat'), eyes: cl(o.eyes, 'eyes'), neck: cl(o.neck, 'neck'), body: cl(o.body, 'body') },
      vehicle: inIds(a.vehicle, G.VEHICLES),
    };
  };
  function sanitizeCard(d) {
    const app = G.sanitizeApp(d);
    return Object.assign(app, {
      lvl: Math.max(1, Math.min(99, Number(d.lvl) || 1)),
      job: inIds(d.job, G.JOBS),
      partner: str(d.partner, 80) || null,
      partnerName: str(d.partnerName, 24),
      kids: Math.max(0, Math.min(9, Number(d.kids) || 0)),
      gen: Math.max(1, Math.min(99, Number(d.gen) || 1)),
      place: G.PLACES.some((p) => p.id === d.place) ? d.place : 'home',
      updated: Number(d.updated) || 0,
    });
  }

  O.init = async function () {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') { emit('cloudSave', null); emit('status', O); return; }
    const [user, db, room] = await Promise.all(['user', 'db', 'room'].map((n) => cl.use(n).catch(() => null)));
    O.user = user; O.db = db; O.room = room;
    O.uid = user ? await user.id().catch(() => null) : null;
    if (db && O.uid) {
      O.mode = 'online';
      try {
        const snap = await db.doc(`data/users/${O.uid}/save`).get();
        emit('cloudSave', snap.exists ? snap.data() : null);
      } catch (e) { emit('cloudSave', null); }
      try { const ob = await db.doc(`mail/${O.uid}`).get(); O.outbox = ob.exists && Array.isArray(ob.data().items) ? ob.data().items.slice(-40) : []; } catch (e) { O.outbox = []; }
      db.collection('capys').onSnapshot((snap) => {
        const m = {};
        snap.docs.forEach((d) => { if (d.exists && d.id !== O.uid) m[d.id] = sanitizeCard(d.data() || {}); });
        O.players = m;
        emit('players', m);
      }, () => {});
      db.collection('mail').where('targets', 'array-contains', O.uid).onSnapshot((snap) => {
        const items = [];
        snap.docs.forEach((d) => {
          const data = d.data() || {};
          (Array.isArray(data.items) ? data.items : []).forEach((it) => {
            if (it && it.to === O.uid && typeof it.id === 'string' && typeof it.kind === 'string') items.push({ id: str(it.id, 40), kind: it.kind, ts: Number(it.ts) || 0, data: it.data && typeof it.data === 'object' ? it.data : {}, from: d.id });
          });
        });
        items.sort((a, b) => a.ts - b.ts);
        emit('mail', items);
      }, () => {});
    } else {
      emit('cloudSave', null);
    }
    if (room) {
      room.onPeers((ch) => { O.peers = ch.peers || []; emit('peers', O.peers); }, () => { O.peers = []; emit('peers', []); });
      room.onConnection((c) => { O.connected = c; emit('conn', c); }, () => {});
    }
    emit('status', O);
  };

  // --- очередь записей: одна запись в документ за раз ---
  const q = {};
  function write(path, data) {
    if (!O.db || !O.uid || !O.canWrite) return Promise.resolve(false);
    const slot = (q[path] = q[path] || { busy: false, next: null, waiters: [] });
    return new Promise((res) => {
      slot.next = data; slot.waiters.push(res);
      if (slot.busy) return;
      const run = async () => {
        slot.busy = true;
        const d = slot.next, ws = slot.waiters; slot.next = null; slot.waiters = [];
        let ok = true;
        try { await O.db.doc(path).set(JSON.parse(JSON.stringify(d))); }
        catch (e) {
          ok = false;
          if (e && e.code === 'invalid_argument' && path.startsWith('capys')) { O.canWrite = false; emit('status', O); }
          if (e && e.code === 'unavailable') { await new Promise((r) => setTimeout(r, 800 + Math.random() * 800)); try { await O.db.doc(path).set(JSON.parse(JSON.stringify(d))); ok = true; } catch (e2) {} }
        }
        ws.forEach((w) => w(ok));
        slot.busy = false;
        if (slot.next) run();
      };
      run();
    });
  }
  O.saveCloud = (state) => (O.mode === 'online' ? write(`data/users/${O.uid}/save`, state) : Promise.resolve(false));
  let lastCard = '';
  O.publishCard = (card) => {
    if (O.mode !== 'online') return;
    const s = JSON.stringify(card);
    if (s === lastCard) return;
    lastCard = s;
    write(`capys/${O.uid}`, Object.assign({}, card, { updated: Date.now() }));
  };
  O.send = async (to, kind, data) => {
    if (O.mode !== 'online') return null;
    const item = { id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), to, kind, ts: Date.now(), data: data || {} };
    const week = Date.now() - 7 * 864e5;
    O.outbox = O.outbox.filter((i) => i.ts > week).slice(-39).concat(item);
    const targets = [...new Set(O.outbox.map((i) => i.to))];
    const ok = await write(`mail/${O.uid}`, { targets, items: O.outbox });
    return ok ? item : null;
  };
  O.sent = (id) => O.outbox.find((i) => i.id === id);

  let lastPres = '';
  O.presence = (p) => {
    if (!O.room) return;
    const s = JSON.stringify(p);
    if (s === lastPres) return;
    lastPres = s;
    O.room.presence(p).catch(() => {});
  };
  // Кто сейчас онлайн (кроме меня)
  O.onlinePeers = () => O.peers.filter((p) => !p.isMe && p.kind === 'viewer');
  O.isOnline = (uid) => O.peers.some((p) => !p.isMe && p.by === uid);
})(window.CAPY);
