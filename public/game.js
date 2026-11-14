// Cliente: UI, input, renderização pixel art procedural, iluminação por raycasting, áudio Web Audio.
const S = io(), $ = id => document.getElementById(id);
let room = null, G = null, st = null, mon = null, ping = 0, pulse = 0, bs = new Set(), mapT = 'forest';
const go = id => { document.querySelectorAll('section').forEach(e => e.classList.toggle('on', e.id == id)); $('gm').classList.remove('on'); };
const nick = () => $('nick').value || 'Anon';
setInterval(() => { const t = Date.now(); S.emit('ping2', () => { ping = Date.now() - t; $('pg').textContent = 'PING ' + ping + 'ms'; }); }, 2000);

// ---------- Menus / salas
const create = () => S.emit('create', { name: nick(), pub: $('pub').value == '1', map: $('mp').value }, () => {});
function browse() { go('br'); S.emit('list', l => { $('rl').innerHTML = l.length ? '' : 'Sem salas públicas...';
  l.forEach(r => { const d = document.createElement('div'); d.textContent = `#${r.code} | ${r.host} | ${r.mapn} | ${ping}ms | ${r.n}/5`; d.onclick = () => joinCode(r.code); $('rl').appendChild(d); }); }); }
const joinCode = c => S.emit('join', { code: c, name: nick() }, e => { if (e) { $('er').textContent = e; go('jn'); } });
S.on('room', r => { room = r; if (r.state == 'lobby') { G = null; st = null; $('msg').textContent = ''; go('lb'); }
  $('lc').textContent = '#' + r.code + ' — ' + r.mapn;
  $('pl').innerHTML = r.players.map(p => `<div>${p.id == r.host ? '★ ' : ''}${p.n} <span class="${p.ready ? 'ok' : 'dim'}">${p.ready ? '[PRONTO]' : '[...]'}</span></div>`).join('');
  const host = r.host == S.id; $('hostc').style.display = host ? 'block' : 'none'; $('sb').style.display = host ? 'block' : 'none';
  $('pf').innerHTML = '<option value="rand">Aleatório</option>' + r.players.map(p => `<option value="${p.id}">${p.n}</option>`).join(''); $('pf').value = r.pref; $('mp2').value = r.map; });
S.on('chat', m => { const d = document.createElement('div'); d.textContent = `<${m.n}> ${m.t}`; $('ch').appendChild(d); $('ch').scrollTop = 1e6; });
$('ci').onkeydown = e => { if (e.key == 'Enter' && e.target.value) { S.emit('chat', e.target.value); e.target.value = ''; } };
S.on('start', d => { G = d.g; mon = d.mon; mapT = d.map; buildTiles(); document.querySelectorAll('section').forEach(e => e.classList.remove('on')); $('gm').classList.add('on'); au(); });
S.on('end', t => $('msg').textContent = t);
S.on('s', d => { st = d; bs = new Set(d.blk.map(b => b.x + ',' + b.y)); });
S.on('pulse', () => { pulse = Date.now() + 2500; noise(2, .3, 2200); tone(400, 2, 'sawtooth', .15, 900); });

// ---------- Pixel art procedural
let sd = 3; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const mk = fn => { const c = document.createElement('canvas'); c.width = c.height = 16; fn(c.getContext('2d')); return c; };
const dots = (x, col, n, a) => { x.fillStyle = col; x.globalAlpha = a; for (let i = 0; i < n; i++) x.fillRect(R() * 16 | 0, R() * 16 | 0, 1 + (R() * 2 | 0), 1); x.globalAlpha = 1; };
let FL = [], WL;
function buildTiles() {
  FL = []; const f = mapT == 'forest';
  for (let i = 0; i < 4; i++) FL.push(mk(x => { x.fillStyle = f ? '#18261f' : '#1e2328'; x.fillRect(0, 0, 16, 16);
    if (f) { dots(x, '#24372c', 14, .8); dots(x, '#0e1812', 10, .8); } else { x.fillStyle = '#171b1f'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 0, 1, 16); dots(x, '#2a3037', 8, .6); } }));
  WL = mk(x => { if (f) { x.fillStyle = '#18261f'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#0c1a13'; x.fillRect(2, 0, 12, 11); x.fillRect(0, 3, 16, 6); x.fillStyle = '#33261c'; x.fillRect(7, 10, 3, 6); dots(x, '#173025', 12, .9); }
    else { x.fillStyle = '#3a414a'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#242a31'; for (let y = 0; y < 16; y += 4) x.fillRect(0, y, 16, 1); x.fillRect(4, 0, 1, 4); x.fillRect(11, 4, 1, 4); x.fillRect(4, 8, 1, 4); dots(x, '#4c555f', 8, .7); } });
}
const wall = (x, y) => { const tx = x / 16 | 0, ty = y / 16 | 0; return G[ty]?.[tx] !== 0 || bs.has(tx + ',' + ty); };
const cv = $('c'), ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
const L = document.createElement('canvas'); L.width = 320; L.height = 180; const lx = L.getContext('2d');
const r2 = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w, h); };

function drawP(p) {
  const { x, y } = p;
  r2('rgba(0,0,0,.4)', x - 5, y, 10, 3);
  if (p.r == 's') { if (!p.al) return r2('#5a3a3a', x - 5, y - 1, 10, 3);
    r2(p.hp < 2 ? '#a56' : '#6a8caf', x - 3, y - 5, 6, 9); r2('#d9b99b', x - 2, y - 9, 4, 4); return; }
  if (p.c == 'siren') { r2('#8a8f94', x - 3, y - 24, 6, 26); r2('#9aa0a5', x - 4, y - 32, 8, 6); r2('#555', x - 8, y - 31, 4, 4); r2('#555', x + 4, y - 31, 4, 4); r2('#222', x - 1, y - 30, 2, 2); }
  else if (p.c == 'cat') { r2('#09090b', x - 5, y - 13, 10, 15); r2('#09090b', x - 5, y - 16, 3, 3); r2('#09090b', x + 2, y - 16, 3, 3);
    r2('#fff', x - 3, y - 10, 2, 2); r2('#fff', x + 1, y - 10, 2, 2); r2('#fff', x - 3, y - 5, 6, 1);
    if (p.k) for (let d = 4; d < 40; d += 2) r2('#09090b', x + Math.cos(p.a) * d, y - 6 + Math.sin(p.a) * d, 2, 2); }
  else { r2('#cfc9bb', x - 14, y - 7, 28, 8); r2('#cfc9bb', x + 12, y - 14, 6, 11); r2('#111', x + 15, y - 12, 1, 1); r2('#a9a395', x - 12, y + 1, 2, 5); r2('#a9a395', x + 8, y + 1, 2, 5); }
}

// ---------- Iluminação: raycasting 2D + cone da lanterna
function light(me, sx, sy) {
  lx.globalCompositeOperation = 'source-over'; lx.fillStyle = 'rgba(2,3,8,.965)'; lx.fillRect(0, 0, 320, 180);
  lx.globalCompositeOperation = 'destination-out';
  const m = me.r == 'm', on = !m && me.l && me.b > 0 && !(me.b < 20 && Math.random() < .15);
  const Rd = m ? 120 : on ? 150 : 30, full = m || !on, fov = full ? Math.PI * 2 : 1.2, N = full ? 80 : 50, a0 = me.a - fov / 2;
  lx.beginPath(); if (!full) lx.moveTo(sx, sy);
  for (let i = 0; i <= N; i++) { const a = a0 + fov * i / N, dx = Math.cos(a), dy = Math.sin(a); let d = 0;
    while (d < Rd && !wall(me.x + dx * d, me.y + dy * d)) d += 3; const q = i ? lx.lineTo(sx + dx * d, sy + dy * d) : lx.moveTo(sx + dx * d, sy + dy * d); }
  lx.closePath(); const g = lx.createRadialGradient(sx, sy, 0, sx, sy, Rd); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = g; lx.fill();
  lx.beginPath(); lx.arc(sx, sy, 18, 0, 7); lx.fillStyle = 'rgba(0,0,0,.45)'; lx.fill();
  ctx.drawImage(L, 0, 0);
}

// ---------- Áudio procedural
let AC, hb = 0, fs = 0;
function au() { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); }
function tone(f, d, type = 'sine', v = .3, f2) { if (!AC) return; const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(AC.destination); o.start(); o.stop(t + d); }
function noise(d, v = .2, f = 1000) { if (!AC) return; const b = AC.createBuffer(1, AC.sampleRate * d, AC.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; fl.type = 'bandpass'; fl.frequency.value = f; g.gain.value = v; s.connect(fl).connect(g).connect(AC.destination); s.start(); }

// ---------- Input
const K = {}; let ang = 0;
onkeydown = e => { if (!G || e.target.tagName == 'INPUT') return; K[e.code] = 1;
  if (e.code == 'KeyF') { S.emit('light'); tone(1200, .03, 'square', .1); } if (e.code == 'KeyE') S.emit('act'); if (e.code == 'Space') { e.preventDefault(); S.emit('skill'); } };
onkeyup = e => K[e.code] = 0;
onmousemove = e => ang = Math.atan2(e.clientY - innerHeight / 2, e.clientX - innerWidth / 2);
onmousedown = () => G && S.emit('act');
setInterval(() => { if (G) S.emit('in', { dx: (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0), dy: (K.KeyS || K.ArrowDown ? 1 : 0) - (K.KeyW || K.ArrowUp ? 1 : 0), run: K.ShiftLeft, a: ang }); }, 33);

// ---------- Loop principal
const D = {}; let last = performance.now();
function frame(t) { requestAnimationFrame(frame); const dt = Math.min(.1, (t - last) / 1000); last = t;
  if (!G || !st) return;
  const me = st.p.find(p => p.id == S.id); if (!me) return;
  for (const p of st.p) { const d = D[p.id] || (D[p.id] = { x: p.x, y: p.y }); d.x += (p.x - d.x) * .5; d.y += (p.y - d.y) * .5; p.x = d.x; p.y = d.y; }
  const cx = me.x, cy = me.y; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 320, 180);
  ctx.setTransform(1, 0, 0, 1, Math.round(160 - cx), Math.round(90 - cy));
  for (let ty = Math.max(0, (cy - 100) / 16 | 0); ty <= Math.min(39, (cy + 100) / 16 | 0); ty++) for (let tx = Math.max(0, (cx - 170) / 16 | 0); tx <= Math.min(59, (cx + 170) / 16 | 0); tx++)
    ctx.drawImage(G[ty][tx] || bs.has(tx + ',' + ty) ? WL : FL[(tx * 7 + ty * 13) % 4], tx * 16, ty * 16);
  for (const i of st.it) { const { x, y } = i;
    if (i.t == 't') { r2('#4ad', x - 4, y - 3, 8, 6); r2('#123', x - 2, y - 1, 4, 2); } else if (i.t == 'b') { r2('#cb3', x - 2, y - 4, 5, 8); r2('#fe8', x - 1, y - 5, 3, 1); }
    else { r2('#2d3640', x - 5, y - 8, 10, 15); r2('#111', x - 4, y - 6, 8, 1); r2('#111', x - 4, y - 4, 8, 1); } }
  r2('#444', st.gen.x - 7, st.gen.y - 6, 14, 12); r2(st.op ? '#4f4' : '#f44', st.gen.x - 1, st.gen.y - 4, 2, 2);
  ctx.globalAlpha = st.op ? 1 : .5; r2(st.op ? '#ec4' : '#733', st.ex.x - 8, st.ex.y - 8, 16, 16); ctx.globalAlpha = 1;
  st.p.filter(p => !p.o && (!p.h || p.id == S.id)).sort((a, b) => a.y - b.y).forEach(p => { ctx.globalAlpha = p.h ? .4 : 1; drawP(p); ctx.globalAlpha = 1; });
  ctx.setTransform(1, 0, 0, 1, 0, 0); light(me, 160, 90);
  ctx.fillStyle = 'rgba(150,170,185,.035)'; for (let i = 0; i < 4; i++) ctx.fillRect(0, i * 45 + Math.sin(t / 2000 + i) * 10, 320, 30);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 140; i++) ctx.fillRect(R() * 320 | 0, R() * 180 | 0, 1, 1);
  const v = ctx.createRadialGradient(160, 90, 40, 160, 90, 190); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.9)'); ctx.fillStyle = v; ctx.fillRect(0, 0, 320, 180);
  // Distorção causada pelo grito do Siren Head
  if (pulse > Date.now()) { cv.style.filter = `hue-rotate(${R() * 80}deg) contrast(1.5)`; cv.style.transform = `translate(${R() * 8 - 4}px,${R() * 6 - 3}px)`; } else { cv.style.filter = cv.style.transform = ''; }
  // Áudio dinâmico: batimento cardíaco (terror radius) e passos
  const mo = st.p.find(p => p.r == 'm'), moving = K.KeyW || K.KeyA || K.KeyS || K.KeyD;
  if (me.r == 's' && mo && me.al) { hb -= dt; if (hb <= 0) { const k = Math.max(0, 1 - Math.hypot(mo.x - me.x, mo.y - me.y) / 260);
    if (k > 0) { tone(55, .15, 'sine', .5 * k + .1, 35); setTimeout(() => tone(50, .18, 'sine', .4 * k + .1, 30), 150); } hb = k > 0 ? 1 - .65 * k : .5; } }
  fs -= dt; if (moving && fs <= 0) { noise(.05, .06, 300); fs = K.ShiftLeft ? .25 : .38; }
  $('hud').innerHTML = me.r == 'm' ? `MONSTRO: ${me.c.toUpperCase()}<br>Clique/E atacar | ESPAÇO habilidade`
    : `HP ${'♥'.repeat(Math.max(0, me.hp))}${me.al ? '' : ' ELIMINADO'}<br>ESTAMINA ${me.st}% | BATERIA ${me.b}% (F)<br>FITAS ${st.tp}/5 | E interagir/curar/esconder`
    + (st.op ? '<br><b style="color:#ec4">PORTÃO ABERTO → canto inferior direito</b>' : '');
}
requestAnimationFrame(frame);
