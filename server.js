// Servidor autoritativo v2: salas, 5 monstros com habilidades Q/E + cooldown, geradores, relógio dinâmico.
const express = require('express'), http = require('http'), { Server } = require('socket.io');
const app = express(); app.use(express.static(__dirname + '/public'));
const srv = http.createServer(app), io = new Server(srv);
const W = 60, H = 40, T = 16, rooms = {};
const SPD = { siren: 85, horse: 78, cat: 80, worm: 76, road: 82 }, MAPN = { forest: 'Floresta Nebulosa', mall: 'Centro Comercial' };
let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

function genMap(t) {
  const g = [];
  for (let y = 0; y < H; y++) { g[y] = []; for (let x = 0; x < W; x++) {
    let w = x == 0 || y == 0 || x == W - 1 || y == H - 1;
    if (!w && t == 'mall') { const a = x % 10, b = y % 10; w = (a == 0 && (b < 3 || b > 5)) || (b == 0 && (a < 3 || a > 5)) || rnd() < .015; }
    else if (!w) w = rnd() < .08;
    g[y][x] = w ? 1 : 0; } }
  for (let y = 1; y < 5; y++) for (let x = 1; x < 6; x++) g[y][x] = 0;
  return g;
}
const free = g => { for (;;) { const x = 6 + rnd() * (W - 12) | 0, y = 6 + rnd() * (H - 12) | 0; if (!g[y][x]) return { x: x * T + 8, y: y * T + 8 }; } };
const solid = (r, x, y) => [[-5, -5], [5, -5], [-5, 5], [5, 5]].some(([a, b]) => r.g[(y + b) / T | 0]?.[(x + a) / T | 0] !== 0);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function mv(r, p, dx, dy, s, dt) {
  const n = Math.hypot(dx, dy) || 1, gh = p.gh > Date.now(); dx = dx / n * s * dt; dy = dy / n * s * dt;
  if (gh || !solid(r, p.x + dx, p.y)) p.x = Math.max(10, Math.min(W * T - 10, p.x + dx));
  if (gh || !solid(r, p.x, p.y + dy)) p.y = Math.max(10, Math.min(H * T - 10, p.y + dy));
}
const coin = (id, n) => io.to(id).emit('coin', n);

function startGame(r) {
  const now = Date.now(); r.state = 'play'; r.g = genMap(r.map); r.t = 240; r.frz = now + 3600; r.blk = []; r.fogs = [];
  const ids = Object.keys(r.p);
  r.mon = r.pref !== 'rand' && r.p[r.pref] ? r.pref : ids[Math.random() * ids.length | 0];
  r.gens = Array.from({ length: 4 }, () => ({ ...free(r.g), d: false }));
  r.items = []; let k = 0;
  for (const [t, n] of [['m', 3], ['e', 3], ['l', 8]]) for (let i = 0; i < n; i++) r.items.push({ id: k++, t, ...free(r.g) });
  let i = 0;
  for (const id of ids) { const p = r.p[id], m = id == r.mon;
    Object.assign(p, { role: m ? 'm' : 's', cr: m ? (r.cr[id] || 'siren') : '', col: m ? p.mc : p.sc, hp: 2, st: 100, hid: false, al: true, cd: 0, atk: 0, c1: 0, c2: 0, stun: 0, inv: 0, gh: 0, bo: 0, rev: 0, dbl: 0, en: 0, in: { dx: 0, dy: 0 }, ang: 0 },
      m ? free(r.g) : { x: 24 + i++ * 14, y: 28 }); }
  io.to(r.code).emit('start', { g: r.g, map: r.map, mon: r.mon });
}
function end(r, win) {
  if (r.state != 'play') return; r.state = 'end';
  for (const p of Object.values(r.p)) coin(p.id, win == 'm' ? (p.role == 'm' ? 100 : 0) : (p.role == 's' && p.al ? 50 : 0));
  io.to(r.code).emit('end', win);
  setTimeout(() => { r.state = 'lobby'; Object.values(r.p).forEach(p => p.ready = false); sendRoom(r); }, 8000);
}
function hit(r, m, q, d) { q.hp -= d; q.hid = false; if (q.hp <= 0 && q.al) { q.al = false; r.t += 30; coin(m.id, 25); } }

function tick(r, dt) {
  const now = Date.now(), ps = Object.values(r.p), go = now > r.frz;
  r.blk = []; r.fogs = r.fogs.filter(f => f.t > now);
  for (const p of ps) { p.c1 = Math.max(0, p.c1 - dt); p.c2 = Math.max(0, p.c2 - dt); p.cd = Math.max(0, p.cd - dt);
    if (p.gh && p.gh <= now) { p.gh = 0; if (solid(r, p.x, p.y)) Object.assign(p, free(r.g)); }
    if (!go || !p.al || p.stun > now) continue; const i = p.in, mov = i.dx || i.dy;
    if (p.role == 'm') { if (mov) mv(r, p, i.dx, i.dy, SPD[p.cr] * (p.bo > now ? (p.cr == 'cat' ? 1.6 : 1.8) : 1), dt); continue; }
    if (p.hid) continue;
    const inf = p.en > now, run = i.run && (p.st > 0 || inf) && mov; if (!inf) p.st = Math.min(100, Math.max(0, p.st + (run ? -28 : 14) * dt)); else p.st = 100;
    if (mov) mv(r, p, i.dx, i.dy, run ? 105 : 62, dt); }
  if (go) r.t -= dt;
  const sv = ps.filter(p => p.role == 's');
  if (r.state == 'play' && go) { if (sv.every(p => !p.al)) end(r, 'm'); else if (r.t <= 0) end(r, 's'); }
  io.to(r.code).volatile.emit('s', { t: Math.max(0, r.t | 0), fz: r.frz > now,
    p: ps.map(p => ({ id: p.id, x: p.x | 0, y: p.y | 0, a: p.ang, r: p.role, c: p.cr, col: p.col, hp: p.hp, st: p.st | 0, h: p.hid, al: p.al, k: p.atk > now,
      c1: Math.ceil(p.c1), c2: Math.ceil(p.c2), inv: p.inv > now, rv: p.rev > now, sn: p.stun > now, en: p.en > now, gh: p.gh > now })),
    it: r.items, gens: r.gens, fogs: r.fogs });
}

function attack(r, p) {
  if (!p.al || p.role != 'm' || p.cd > 0 || Date.now() < r.frz) return;
  p.cd = 1.2; p.atk = Date.now() + 200; const reach = { horse: 30, cat: 28 }[p.cr] || 24, dmg = p.dbl > Date.now() ? 2 : 1; p.dbl = 0;
  for (const q of Object.values(r.p)) if (q.role == 's' && q.al && dist(p, q) < (q.hid ? 14 : reach)) hit(r, p, q, dmg);
}
function interact(r, p) {
  if (!p.al || Date.now() < r.frz) return;
  if (p.role == 'm') return ability(r, p, 2);
  if (p.hid) { p.hid = false; return; }
  const it = r.items.find(i => dist(p, i) < 20);
  if (it) { if (it.t == 'l') { p.hid = true; p.x = it.x; p.y = it.y; }
    else if (it.t == 'm' && p.hp < 2) { p.hp++; r.items.splice(r.items.indexOf(it), 1); }
    else if (it.t == 'e') { p.en = Date.now() + 8000; r.items.splice(r.items.indexOf(it), 1); } return; }
  const ally = Object.values(r.p).find(q => q != p && q.role == 's' && q.al && q.hp < 2 && dist(p, q) < 24); if (ally) ally.hp++;
}
function ability(r, p, n) {
  const now = Date.now(); if (p.role != 'm' || !p.al || now < r.frz || p['c' + n] > 0) return;
  const dx = Math.cos(p.ang), dy = Math.sin(p.ang), sv = Object.values(r.p).filter(q => q.role == 's' && q.al), c = p.cr;
  const near = lim => sv.filter(q => !q.hid && dist(p, q) < lim).sort((a, b) => dist(p, a) - dist(p, b))[0];
  if (n == 1) { p.c1 = 10;
    if (c == 'siren') sv.forEach(q => { if (dist(p, q) < 220) { q.stun = now + 1500; io.to(q.id).emit('pulse'); } });
    if (c == 'horse') { const hs = new Set(); for (let d = 8; d <= 110; d += 8) sv.forEach(q => { if (!q.hid && !hs.has(q) && Math.hypot(p.x + dx * d - q.x, p.y + dy * d - q.y) < 14) { hs.add(q); hit(r, p, q, 1); } }); }
    if (c == 'cat') { const q = near(280); if (q) { q.x = p.x + dx * 22; q.y = p.y + dy * 22; if (solid(r, q.x, q.y)) { q.x = p.x; q.y = p.y; } q.stun = now + 800; } }
    if (c == 'worm') { p.inv = now + 3000; p.dbl = now + 4000; for (let d = 60; d > 8; d -= 6) if (!solid(r, p.x + dx * d, p.y + dy * d)) { p.x += dx * d; p.y += dy * d; break; } }
    if (c == 'road') { const q = near(500); if (q) { const a = Math.random() * 6.28, x = q.x + Math.cos(a) * 36, y = q.y + Math.sin(a) * 36; if (!solid(r, x, y)) { p.x = x; p.y = y; } } }
  } else { p.c2 = 16;
    if (c == 'siren') p.bo = now + 5000;
    if (c == 'horse') p.gh = now + 4000;
    if (c == 'cat') { p.inv = now + 5000; p.bo = now + 5000; }
    if (c == 'worm') p.rev = now + 4000;
    if (c == 'road') r.fogs.push({ x: p.x | 0, y: p.y | 0, t: now + 6000 });
  }
}
setInterval(() => { for (const r of Object.values(rooms)) if (r.state != 'lobby') tick(r, .033); }, 33);

const info = r => ({ code: r.code, host: r.host, pub: r.pub, map: r.map, mapn: MAPN[r.map], pref: r.pref, state: r.state, players: Object.values(r.p).map(p => ({ id: p.id, n: p.n, ready: p.ready })) });
const sendRoom = r => io.to(r.code).emit('room', info(r));
io.on('connection', s => {
  let r = null;
  const join = (code, name) => { const x = rooms[code]; if (!x) return 'Sala não existe'; if (x.state != 'lobby') return 'Jogo em curso'; if (Object.keys(x.p).length >= 5) return 'Sala cheia';
    r = x; s.join(code); r.p[s.id] = { id: s.id, n: String(name || 'Anon').slice(0, 12), ready: false, x: 0, y: 0, in: {}, mc: '#8a8f94', sc: '#6a8caf' }; sendRoom(r); return null; };
  const pl = () => r?.state == 'play' && r.p[s.id];
  s.on('ping2', cb => cb());
  s.on('create', ({ name, pub, map }, cb) => { const code = 'TH' + Math.random().toString(36).slice(2, 6).toUpperCase();
    rooms[code] = { code, host: s.id, pub: !!pub, map: MAPN[map] ? map : 'forest', pref: 'rand', state: 'lobby', p: {}, cr: {} }; join(code, name); cb(code); });
  s.on('list', cb => cb(Object.values(rooms).filter(x => x.pub && x.state == 'lobby').map(x => ({ code: x.code, host: x.p[x.host]?.n, mapn: MAPN[x.map], n: Object.keys(x.p).length }))));
  s.on('join', ({ code, name }, cb) => cb(join(String(code).replace('#', '').toUpperCase(), name)));
  s.on('ready', () => { if (r?.p[s.id]) { r.p[s.id].ready = !r.p[s.id].ready; sendRoom(r); } });
  s.on('chat', t => r && io.to(r.code).emit('chat', { n: r.p[s.id].n, t: String(t).slice(0, 120) }));
  s.on('pref', v => { if (r && r.host == s.id) { r.pref = v; sendRoom(r); } });
  s.on('map', v => { if (r && r.host == s.id && MAPN[v]) { r.map = v; sendRoom(r); } });
  s.on('creature', v => { if (r && SPD[v]) r.cr[s.id] = v; });
  s.on('look', ({ mc, sc }) => { const p = r?.p[s.id], ok = c => /^#[0-9a-f]{6}$/i.test(c); if (p) { if (ok(mc)) p.mc = mc; if (ok(sc)) p.sc = sc; } });
  s.on('start', () => { if (r && r.host == s.id && r.state == 'lobby') { const ps = Object.values(r.p); if (ps.length > 1 && ps.every(p => p.ready)) startGame(r); } });
  s.on('in', i => { const p = pl(); if (p) { p.in = { dx: +i.dx || 0, dy: +i.dy || 0, run: !!i.run }; p.ang = +i.a || 0; } });
  s.on('atk', () => { const p = pl(); p && attack(r, p); });
  s.on('e', () => { const p = pl(); p && interact(r, p); });
  s.on('q', () => { const p = pl(); p && ability(r, p, 1); });
  s.on('gen', ({ i }) => { const p = pl(), g = r?.gens[i]; if (p && p.role == 's' && p.al && g && !g.d && dist(p, g) < 36) { g.d = true; r.t = Math.max(5, r.t - 35); coin(s.id, 20); } });
  s.on('disconnect', () => { if (!r) return; delete r.p[s.id]; const ids = Object.keys(r.p);
    if (!ids.length) delete rooms[r.code]; else { if (r.host == s.id) r.host = ids[0]; sendRoom(r); } });
});
srv.listen(process.env.PORT || 3000, () => console.log('Servidor na porta ' + (process.env.PORT || 3000)));
