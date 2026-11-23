/* Little Play 2: Math (counting, adding, balancing, comparing sizes) */
(function () {
  'use strict';
  const { rand, pick, shuffle, Snd, FX, S, Voice } = BE;
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const THINGS = [['🌸', 'flowers'], ['🍎', 'apples'], ['⭐', 'stars'], ['🐞', 'ladybugs'], ['🎈', 'balloons'], ['🍓', 'strawberries'], ['🦋', 'butterflies'], ['🐟', 'fish'], ['🍪', 'cookies'], ['🐥', 'chicks']];

  BE.css(`
.m-field { position: absolute; left: 0; right: 0; top: calc(var(--st) + 84px); bottom: 150px; }
.m-field .it { position: absolute; font-size: var(--f); line-height: 1; transform: translate(-50%, -50%); transition: transform .5s cubic-bezier(.3,1.2,.5,1), opacity .4s; touch-action: none; }
.m-field .it.counted { filter: drop-shadow(0 0 0 #fff) saturate(.5); opacity: .55; }
.m-field .it .n { position: absolute; left: 50%; top: -6px; transform: translateX(-50%); font-size: .42em; font-weight: 900; color: #fff; background: #7d5cd6; border-radius: 50%; min-width: 1.5em; height: 1.5em; line-height: 1.5em; text-align: center; }
.m-bar { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 14px); min-height: 120px; display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; padding: 0 12px; z-index: 5; }
.m-basket { position: relative; font-size: 84px; line-height: 1; }
.m-basket .badge { position: absolute; right: -14px; top: -14px; background: #7d5cd6; color: #fff; font-weight: 900; font-size: 30px; min-width: 52px; height: 52px; line-height: 52px; text-align: center; border-radius: 50%; box-shadow: 0 4px 0 rgba(0,0,0,.15); }
.m-ans { width: min(96px, 22vh); height: min(96px, 22vh); font-size: min(48px, 11vh); }
@media (max-height: 520px) { .bal { top: calc(var(--st) + 96px); bottom: 104px; } .m-tray { bottom: calc(var(--sb) + 6px); } .m-bar { min-height: 90px; bottom: calc(var(--sb) + 8px); } .m-field { bottom: 110px; } .m-eq { bottom: 110px; } }
.m-eq { position: absolute; left: 0; right: 0; top: calc(var(--st) + 96px); bottom: 150px; display: flex; align-items: center; justify-content: center; gap: 2vmin; flex-wrap: wrap; padding: 0 12px; }
.m-eq .grp { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; max-width: 34vw; font-size: var(--f); line-height: 1.1; padding: 10px; border-radius: 22px; background: rgba(255,255,255,.55); }
.m-eq .op { font-size: clamp(34px, 8vmin, 64px); font-weight: 900; color: #7d5cd6; }
.m-eq .grp span { transition: transform .25s; }
.m-eq .grp span.tapped { transform: scale(1.25) rotate(-8deg); }
.bal { position: absolute; left: 0; right: 0; top: calc(var(--st) + 84px); bottom: 170px; }
.bal .stand { position: absolute; left: 50%; bottom: 0; width: 18px; height: 42%; transform: translateX(-50%); background: #8a6a43; border-radius: 8px; }
.bal .base { position: absolute; left: 50%; bottom: -8px; width: min(46vw, 260px); height: 22px; transform: translateX(-50%); background: #6b4f2f; border-radius: 12px; }
.bal .beam { position: absolute; left: 50%; bottom: 42%; width: min(88vw, 640px, 125vh); height: 14px; margin-left: calc(min(88vw, 640px, 125vh) / -2); background: #b48a55; border-radius: 8px; transition: transform .7s cubic-bezier(.3,1.4,.5,1); transform-origin: 50% 50%; }
.bal .pan { position: absolute; bottom: 14px; width: 40%; min-height: 34px; padding: 6px 4px 0; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: center; gap: 3px; border-bottom: 12px solid #d4a65e; border-radius: 0 0 40px 40px; background: rgba(255,255,255,.28); transition: transform .7s cubic-bezier(.3,1.4,.5,1); touch-action: none; }
.bal .pan.l { left: 3%; } .bal .pan.r { right: 3%; }
.cube { width: var(--c); height: var(--c); border-radius: 6px; background: var(--k); box-shadow: inset 0 -4px 0 rgba(0,0,0,.18); flex: none; }
.rod { display: flex; gap: 2px; padding: 3px; border-radius: 9px; background: rgba(255,255,255,.4); align-items: center; }
.rod .num { font-weight: 900; font-size: 22px; margin-left: 6px; color: var(--ink); }
.rod.btn { cursor: pointer; }
.m-tray { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 12px); display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap; padding: 0 10px; }
.m-tray .big-btn { padding: 10px 12px; display: flex; align-items: center; }
.ss-area { position: absolute; left: 0; right: 0; top: calc(var(--st) + 84px); bottom: calc(var(--sb) + 10px); }
.ss-shelf { position: absolute; left: 6%; right: 6%; height: 14px; background: #c79a5e; border-radius: 8px; box-shadow: 0 6px 0 rgba(0,0,0,.12); }
.ss-obj { position: absolute; line-height: 1; transform: translate(-50%, -100%); transition: left .6s cubic-bezier(.3,1.2,.5,1), top .6s cubic-bezier(.3,1.2,.5,1); touch-action: none; }
.ss-obj.wrong { animation: shake .4s; }
`);

  /* ===== 1. Count & Give: put a number of things in the basket, or count them and say how many ===== */
  BE.GAMES.push({
    id: 'count', subject: 'math', icon: '🧺', color: '#e4d6ff', name: 'Count & Give',
    start(api) {
      const root = api.root, lv = BE.Lv('count', 2);
      root.innerHTML = '<div class="m-field"></div><div class="m-bar"></div>';
      const field = root.querySelector('.m-field'), bar = root.querySelector('.m-bar');
      let target = 1, placed = 0, counted = 0, busy = false, tries = 0, thing;
      function scatter(n, fs) {   // n spots on a loose grid inside the field, kept fully on screen
        const W = field.clientWidth, H = field.clientHeight, cols = Math.max(1, Math.round(Math.sqrt(n * W / H))), rows = Math.ceil(n / cols);
        const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
        const mx = fs * 0.78, my = fs * 0.62;
        return cells.map(i => ({ x: Math.max(mx, Math.min(W - mx, (i % cols + 0.5) / cols * W + rand(-0.12, 0.12) * W / cols)), y: Math.max(my, Math.min(H - my, (Math.floor(i / cols) + 0.5) / rows * H + rand(-0.12, 0.12) * H / rows)) }));
      }
      function size(n) { const W = field.clientWidth, H = field.clientHeight; return Math.max(34, Math.min(84, Math.sqrt(W * H / (n * 3.2)))); }
      function round() {
        busy = false; placed = 0; counted = 0; tries = 0; field.innerHTML = ''; bar.innerHTML = '';
        thing = pick(THINGS);
        const max = [3, 5, 10][lv.n];
        target = 1 + Math.floor(Math.random() * max);
        const ask = lv.n > 0 && Math.random() < 0.45;
        if (!ask) {
          BE.prompt(root, `Put ${NUM[target]} ${thing[1]} in the basket!`);
          const total = Math.min(12, target + 2 + Math.floor(Math.random() * 3)), f = size(total);
          field.style.setProperty('--f', f + 'px');
          bar.innerHTML = '<div class="m-basket">🧺<span class="badge">0</span></div>';
          const basket = bar.querySelector('.m-basket'), badge = bar.querySelector('.badge');
          scatter(total, f).forEach(p => {
            const it = document.createElement('div'); it.className = 'it'; it.textContent = thing[0];
            it.style.left = p.x + 'px'; it.style.top = p.y + 'px'; field.appendChild(it);
            it.addEventListener('pointerdown', () => {
              if (busy || it.dataset.gone) return;
              it.dataset.gone = 1; placed++;
              const fb = field.getBoundingClientRect(), bb = basket.getBoundingClientRect();
              it.style.transform = `translate(${bb.left + bb.width / 2 - fb.left - p.x - 0}px, ${bb.top + bb.height / 2 - fb.top - p.y}px) translate(-50%,-50%) scale(.6)`;
              Snd.pop(placed); badge.textContent = placed; Voice.say(NUM[placed] || String(placed));
              setTimeout(() => { it.style.opacity = 0; }, 450);
              if (placed === target) { busy = true; api.timeout(() => { BE.win(root, 'count'); lv.win(); api.timeout(round, 2000); }, 800); }
            });
          });
        } else {
          BE.prompt(root, `Count the ${thing[1]}. How many are there?`);
          const f = size(target); field.style.setProperty('--f', f + 'px');
          scatter(target, f).forEach(p => {
            const it = document.createElement('div'); it.className = 'it'; it.textContent = thing[0];
            it.style.left = p.x + 'px'; it.style.top = p.y + 'px'; field.appendChild(it);
            it.addEventListener('pointerdown', () => {
              if (it.dataset.c) return; it.dataset.c = 1; counted++; it.classList.add('counted');
              const n = document.createElement('span'); n.className = 'n'; n.textContent = counted; it.appendChild(n);
              Snd.pop(counted); Voice.say(NUM[counted] || String(counted));
            });
          });
          const opts = new Set([target]); const spread = lv.n === 1 ? 2 : 3;
          while (opts.size < 3) { const v = target + Math.floor(rand(-spread, spread + 1)); if (v >= 1 && v <= 10) opts.add(v); }
          shuffle([...opts]).forEach(v => {
            const b = document.createElement('button'); b.className = 'big-btn m-ans'; b.textContent = v; bar.appendChild(b);
            b.addEventListener('pointerup', () => {
              if (busy) return;
              if (v === target) { busy = true; b.classList.add('right'); Voice.say(NUM[target]); api.timeout(() => { BE.win(root, 'count'); lv.win(); api.timeout(round, 2000); }, 700); }
              else { b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); Snd.oops(); lv.miss(); tries++; if (tries >= 2) bar.querySelectorAll('.m-ans').forEach(x => { if (+x.textContent === target) x.classList.add('fade-hint'); }); }
            });
          });
        }
      }
      round();
    }
  });

  /* ===== 2. Add It Up: two groups of things, how many altogether? ===== */
  BE.GAMES.push({
    id: 'add', subject: 'math', icon: '➕', color: '#d9e2ff', name: 'Add It Up',
    start(api) {
      const root = api.root, lv = BE.Lv('add', 2);
      root.innerHTML = '<div class="m-eq"></div><div class="m-bar"></div>';
      const eq = root.querySelector('.m-eq'), bar = root.querySelector('.m-bar');
      let busy = false, tries = 0;
      function round() {
        busy = false; tries = 0; eq.innerHTML = ''; bar.innerHTML = '';
        const cap = [5, 7, 10][lv.n];
        const a = 1 + Math.floor(Math.random() * (cap - 1)), b = 1 + Math.floor(Math.random() * (cap - a)), sum = a + b;
        const th = pick(THINGS), f = Math.max(30, Math.min(64, 300 / Math.max(a, b, 3)));
        eq.style.setProperty('--f', f + 'px');
        BE.prompt(root, `${NUM[a][0].toUpperCase() + NUM[a].slice(1)} plus ${NUM[b]}. How many altogether?`);
        const mk = n => { const g = document.createElement('div'); g.className = 'grp'; for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.textContent = th[0]; g.appendChild(s); } return g; };
        const op = t => { const o = document.createElement('div'); o.className = 'op'; o.textContent = t; return o; };
        const ga = mk(a), gb = mk(b), q = op('?'); eq.append(ga, op('+'), gb, op('='), q);
        let n = 0;
        [ga, gb].forEach(g => g.addEventListener('pointerdown', e => {   // tap a thing to hear it counted
          const s = e.target.closest('span'); if (!s || s.classList.contains('tapped')) return;
          s.classList.add('tapped'); n++; Snd.pop(n); Voice.say(NUM[n] || String(n));
        }));
        const opts = new Set([sum]);
        while (opts.size < (lv.n === 0 ? 3 : 4)) { const v = sum + Math.floor(rand(-2, 3)); if (v >= 1 && v <= 10) opts.add(v); }
        shuffle([...opts]).forEach(v => {
          const bt = document.createElement('button'); bt.className = 'big-btn m-ans'; bt.textContent = v; bar.appendChild(bt);
          bt.addEventListener('pointerup', () => {
            if (busy) return;
            if (v === sum) {
              busy = true; bt.classList.add('right'); q.textContent = sum; q.style.color = '#2f9e44';
              Voice.say(`${NUM[a]} plus ${NUM[b]} makes ${NUM[sum]}!`);
              api.timeout(() => { BE.win(root, 'add'); lv.win(); api.timeout(round, 2200); }, 1700);
            } else {
              bt.classList.remove('wrong'); void bt.offsetWidth; bt.classList.add('wrong'); Snd.oops(); lv.miss(); tries++;
              if (tries >= 2) bar.querySelectorAll('.m-ans').forEach(x => { if (+x.textContent === sum) x.classList.add('fade-hint'); });
            }
          });
        });
      }
      round();
    }
  });

  /* ===== 3. Balance the Scale: make both sides weigh the same ===== */
  BE.GAMES.push({
    id: 'balance', subject: 'math', icon: '⚖️', color: '#ffe3d0', name: 'Balance It',
    start(api) {
      const root = api.root, lv = BE.Lv('balance', 2);
      root.innerHTML = `<div class="bal"><div class="stand"></div><div class="base"></div><div class="beam"><div class="pan l"></div><div class="pan r"></div></div></div><div class="m-tray"></div>`;
      const beam = root.querySelector('.beam'), pl = root.querySelector('.pan.l'), pr = root.querySelector('.pan.r'), tray = root.querySelector('.m-tray');
      const COL = ['#ff8787', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];
      let left = 0, right = [], busy = false;
      const cube = (c, col) => { const d = document.createElement('div'); d.className = 'cube'; d.style.setProperty('--k', col); d.style.setProperty('--c', c + 'px'); return d; };
      function tilt() {
        const R = right.reduce((a, b) => a + b, 0), d = Math.max(-14, Math.min(14, (left - R) * 4));
        beam.style.transform = `rotate(${-d}deg)`;
        pl.style.transform = `rotate(${d}deg)`; pr.style.transform = `rotate(${d}deg)`;   // pans stay level as the beam turns
        return R;
      }
      function drawRight() {
        pr.innerHTML = '';
        right.forEach((v, i) => {
          const rod = document.createElement('div'); rod.className = 'rod btn';
          for (let k = 0; k < v; k++) rod.appendChild(cube(24, COL[v % COL.length]));
          rod.addEventListener('pointerdown', () => { if (busy) return; right.splice(i, 1); Snd.click(); drawRight(); });
          pr.appendChild(rod);
        });
        const R = tilt();
        if (R === left && !busy) {
          busy = true; Snd.ding(660); Voice.say(`${NUM[left]} equals ${NUM[left]}. Balanced!`);
          api.timeout(() => { BE.win(root, 'balance'); lv.win(); api.timeout(round, 2100); }, 1300);
        } else if (R > left && right.length) { Snd.oops(); lv.miss(); }
      }
      function round() {
        busy = false; right = []; pl.innerHTML = ''; tray.innerHTML = '';
        const lo = [2, 3, 5][lv.n], hi = [5, 8, 10][lv.n];
        left = lo + Math.floor(Math.random() * (hi - lo + 1));
        const col = pick(COL);
        for (let i = 0; i < left; i++) pl.appendChild(cube(24, col));
        BE.prompt(root, 'Make both sides the same. Tap the blocks!');
        const sizes = [[1, 2], [1, 2, 3], [1, 2, 3, 5]][lv.n];
        sizes.forEach(v => {
          const b = document.createElement('button'); b.className = 'big-btn';
          const rod = document.createElement('div'); rod.className = 'rod';
          for (let k = 0; k < v; k++) rod.appendChild(cube(24, COL[v % COL.length]));
          const num = document.createElement('span'); num.className = 'num'; num.textContent = v; rod.appendChild(num); b.appendChild(rod);
          b.addEventListener('pointerup', () => { if (busy) return; if (right.length >= 8) return; right.push(v); Snd.pop(v); drawRight(); });
          tray.appendChild(b);
        });
        tilt();
      }
      round();
    }
  });

  /* ===== 4. Size Sort: tap the things in order from smallest to biggest (or the other way) ===== */
  BE.GAMES.push({
    id: 'sizes', subject: 'math', icon: '📏', color: '#d6f5e8', name: 'Small to Big',
    start(api) {
      const root = api.root, lv = BE.Lv('sizes', 2);
      root.innerHTML = '<div class="ss-area"><div class="ss-shelf"></div></div>';
      const area = root.querySelector('.ss-area'), shelf = area.querySelector('.ss-shelf');
      let objs = [], next = 0, busy = false, up = true, tries = 0;
      function round() {
        busy = false; next = 0; tries = 0; objs.forEach(o => o.el.remove()); objs = [];
        const n = [3, 4, 5][lv.n], th = pick(['🐻', '🌳', '🏠', '🍎', '🦆', '🐘', '🎈', '🚗']);
        up = Math.random() < 0.65 || lv.n === 0;
        BE.prompt(root, up ? 'Tap them from the smallest to the biggest!' : 'Now from the biggest to the smallest!');
        const W = area.clientWidth, H = area.clientHeight;
        shelf.style.top = (H * 0.40) + 'px';
        // sizes grow in equal steps; scale them so that all of them standing side by side fill about 86% of the width
        const steps = Array.from({ length: n }, (_, i) => 1 + i * 0.62), tot = steps.reduce((x, y) => x + y, 0);
        const unit = Math.min(W * 0.86 / tot, Math.min(170, H * 0.3) / steps[n - 1]);
        const sizes = steps.map(k => k * unit);
        const order = up ? sizes : sizes.slice().reverse();   // order[i] is the size that must be tapped i-th
        let cx = W * 0.07 + (W * 0.86 - order.reduce((x, y) => x + y, 0)) / 2; const slotX = order.map(s => { const c = cx + s / 2; cx += s; return c; });
        const pos = shuffle(order.map((_, i) => i));
        order.forEach((s, i) => {
          const el = document.createElement('div'); el.className = 'ss-obj'; el.textContent = th; el.style.fontSize = s + 'px';
          const o = { el, idx: i, slotX: slotX[i], size: s };
          el.style.left = (W * (0.12 + 0.76 * (pos[i] + 0.5) / n)) + 'px'; el.style.top = (H * (pos[i] % 2 ? 0.97 : 0.8)) + 'px';
          area.appendChild(el); objs.push(o);
          el.addEventListener('pointerdown', () => {
            if (busy || o.done) return;
            if (o.idx === next) {
              o.done = true; next++; el.style.left = o.slotX + 'px'; el.style.top = (H * 0.42) + 'px'; Snd.pop(next);
              if (next === n) { busy = true; Snd.ding(784); Voice.say(up ? 'Smallest to biggest!' : 'Biggest to smallest!'); api.timeout(() => { BE.win(root, 'sizes'); lv.win(); api.timeout(round, 2000); }, 1000); }
            } else {
              el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); Snd.oops(); lv.miss(); tries++;
              if (tries >= 2) { const t = objs.find(x => x.idx === next); if (t) t.el.classList.add('fade-hint'); }
              if (tries === 1) Voice.say(up ? 'Look for the smallest one.' : 'Look for the biggest one.');
            }
          });
        });
      }
      round();
    }
  });
})();
