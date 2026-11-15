// Cliente v2: visão igual e ampla (sem raycasting), loja/skins, minigames, cutscenes, áudio procedural.
const S = io(), $ = id => document.getElementById(id);
let G = null, st = null, ping = 0, pulse = 0, bs = new Set(), mapT = 'forest', cut = null, mg = null;
const go = id => { document.querySelectorAll('section').forEach(e => e.classList.toggle('on', e.id == id)); $('gm').classList.remove('on'); };
const nick = () => $('nick').value || 'Anon';
setInterval(() => { const t = Date.now(); S.emit('ping2', () => { ping = Date.now() - t; $('pg').textContent = 'PING ' + ping + 'ms'; }); }, 2000);

// ---------- Loja / skins (localStorage)
const MN = { siren: ['Siren Head', 0, '#8a8f94'], horse: ['Long Horse', 100, '#cfc9bb'], cat: ['Cartoon Cat', 500, '#15151a'], worm: ['Bridge Worm', 800, '#6b5a4a'], road: ['Country Road Creature', 1200, '#3a3f33'] };
const SKN = { siren: [['Enferrujado', '#9a5a2a', 150], ['Inverno', '#cfe3ee', 150]], horse: [['Pálido', '#e8e4d8', 120], ['Carvão', '#4a4a4a', 120]], cat: [['Sangrento', '#6a1010', 200], ['Fantasma', '#8a8a99', 200]],
  worm: [['Musgo', '#4a6a3a', 250], ['Ferrugem', '#8a4a2a', 250]], road: [['Cinza', '#6a6f66', 300], ['Noturno', '#1a1f33', 300]] };
const SVS = [['Padrão', '#6a8caf', 0], ['Detetive', '#8a6a4a', 120], ['Hazmat', '#c9b21a', 200], ['Sinal Dourado', '#ffd24a', 0, 1]];
let SV = { coins: 0, own: ['siren'], mon: 'siren', sk: {}, sv: 0 };
try { Object.assign(SV, JSON.parse(localStorage.getItem('th') || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem('th', JSON.stringify(SV)); } catch (e) {} $('co').textContent = SV.coins; }; save();
const owns = id => SV.own.includes(id);
const monCol = m => SV.sk[m] == 99 && owns('mc') ? '#8a1a4a' : SV.sk[m] >= 0 && owns(m + ':' + SV.sk[m]) ? SKN[m][SV.sk[m]][1] : MN[m][2];
function shop() { const L = [];
  for (const k in MN) L.push([k, 'Monstro: ' + MN[k][0], MN[k][1]]);
  for (const m in SKN) SKN[m].forEach(([n, c, p], i) => L.push([m + ':' + i, `Skin ${MN[m][0]} ${n}`, p]));
  SVS.forEach(([n, c, p, ev], i) => i && (!ev || owns('sv:' + i)) && L.push(['sv:' + i, 'Skin Sobrevivente ' + n, p]));
  $('sl').innerHTML = L.map(([id, n, p]) => `<div>${n} — ${p} 🪙 ${p == 0 || owns(id) ? '<span class="ok">[TEU]</span>' : `<button onclick="buy('${id}',${p})">COMPRAR</button>`}</div>`).join(''); }
function buy(id, p) { if (SV.coins >= p && !owns(id)) { SV.coins -= p; SV.own.push(id); save(); shop(); } else if (!owns(id)) alert('Moedas insuficientes!'); }
S.on('coin', n => { if (n) { SV.coins += n; save(); } });
// ---------- Evento TRANSMISSÃO CORROMPIDA (estado vem do servidor)
let EV = false, EVG = false, EVMS = 0, EVT = 0;
S.on('ev', d => { EV = d.on; EVMS = d.ms; EVT = Date.now(); upEv(); });
function upEv() { document.body.classList.toggle('ev', EV);
  $('evb').textContent = '🔴 ALERTA: TRANSMISSÃO CORROMPIDA ATIVA (20:30 - 21:30) — 2X MOEDAS SUSTO + FITA DOURADA!';
  const s = Math.max(0, EVMS - (Date.now() - EVT)) / 1000 | 0, dd = s / 86400 | 0, hh = (s % 86400) / 3600 | 0, mi = (s % 3600) / 60 | 0, c = n => String(n).padStart(2, '0');
  $('evc').textContent = EV ? '' : `Próxima Transmissão Corrompida: Sábado/Domingo às 20:30 (em ${dd ? dd + 'd ' : ''}${c(hh)}:${c(mi)}:${c(s % 60)})`; }
setInterval(upEv, 1000);
S.on('gold', () => { if (!owns('sv:3')) { SV.own.push('sv:3', 'mc'); save(); } $('msg').textContent = '🏆 FITA DOURADA! SKINS DO EVENTO DESBLOQUEADAS'; setTimeout(() => $('msg').textContent = '', 6000); });
function look() { // preenche seletores do lobby só com o que o jogador possui
  const ms = Object.keys(MN).filter(k => MN[k][1] == 0 || owns(k)); if (!ms.includes(SV.mon)) SV.mon = 'siren';
  $('crs').innerHTML = ms.map(k => `<option value="${k}">${MN[k][0]}</option>`).join(''); $('crs').value = SV.mon;
  const sk = ['Padrão', ...SKN[SV.mon].map(s => s[0])].map((n, i) => [n, i - 1]).filter(([n, i]) => i < 0 || owns(SV.mon + ':' + i)); if (owns('mc')) sk.push(['Corrompido (Evento)', 99]);
  $('skm').innerHTML = sk.map(([n, i]) => `<option value="${i}">${n}</option>`).join(''); $('skm').value = SV.sk[SV.mon] ?? -1;
  $('sks').innerHTML = SVS.map(([n], i) => [n, i]).filter(([n, i]) => i == 0 || owns('sv:' + i)).map(([n, i]) => `<option value="${i}">${n}</option>`).join(''); $('sks').value = SV.sv;
  S.emit('creature', SV.mon); S.emit('look', { mc: monCol(SV.mon), sc: SVS[SV.sv][1] }); }
$('crs').onchange = e => { SV.mon = e.target.value; save(); look(); }; $('skm').onchange = e => { SV.sk[SV.mon] = +e.target.value; save(); look(); }; $('sks').onchange = e => { SV.sv = +e.target.value; save(); look(); };

// ---------- Menus / salas
const create = () => S.emit('create', { name: nick(), pub: $('pub').value == '1', map: $('mp').value }, () => {});
function browse() { go('br'); S.emit('list', l => { $('rl').innerHTML = l.length ? '' : 'Sem salas públicas...';
  l.forEach(r => { const d = document.createElement('div'); d.textContent = `#${r.code} | ${r.host} | ${r.mapn} | ${ping}ms | ${r.n}/5`; d.onclick = () => joinCode(r.code); $('rl').appendChild(d); }); }); }
const joinCode = c => S.emit('join', { code: c, name: nick() }, e => { if (e) { $('er').textContent = e; go('jn'); } });
S.on('room', r => { if (r.state == 'lobby') { G = null; st = null; cut = null; closeMG(); $('msg').textContent = ''; go('lb'); look(); }
  $('lc').textContent = '#' + r.code + ' — ' + r.mapn;
  $('pl').innerHTML = r.players.map(p => `<div>${p.id == r.host ? '★ ' : ''}${p.n} <span class="${p.ready ? 'ok' : 'dim'}">${p.ready ? '[PRONTO]' : '[...]'}</span></div>`).join('');
  const host = r.host == S.id; $('hostc').style.display = host ? 'block' : 'none'; $('sb').style.display = host ? 'block' : 'none';
  $('pf').innerHTML = '<option value="rand">Aleatório</option>' + r.players.map(p => `<option value="${p.id}">${p.n}</option>`).join(''); $('pf').value = r.pref; $('mp2').value = r.map; });
S.on('chat', m => { const d = document.createElement('div'); d.textContent = `<${m.n}> ${m.t}`; $('ch').appendChild(d); $('ch').scrollTop = 1e6; });
$('ci').onkeydown = e => { if (e.key == 'Enter' && e.target.value) { S.emit('chat', e.target.value); e.target.value = ''; } };
S.on('start', d => { EVG = !!d.ev; if (EVG) { au(); [0, 2600, 5200].forEach(t => setTimeout(() => { tone(300, 2.4, 'sawtooth', .03, 520); tone(150, 2.4, 'triangle', .04, 260); }, t)); } G = d.g; mapT = d.map; buildTiles(); document.querySelectorAll('section').forEach(e => e.classList.remove('on')); $('gm').classList.add('on'); au();
  cut = { k: 'i', t: Date.now(), m: d.mon }; tone(45, 3.4, 'sawtooth', .25, 70); noise(3, .15, 200); });
S.on('end', w => { cut = { k: w, t: Date.now() }; closeMG(); w == 'm' ? (noise(3, .4, 150), tone(60, 3, 'sawtooth', .3, 30)) : tone(330, 2, 'triangle', .2, 660); });
S.on('s', d => { st = d; bs = new Set(); d.p.forEach(p => { p.rx = p.x; p.ry = p.y; }); });
S.on('kill', d => { cut = { k: 'k', t: Date.now(), ...d }; tone(70, 1.6, 'sawtooth', .3, 30); noise(.6, .3, 400); setTimeout(() => noise(.3, .4, 1500), 800); });
S.on('pulse', () => { pulse = Date.now() + 2500; noise(2, .3, 2200); tone(400, 2, 'sawtooth', .15, 900); });

// ---------- Pixel art procedural
let sd = 3; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const mk = fn => { const c = document.createElement('canvas'); c.width = c.height = 16; fn(c.getContext('2d')); return c; };
const dots = (x, col, n, a) => { x.fillStyle = col; x.globalAlpha = a; for (let i = 0; i < n; i++) x.fillRect(R() * 16 | 0, R() * 16 | 0, 1 + (R() * 2 | 0), 1); x.globalAlpha = 1; };
let FL = [], WL;
function buildTiles() { FL = []; const f = mapT == 'forest';
  for (let i = 0; i < 4; i++) FL.push(mk(x => { x.fillStyle = f ? '#1a2a21' : '#20262b'; x.fillRect(0, 0, 16, 16);
    if (f) { dots(x, '#27402f', 16, .8); dots(x, '#0f1a13', 10, .8); x.fillStyle = '#3a5a3a'; for (let k = 0; k < 3; k++) { const a = R() * 14 | 0, b = 2 + R() * 12 | 0; x.fillRect(a, b, 1, 3); x.fillRect(a + 1, b + 1, 1, 2); } }
    else { x.fillStyle = '#161a1e'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 0, 1, 16); x.fillStyle = '#2d343b'; x.fillRect(1, 1, 7, 7); x.fillRect(8, 8, 7, 7); dots(x, '#3a424a', 6, .6); x.fillStyle = '#0c0f12'; x.fillRect(R() * 14 | 0, R() * 14 | 0, 1, 4); } }));
  WL = mk(x => { if (f) { x.fillStyle = '#1a2a21'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#0a1710'; x.fillRect(2, 0, 12, 11); x.fillRect(0, 3, 16, 6); x.fillStyle = '#143022'; x.fillRect(3, 1, 7, 5); x.fillStyle = '#33261c'; x.fillRect(7, 10, 3, 6); x.fillStyle = '#4a3828'; x.fillRect(7, 10, 1, 6); dots(x, '#1c4030', 12, .9); }
    else { x.fillStyle = '#3d444d'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#232930'; for (let y = 0; y < 16; y += 4) x.fillRect(0, y, 16, 1); x.fillRect(4, 0, 1, 4); x.fillRect(11, 4, 1, 4); x.fillRect(4, 8, 1, 4); x.fillStyle = '#566069'; x.fillRect(0, 1, 16, 1); dots(x, '#4c555f', 8, .7); } }); }
const cv = $('c'), ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
const r2 = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w, h); };
const dust = Array.from({ length: 45 }, () => ({ x: Math.random() * 320, y: Math.random() * 180, v: .1 + Math.random() * .3 }));

// ---------- Sprites com braços/pernas e animação (andar, correr, atacar, habilidades, animação de kill do gato)
const PI = Math.PI, ease = u => 1 - (1 - u) * (1 - u), RR = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
const shade = (c, k) => { const n = parseInt(c.slice(1), 16), f = v => Math.max(0, Math.min(255, v * k | 0)); return '#' + [n >> 16, n >> 8 & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); };
function lm(c, x, y, l1, a1, l2, a2, w = 2) { // membro de 2 segmentos (articulação) desenhado a pixels
  let px = x, py = y; for (const [l, a] of [[l1, a1], [l2, a2]]) { if (!l) continue; for (let i = 0; i < l; i++) RR(c, px + Math.cos(a) * i, py + Math.sin(a) * i, w, w); px += Math.cos(a) * l; py += Math.sin(a) * l; }
  return [px, py]; }
function humanoid(o, cf) { // corpo base com 2 pernas e 2 braços; cf.pose(back) pode substituir o ângulo dos braços
  const { s, sw, bob } = o, b = Math.round(bob), top = -cf.hip - cf.th - b;
  const leg = (x, g, k) => { const a = PI / 2 + g * s * .9 * sw; lm(shade(cf.col, k), x, -cf.hip, cf.leg, a, cf.leg, a + .7 * Math.max(0, -g * s) * sw, cf.lw || 2); };
  const arm = (x, back) => { let a = PI / 2 + (back ? 1 : -1) * s * .8 * sw, a2 = a - .4, m = 1; const r = cf.pose && cf.pose(back); if (r) [a, a2, m] = r;
    const e = lm(shade(cf.col, back ? .7 : 1), x, top + 2, cf.arm * m, a, cf.arm * m, a2, cf.aw || 2); if (cf.hand) RR(cf.hand, e[0] - 1, e[1] - 1, 3, 3); };
  leg(-2, 1, .6); leg(1, -1, .85); arm(-cf.tw / 2 - 1, true); RR(cf.col, -cf.tw / 2, top, cf.tw, cf.th); RR(shade(cf.col, .7), cf.tw / 2 - 2, top, 2, cf.th); arm(cf.tw / 2 - 1, false); return top; }

function drawS(p, o) { const c = p.col || '#6a8caf';
  if (!p.al) { RR('#6a0d0d', -9, 0, 18, 3); RR('#4a3030', -6, -3, 12, 3); RR(c, -3, -5, 6, 3); RR('#d9b99b', 5, -5, 3, 3); return; }
  const top = humanoid(o, { col: c, hip: 6, leg: 3, tw: 6, th: 6, arm: 3, hand: '#d9b99b', pose: bk => bk ? 0 : [o.al, o.al, 1] }); // braço da frente aponta a lanterna
  RR('#d9b99b', -2, top - 5, 5, 5); RR('#241c18', -2, top - 6, 5, 2); RR('#111', 1, top - 3, 1, 1); if (p.hp < 2) RR('#a22', -1, top + 2, 2, 2);
  if (p.sn) { const q = Math.round(Math.cos(o.t / 90) * 5); RR('#ff4', q - 1, top - 9, 2, 2); RR('#ff4', -q - 1, top - 9, 2, 2); } }

function drawSiren(p, o) {
  const top = humanoid(o, { col: o.c, hip: 14, leg: 7, tw: 6, th: 12, arm: 7, pose: bk => o.ab == 2 ? [PI * .88, PI * .88, 1] : o.ab == 1 ? [bk ? -1.2 : -1.9, bk ? -1.2 : -1.9, 1] : !bk && o.ak >= 0 ? [-2.2 + 2.7 * ease(o.ak), -2 + 2.7 * ease(o.ak), 1] : 0 });
  const up = o.ab == 1 ? -2 : 0, hx = o.ab == 2 ? 2 : 0, gl = o.ab == 1 ? '#f33' : '#111';
  RR(o.c, -4 + hx, top - 8 + up, 8, 8); RR('#444', -9 + hx, top - 7 + up, 5, 4); RR('#444', 4 + hx, top - 7 + up, 5, 4); RR(gl, -8 + hx, top - 6 + up, 3, 2); RR(gl, 5 + hx, top - 6 + up, 3, 2); RR(shade(o.c, .6), -2 + hx, top - 4 + up, 4, 1);
  if (o.ab == 1) { ctx.strokeStyle = `rgba(255,70,70,${1 - o.ap})`; ctx.beginPath(); ctx.arc(0, top - 4, 10 + o.ap * 70, 0, 7); ctx.stroke(); }
  if (o.ab == 2) for (let i = 0; i < 3; i++) RR('rgba(255,255,255,.3)', -16 - i * 4, top + 4 + i * 5, 8, 1); }

function drawCat(p, o) {
  const top = humanoid(o, { col: o.c, hip: 7, leg: 4, lw: 3, tw: 8, th: 9, arm: 5, aw: 3, hand: '#f2f2f2', pose: bk => p.kp >= 0 ? [o.al, o.al, 1 + 3 * ease(Math.min(1, p.kp * 2.2))] : o.ab == 1 ? [o.al, o.al, 1 + 2.5 * Math.sin(PI * o.ap)] : !bk && o.ak >= 0 ? [o.al, o.al, 1 + 3 * Math.sin(PI * o.ak)] : 0 });
  RR(o.c, -5, top - 9, 10, 9); RR(o.c, -5, top - 12, 3, 3); RR(o.c, 2, top - 12, 3, 3); RR('#c58', -4, top - 11, 1, 1); RR('#c58', 3, top - 11, 1, 1);
  RR('#fff', -4, top - 7, 4, 4); RR('#fff', 1, top - 7, 4, 4); RR('#000', -2, top - 6, 1, 2); RR('#000', 3, top - 6, 1, 2);
  RR('#fff', p.kp >= 0 ? -5 : -4, top - 3, p.kp >= 0 ? 10 : 8, p.kp >= 0 ? 3 : 2); RR('#000', -2, top - 3, 1, 2); RR('#000', 1, top - 3, 1, 2); }

function drawRoad(p, o) {
  const top = humanoid(o, { col: o.c, hip: 16, leg: 8, tw: 5, th: 14, arm: 9, hand: '#bfc0b8', pose: bk => o.ab == 2 ? [-1.9, -1.9, 1] : !bk && o.ak >= 0 ? [-2.2 + 2.7 * ease(o.ak), -2 + 2.7 * ease(o.ak), 1] : 0 }), cf = shade(o.c, .8), hx = o.mvg ? Math.round(Math.sin(o.t / 90)) : 0;
  RR(cf, -4, top + 10, 8, 8); RR(cf, -4, top + 17, 2, 3); RR(cf, 0, top + 17, 2, 2); RR(cf, 2, top + 16, 2, 4);                   // casaco rasgado
  RR('#cfcfc8', -3 + hx, top - 11, 6, 11); RR('#000', -2 + hx, top - 8, 1, 3); RR('#000', 1 + hx, top - 8, 1, 3); RR('#222', -2 + hx, top - 3, 4, 1); RR('#111', -3 + hx, top - 12, 6, 1);
  if (o.ab == 1) for (let i = 0; i < 7; i++) RR(`rgba(10,10,14,${1 - o.ap})`, Math.round(Math.sin(i * 2.3) * 8), top + 14 - Math.round(o.ap * 20) - i * 3, 4, 4);   // teleporte: fumo
  if (o.ab == 2) for (let i = 0; i < 6; i++) RR('rgba(160,170,170,.35)', Math.round(Math.cos(i * 1.7) * 10), -2 - i * 2, 8, 3); }

function drawHorse(p, o) { const { c, s, sw, bob } = o, b = Math.round(bob), dk = shade(c, .65), lt = shade(c, 1.1);
  const leg = (x, g, k) => { const a = PI / 2 + g * s * sw; lm(shade(c, k), x, -9, 5, a, 5, a + .8 * Math.max(0, -g * s) * sw, 2); };
  leg(-11, 1, .6); leg(-7, -1, .8); leg(6, -1, .6); leg(10, 1, .85);                                  // 4 membros em galope
  lm(dk, -14, -12 - b, 5, PI - .3 + Math.sin(o.t / 200) * .25, 4, PI + .2, 2);                         // cauda
  RR(c, -14, -15 - b, 28, 8); RR(dk, -14, -9 - b, 28, 2); RR(lt, -12, -15 - b, 22, 1); for (let i = 0; i < 6; i++) RR(dk, -12 + i * 4, -16 - b, 2, 2);
  const st = o.ab == 1 ? o.ap : o.ak >= 0 ? o.ak : -1, len = st >= 0 ? 6 + (o.ab == 1 ? 100 : 28) * Math.sin(PI * st) : 0;
  const e = st >= 0 ? lm(c, 12, -13 - b, len + 6, o.al, 0, 0, 3) : lm(c, 12, -13 - b, 7, -1.1, 6, -.5, 3), hx = e[0], hy = e[1];  // pescoço estica no ataque/Q
  RR(c, hx - 1, hy - 3, 9, 6); RR(dk, hx + 6, hy - 1, 3, 3); RR('#111', hx + 3, hy - 2, 1, 1); RR('#222', hx - 2, hy - 5, 3, 5); }

function drawWorm(p, o) { const { c, t, sw } = o, dk = shade(c, .55), lt = shade(c, 1.35), roar = o.ab == 2, leap = o.ab == 1 && !p.inv ? Math.sin(PI * o.ap) * 14 : 0;
  ctx.translate(0, -leap);
  if (p.inv) { RR('#2f2216', -16, -3, 32, 4); RR('#4a3622', -12, -6, 24, 3); RR('#3a2a1a', -6, -8, 12, 3); RR('#ee4', 12, -6, 2, 1); RR('#ee4', 16, -6, 2, 1); return; }   // enterrado
  const wv = i => Math.sin(t / 160 - i * .9) * (o.mvg ? 2.4 : .7);
  for (let i = 0; i < 6; i++) { const x = -18 + i * 6, h = 4 + i, y = -h - 1 + wv(i);
    if (i > 0 && i < 5) { const a = PI / 2 + Math.sin(o.ph * 1.2 + i * 2) * .7 * sw; lm(dk, x + 2, y + h - 2, 2, a, 2, a + .5, 1); lm(dk, x + 5, y + h - 2, 2, a + 3.2 - PI, 2, a - .3, 1); }
    RR(c, x, y, 7, h); RR(lt, x + 1, y, 5, 2); RR(dk, x, y + h - 2, 7, 2); RR(dk, x + 6, y + 1, 1, h - 2); if (i < 5) { RR('#241a12', x + 2, y - 2, 2, 2); RR('#241a12', x + 3, y - 3, 1, 1); } }
  const hy = -14 + wv(5) - (roar ? 5 : 0), hx = 15, op = roar ? 6 : o.ak >= 0 ? 2 + 5 * Math.sin(PI * o.ak) : 1;
  RR(c, hx, hy, 10, 11); RR(lt, hx + 1, hy, 8, 2); RR(dk, hx, hy + 9, 10, 2); RR('#6a0808', hx + 7, hy + 4, 4, op);
  RR('#fff', hx + 7, hy + 4, 1, 2); RR('#fff', hx + 10, hy + 4, 1, 2); RR('#fff', hx + 8, hy + 3 + op, 1, 2); RR(dk, hx + 8, hy + 2, 3, 2); RR(dk, hx + 8, hy + 4 + op, 3, 2);
  RR('rgba(255,230,60,.35)', hx + 2, hy + 1, 4, 4); RR('#ee4', hx + 3, hy + 2, 2, 2); RR('#ee4', hx + 6, hy + 2, 1, 1);
  const arm = (x, bk) => { let a = PI / 2 - .3 + (bk ? 1 : -1) * Math.sin(o.ph) * .6 * sw; if (!bk && o.ak >= 0) a = -1.8 + 2.4 * ease(o.ak); const e = lm(bk ? dk : c, x, hy + 8, 4, a, 4, a + .5, 2); RR('#e8e0c0', e[0], e[1], 2, 2); RR('#e8e0c0', e[0] + 2, e[1] + 1, 1, 2); };   // garras
  arm(hx + 1, true); arm(hx + 6, false);
  if (roar) { ctx.strokeStyle = `rgba(255,60,40,${1 - o.ap})`; ctx.beginPath(); ctx.arc(hx + 8, hy + 5, 8 + o.ap * 60, 0, 7); ctx.stroke(); } }

let KU = -1; // progresso (0..1) da animação de kill do gato, ou -1
function drawP(p, t) {
  if (KU >= 0) { if (p.id == cut.vid) { if (KU > .85) return; p = { ...p, al: true, hp: 1, sn: true, mvg: false, y: p.y - 10 * ease(Math.min(1, Math.max(0, (KU - .25) * 3))), x: p.x + (KU > .25 ? Math.round(Math.sin(t / 25)) : 0) }; }
    else if (p.id == cut.mid) p = { ...p, a: Math.atan2(cut.vy - cut.my, cut.vx - cut.mx), kp: KU, mvg: false, ak: -1, ab: 0 }; }
  const la = p.a || 0, face = Math.cos(la) < 0 ? -1 : 1, X = Math.round(p.x), Y = Math.round(p.y), ph = p.ph || 0, mvg = p.mvg;
  const o = { c: p.col || '#888', s: Math.sin(ph), sw: mvg ? (p.rn ? 1.15 : .8) : 0, bob: mvg ? Math.abs(Math.sin(ph)) * (p.rn ? 2 : 1.2) : Math.sin(t / 420) * .6, mvg, t, ph, al: face < 0 ? PI - la : la, ak: p.ak ?? -1, ab: p.ab || 0, ap: p.ap || 0 };
  RR('rgba(0,0,0,.4)', X - 7, Y, 14, 3); ctx.save(); ctx.translate(X, Y); ctx.scale(face, 1);
  (p.r == 's' ? drawS : { siren: drawSiren, horse: drawHorse, cat: drawCat, worm: drawWorm, road: drawRoad }[p.c])(p, o); ctx.restore(); }

// ---------- Áudio procedural
let AC, hb = 0, fs = 0;
function au() { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); }
function tone(f, d, type = 'sine', v = .3, f2) { if (!AC) return; const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(AC.destination); o.start(); o.stop(t + d); }
function noise(d, v = .2, f = 1000) { if (!AC) return; const b = AC.createBuffer(1, AC.sampleRate * d, AC.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; fl.type = 'bandpass'; fl.frequency.value = f; g.gain.value = v; s.connect(fl).connect(g).connect(AC.destination); s.start(); }

// ---------- Minigames do gerador: fios + skill check
function closeMG() { if (mg?.iv) clearInterval(mg.iv); mg = null; $('mg').style.display = 'none'; }
function openMG(i) { mg = { i }; $('mg').style.display = 'block'; wires(); }
function wires() { mg.ph = 'w'; mg.ok = 0; mg.sel = null; const C = ['#e44', '#4e4', '#48f'], Rr = [...C].sort(() => Math.random() - .5), f = a => a.map(c => `<i data-c="${c}" style="background:${c}"></i>`).join('');
  $('mgt').textContent = '1/2 LIGA OS FIOS (clica na cor e depois na igual)'; $('mgb').innerHTML = `<div class="wr" id="wl">${f(C)}</div><div class="wr" id="wrr">${f(Rr)}</div>`; }
$('mgb').onclick = e => { const el = e.target; if (!mg || mg.ph != 'w' || el.tagName != 'I') return;
  if (el.parentNode.id == 'wl') { mg.sel = el; el.style.outline = '2px solid #fff'; }
  else if (mg.sel && mg.sel.dataset.c == el.dataset.c) { el.style.opacity = mg.sel.style.opacity = .25; mg.sel.style.pointerEvents = el.style.pointerEvents = 'none'; mg.sel = null; tone(700, .08, 'square', .1); if (++mg.ok == 3) skillStart(); } };
function skillStart() { mg.ph = 's'; mg.hits = 0; mg.z = 40 + Math.random() * 240; mg.p = 0; mg.dir = 1; $('mgt').textContent = '2/2 SKILL CHECK';
  $('mgb').innerHTML = '<div id="bar"><div id="zn"></div><div id="pt"></div></div><p>ESPAÇO na zona verde (0/3)</p>'; $('zn').style.left = mg.z + 'px';
  mg.iv = setInterval(() => { mg.p += mg.dir * 4; if (mg.p >= 336 || mg.p <= 0) mg.dir *= -1; $('pt').style.left = mg.p + 'px'; }, 16); }
function skillHit() { if (mg.p >= mg.z && mg.p <= mg.z + 50) { tone(900, .08, 'square', .12); if (++mg.hits >= 3) { S.emit('gen', { i: mg.i }); tone(500, .5, 'triangle', .3, 1000); closeMG(); return; } mg.z = 40 + Math.random() * 240; $('zn').style.left = mg.z + 'px'; }
  else { mg.hits = 0; tone(120, .2, 'sawtooth', .2); } $('mgb').querySelector('p').textContent = `ESPAÇO na zona verde (${mg.hits}/3)`; }

// ---------- Input
const K = {}; let ang = 0;
const me = () => st?.p.find(p => p.id == S.id);
onkeydown = e => { if (!G || e.target.tagName == 'INPUT') return; K[e.code] = 1; const m = me(); if (!m) return;
  if (e.code == 'Space') { e.preventDefault(); return mg ? (mg.ph == 's' && skillHit()) : S.emit('atk'); }
  if (e.code == 'KeyQ') S.emit('q'); if (e.code == 'KeyE') S.emit('e');
  if (e.code == 'KeyF') { if (mg) return closeMG(); const i = st.gens.findIndex(g => !g.d && Math.hypot(g.x - m.x, g.y - m.y) < 30); if (m.r == 's' && m.al && i >= 0) openMG(i); } };
onkeyup = e => K[e.code] = 0;
onmousemove = e => !MOB() && (ang = Math.atan2(e.clientY - innerHeight / 2, e.clientX - innerWidth / 2));
onmousedown = () => G && !mg && !MOB() && S.emit('atk');
const MOB = () => document.body.classList.contains('mob'), TJ = { x: 0, y: 0, run: 0 };
setInterval(() => { if (!G) return; const kx = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0), ky = (K.KeyS || K.ArrowDown ? 1 : 0) - (K.KeyW || K.ArrowUp ? 1 : 0);
  if ((TJ.x || TJ.y) && !kx && !ky) ang = Math.atan2(TJ.y, TJ.x);
  S.emit('in', mg ? { dx: 0, dy: 0 } : { dx: kx || TJ.x, dy: ky || TJ.y, run: K.ShiftLeft || TJ.run, a: ang }); }, 33);

// ---------- Loop principal
const D = {}; let last = performance.now();
function frame(t) { requestAnimationFrame(frame); const dt = Math.min(.1, (t - last) / 1000); last = t;
  if (!G || !st) return; const m = me(); if (!m) return; const now = Date.now();
  for (const p of st.p) { const d = D[p.id] || (D[p.id] = { x: p.rx, y: p.ry, ph: 0, lx: p.rx, ly: p.ry, mt: 0 }); if (p.rx != d.lx || p.ry != d.ly) { d.mt = now; d.lx = p.rx; d.ly = p.ry; }
    d.x += (p.rx - d.x) * .5; d.y += (p.ry - d.y) * .5; p.x = d.x; p.y = d.y; p.mvg = now - d.mt < 140; if (p.mvg && p.al) d.ph += dt * (p.rn ? 16 : 10); p.ph = d.ph; }
  const mo = st.p.find(p => p.r == 'm'); KU = cut?.k == 'k' && now - cut.t < 1700 ? (now - cut.t) / 1700 : -1;
  const cutting = cut && (cut.k == 'k' ? KU >= 0 : cut.k != 'i' ? now - cut.t < 8000 : now - cut.t < 3600), foc = KU >= 0 ? { x: (cut.mx + cut.vx) / 2, y: (cut.my + cut.vy) / 2 } : cutting && mo ? mo : m, cx = foc.x, cy = foc.y;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 320, 180);
  const Z = KU >= 0 ? 1 + 1.3 * Math.sin(PI * KU) : 1; ctx.setTransform(Z, 0, 0, Z, Math.round(160 - cx * Z), Math.round(90 - cy * Z));
  for (let ty = Math.max(0, (cy - 100) / 16 | 0); ty <= Math.min(39, (cy + 100) / 16 | 0); ty++) for (let tx = Math.max(0, (cx - 170) / 16 | 0); tx <= Math.min(59, (cx + 170) / 16 | 0); tx++) {
    if (G[ty][tx]) ctx.drawImage(WL, tx * 16, ty * 16); else { ctx.drawImage(FL[(tx * 7 + ty * 13) % 4], tx * 16, ty * 16); if ((tx * 31 + ty * 17) % 53 == 0) { r2('#4a0a0a', tx * 16 + 3, ty * 16 + 6, 9, 5); r2('#6a1010', tx * 16 + 5, ty * 16 + 7, 4, 2); } } }
  for (const i of st.it) { const { x, y } = i;
    if (i.t == 'm') { r2('#eee', x - 4, y - 3, 8, 6); r2('#d22', x - 1, y - 3, 2, 6); r2('#d22', x - 3, y - 1, 6, 2); } else if (i.t == 'g') { const gl = 3 + Math.sin(t / 150) * 2; r2('rgba(255,210,60,.25)', x - 8 - gl / 2, y - 8 - gl / 2, 16 + gl, 14 + gl); r2('#ffd24a', x - 4, y - 3, 8, 6); r2('#7a5a00', x - 2, y - 1, 4, 2); } else if (i.t == 'e') { r2('#3c3', x - 2, y - 4, 5, 8); r2('#ff4', x - 2, y - 1, 5, 2); }
    else { r2('#2d3640', x - 5, y - 8, 10, 15); r2('#111', x - 4, y - 6, 8, 1); r2('#111', x - 4, y - 4, 8, 1); } }
  st.gens.forEach(g => { r2('#333', g.x - 7, g.y - 6, 14, 12); r2('#555', g.x - 7, g.y - 6, 14, 2); r2(g.d ? '#4f4' : '#f44', g.x - 1, g.y - 3, 2, 2); r2('#222', g.x - 5, g.y + 1, 10, 3); });
  const rv = m.r == 'm' && m.rv;
  st.p.filter(p => p.al || p.r == 's').sort((a, b) => a.y - b.y).forEach(p => { if (p.h && p.id != S.id && !rv) return;
    if (rv && p.r == 's') { ctx.strokeStyle = '#f33'; ctx.beginPath(); ctx.arc(p.x, p.y - 4, 10 + Math.sin(t / 100) * 2, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = p.inv ? (p.id == S.id ? .5 : .1) : p.gh ? .55 : p.h ? .4 : 1; if (cut?.k == 'm' && p.r == 'm' && cutting) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(3, 3); ctx.translate(-p.x, -p.y); drawP(p, t); ctx.restore(); } else drawP(p, t); ctx.globalAlpha = 1;
    if (p.r == 's' && p.al && !cutting) { const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 70); g.addColorStop(0, 'rgba(255,240,180,.18)'); g.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, 70, p.a - .45, p.a + .45); ctx.fill(); } }); // lanterna estética
  let blind = 0; st.fogs.forEach(f => { const g = ctx.createRadialGradient(f.x, f.y, 5, f.x, f.y, 70); g.addColorStop(0, 'rgba(90,100,105,.95)'); g.addColorStop(1, 'rgba(90,100,105,0)'); ctx.fillStyle = g; ctx.fillRect(f.x - 70, f.y - 70, 140, 140); if (m.r == 's' && Math.hypot(m.x - f.x, m.y - f.y) < 70) blind = .7; });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Nevoeiro suave, poeira, grão e vinheta (sem bloquear a visão)
  ctx.fillStyle = 'rgba(150,170,185,.04)'; for (let i = 0; i < 4; i++) ctx.fillRect(0, i * 45 + Math.sin(t / 2000 + i) * 10, 320, 30);
  dust.forEach(d => { d.x = (d.x + d.v + 320) % 320; d.y = (d.y + Math.sin(t / 1000 + d.x) * .1 + 180) % 180; r2('rgba(200,210,200,.25)', d.x, d.y, 1, 1); });
  ctx.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 120; i++) ctx.fillRect(R() * 320 | 0, R() * 180 | 0, 1, 1);
  const v = ctx.createRadialGradient(160, 90, 70, 160, 90, 200); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, EVG ? 'rgba(70,0,10,.85)' : 'rgba(0,0,0,.8)'); ctx.fillStyle = v; ctx.fillRect(0, 0, 320, 180); if (EVG) { ctx.fillStyle = 'rgba(160,10,30,' + (.07 + Math.sin(t / 700) * .02) + ')'; ctx.fillRect(0, 0, 320, 180); }
  if (blind) { ctx.fillStyle = `rgba(20,25,28,${blind})`; ctx.fillRect(0, 0, 320, 180); }
  if (pulse > now || m.sn) { cv.style.filter = `hue-rotate(${R() * 80}deg) contrast(1.5)`; cv.style.transform = `translate(${R() * 8 - 4}px,${R() * 6 - 3}px)`; } else cv.style.filter = cv.style.transform = '';
  // Cutscenes: barras de cinema + texto
  if (cutting) { const bar = 24; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 320, bar); ctx.fillRect(0, 180 - bar, 320, bar); ctx.textAlign = 'center'; ctx.font = 'bold 12px monospace';
    if (cut.k == 'i') { const nm = MN[mo.c][0].toUpperCase(); ctx.fillStyle = Math.random() < .1 ? '#fff' : '#c33'; ctx.fillText(nm, 160, 168); if (mo.c == 'siren' && now % 400 < 200) { ctx.fillStyle = 'rgba(200,0,0,.12)'; ctx.fillRect(0, 0, 320, 180); } }
    else if (cut.k == 'm') { ctx.fillStyle = `rgba(160,40,0,${.15 + Math.random() * .1})`; ctx.fillRect(0, 0, 320, 180); ctx.fillStyle = '#e33'; ctx.fillText('NINGUÉM ESCAPOU', 160, 168); }
    else if (cut.k == 'k') { ctx.fillStyle = 'rgba(0,0,0,' + .3 * Math.sin(PI * KU) + ')'; ctx.fillRect(0, bar, 320, 132); } else { const k = (now - cut.t) / 8000; ctx.fillStyle = 'rgba(10,15,25,.8)'; ctx.fillRect(0, bar, 320, 132); r2('#7a8a9a', -60 + k * 420, 90, 46, 20); r2('#556', -50 + k * 420, 84, 24, 8); r2('#ff8', -14 + k * 420, 96, 6, 3); r2('#222', -55 + k * 420, 108, 8, 8); r2('#222', -25 + k * 420, 108, 8, 8);
      ctx.globalAlpha = .25; ctx.fillStyle = '#aaa'; ctx.fillRect(250 - k * 60, 100, 8, 22); ctx.globalAlpha = 1; ctx.fillStyle = '#9fd'; ctx.fillText('SOBREVIVESTE À NOITE', 160, 168); } }
  // Áudio dinâmico
  const moving = K.KeyW || K.KeyA || K.KeyS || K.KeyD || TJ.x || TJ.y;
  if (m.r == 's' && mo && m.al && !cutting) { hb -= dt; if (hb <= 0) { const k = Math.max(0, 1 - Math.hypot(mo.x - m.x, mo.y - m.y) / 260); if (k > 0) { tone(55, .15, 'sine', .5 * k + .1, 35); setTimeout(() => tone(50, .18, 'sine', .4 * k + .1, 30), 150); } hb = k > 0 ? 1 - .65 * k : .5; } }
  fs -= dt; if (moving && fs <= 0 && !cutting) { noise(.05, .06, 300); fs = K.ShiftLeft ? .25 : .38; }
  const mm = Math.floor(st.t / 60), ss = String(st.t % 60).padStart(2, '0'); $('tm').textContent = (EVG ? '🔴 ' : '') + `⏱ ${mm}:${ss}  |  GERADORES ${st.gens.filter(g => g.d).length}/4`;
  $('hud').innerHTML = cutting ? '' : m.r == 'm' ? `MONSTRO: ${MN[m.c][0].toUpperCase()}<br>Q ${m.c1 ? m.c1 + 's' : 'PRONTO'} | E ${m.c2 ? m.c2 + 's' : 'PRONTO'} | Clique/ESPAÇO atacar`
    : `HP ${'♥'.repeat(Math.max(0, m.hp))}${m.al ? '' : ' ELIMINADO'}<br>ESTAMINA ${m.st}%${m.en ? ' ∞' : ''}<br>E interagir/curar/esconder | F gerador | SHIFT correr`;
}
requestAnimationFrame(frame);

// ---------- Modo telemóvel: joystick + botões de toque
function dev(d) { if (d == 'mob') { document.body.classList.add('mob'); try { document.documentElement.requestFullscreen?.()?.catch(() => {}); screen.orientation?.lock?.('landscape')?.catch(() => {}); } catch (e) {} } go('m'); }
const jsk = $('js'), kn = $('kn');
function jmove(e) { const r = jsk.getBoundingClientRect(), M = r.width / 2; let x = e.clientX - (r.left + M), y = e.clientY - (r.top + M); const L = Math.hypot(x, y); if (L > M) { x *= M / L; y *= M / L; }
  kn.style.transform = `translate(${x}px,${y}px)`; const n = Math.hypot(x, y) / M; TJ.x = n > .25 ? x / M : 0; TJ.y = n > .25 ? y / M : 0; }
jsk.onpointerdown = e => { jsk.setPointerCapture(e.pointerId); jmove(e); };
jsk.onpointermove = e => { if (jsk.hasPointerCapture(e.pointerId)) jmove(e); };
jsk.onpointerup = jsk.onpointercancel = () => { TJ.x = TJ.y = 0; kn.style.transform = ''; };
document.querySelectorAll('#tb button').forEach(b => { const k = b.dataset.k;
  b.onpointerdown = e => { e.preventDefault(); const m = me(); if (k == 'run') TJ.run = 1; else if (k == 'f') { if (mg) return closeMG(); if (!m) return; const i = st.gens.findIndex(g => !g.d && Math.hypot(g.x - m.x, g.y - m.y) < 30); if (m.r == 's' && m.al && i >= 0) openMG(i); } else S.emit(k); };
  b.onpointerup = b.onpointercancel = b.onpointerleave = () => { if (k == 'run') TJ.run = 0; }; });
$('mg').onclick = e => { if (e.target.tagName != 'I' && mg?.ph == 's') skillHit(); }; // toque no painel = ESPAÇO do skill check
