/* Little Play 2: Technology (robot path = first coding, pixel pictures, electric circuit) */
(function () {
  'use strict';
  const { rand, pick, shuffle, Snd, FX, S, Voice } = BE;

  BE.css(`
.rb-board { position: absolute; left: 50%; transform: translateX(-50%); top: calc(var(--st) + 84px); display: grid; gap: 4px; padding: 6px; background: rgba(255,255,255,.55); border-radius: 18px; }
.rb-cell { width: var(--cs); height: var(--cs); border-radius: 12px; background: #dff0ff; display: flex; align-items: center; justify-content: center; font-size: calc(var(--cs) * .6); line-height: 1; position: relative; }
.rb-cell.rock { background: #cfd8e3; }
.rb-robot { position: absolute; left: 0; top: 0; width: var(--cs); height: var(--cs); font-size: calc(var(--cs) * .66); display: flex; align-items: center; justify-content: center; line-height: 1; transition: left .45s ease-in-out, top .45s ease-in-out; z-index: 3; pointer-events: none; }
.rb-robot.bump { animation: shake .4s; }
.rb-robot.dance { animation: bounce .7s var(--pop) 2; }
.rb-prog { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 112px); display: flex; justify-content: center; gap: 5px; flex-wrap: wrap; padding: 0 10px; min-height: 48px; }
.rb-slot { width: 42px; height: 42px; border-radius: 10px; background: rgba(255,255,255,.7); border: 2px dashed #a9b8d0; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.rb-slot.on { background: #fff6b0; border-color: #e0b400; border-style: solid; }
.rb-slot.cur { outline: 4px solid #7d5cd6; }
.rb-pad { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 14px); display: flex; justify-content: center; gap: 10px; padding: 0 8px; }
.rb-btn { width: min(17vw, 76px); height: min(17vw, 76px); font-size: min(8vw, 34px); }
.rb-go { background: #b9f2c6; } .rb-del { background: #ffe2c2; }
.px-wrap { position: absolute; left: 0; right: 0; top: calc(var(--st) + 84px); bottom: calc(var(--sb) + 84px); display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; }
.px-grid { display: grid; gap: 3px; padding: 6px; background: rgba(255,255,255,.7); border-radius: 14px; }
.px-cell { width: var(--cs); height: var(--cs); border-radius: 5px; background: #eef2f7; touch-action: none; }
.land .rb-board { left: 12px; transform: none; }
.land .rb-prog { left: 46%; right: 10px; bottom: auto; top: calc(var(--st) + 92px); justify-content: flex-start; }
.land .rb-pad { left: 46%; right: 10px; justify-content: flex-start; }
.land .px-wrap { flex-direction: row; right: 96px; align-items: center; justify-content: space-evenly; bottom: calc(var(--sb) + 12px); }
.land .px-pal { left: auto; right: 14px; top: 50%; bottom: auto; transform: translateY(-50%); flex-direction: column; }
.px-lab { font-weight: 900; font-size: 18px; text-align: center; opacity: .75; }
.px-pal { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 14px); display: flex; justify-content: center; gap: 14px; }
.px-sw { width: 62px; height: 62px; border-radius: 50%; border: 5px solid #fff; box-shadow: 0 5px 0 rgba(0,0,0,.15); touch-action: none; }
.px-sw.on { outline: 5px solid #7d5cd6; }
.ci-row { position: absolute; left: 0; right: 0; top: calc(var(--st) + 130px); display: flex; align-items: center; justify-content: center; gap: 0; padding: 0 8px; }
.ci-part { font-size: min(18vw, 84px); line-height: 1; text-align: center; }
.ci-wire { height: 10px; flex: 1; max-width: 60px; background: #5c6b80; border-radius: 6px; }
.ci-wire.live { background: #ffb700; box-shadow: 0 0 12px #ffb700; }
.ci-gap { width: min(20vw, 96px); height: min(20vw, 96px); border: 5px dashed #5c6b80; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: min(14vw, 64px); line-height: 1; margin: 0 4px; background: rgba(255,255,255,.5); }
.ci-bulb { transition: filter .3s, transform .3s; filter: grayscale(1) opacity(.55); }
.ci-bulb.on { filter: drop-shadow(0 0 22px #ffe066) drop-shadow(0 0 40px #ffd43b); transform: scale(1.2); }
.ci-bar { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 22px); display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; padding: 0 10px; }
.ci-opt { width: min(26vw, 110px); height: min(26vw, 110px); font-size: min(14vw, 60px); }
.ci-note { position: absolute; left: 0; right: 0; top: calc(var(--st) + 250px); text-align: center; font-weight: 800; font-size: 20px; padding: 0 20px; }
`);

  /* ===== 1. Robot Path: put arrows in order, press go ===== */
  const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]], ARR = ['⬆️', '⬇️', '⬅️', '➡️'];
  function bfs(n, start, goal, rocks) {
    const key = (x, y) => x + ',' + y, bad = new Set(rocks.map(r => key(r.x, r.y))), prev = { [key(start.x, start.y)]: null }, q = [start];
    while (q.length) {
      const c = q.shift(); if (c.x === goal.x && c.y === goal.y) { const path = []; let k = key(c.x, c.y), cur = c; while (prev[k]) { path.unshift(prev[k].d); cur = prev[k].from; k = key(cur.x, cur.y); } return path; }
      DIRS.forEach((d, i) => { const x = c.x + d[0], y = c.y + d[1], k = key(x, y); if (x < 0 || y < 0 || x >= n || y >= n || bad.has(k) || k in prev) return; prev[k] = { from: c, d: i }; q.push({ x, y }); });
    }
    return null;
  }
  BE.GAMES.push({
    id: 'robot', subject: 'tech', icon: '🤖', color: '#cfe4ff', name: 'Robot Path',
    start(api) {
      const root = api.root, lv = BE.Lv('robot', 2);
      root.innerHTML = '<div class="rb-board"></div><div class="rb-prog"></div><div class="rb-pad"></div>';
      const board = root.querySelector('.rb-board'), progEl = root.querySelector('.rb-prog'), pad = root.querySelector('.rb-pad');
      let n = 3, cs = 80, start0, goal, rocks, prog = [], maxLen = 6, busy = false, fails = 0, robot, solution = [];
      pad.innerHTML = ARR.map((a, i) => `<button class="big-btn rb-btn" data-d="${i}">${a}</button>`).join('') + '<button class="big-btn rb-btn rb-del" aria-label="Undo">⌫</button><button class="big-btn rb-btn rb-go" aria-label="Go">▶️</button>';
      function build() {
        busy = false; prog = []; fails = 0;
        n = [3, 4, 5][lv.n]; const W = root.clientWidth, H = root.clientHeight;
        const land = W > H * 1.15; root.classList.toggle('land', land);
        cs = land ? Math.max(30, Math.min(80, (H - 100) / n - 4, (W * 0.45 - 20) / n - 4)) : Math.max(34, Math.min(92, (W - 30) / n - 4, (H - 84 - 110 - 130 - 40) / n - 4));
        maxLen = [6, 9, 12][lv.n]; let ok = false, tries = 0;
        while (!ok && tries++ < 200) {
          start0 = { x: Math.floor(Math.random() * n), y: Math.floor(Math.random() * n) }; goal = { x: Math.floor(Math.random() * n), y: Math.floor(Math.random() * n) };
          const dist = Math.abs(start0.x - goal.x) + Math.abs(start0.y - goal.y), lo = [2, 3, 4][lv.n], hi = [3, 5, 6][lv.n]; if (dist < lo || dist > hi) continue;
          rocks = []; const nr = [0, 1, 2][lv.n];
          while (rocks.length < nr) { const r = { x: Math.floor(Math.random() * n), y: Math.floor(Math.random() * n) }; if ((r.x === start0.x && r.y === start0.y) || (r.x === goal.x && r.y === goal.y) || rocks.some(q => q.x === r.x && q.y === r.y)) continue; rocks.push(r); }
          solution = bfs(n, start0, goal, rocks); ok = !!solution && solution.length <= maxLen - 1;
        }
        root._sol = solution.slice();   // lets the test script play the game
        board.style.setProperty('--cs', cs + 'px'); board.style.gridTemplateColumns = `repeat(${n}, ${cs}px)`; board.innerHTML = '';
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const c = document.createElement('div'); c.className = 'rb-cell'; const r = rocks.some(q => q.x === x && q.y === y);
          if (r) { c.classList.add('rock'); c.textContent = '🌳'; } else if (x === goal.x && y === goal.y) c.textContent = '⭐'; board.appendChild(c);
        }
        robot = document.createElement('div'); robot.className = 'rb-robot'; robot.textContent = '🤖'; board.appendChild(robot); place(start0, true);
        BE.prompt(root, 'Help the robot reach the star! Tap arrows, then press play.');
        drawProg(); hint();
      }
      function place(p, instant) { const o = 6 + p.x * (cs + 4), t = 6 + p.y * (cs + 4); if (instant) robot.style.transition = 'none'; robot.style.left = o + 'px'; robot.style.top = t + 'px'; if (instant) { void robot.offsetWidth; robot.style.transition = ''; } }
      function drawProg(cur) {
        progEl.innerHTML = '';
        for (let i = 0; i < maxLen; i++) { const s = document.createElement('div'); s.className = 'rb-slot' + (prog[i] != null ? ' on' : '') + (i === cur ? ' cur' : ''); s.textContent = prog[i] != null ? ARR[prog[i]] : ''; progEl.appendChild(s); }
      }
      function hint() { pad.querySelectorAll('[data-d]').forEach(b => b.classList.remove('fade-hint')); if (fails >= 3 && solution[prog.length] != null) pad.querySelector(`[data-d="${solution[prog.length]}"]`).classList.add('fade-hint'); }
      pad.querySelectorAll('[data-d]').forEach(b => b.addEventListener('pointerup', () => { if (busy || prog.length >= maxLen) return; prog.push(+b.dataset.d); Snd.pop(prog.length); drawProg(); hint(); }));
      pad.querySelector('.rb-del').addEventListener('pointerup', () => { if (busy) return; prog.pop(); Snd.click(); drawProg(); hint(); });
      pad.querySelector('.rb-go').addEventListener('pointerup', () => {
        if (busy || !prog.length) return; busy = true; let pos = { ...start0 }, i = 0; place(pos, true); Snd.whoosh();
        const fail = (msg) => { fails++; lv.miss(); Voice.say(msg); api.timeout(() => { place(start0); busy = false; if (fails >= 3) prog = []; drawProg(); hint(); }, 1100); };
        (function step() {
          if (pos.x === goal.x && pos.y === goal.y) { robot.classList.add('dance'); Snd.ding(880); api.timeout(() => { BE.win(root, 'robot'); lv.win(); api.timeout(build, 2200); }, 700); return; }
          if (i >= prog.length) return fail('Not there yet. Try again!');
          drawProg(i); const d = DIRS[prog[i]], x = pos.x + d[0], y = pos.y + d[1];
          if (x < 0 || y < 0 || x >= n || y >= n || rocks.some(q => q.x === x && q.y === y)) { robot.classList.remove('bump'); void robot.offsetWidth; robot.classList.add('bump'); Snd.oops(); return fail('Bump! Let us try another way.'); }
          pos = { x, y }; place(pos); Snd.pop(i); i++; api.timeout(step, 560);
        })();
      });
      api.on(window, 'resize', () => { if (!busy) build(); });
      build();
    }
  });

  /* ===== 2. Pixel Painter: copy a picture made of pixels ===== */
  const PXC = ['#ff6b6b', '#4dabf7', '#ffd43b'];
  BE.GAMES.push({
    id: 'pixel', subject: 'tech', icon: '🖼️', color: '#d3e7ff', name: 'Pixel Painter',
    start(api) {
      const root = api.root, lv = BE.Lv('pixel', 2);
      root.innerHTML = '<div class="px-wrap"><div><div class="px-lab">Copy this</div><div class="px-grid px-t"></div></div><div><div class="px-lab">Your picture</div><div class="px-grid px-m"></div></div></div><div class="px-pal"></div>';
      const tg = root.querySelector('.px-t'), mg = root.querySelector('.px-m'), pal = root.querySelector('.px-pal');
      let n = 3, target = [], mine = [], col = 0, nc = 1, busy = false;
      function round() {
        busy = false; n = [3, 4, 5][lv.n]; nc = [1, 2, 3][lv.n];
        const W = root.clientWidth, H = root.clientHeight, land = W > H * 1.15; root.classList.toggle('land', land);
        const cs = land ? Math.max(22, Math.min(64, (W - 150) / 2 / n - 6, (H - 84 - 70) / n - 3)) : Math.max(26, Math.min(64, (W - 60) / n - 3, (H - 84 - 84 - 100) / (2 * n) - 3));
        [tg, mg].forEach(g => { g.style.setProperty('--cs', cs + 'px'); g.style.gridTemplateColumns = `repeat(${n}, ${cs}px)`; g.innerHTML = ''; });
        let ones = 0;
        do { target = Array(n * n).fill(-1); ones = 0;
          for (let y = 0; y < n; y++) for (let x = 0; x < Math.ceil(n / 2); x++) { const v = Math.random() < 0.5 ? Math.floor(Math.random() * nc) : -1; target[y * n + x] = v; target[y * n + (n - 1 - x)] = v; if (v >= 0) ones += x === n - 1 - x ? 1 : 2; }
        } while (ones < n + 1 || ones > n * n - 2);
        mine = Array(n * n).fill(-1); root._t = target.slice();
        target.forEach(v => { const c = document.createElement('div'); c.className = 'px-cell'; if (v >= 0) c.style.background = PXC[v]; tg.appendChild(c); });
        target.forEach((_, i) => { const c = document.createElement('div'); c.className = 'px-cell'; mg.appendChild(c); c.addEventListener('pointerdown', () => {
          if (busy) return; mine[i] = mine[i] === col ? -1 : col; c.style.background = mine[i] >= 0 ? PXC[mine[i]] : ''; Snd.pop(i % 8);
          if (mine.every((v, k) => v === target[k])) { busy = true; Snd.ding(784); Voice.say('You copied the picture! Every little square is a pixel.'); api.timeout(() => { BE.win(root, 'pixel'); lv.win(); api.timeout(round, 2300); }, 1200); }
        }); });
        col = 0; pal.innerHTML = '';
        for (let k = 0; k < nc; k++) { const b = document.createElement('button'); b.className = 'px-sw' + (k === 0 ? ' on' : ''); b.style.background = PXC[k]; b.setAttribute('aria-label', 'Colour'); pal.appendChild(b); b.addEventListener('pointerup', () => { col = k; [...pal.children].forEach((x, j) => x.classList.toggle('on', j === k)); Snd.click(); }); }
        pal.style.display = nc > 1 ? '' : 'none';
        BE.prompt(root, nc > 1 ? 'Copy the picture. Pick a colour, then tap the squares.' : 'Copy the picture. Tap the squares to colour them.');
      }
      api.on(window, 'resize', () => { if (!busy) round(); });
      round();
    }
  });

  /* ===== 3. Light It Up: which thing lets electricity flow? ===== */
  const COND = [['🔑', 'key'], ['🥄', 'spoon'], ['🔩', 'bolt'], ['🔧', 'wrench'], ['⛓️', 'chain'], ['✂️', 'scissors']];
  const NONC = [['📄', 'paper'], ['🧦', 'sock'], ['🖍️', 'crayon'], ['🍃', 'leaf'], ['🧸', 'teddy bear'], ['🎈', 'balloon'], ['🍎', 'apple']];
  BE.GAMES.push({
    id: 'circuit', subject: 'tech', icon: '💡', color: '#e0ecff', name: 'Light It Up',
    start(api) {
      const root = api.root, lv = BE.Lv('circuit', 2);
      root.innerHTML = '<div class="ci-row"><div class="ci-part">🔋</div><div class="ci-wire w1"></div><div class="ci-gap"></div><div class="ci-wire w2"></div><div class="ci-part ci-bulb">💡</div></div><div class="ci-note"></div><div class="ci-bar"></div>';
      const gap = root.querySelector('.ci-gap'), w1 = root.querySelector('.w1'), w2 = root.querySelector('.w2'), bulb = root.querySelector('.ci-bulb'), bar = root.querySelector('.ci-bar'), note = root.querySelector('.ci-note');
      let busy = false, tries = 0;
      function round() {
        busy = false; tries = 0; bar.innerHTML = ''; gap.textContent = ''; note.textContent = ''; [w1, w2].forEach(w => w.classList.remove('live')); bulb.classList.remove('on');
        BE.prompt(root, 'Which one will make the light turn on?');
        const nGood = lv.n === 2 ? 2 : 1, nBad = [2, 2, 2][lv.n];
        const opts = shuffle([...shuffle(COND).slice(0, nGood).map(x => [...x, 1]), ...shuffle(NONC).slice(0, nBad).map(x => [...x, 0])]);
        opts.forEach(o => {
          const b = document.createElement('button'); b.className = 'big-btn ci-opt'; b.textContent = o[0]; bar.appendChild(b);
          b.addEventListener('pointerup', () => {
            if (busy) return; Voice.say(o[1]);
            gap.textContent = o[0];
            if (o[2]) {
              busy = true; b.classList.add('right'); [w1, w2].forEach(w => w.classList.add('live')); bulb.classList.add('on'); Snd.light(true); note.textContent = 'Metal lets electricity flow!';
              api.timeout(() => Voice.say('Metal lets electricity flow!'), 700);
              api.timeout(() => { BE.win(root, 'circuit'); lv.win(); api.timeout(round, 2300); }, 1800);
            } else {
              b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); Snd.oops(); lv.miss(); tries++; note.textContent = 'The light stays off. Try another one!';
              if (tries >= 2) [...bar.children].forEach((x, i) => { if (opts[i][2]) x.classList.add('fade-hint'); });
            }
          });
        });
      }
      round();
    }
  });
  BE.DATA.cond = COND;
})();
