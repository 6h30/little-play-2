/* Little Play 2: Engineering (stable towers, gears that mesh, ramps) */
(function () {
  'use strict';
  const { rand, pick, shuffle, Snd, FX, S, Voice } = BE;

  BE.css(`
.tw-ground { position: absolute; left: 0; right: 0; height: 14px; background: #7bb661; border-radius: 8px; box-shadow: 0 8px 0 #5d9a45; }
.tw-blk { position: absolute; border-radius: 10px; box-shadow: inset 0 -6px 0 rgba(0,0,0,.18); transition: left .5s cubic-bezier(.3,1.3,.5,1), top .5s cubic-bezier(.3,1.3,.5,1), transform .8s ease-in; touch-action: none; transform: translate(-50%, 0); }
.tw-blk.in-tray { box-shadow: inset 0 -6px 0 rgba(0,0,0,.18), 0 4px 0 rgba(0,0,0,.12); }
.tw-blk.fall { transition: transform .9s cubic-bezier(.5,0,.9,.6), top .9s ease-in; }
.gr-area { position: absolute; left: 0; right: 0; top: calc(var(--st) + 100px); height: 42%; }
.gr-g { position: absolute; transform: translate(-50%, -50%); }
.gr-g svg { display: block; overflow: visible; }
.gr-g.spin svg { animation: grspin linear infinite; }
.gr-g.back svg { animation-direction: reverse; }
@keyframes grspin { to { transform: rotate(360deg); } }
.gr-slot { position: absolute; transform: translate(-50%, -50%); border: 4px dashed #c78a3b; border-radius: 50%; background: rgba(255,255,255,.35); }
.gr-slot.hint { animation: pulse .8s ease-in-out infinite; }
.gr-bar { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 18px); display: flex; justify-content: center; align-items: flex-end; gap: 14px; padding: 0 10px; }
.gr-opt { padding: 10px; display: flex; align-items: center; justify-content: center; min-width: 96px; min-height: 96px; }
.gr-note { position: absolute; left: 0; right: 0; top: calc(var(--st) + 100px + 42% + 14px); text-align: center; font-weight: 800; font-size: 20px; padding: 0 20px; }
.rp-floor { position: absolute; left: 0; right: 0; height: 16px; background: #c9a36a; border-radius: 8px; box-shadow: 0 8px 0 #a37f48; }
.rp-ramp { position: absolute; height: 14px; background: #e0903a; border-radius: 7px; transform-origin: 0 0; box-shadow: 0 5px 0 #b8702a; transition: transform .35s ease-out, width .35s ease-out; }
.rp-post { position: absolute; width: 22px; background: repeating-linear-gradient(#b48a55 0 28px, #9a7343 28px 31px); border-radius: 4px 4px 0 0; transition: height .35s ease-out, top .35s ease-out; }
.rp-ball { position: absolute; line-height: 1; transform: translate(-50%, -100%); }
.rp-basket { position: absolute; line-height: 1; transform: translate(-50%, -100%); }
.rp-bar { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 16px); display: flex; justify-content: center; gap: 14px; }
.rp-btn { width: 84px; height: 84px; font-size: 38px; }
.rp-go { background: #b9f2c6; }
.rp-note { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 116px); text-align: center; font-weight: 800; font-size: 20px; padding: 0 20px; }
`);

  /* ===== 1. Tower Stacker: wide blocks at the bottom ===== */
  const TCOL = ['#ff8787', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];
  BE.GAMES.push({
    id: 'tower', subject: 'eng', icon: '🏗️', color: '#ffe0b8', name: 'Tower Builder',
    start(api) {
      const root = api.root, lv = BE.Lv('tower', 2);
      root.innerHTML = '<div class="tw-ground"></div>';
      const ground = root.querySelector('.tw-ground');
      let blocks = [], stack = [], busy = false, tries = 0, bh = 40;
      function round() {
        busy = false; tries = 0; blocks.forEach(b => b.el.remove()); blocks = []; stack = [];
        const W = root.clientWidth, H = root.clientHeight, n = [3, 4, 5][lv.n];
        bh = Math.max(28, Math.min(48, H * 0.055)); const gy = H * 0.66; ground.style.top = gy + 'px';
        const maxW = Math.min(W * 0.6, 240, H * 0.4), minW = maxW * 0.3, ws = Array.from({ length: n }, (_, i) => minW + (maxW - minW) * i / (n - 1));
        const order = shuffle(ws), cols = shuffle(TCOL);
        BE.prompt(root, 'Build a tall, steady tower! Tap the blocks.');
        // blocks wait under the ground line, packed into rows that fit the screen width
        const rows = [[]]; let used = 0; const GAP = 10;
        order.forEach((w, i) => { if (used + w > W - 24 && rows[rows.length - 1].length) { rows.push([]); used = 0; } rows[rows.length - 1].push({ w, i }); used += w + GAP; });
        const homes = {};
        rows.forEach((row, r) => { const tot = row.reduce((x, o) => x + o.w, 0) + GAP * (row.length - 1); let x = (W - tot) / 2; row.forEach(o => { homes[o.i] = { l: (x + o.w / 2) + 'px', t: (gy + 40 + r * (bh + 12)) + 'px' }; x += o.w + GAP; }); });
        order.forEach((w, i) => {
          const el = document.createElement('div'); el.className = 'tw-blk in-tray'; el.style.width = w + 'px'; el.style.height = bh + 'px'; el.style.background = cols[i];
          el.style.left = homes[i].l; el.style.top = homes[i].t;
          root.appendChild(el); const b = { el, w, home: homes[i], on: false }; blocks.push(b);
          el.addEventListener('pointerdown', () => place(b));
        });
        root._bl = blocks;
      }
      function place(b) {
        if (busy || b.on) return;
        const W = root.clientWidth, H = root.clientHeight, gy = H * 0.66, top = stack[stack.length - 1];
        b.on = true; stack.push(b); b.el.classList.remove('in-tray'); Snd.pop(stack.length);
        b.el.style.left = (W / 2 + rand(-3, 3)) + 'px'; b.el.style.top = (gy - stack.length * bh) + 'px';
        if (top && b.w > top.w + 0.5) {   // a wider block on a narrower one: the tower falls
          busy = true; lv.miss(); tries++;
          api.timeout(() => { Snd.oops(); stack.forEach(s => { s.el.classList.add('fall'); s.el.style.transform = `translate(${rand(-90, 90)}%, 0) rotate(${rand(-70, 70)}deg)`; s.el.style.top = (gy + rand(2, 10)) + 'px'; }); Voice.say('Oh no! A wide block on a narrow block makes it fall. Put the wide ones at the bottom.'); }, 450);
          api.timeout(() => { stack.forEach(s => { s.on = false; s.el.classList.remove('fall'); s.el.classList.add('in-tray'); s.el.style.transform = ''; s.el.style.left = s.home.l; s.el.style.top = s.home.t; }); stack = []; busy = false; }, 2900);
          return;
        }
        if (stack.length === blocks.length) { busy = true; Snd.ding(784); api.timeout(() => Voice.say('A wide base keeps the tower steady!'), 400); api.timeout(() => { BE.win(root, 'tower'); lv.win(); api.timeout(round, 2400); }, 1500); }
      }
      api.on(window, 'resize', () => { if (!busy && !stack.length) round(); });
      round();
    }
  });

  /* ===== 2. Gears: which gear fits the gap so they all turn? ===== */
  function gearSvg(r, color) {
    const teeth = Math.max(8, Math.round(r / 4.4)), ro = r, ri = r * 0.8, st = Math.PI * 2 / teeth; let d = '';
    for (let i = 0; i < teeth; i++) {
      const a = i * st, pts = [[ri, a], [ro, a + st * 0.16], [ro, a + st * 0.5 - st * 0.16], [ri, a + st * 0.5]];
      pts.forEach((p, k) => { d += (i === 0 && k === 0 ? 'M' : 'L') + (r + Math.cos(p[1]) * p[0]).toFixed(1) + ' ' + (r + Math.sin(p[1]) * p[0]).toFixed(1) + ' '; });
    }
    return `<svg width="${r * 2}" height="${r * 2}" viewBox="0 0 ${r * 2} ${r * 2}"><path d="${d}Z" fill="${color}" stroke="rgba(0,0,0,.22)" stroke-width="2" stroke-linejoin="round"/><circle cx="${r}" cy="${r}" r="${r * 0.58}" fill="rgba(255,255,255,.28)"/><circle cx="${r}" cy="${r}" r="${r * 0.2}" fill="rgba(0,0,0,.28)"/></svg>`;
  }
  const GSZ = [26, 36, 48], GCOL = ['#ffa94d', '#4dabf7', '#69db7c', '#b197fc', '#ff8787'];
  BE.GAMES.push({
    id: 'gears', subject: 'eng', icon: '⚙️', color: '#ffe8c4', name: 'Gear Fit',
    start(api) {
      const root = api.root, lv = BE.Lv('gears', 2);
      root.innerHTML = '<div class="gr-area"></div><div class="gr-note"></div><div class="gr-bar"></div>';
      const area = root.querySelector('.gr-area'), bar = root.querySelector('.gr-bar'), note = root.querySelector('.gr-note');
      let busy = false, gaps = [], fixed = [], k = 1, filled = 0, tries = 0;
      const PITCH = 0.9;   // meshing distance factor: gear teeth overlap a little
      function round() {
        busy = false; filled = 0; tries = 0; area.innerHTML = ''; bar.innerHTML = ''; note.textContent = '';
        const nGap = lv.n === 2 ? 2 : 1, W = root.clientWidth, AH = area.clientHeight;
        const rs = Array.from({ length: nGap + 2 }, (_, i) => (i === 0 || i === nGap + 1) ? pick(GSZ) * (lv.n ? 1 : 1.1) : pick(GSZ));
        const total = rs.reduce((a, r, i) => a + (i ? PITCH * r : r), 0) + rs.slice(0, -1).reduce((a, r, i) => a + (i ? 0 : 0), 0);
        // centres: x_i = x_{i-1} + PITCH * (r_{i-1} + r_i)
        const xs = [0]; for (let i = 1; i < rs.length; i++) xs.push(xs[i - 1] + PITCH * (rs[i - 1] + rs[i]));
        const span = xs[xs.length - 1] + rs[0] + rs[rs.length - 1]; k = Math.min(1.35, (W - 24) / span);
        const x0 = (W - span * k) / 2 + rs[0] * k, y = AH * 0.5, cols = shuffle(GCOL);
        gaps = []; fixed = [];
        rs.forEach((r, i) => {
          const x = x0 + xs[i] * k, edge = i === 0 || i === rs.length - 1;
          if (edge) { const g = document.createElement('div'); g.className = 'gr-g'; g.style.left = x + 'px'; g.style.top = y + 'px'; g.innerHTML = gearSvg(r * k, cols[i % cols.length]); area.appendChild(g); fixed.push({ el: g, r: r * k, i }); }
          else { const s = document.createElement('div'); s.className = 'gr-slot'; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.width = s.style.height = (r * k * 2 * 0.9) + 'px'; s.textContent = ''; area.appendChild(s); gaps.push({ slot: s, r: r * k, rr: r, x, y, i, ok: false }); }
        });
        BE.prompt(root, nGap > 1 ? 'Fill the gaps with gears that fit, so they all turn!' : 'Which gear fits the gap, so they all turn?');
        GSZ.forEach((sz, j) => {
          const b = document.createElement('button'); b.className = 'big-btn gr-opt'; b.innerHTML = gearSvg(sz * Math.min(k, 1.1) * 0.9, GCOL[j]); b.dataset.s = sz; bar.appendChild(b);
          b.addEventListener('pointerup', () => tryGear(sz, b));
        });
        root._need = () => gaps.filter(x => !x.ok).map(x => x.rr);
        gaps[0].slot.classList.add('hint'); setTimeout(() => gaps.forEach(g => g.slot.classList.remove('hint')), 2500);
      }
      function tryGear(sz, btn) {
        if (busy) return; const g = gaps.find(x => !x.ok); if (!g) return;
        const el = document.createElement('div'); el.className = 'gr-g'; el.style.left = g.x + 'px'; el.style.top = g.y + 'px'; el.style.zIndex = 3;
        const rr = sz * k; el.innerHTML = gearSvg(rr, GCOL[GSZ.indexOf(sz)]); area.appendChild(el); Snd.click();
        if (sz === g.rr) {
          g.ok = true; g.slot.style.display = 'none'; g.el = el; filled++; Snd.pop(filled);
          if (gaps.every(x => x.ok)) { busy = true; spinAll(); }
        } else {
          busy = true; lv.miss(); tries++; const big = sz > g.rr; note.textContent = big ? 'Too big! The gears crash.' : 'Too small! The gears do not touch.';
          Snd.oops(); Voice.say(big ? 'Too big!' : 'Too small!');
          api.timeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = 0; api.timeout(() => el.remove(), 450); note.textContent = ''; busy = false; if (tries >= 2) btn.parentNode.querySelectorAll('.gr-opt').forEach(o => { if (+o.dataset.s === g.rr) o.classList.add('fade-hint'); }); }, 1300);
        }
      }
      function spinAll() {
        const all = [...fixed, ...gaps.map(g => ({ el: g.el, r: g.r, i: g.i }))].sort((a, b) => a.i - b.i);
        all.forEach((g, idx) => { g.el.classList.add('spin'); if (idx % 2) g.el.classList.add('back'); g.el.querySelector('svg').style.animationDuration = (g.r * 0.075) + 's'; });
        Snd.light(true); note.textContent = 'Every gear turns! Next to each other they spin the opposite way.';
        api.timeout(() => Voice.say('Look! Gears that touch turn in opposite directions.'), 500);
        api.timeout(() => { BE.win(root, 'gears'); lv.win(); api.timeout(round, 2400); }, 3200);
      }
      api.on(window, 'resize', () => { if (!busy) round(); });
      round();
    }
  });

  /* ===== 3. Ramp Race: how high must the ramp be? ===== */
  BE.GAMES.push({
    id: 'ramp', subject: 'eng', icon: '⚽', color: '#ffe6cf', name: 'Ramp Race',
    start(api) {
      const root = api.root, lv = BE.Lv('ramp', 2);
      root.innerHTML = '<div class="rp-floor"></div><div class="rp-post"></div><div class="rp-ramp"></div><div class="rp-basket">🧺</div><div class="rp-ball">⚽</div><div class="rp-note"></div><div class="rp-bar"><button class="big-btn rp-btn rp-dn" aria-label="Lower the ramp">➖</button><button class="big-btn rp-btn rp-go" aria-label="Let go">▶️</button><button class="big-btn rp-btn rp-up" aria-label="Raise the ramp">➕</button></div>';
      const floor = root.querySelector('.rp-floor'), post = root.querySelector('.rp-post'), ramp = root.querySelector('.rp-ramp'), basket = root.querySelector('.rp-basket'), ball = root.querySelector('.rp-ball'), note = root.querySelector('.rp-note');
      let h = 1, want = 3, maxH = 4, busy = false, tries = 0, G;
      function geom() {
        const W = root.clientWidth, H = root.clientHeight, floorY = H * 0.62, bh = Math.max(26, Math.min(46, H * 0.05)), x0 = W * 0.08, run = W * 0.3, x1 = x0 + run, u = (W - 40 - x1) / (maxH + 1.2);
        return { W, H, floorY, bh, x0, run, x1, u, br: Math.max(18, Math.min(30, W * 0.06)) };
      }
      function draw() {
        G = geom(); const rise = h * G.bh, top = G.floorY - rise, len = Math.hypot(G.run, rise), ang = Math.atan2(rise, G.run) * 180 / Math.PI;
        floor.style.top = G.floorY + 'px';
        ramp.style.left = G.x0 + 'px'; ramp.style.top = top + 'px'; ramp.style.width = len + 'px'; ramp.style.transform = `rotate(${ang}deg)`;
        post.style.left = (G.x0 - 8) + 'px'; post.style.top = top + 'px'; post.style.height = rise + 'px';
        ball.style.fontSize = (G.br * 2) + 'px'; ball.style.transition = 'none'; ball.style.left = (G.x0 + 8) + 'px'; ball.style.top = (top - 6) + 'px'; ball.style.transform = 'translate(-50%,-100%)';
        basket.style.fontSize = (G.br * 2.6) + 'px'; basket.style.left = (G.x1 + want * G.u) + 'px'; basket.style.top = (G.floorY + 6) + 'px';
      }
      function round() {
        busy = false; tries = 0; maxH = [3, 4, 5][lv.n]; want = 1 + Math.floor(Math.random() * maxH); if (want === h && Math.random() < 0.7) want = ((want) % maxH) + 1;
        h = 1; note.textContent = ''; draw();
        BE.prompt(root, 'Make the ball roll into the basket! Change the ramp height, then press play.');
      }
      root._ramp = () => ({ h, want });
      function setH(v) { if (busy) return; h = Math.max(1, Math.min(maxH, v)); Snd.pop(h); draw(); }
      root.querySelector('.rp-up').addEventListener('pointerup', () => setH(h + 1));
      root.querySelector('.rp-dn').addEventListener('pointerup', () => setH(h - 1));
      root.querySelector('.rp-go').addEventListener('pointerup', () => {
        if (busy) return; busy = true; draw(); void ball.offsetWidth; Snd.whoosh();
        const rise = h * G.bh, endX = G.x1 + h * G.u, floorTop = G.floorY;
        ball.style.transition = 'left .75s cubic-bezier(.5,0,.9,.7), top .75s cubic-bezier(.5,0,.9,.7), transform .75s linear';
        ball.style.left = G.x1 + 'px'; ball.style.top = floorTop + 'px'; ball.style.transform = 'translate(-50%,-100%) rotate(360deg)';
        api.timeout(() => {
          ball.style.transition = `left ${0.6 + h * 0.45}s cubic-bezier(.15,.7,.35,1), transform ${0.6 + h * 0.45}s cubic-bezier(.15,.7,.35,1)`;
          ball.style.left = endX + 'px'; ball.style.transform = `translate(-50%,-100%) rotate(${360 + (endX - G.x1) * 3}deg)`;
        }, 760);
        api.timeout(() => {
          if (h === want) { ball.style.transition = 'top .4s ease-in'; ball.style.top = (G.floorY + 6) + 'px'; Snd.ding(784); BE.win(root, 'ramp'); lv.win(); Voice.say('Goal! A higher ramp gives the ball more speed.'); api.timeout(round, 2800); }
          else { lv.miss(); tries++; const msg = h < want ? 'Not far enough! Make the ramp higher.' : 'Too far! Make the ramp lower.'; note.textContent = msg; Voice.say(msg); Snd.oops(); api.timeout(() => { busy = false; note.textContent = ''; draw(); }, 1900); }
        }, 760 + (0.6 + h * 0.45) * 1000 + 250);
      });
      api.on(window, 'resize', () => { if (!busy) draw(); });
      round();
    }
  });
})();
