// Servidor autoritativo: salas, lobby, movimento, colisões, habilidades, vitória.
const express = require('express'), http = require('http'), { Server } = require('socket.io');
const app = express(); app.use(express.static(__dirname + '/public'));
const srv = http.createServer(app), io = new Server(srv);
const W = 60, H = 40, T = 16, rooms = {};
const SPD = { siren: 85, cat: 80, horse: 72 }, MAPN = { forest: 'Floresta Nebulosa', mall: 'Centro Comercial' };
let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

// ---- Geração de mapa (0 = livre, 1 = parede/árvore/pilar)
function genMap(t) {
  const g = [];
  for (let y = 0; y < H; y++) { g[y] = []; for (let x = 0; x < W; x++) {
    let w = x == 0 || y == 0 || x == W - 1 || y == H - 1;
    if (!w && t == 'mall') { const a = x % 10, b = y % 10; w = (a == 0 && (b < 3 || b > 5)) || (b == 0 && (a < 3 || a > 5)) || rnd() < .015; }
    else if (!w) w = rnd() < .08;
    g[y][x] = w ? 1 : 0; } }
  for (let y = 1; y < 5; y++) for (let x = 1; x < 6; x++) g[y][x] = 0;           // spawn
  for (let y = H - 6; y < H - 1; y++) for (let x = W - 6; x < W - 1; x++) g[y][x] = 0; // saída
  return g;
}
const free = g => { for (;;) { const x = 6 + rnd() * (W - 12) | 0, y = 6 + rnd() * (H - 12) | 0; if (!g[y][x]) return { x: x * T + 8, y: y * T + 8 }; } };
const solid = (r, x, y) => [[-5, -5], [5, -5], [-5, 5], [5, 5]].some(([a, b]) => r.g[(y + b) / T | 0]?.[(x + a) / T | 0] !== 0);
const mv = (r, p, dx, dy, s, dt) => { const n = Math.hypot(dx, dy) || 1; dx = dx / n * s * dt; dy = dy / n * s * dt;
  if (!solid(r, p.x + dx, p.y)) p.x += dx; if (!solid(r, p.x, p.y + dy)) p.y += dy; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function startGame(r) {
  r.state = 'play'; r.g = genMap(r.map); r.tapes = 0; r.open = false; r.blk = []; r.end = null;
  const ids = Object.keys(r.p);
  r.mon = r.pref !== 'rand' && r.p[r.pref] ? r.pref : ids[Math.random() * ids.length | 0];
  r.gen = free(r.g); r.exit = { x: (W - 3) * T + 8, y: (H - 3) * T + 8 };
  r.items = []; let k = 0;
  for (let i = 0; i < 5; i++) r.items.push({ id: k++, t: 't', ...free(r.g) });
  for (let i = 0; i < 4; i++) r.items.push({ id: k++, t: 'b', ...free(r.g) });
  for (let i = 0; i < 8; i++) r.items.push({ id: k++, t: 'l', ...free(r.g) });
  let i = 0;
  for (const id of ids) { const p = r.p[id], m = id == r.mon;
    Object.assign(p, { role: m ? 'm' : 's', cr: m ? (r.cr[id] || 'siren') : '', hp: 2, st: 100, bat: 100, hid: false, light: true, al: true, out: false, cd: 0, atk: 0, in: { dx: 0, dy: 0 }, ang: 0 });
    Object.assign(p, m ? free(r.g) : { x: 24 + i++ * 14, y: 28 }); }
  io.to(r.code).emit('start', { g: r.g, map: r.map, mon: r.mon });
}

function tick(r, dt) {
  const ps = Object.values(r.p), now = Date.now();
  r.blk = r.blk.filter(b => b.t > now || (r.g[b.y][b.x] = 0));
  for (const p of ps) { if (!p.al || p.out) continue; const i = p.in, mov = i.dx || i.dy;
    p.cd = Math.max(0, p.cd - dt);
    if (p.role == 'm') { if (mov) mv(r, p, i.dx, i.dy, SPD[p.cr], dt); continue; }
    if (p.hid) continue;
    const run = i.run && p.st > 0 && mov; p.st = Math.min(100, Math.max(0, p.st + (run ? -28 : 14) * dt));
    if (mov) mv(r, p, i.dx, i.dy, run ? 105 : 62, dt);
    if (p.light) p.bat = Math.max(0, p.bat - 1.2 * dt);
    if (r.open && dist(p, r.exit) < 22) p.out = true; }
  const m = r.p[r.mon];
  if (r.state == 'play' && ps.filter(p => p.role == 's').every(p => !p.al || p.out)) {
    r.state = 'end'; r.end = ps.some(p => p.role == 's' && p.out) ? 'Sobreviventes escaparam!' : 'O monstro venceu.';
    io.to(r.code).emit('end', r.end); setTimeout(() => { r.state = 'lobby'; Object.values(r.p).forEach(p => p.ready = false); sendRoom(r); }, 6000); }
  io.to(r.code).volatile.emit('s', { p: ps.map(p => ({ id: p.id, n: p.n, x: p.x | 0, y: p.y | 0, a: p.ang, r: p.role, c: p.cr, hp: p.hp, st: p.st | 0, b: p.bat | 0, h: p.hid, l: p.light, al: p.al, o: p.out, k: p.atk > now })),
    it: r.items, tp: r.tapes, gen: r.gen, ex: r.exit, op: r.open, blk: r.blk.map(b => ({ x: b.x, y: b.y })) });
}

function act(r, p) {
  if (!p.al || p.out) return;
  if (p.role == 'm') { if (p.cd > 0) return; p.cd = 1.2; p.atk = Date.now() + 200;
    const reach = p.cr == 'cat' ? 40 : 24; // gato estica os braços
    for (const q of Object.values(r.p)) if (q.role == 's' && q.al && !q.out && dist(p, q) < (q.hid ? 14 : reach)) { q.hp--; q.hid = false; if (q.hp <= 0) q.al = false; }
    return; }
  if (p.hid) { p.hid = false; return; }
  const it = r.items.find(i => dist(p, i) < 20);
  if (it) { if (it.t == 't') { r.items.splice(r.items.indexOf(it), 1); if (++r.tapes >= 5) r.open = true; }
    else if (it.t == 'b') { r.items.splice(r.items.indexOf(it), 1); p.bat = 100; }
    else { p.hid = true; p.x = it.x; p.y = it.y; } return; }
  const ally = Object.values(r.p).find(q => q != p && q.role == 's' && q.al && q.hp < 2 && dist(p, q) < 24);
  if (ally) ally.hp++;
}
function skill(r, p) {
  if (p.role != 'm' || p.cd > 0 && p.sk > 0 || (p.sk || 0) > 0) return;
  p.sk = 8; const dx = Math.cos(p.ang), dy = Math.sin(p.ang);
  if (p.cr == 'siren') for (const q of Object.values(r.p)) if (q.role == 's' && dist(p, q) < 220) io.to(q.id).emit('pulse', { x: p.x, y: p.y });
  if (p.cr == 'cat') for (let d = 90; d > 10; d -= 8) if (!solid(r, p.x + dx * d, p.y + dy * d)) { p.x += dx * d; p.y += dy * d; break; }
  if (p.cr == 'horse') { const tx = (p.x + dx * 36) / T | 0, ty = (p.y + dy * 36) / T | 0, px = Math.abs(dy) > .7 ? 1 : 0, py = 1 - px;
    for (let k = -1; k <= 1; k++) { const x = tx + px * k, y = ty + py * k; if (r.g[y]?.[x] === 0) { r.g[y][x] = 1; r.blk.push({ x, y, t: Date.now() + 6000 }); } } }
}
setInterval(() => { for (const r of Object.values(rooms)) if (r.state == 'play') { for (const p of Object.values(r.p)) if (p.sk > 0) p.sk -= .033; tick(r, .033); } }, 33);

const info = r => ({ code: r.code, host: r.host, pub: r.pub, map: r.map, mapn: MAPN[r.map], pref: r.pref, state: r.state,
  players: Object.values(r.p).map(p => ({ id: p.id, n: p.n, ready: p.ready })) });
const sendRoom = r => io.to(r.code).emit('room', info(r));

io.on('connection', s => {
  let r = null;
  const join = (code, name) => { const x = rooms[code]; if (!x) return 'Sala não existe'; if (x.state != 'lobby') return 'Jogo em curso'; if (Object.keys(x.p).length >= 5) return 'Sala cheia';
    r = x; s.join(code); r.p[s.id] = { id: s.id, n: String(name || 'Anon').slice(0, 12), ready: false, x: 0, y: 0, in: {} }; sendRoom(r); return null; };
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
  s.on('start', () => { if (r && r.host == s.id && r.state == 'lobby') { const ps = Object.values(r.p); if (ps.length > 1 && ps.every(p => p.ready)) startGame(r); } });
  s.on('in', i => { const p = r?.p[s.id]; if (p && r.state == 'play') { p.in = { dx: +i.dx || 0, dy: +i.dy || 0, run: !!i.run }; p.ang = +i.a || 0; } });
  s.on('act', () => r?.state == 'play' && act(r, r.p[s.id]));
  s.on('skill', () => r?.state == 'play' && skill(r, r.p[s.id]));
  s.on('light', () => { const p = r?.p[s.id]; if (p && p.bat > 0) p.light = !p.light; });
  s.on('disconnect', () => { if (!r) return; delete r.p[s.id]; const ids = Object.keys(r.p);
    if (!ids.length) delete rooms[r.code]; else { if (r.host == s.id) r.host = ids[0]; sendRoom(r); } });
});
srv.listen(process.env.PORT || 3000, () => console.log('Servidor em http://localhost:' + (process.env.PORT || 3000)));
