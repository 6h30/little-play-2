/* Little Play 2: Art (colour mixing, mirror painting, patterns) */
(function () {
  'use strict';
  const { rand, pick, shuffle, Snd, FX, S, Voice } = BE;

  BE.css(`
.cm-top { position: absolute; left: 0; right: 0; top: calc(var(--st) + 92px); display: flex; justify-content: center; align-items: center; gap: 14px; font-weight: 900; font-size: 22px; }
.cm-sw { width: min(74px, 16vh); height: min(74px, 16vh); border-radius: 50%; border: 6px solid #fff; box-shadow: 0 5px 0 rgba(0,0,0,.15); }
.cm-beaker { position: absolute; left: 50%; transform: translateX(-50%); width: min(46vw, 190px, 34vh); height: min(46vw, 190px, 34vh); border: 8px solid rgba(255,255,255,.95); border-top: 0; border-radius: 0 0 40px 40px; background: rgba(255,255,255,.35); overflow: hidden; box-shadow: 0 6px 0 rgba(0,0,0,.1); }
.cm-liq { position: absolute; left: 0; right: 0; bottom: 0; height: 0; background: #fff; transition: height .5s ease-out, background-color .5s; }
.cm-drop { position: absolute; width: 26px; height: 34px; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; z-index: 6; pointer-events: none; transition: top .5s ease-in, opacity .2s .45s; }
.cm-pots { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 18px); display: flex; justify-content: center; gap: 18px; }
.cm-pot { width: min(26vw, 108px, 24vh); height: min(26vw, 108px, 24vh); border-radius: 50%; border: 8px solid #fff; box-shadow: 0 7px 0 rgba(0,0,0,.18); touch-action: none; }
.cm-pot:active { transform: translateY(4px); }
.cm-note { position: absolute; left: 0; right: 0; text-align: center; font-weight: 800; font-size: 20px; padding: 0 20px; }
.mp-wrap { position: absolute; left: 10px; right: 10px; top: calc(var(--st) + 86px); bottom: calc(var(--sb) + 96px); border-radius: 22px; background: #fff; box-shadow: 0 6px 0 rgba(0,0,0,.12); overflow: hidden; }
.mp-wrap canvas { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: none; }
.mp-mid { position: absolute; left: 50%; top: 0; bottom: 0; width: 0; border-left: 3px dashed #c8b8ee; pointer-events: none; }
@media (max-width: 520px) { .mp-wrap { bottom: calc(var(--sb) + 138px); } }
.mp-bar { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 14px); display: flex; justify-content: center; align-items: center; gap: 10px; padding: 0 8px; flex-wrap: wrap; }
.mp-sw { width: 52px; height: 52px; border-radius: 50%; border: 5px solid #fff; box-shadow: 0 4px 0 rgba(0,0,0,.15); touch-action: none; }
.mp-sw.on { outline: 5px solid #7d5cd6; }
.mp-clear { width: 58px; height: 58px; border-radius: 50%; background: #fff; font-size: 28px; box-shadow: 0 4px 0 rgba(0,0,0,.15); }
.pt-row { position: absolute; left: 0; right: 0; top: calc(var(--st) + 120px); display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; padding: 0 8px; }
.pt-box { width: var(--b); height: var(--b); border-radius: 18px; background: rgba(255,255,255,.7); display: flex; align-items: center; justify-content: center; font-size: calc(var(--b) * .62); line-height: 1; }
.pt-box.q { background: #fff6b0; outline: 4px dashed #e0b400; font-weight: 900; color: #b07a00; }
.pt-bar { position: absolute; left: 0; right: 0; bottom: calc(var(--sb) + 22px); display: flex; justify-content: center; gap: 16px; padding: 0 10px; }
.pt-opt { width: min(100px, 24vh); height: min(100px, 24vh); font-size: min(56px, 13vh); }
`);

  /* ===== 1. Colour Mixer ===== */
  const PAINT = { R: ['#ef4444', 'red'], Y: ['#fcd34d', 'yellow'], B: ['#3b82f6', 'blue'] };
  const MIX = { 'R+Y': ['#fb923c', 'orange'], 'B+Y': ['#4ade80', 'green'], 'B+R': ['#a855f7', 'purple'], 'B+R+Y': ['#8b5a2b', 'brown'] };
  const mixKey = a => [...new Set(a)].sort().join('+');
  const mixOf = a => { const k = mixKey(a); return MIX[k] || (k.length === 1 ? PAINT[k] : MIX['B+R+Y']); };
  BE.GAMES.push({
    id: 'mixer', subject: 'art', icon: '🎨', color: '#ffd1e6', name: 'Colour Mixer',
    start(api) {
      const root = api.root, lv = BE.Lv('mixer', 2);
      root.innerHTML = '<div class="cm-top"><div class="cm-sw"></div><div class="cm-name"></div></div><div class="cm-beaker"><div class="cm-liq"></div></div><div class="cm-note"></div><div class="cm-pots"></div>';
      const sw = root.querySelector('.cm-sw'), nm = root.querySelector('.cm-name'), beaker = root.querySelector('.cm-beaker'), liq = root.querySelector('.cm-liq'), pots = root.querySelector('.cm-pots'), note = root.querySelector('.cm-note');
      let want, poured = [], busy = false, tries = 0, need = 2;
      Object.keys(PAINT).forEach(k => { const b = document.createElement('button'); b.className = 'cm-pot'; b.style.background = PAINT[k][0]; b.dataset.k = k; b.setAttribute('aria-label', PAINT[k][1] + ' paint'); pots.appendChild(b); b.addEventListener('pointerup', () => pour(k, b)); });
      function layout() { const H = root.clientHeight, bh = parseFloat(getComputedStyle(beaker).height); beaker.style.top = (H * 0.5 - bh * 0.5) + 'px'; note.style.top = (H * 0.5 + bh * 0.5 + 14) + 'px'; }
      function round() {
        busy = false; poured = []; tries = 0; layout(); liq.style.height = '0'; note.textContent = '';
        const keys = lv.n === 2 && Math.random() < 0.4 ? ['B+R+Y'] : ['R+Y', 'B+Y', 'B+R']; const key = pick(keys); want = MIX[key]; need = key.split('+').length;
        sw.style.background = want[0]; nm.textContent = want[1].toUpperCase();
        BE.prompt(root, need === 3 ? 'Mix all three paints to make brown!' : `Mix two paints to make ${want[1]}!`);
        pots.querySelectorAll('.cm-pot').forEach(p => p.classList.remove('fade-hint'));
      }
      function pour(k, btn) {
        if (busy || poured.length >= need) return; poured.push(k); Snd.pop(poured.length);
        const bb = beaker.getBoundingClientRect(), pb = btn.getBoundingClientRect(), rb = root.getBoundingClientRect();
        const d = document.createElement('div'); d.className = 'cm-drop'; d.style.background = PAINT[k][0]; d.style.left = (bb.left + bb.width / 2 - rb.left - 13) + 'px'; d.style.top = (pb.top - rb.top - 40) + 'px'; root.appendChild(d); void d.offsetWidth;
        d.style.top = (bb.top - rb.top + bb.height * 0.45) + 'px'; d.style.opacity = '0.9'; setTimeout(() => d.remove(), 900);
        api.timeout(() => {
          const blend = a => { const rgb = a.map(x => PAINT[x][0]).map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))); return '#' + [0, 1, 2].map(c => Math.round(rgb.reduce((s, v) => s + v[c], 0) / rgb.length).toString(16).padStart(2, '0')).join(''); };
          liq.style.background = blend(poured); liq.style.height = (poured.length / 3 * 70 + 18) + '%';
          if (poured.length === need) evaluate();
        }, 450);
      }
      function evaluate() {
        busy = true; const res = mixOf(poured);
        api.timeout(() => {
          liq.style.background = res[0]; Snd.bell();
          if (res[1] === want[1]) { note.textContent = `Yes! That makes ${res[1]}!`; Voice.say(`${poured.map(k => PAINT[k][1]).join(' and ')} make ${res[1]}!`); api.timeout(() => { BE.win(root, 'mixer'); lv.win(); api.timeout(round, 2300); }, 1600); }
          else { note.textContent = `That makes ${res[1]}. Let us try again!`; Voice.say(`That makes ${res[1]}. Try again!`); lv.miss(); tries++; api.timeout(() => { poured = []; liq.style.height = '0'; busy = false; note.textContent = ''; if (tries >= 2) { const ks = Object.keys(MIX).find(m => MIX[m][1] === want[1]).split('+'); pots.querySelectorAll('.cm-pot').forEach(p => { if (ks.includes(p.dataset.k)) p.classList.add('fade-hint'); }); } }, 2200); }
        }, 500);
      }
      api.on(window, 'resize', layout);
      round();
    }
  });

  /* ===== 2. Mirror Painter ===== */
  const MPAL = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  BE.GAMES.push({
    id: 'mirror', subject: 'art', icon: '🦋', color: '#ffd9ec', name: 'Mirror Paint',
    start(api) {
      const root = api.root;
      root.innerHTML = '<div class="mp-wrap"><canvas></canvas><div class="mp-mid"></div></div><div class="mp-bar"></div>';
      const wrap = root.querySelector('.mp-wrap'), cv = wrap.querySelector('canvas'), bar = root.querySelector('.mp-bar'), ctx = cv.getContext('2d');
      let col = MPAL[0], W = 0, H = 0, strokes = 0, last = null, id = null;
      function size() { const dpr = Math.min(2, window.devicePixelRatio || 1); W = wrap.clientWidth; H = wrap.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
      size(); api.on(window, 'resize', size);
      MPAL.forEach((c, i) => { const b = document.createElement('button'); b.className = 'mp-sw' + (i === 0 ? ' on' : ''); b.style.background = c; b.setAttribute('aria-label', 'Colour'); bar.appendChild(b); b.addEventListener('pointerup', () => { col = c; [...bar.querySelectorAll('.mp-sw')].forEach(x => x.classList.toggle('on', x === b)); Snd.click(); }); });
      const clr = document.createElement('button'); clr.className = 'mp-clear'; clr.textContent = '🧽'; clr.setAttribute('aria-label', 'Clear'); bar.appendChild(clr);
      clr.addEventListener('pointerup', () => { ctx.clearRect(0, 0, W, H); strokes = 0; Snd.whoosh(); });
      BE.prompt(root, 'Paint on one side. The mirror paints the other side!');
      const pt = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      function seg(a, b) { ctx.strokeStyle = col; ctx.lineWidth = 18; [0, 1].forEach(m => { ctx.beginPath(); ctx.moveTo(m ? W - a.x : a.x, a.y); ctx.lineTo(m ? W - b.x : b.x, b.y); ctx.stroke(); }); }
      cv.addEventListener('pointerdown', e => { if (id !== null) return; id = e.pointerId; try { cv.setPointerCapture(id); } catch (_) { } last = pt(e); seg(last, last); Snd.pop(Math.floor(last.x / 40)); e.preventDefault(); });
      cv.addEventListener('pointermove', e => { if (e.pointerId !== id) return; const p = pt(e); seg(last, p); last = p; });
      const end = e => { if (e.pointerId !== id) return; id = null; last = null; strokes++; if (strokes % 6 === 0) BE.win(root, 'mirror'); };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    }
  });

  /* ===== 3. Pattern Parade: what comes next? ===== */
  const PCOL = ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠'], PSHP = ['⭐', '❤️', '🌙', '🍎', '🐟', '🌸', '🚗', '🐥'];
  BE.GAMES.push({
    id: 'pattern', subject: 'art', icon: '🔴', color: '#ffe0f0', name: 'Pattern Parade',
    start(api) {
      const root = api.root, lv = BE.Lv('pattern', 2);
      root.innerHTML = '<div class="pt-row"></div><div class="pt-bar"></div>';
      const row = root.querySelector('.pt-row'), bar = root.querySelector('.pt-bar');
      let busy = false, tries = 0;
      const PATS = [['AB', 'AB', 'AB'], ['AAB', 'ABB', 'ABC'], ['ABC', 'AABB', 'ABAC']];
      function round() {
        busy = false; tries = 0; row.innerHTML = ''; bar.innerHTML = '';
        const pat = pick(PATS[lv.n]), pool = shuffle(Math.random() < 0.5 ? PCOL : PSHP), map = {}; [...new Set(pat)].forEach((l, i) => { map[l] = pool[i]; });
        const len = lv.n === 0 ? 6 : lv.n === 1 ? 7 : 9, seq = Array.from({ length: len }, (_, i) => map[pat[i % pat.length]]), ans = map[pat[len % pat.length]];
        const W = root.clientWidth, b = Math.max(36, Math.min(66, (W - 20) / (len + 1) - 6)); row.style.setProperty('--b', b + 'px');
        seq.forEach(e => { const d = document.createElement('div'); d.className = 'pt-box'; d.textContent = e; row.appendChild(d); });
        const q = document.createElement('div'); q.className = 'pt-box q'; q.textContent = '?'; row.appendChild(q);
        BE.prompt(root, 'What comes next in the pattern?');
        const others = shuffle(pool.filter(x => x !== ans)).slice(0, 2);
        shuffle([ans, ...others]).forEach(e => {
          const bt = document.createElement('button'); bt.className = 'big-btn pt-opt'; bt.textContent = e; bar.appendChild(bt);
          bt.addEventListener('pointerup', () => {
            if (busy) return;
            if (e === ans) { busy = true; bt.classList.add('right'); q.textContent = e; q.classList.remove('q'); Snd.ding(784); api.timeout(() => { BE.win(root, 'pattern'); lv.win(); api.timeout(round, 2100); }, 800); }
            else { bt.classList.remove('wrong'); void bt.offsetWidth; bt.classList.add('wrong'); Snd.oops(); lv.miss(); tries++; if (tries >= 2) [...bar.children].forEach(x => { if (x.textContent === ans) x.classList.add('fade-hint'); }); }
          });
        });
        root._ans = ans;
      }
      api.on(window, 'resize', () => { if (!busy) round(); });
      round();
    }
  });
})();
