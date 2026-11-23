/* Little Play 2: Science (sink or float, magnets, life cycles, habitats) */
(function () {
  'use strict';
  const { rand, pick, shuffle, Snd, FX, S, Voice } = BE;

  BE.css(`
.fl-item { position: absolute; left: 50%; line-height: 1; transform: translate(-50%, -50%); z-index: 4; transition: top 1.1s cubic-bezier(.3,1.3,.5,1); }
.fl-item.bob { animation: flbob 1.6s ease-in-out infinite; }
@keyframes flbob { 0%, 100% { transform: translate(-50%, -50%) rotate(-4deg); } 50% { transform: translate(-50%, -42%) rotate(4deg); } }
.fl-item.sinking { transition: top 1.6s cubic-bezier(.4,0,.8,.6); }
.fl-water { position: absolute; left: 0; right: 0; bottom: 0; background: linear-gradient(#8fd3ff, #3f97e6 60%, #2b6fc1); z-index: 3; opacity: .92; }
.fl-water::before { content: ""; position: absolute; left: 0; right: 0; top: -12px; height: 24px; background: radial-gradient(circle at 12px 24px, #8fd3ff 12px, transparent 13px) 0 0 / 24px 24px repeat-x; }
.fl-btns { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 16px); display: flex; justify-content: center; gap: 18px; z-index: 6; }
.fl-b { width: min(40vw, 170px); height: 100px; font-size: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
.fl-b small { font-size: 18px; font-weight: 900; }
.fl-bub { position: absolute; font-size: 28px; z-index: 5; animation: flbub 1.8s ease-out forwards; pointer-events: none; }
@keyframes flbub { from { transform: translateY(0) scale(.6); opacity: 1; } to { transform: translateY(-140px) scale(1.1); opacity: 0; } }
.mg-field { position: absolute; inset: 0; }
.mg-it { position: absolute; line-height: 1; transform: translate(-50%, -50%); transition: left .35s ease-out, top .35s ease-out; z-index: 2; }
.mg-it.wob { animation: wobble .5s ease-in-out 2; }
.mg-it.stuck { z-index: 7; transition: left .08s linear, top .08s linear; }
.mg-mag { position: absolute; line-height: 1; transform: translate(-50%, -50%); z-index: 9; filter: drop-shadow(0 8px 0 rgba(0,0,0,.14)); touch-action: none; }
.mg-hint { position: absolute; left: 0; right: 0; top: calc(var(--st) + 92px); text-align: center; font-weight: 800; opacity: .6; z-index: 1; }
.lc-row { position: absolute; left: 0; right: 0; top: calc(var(--st) + 92px); bottom: 190px; display: flex; align-items: center; justify-content: center; gap: 1vmin; flex-wrap: wrap; padding: 0 8px; }
.lc-step { font-size: var(--f); line-height: 1; background: rgba(255,255,255,.6); border-radius: 24px; padding: .18em; display: flex; align-items: center; justify-content: center; min-width: 1.5em; min-height: 1.5em; }
.lc-step.q { background: #fff6b0; outline: 4px dashed #e0b400; font-weight: 900; color: #b07a00; }
.lc-arrow { font-size: calc(var(--f) * .5); color: #7d5cd6; font-weight: 900; }
.lc-bar { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 18px); display: flex; justify-content: center; gap: 14px; padding: 0 10px; flex-wrap: wrap; z-index: 5; }
.lc-opt { width: 100px; height: 100px; font-size: 56px; }
.hb-pet { position: absolute; left: 0; right: 0; text-align: center; top: calc(var(--st) + 110px); line-height: 1; z-index: 3; animation: float 3s ease-in-out infinite; }
.hb-bar { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 16px); display: flex; justify-content: center; gap: 12px; padding: 0 10px; flex-wrap: wrap; z-index: 5; }
.hb-opt { width: min(28vw, 130px); height: min(28vw, 130px); display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 52px; }
.hb-opt small { font-size: 16px; font-weight: 900; }
`);

  /* ===== 1. Sink or Float: guess first, then watch ===== */
  const FLOAT = [
    ['🦆', 'duck', 1], ['🔑', 'key', 0], ['🍃', 'leaf', 1], ['🔨', 'hammer', 0], ['⚽', 'ball', 1], ['⚓', 'anchor', 0],
    ['🍎', 'apple', 1], ['🎈', 'balloon', 1], ['🥄', 'spoon', 0], ['⛵', 'boat', 1], ['🔩', 'bolt', 0], ['🥥', 'coconut', 1],
    ['🧱', 'brick', 0], ['🍊', 'orange', 1], ['🧊', 'ice cube', 1], ['✂️', 'scissors', 0]
  ];
  BE.DATA.float = FLOAT;
  BE.GAMES.push({
    id: 'float', subject: 'science', icon: '🦆', color: '#c9f0d2', name: 'Sink or Float',
    start(api) {
      const root = api.root, lv = BE.Lv('float', 2);
      root.innerHTML = '<div class="fl-item"></div><div class="fl-water"></div><div class="fl-btns"><button class="big-btn fl-b" data-v="0">⬇️<small>Sink</small></button><button class="big-btn fl-b" data-v="1">⬆️<small>Float</small></button></div>';
      const item = root.querySelector('.fl-item'), water = root.querySelector('.fl-water');
      let cur = null, busy = false, last = -1;
      function layout() { const H = root.clientHeight; water.style.top = (H * 0.5) + 'px'; }
      function round() {
        busy = false; layout(); const H = root.clientHeight, W = root.clientWidth;
        const pool = FLOAT.slice(0, [8, 12, 16][lv.n]);
        let i; do { i = Math.floor(Math.random() * pool.length); } while (i === last && pool.length > 1); last = i; cur = pool[i];
        const fs = Math.min(W * 0.3, 120); item.style.fontSize = fs + 'px'; item.className = 'fl-item'; item.textContent = cur[0];
        item.style.transition = 'none'; item.style.top = (H * 0.28) + 'px'; void item.offsetWidth; item.style.transition = '';
        BE.prompt(root, `Will the ${cur[1]} sink or float?`);
        root.querySelectorAll('.fl-b').forEach(b => { b.classList.remove('right', 'wrong'); });
      }
      function bubbles() { const W = root.clientWidth, H = root.clientHeight; for (let k = 0; k < 5; k++) { const b = document.createElement('div'); b.className = 'fl-bub'; b.textContent = '💧'; b.style.left = (W / 2 + rand(-60, 60)) + 'px'; b.style.top = (H * 0.5 + rand(10, 70)) + 'px'; b.style.animationDelay = (k * 0.12) + 's'; root.appendChild(b); setTimeout(() => b.remove(), 2200); } }
      root.querySelectorAll('.fl-b').forEach(b => b.addEventListener('pointerup', () => {
        if (busy) return; busy = true;
        const guess = +b.dataset.v, floats = cur[2], ok = guess === floats, H = root.clientHeight, fs = parseFloat(item.style.fontSize);
        b.classList.add(ok ? 'right' : 'wrong'); Snd.whoosh();
        api.timeout(() => {
          Snd.bell(); bubbles();
          if (floats) { item.style.top = (H * 0.5 - fs * 0.32) + 'px'; api.timeout(() => item.classList.add('bob'), 1100); }
          else { item.classList.add('sinking'); item.style.top = (H * 0.78 - fs * 0.2) + 'px'; }
        }, 350);
        api.timeout(() => {
          const msg = floats ? `The ${cur[1]} floats!` : `The ${cur[1]} sinks!`;
          BE.prompt(root, ok ? `You got it! ${msg}` : `Surprise! ${msg}`);
          if (ok) { lv.win(); api.timeout(() => BE.win(root, 'float'), 900); } else lv.miss(); S.done.float = S.done.float || 0;
          if (!ok) { S.done.float++; BE.save(); }
        }, 1500);
        api.timeout(round, 4800);
      }));
      api.on(window, 'resize', layout);
      round();
    }
  });

  /* ===== 2. Magnet Lab: drag the magnet, find what sticks ===== */
  const MAG = ['📎', '🔩', '🔑', '🔧', '✂️'], NOMAG = ['🍎', '🧸', '🥕', '🎈', '🍃', '⚽', '🖍️', '🧦'];
  BE.GAMES.push({
    id: 'magnet', subject: 'science', icon: '🧲', color: '#d4f5da', name: 'Magnet Lab',
    start(api) {
      const root = api.root, lv = BE.Lv('magnet', 2);
      root.innerHTML = '<div class="mg-field"></div>';
      const field = root.querySelector('.mg-field');
      let items = [], stuck = [], mag, mx = 0, my = 0, R = 60, need = 0, busy = false;
      function round() {
        busy = false; field.innerHTML = ''; items = []; stuck = [];
        const W = root.clientWidth, H = root.clientHeight; R = Math.min(W, H) * 0.12;
        const nMag = [2, 3, 4][lv.n], nNo = [2, 3, 4][lv.n]; need = nMag;
        const list = shuffle([...shuffle(MAG).slice(0, nMag).map(e => [e, 1]), ...shuffle(NOMAG).slice(0, nNo).map(e => [e, 0])]);
        BE.prompt(root, 'Drag the magnet. Which things stick to it?');
        const n = list.length, cols = Math.min(n, W < 500 ? 3 : 4), rows = Math.ceil(n / cols), top = H * 0.36, area = H * 0.58;
        list.forEach(([e, m], i) => {
          const el = document.createElement('div'); el.className = 'mg-it'; el.textContent = e; el.style.fontSize = (R * 1.05) + 'px';
          const c = i % cols, r = Math.floor(i / cols);
          const x = W * (c + 0.5) / cols + rand(-8, 8), y = top + area * (r + 0.5) / rows + rand(-6, 6);
          el.style.left = x + 'px'; el.style.top = y + 'px'; field.appendChild(el);
          items.push({ el, m, x, y, near: false, done: false });
        });
        mag = document.createElement('div'); mag.className = 'mg-mag'; mag.textContent = '🧲'; mag.style.fontSize = (R * 1.5) + 'px';
        mx = W / 2; my = H * 0.24 + 40; mag.style.left = mx + 'px'; mag.style.top = my + 'px'; field.appendChild(mag);
        let sx = 0, sy = 0;
        BE.draggable(mag, {
          slop: 2,
          onStart() { sx = mx; sy = my; },
          onMove(dx, dy) { if (busy) return; mx = Math.max(R, Math.min(W - R, sx + dx)); my = Math.max(R + 70, Math.min(H - R, sy + dy)); place(); check(); }
        });
      }
      function place() {
        mag.style.left = mx + 'px'; mag.style.top = my + 'px';
        stuck.forEach(s => { s.el.style.left = (mx + s.dx) + 'px'; s.el.style.top = (my + s.dy) + 'px'; });
      }
      function check() {
        items.forEach(it => {
          if (it.done) return;
          const d = Math.hypot(it.x - mx, it.y - my), close = d < R * 1.35;
          if (close && it.m) {
            it.done = true; it.el.classList.add('stuck'); const k = stuck.length, a = k * 2.4 + 0.6;
            const dx = Math.cos(a) * R * 0.95 + (k % 2 ? 8 : -8), dy = Math.sin(a) * R * 0.95 + 14; stuck.push({ el: it.el, dx, dy }); Snd.pop(stuck.length);
            if (stuck.length === need) { busy = true; Snd.ding(784); Voice.say('Magnets stick to iron and steel!'); api.timeout(() => { BE.win(root, 'magnet'); lv.win(); api.timeout(round, 2300); }, 900); }
          } else if (close && !it.m && !it.near) { it.near = true; it.el.classList.remove('wob'); void it.el.offsetWidth; it.el.classList.add('wob'); Snd.oops(); }
          else if (!close) it.near = false;
        });
      }
      round();
    }
  });

  /* ===== 3. Life Cycles: what comes next? ===== */
  const CYCLES = [
    { n: 'plant', t: [['🌰', 'seed'], ['🌱', 'sprout'], ['🌿', 'plant'], ['🌻', 'flower']] },
    { n: 'chick', t: [['🥚', 'egg'], ['🐣', 'hatching chick'], ['🐥', 'chick'], ['🐔', 'hen']] },
    { n: 'butterfly', t: [['🥚', 'egg'], ['🐛', 'caterpillar'], ['🦋', 'butterfly']] },
    { n: 'day', t: [['🌅', 'morning'], ['☀️', 'noon'], ['🌇', 'evening'], ['🌙', 'night']] },
    { n: 'seasons', t: [['🌸', 'spring'], ['🏖️', 'summer'], ['🍂', 'autumn'], ['❄️', 'winter']] }
  ];
  BE.DATA.cycles = CYCLES;
  BE.GAMES.push({
    id: 'cycle', subject: 'science', icon: '🦋', color: '#e0f5c8', name: 'What Comes Next?',
    start(api) {
      const root = api.root, lv = BE.Lv('cycle', 2);
      root.innerHTML = '<div class="lc-row"></div><div class="lc-bar"></div>';
      const row = root.querySelector('.lc-row'), bar = root.querySelector('.lc-bar');
      let busy = false, tries = 0, last = -1;
      function round() {
        busy = false; tries = 0; row.innerHTML = ''; bar.innerHTML = '';
        let ci; do { ci = Math.floor(Math.random() * CYCLES.length); } while (ci === last); last = ci;
        const cy = CYCLES[ci], t = cy.t, hide = lv.n === 0 ? t.length - 1 : 1 + Math.floor(Math.random() * (t.length - 1));
        const W = root.clientWidth, f = Math.max(40, Math.min(84, (W - 30) / (t.length * 1.9)));
        row.style.setProperty('--f', f + 'px');
        BE.prompt(root, hide === t.length - 1 ? 'What comes next?' : 'What is missing?');
        t.forEach((s, i) => {
          if (i) { const a = document.createElement('div'); a.className = 'lc-arrow'; a.textContent = '➜'; row.appendChild(a); }
          const d = document.createElement('div'); d.className = 'lc-step' + (i === hide ? ' q' : ''); d.textContent = i === hide ? '?' : s[0]; row.appendChild(d);
          if (i !== hide) d.addEventListener('pointerdown', () => Voice.say(s[1]));
        });
        const others = shuffle(CYCLES.filter((_, k) => k !== ci).flatMap(c => c.t)).filter(s => !t.some(x => x[0] === s[0])).slice(0, 2);
        shuffle([t[hide], ...others]).forEach(s => {
          const b = document.createElement('button'); b.className = 'big-btn lc-opt'; b.textContent = s[0]; bar.appendChild(b);
          b.addEventListener('pointerup', () => {
            if (busy) return;
            if (s[0] === t[hide][0]) {
              busy = true; b.classList.add('right'); row.children[hide * 2].textContent = s[0]; row.children[hide * 2].classList.remove('q'); Voice.say(s[1]);
              api.timeout(() => { BE.win(root, 'cycle'); lv.win(); api.timeout(round, 2100); }, 900);
            } else { b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); Snd.oops(); lv.miss(); tries++; if (tries >= 2) [...bar.children].forEach(x => { if (x.textContent === t[hide][0]) x.classList.add('fade-hint'); }); }
          });
        });
      }
      round();
    }
  });

  /* ===== 4. Home sweet home: where does this animal live? ===== */
  const HAB = { farm: ['🏡', 'the farm'], ocean: ['🌊', 'the ocean'], forest: ['🌳', 'the forest'], desert: ['🏜️', 'the desert'], polar: ['❄️', 'the snow and ice'] };
  const PETS = [['🐄', 'cow', 'farm'], ['🐔', 'hen', 'farm'], ['🐖', 'pig', 'farm'], ['🐠', 'fish', 'ocean'], ['🐙', 'octopus', 'ocean'], ['🐳', 'whale', 'ocean'],
    ['🦌', 'deer', 'forest'], ['🦉', 'owl', 'forest'], ['🐿️', 'squirrel', 'forest'], ['🐪', 'camel', 'desert'], ['🦂', 'scorpion', 'desert'], ['🐧', 'penguin', 'polar'], ['🦈', 'shark', 'ocean']];
  BE.DATA.pets = PETS;
  BE.GAMES.push({
    id: 'habitat', subject: 'science', icon: '🐧', color: '#cdeef5', name: 'Where Do I Live?',
    start(api) {
      const root = api.root, lv = BE.Lv('habitat', 2);
      root.innerHTML = '<div class="hb-pet"></div><div class="hb-bar"></div>';
      const pet = root.querySelector('.hb-pet'), bar = root.querySelector('.hb-bar');
      let busy = false, tries = 0, last = -1;
      function round() {
        busy = false; tries = 0; bar.innerHTML = '';
        let i; do { i = Math.floor(Math.random() * PETS.length); } while (i === last); last = i; const p = PETS[i];
        pet.textContent = p[0]; pet.style.fontSize = Math.min(root.clientWidth * 0.4, root.clientHeight * 0.26) + 'px';
        BE.prompt(root, `Where does the ${p[1]} live?`);
        const n = [2, 3, 4][lv.n], keys = shuffle(Object.keys(HAB).filter(k => k !== p[2])).slice(0, n - 1);
        shuffle([p[2], ...keys]).forEach(k => {
          const b = document.createElement('button'); b.className = 'big-btn hb-opt'; b.innerHTML = `${HAB[k][0]}<small>${HAB[k][1].replace('the ', '')}</small>`; b.dataset.k = k; bar.appendChild(b);
          b.addEventListener('pointerup', () => {
            if (busy) return;
            if (k === p[2]) { busy = true; b.classList.add('right'); Voice.say(`The ${p[1]} lives in ${HAB[k][1]}.`); api.timeout(() => { BE.win(root, 'habitat'); lv.win(); api.timeout(round, 2200); }, 1400); }
            else { b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); Snd.oops(); lv.miss(); tries++; if (tries >= 2) bar.querySelectorAll('.hb-opt').forEach(x => { if (x.dataset.k === p[2]) x.classList.add('fade-hint'); }); }
          });
        });
      }
      round();
    }
  });
})();
