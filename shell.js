/* Little Play 2: app shell: home (subjects, games), entering and leaving a game, parent area, play timer */
(function () {
  'use strict';
  const { $, S, Snd, Voice } = BE;
  const menu = $('#menu'), stage = $('#stage'), gameEl = $('#game'), grid = $('#grid'), wrap = $('#gridwrap');
  const panel = $('#panel'), bye = $('#bye'), menuBack = $('#menuBack'), menuTitle = $('#menuTitle');
  let cur = null, curApi = null, playSec = 0, view = null;     // view: null = the five subjects, otherwise a subject id

  /* Unlock sound on the first gesture (iOS needs touchend/click) */
  ['touchend', 'click', 'pointerup', 'keydown'].forEach(ev => document.addEventListener(ev, () => Snd.unlock(), { capture: true, passive: true }));
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());
  document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  /* ---------- Toolkit handed to each game (cleans itself up when the game ends) ---------- */
  function makeApi(root) {
    const cl = [];
    return {
      root, S,
      say: t => Voice.say(t),
      on(t, ev, fn, opt) { t.addEventListener(ev, fn, opt); cl.push(() => t.removeEventListener(ev, fn, opt)); },
      timeout(fn, ms) { const h = setTimeout(fn, ms); cl.push(() => clearTimeout(h)); return h; },
      interval(fn, ms) { const h = setInterval(fn, ms); cl.push(() => clearInterval(h)); return h; },
      loop(fn) {
        let last = performance.now(), h;
        const f = t => { const dt = Math.min(0.05, (t - last) / 1000); last = t; fn(dt, t); h = requestAnimationFrame(f); };
        h = requestAnimationFrame(f); cl.push(() => cancelAnimationFrame(h));
      },
      cleanup() { cl.forEach(f => f()); cl.length = 0; }
    };
  }

  // A tap counts when the finger is lifted on the button, even if it wiggled a little.
  function onTap(el, fn) {
    let down = false;
    el.addEventListener('pointerdown', () => { down = true; });
    el.addEventListener('pointerup', e => { if (down) { down = false; fn(e); } });
    ['pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, () => { down = false; }));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
  }

  /* ---------- Home ---------- */
  const starsOf = id => { const n = BE.stars(id); return '★'.repeat(n) + '☆'.repeat(3 - n); };
  function renderMenu() {
    grid.innerHTML = '';
    if (!view) {
      menuTitle.textContent = 'Little Play 2'; menuBack.classList.add('hidden');
      BE.SUBJECTS.forEach(s => {
        const games = BE.GAMES.filter(g => g.subject === s.id);
        const got = games.reduce((a, g) => a + BE.stars(g.id), 0);
        const b = document.createElement('button');
        b.className = 'card subj'; b.style.setProperty('--c', s.color);
        b.innerHTML = `<span class="ic">${s.icon}</span><span class="lb">${s.name}</span><span class="stars">${got} / ${games.length * 3} ★</span>`;
        onTap(b, () => { Snd.click(); Voice.say(s.name); view = s.id; renderMenu(); });
        grid.appendChild(b);
      });
    } else {
      const s = BE.SUBJECTS.find(x => x.id === view);
      menuTitle.textContent = s.icon + ' ' + s.name; menuBack.classList.remove('hidden');
      BE.GAMES.filter(g => g.subject === view).forEach(g => {
        const b = document.createElement('button');
        b.className = 'card'; b.style.setProperty('--c', g.color);
        b.innerHTML = `<span class="ic">${g.icon}</span><span class="lb">${g.name}</span><span class="stars">${starsOf(g.id)}</span>`;
        onTap(b, () => startGame(g));
        grid.appendChild(b);
      });
    }
    layoutMenu();
  }
  onTap(menuBack, () => { Snd.whoosh(); view = null; renderMenu(); });
  function layoutMenu() {
    const n = grid.children.length; if (!n) return;
    const f = BE.fit(n, wrap.clientWidth, wrap.clientHeight, 0.12, 230);
    grid.style.setProperty('--s', f.s + 'px');
    grid.style.width = (f.cols * f.s + (f.cols - 1) * f.gap + 1) + 'px';
    grid.style.gap = f.gap + 'px';
  }
  addEventListener('resize', layoutMenu);

  /* ---------- Entering and leaving a game ---------- */
  function startGame(g) {
    Snd.unlock(); Snd.click();
    exitGame(true);
    cur = g;
    menu.classList.add('hidden'); stage.classList.remove('hidden');
    gameEl.className = 'g-' + g.id;
    gameEl.style.background = g.bg || (BE.SUBJECTS.find(s => s.id === g.subject) || {}).bg;
    gameEl.innerHTML = '';
    curApi = makeApi(gameEl);
    try { g.start(curApi); } catch (e) { console.error(e); }
  }
  function exitGame(silent) {
    if (curApi) { curApi.cleanup(); curApi = null; }
    cur = null; gameEl.innerHTML = '';
    Voice.stop();
    if (!silent) { stage.classList.add('hidden'); menu.classList.remove('hidden'); renderMenu(); }
  }
  onTap($('#home'), () => { Snd.whoosh(); exitGame(false); });

  /* ---------- Hold to open the parent area (a small child can't do it) ---------- */
  function gate(btn, ms, cb) {
    let t = null;
    btn.style.setProperty('--ms', ms + 'ms');
    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.classList.add('holding'); t = setTimeout(() => { btn.classList.remove('holding'); t = null; cb(); }, ms); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => btn.addEventListener(ev, () => { clearTimeout(t); t = null; btn.classList.remove('holding'); }));
  }
  /* ---------- Grown-ups check: after the 2-second hold, type a number that is written in words ---------- */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const words = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  let adultOk = null, adultTarget = 0, adultTyped = '';
  function adultFresh() {
    adultTarget = 21 + Math.floor(Math.random() * 78); adultTyped = '';
    $('#adultWord').textContent = words(adultTarget); showTyped();
  }
  function showTyped() { $('#adultDisp').textContent = (adultTyped + '– –'.replace(/ /g, '').slice(0, 2 - adultTyped.length)).split('').join(' '); }
  function askAdult(ok) { adultOk = ok; adultFresh(); $('#adult').classList.remove('hidden'); }
  $('#adult').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const k = b.dataset.k, disp = $('#adultDisp');
    if (k === 'x') { $('#adult').classList.add('hidden'); adultOk = null; return; }
    if (k === 'b') { adultTyped = adultTyped.slice(0, -1); showTyped(); return; }
    if (adultTyped.length >= 2) return;
    adultTyped += k; showTyped();
    if (adultTyped.length === 2) {
      if (+adultTyped === adultTarget) { $('#adult').classList.add('hidden'); const f = adultOk; adultOk = null; f && f(); }
      else { disp.classList.remove('bad'); void disp.offsetWidth; disp.classList.add('bad'); setTimeout(() => { disp.classList.remove('bad'); adultFresh(); }, 450); }
    }
  });
  gate($('#gear'), 2000, () => askAdult(openPanel));
  gate($('#byeResume'), 2000, () => askAdult(() => { playSec = 0; bye.classList.add('hidden'); }));

  /* ---------- Parent area ---------- */
  function syncPanel() {
    $('#vol').value = Math.round(S.volume * 100);
    panel.querySelectorAll('.seg').forEach(seg => {
      const key = seg.dataset.key;
      seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(S[key]) === b.dataset.v));
    });
    const en = Voice.has('en');
    $('#voiceInfo').textContent = !Voice.supported ? 'This browser can\'t read text aloud. The games still show every instruction in words and pictures.'
      : en ? 'An English voice is available on this device.'
        : 'No English voice was found on this device, so spoken words may be skipped. On iPhone/iPad: Settings → Accessibility → Spoken Content → Voices → English. On Android: Settings → Language → Text-to-speech output.';
  }
  const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  function openPanel() { syncPanel(); panel.classList.remove('hidden'); }
  $('#panelClose').addEventListener('click', () => { panel.classList.add('hidden'); if (!cur) renderMenu(); });
  $('#vol').addEventListener('input', e => { S.volume = e.target.value / 100; Snd.vol(S.volume); BE.save(); });
  $('#vol').addEventListener('change', () => { Snd.unlock(); Snd.ding(784); });
  panel.querySelectorAll('.seg').forEach(seg => seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const v = b.dataset.v, key = seg.dataset.key;
    S[key] = v === 'true' ? true : v === 'false' ? false : (isNaN(+v) ? v : +v);
    if (key === 'age') S.lv = {};           // a new age restarts every game at that age's level
    BE.save(); syncPanel();
  }));
  $('#testVoice').addEventListener('click', () => { Snd.unlock(); Voice.say('Hello! Let us learn and play together!'); });
  $('#fsBtn').addEventListener('click', () => {
    const d = document.documentElement;
    try { if (document.fullscreenElement) document.exitFullscreen(); else (d.requestFullscreen || d.webkitRequestFullscreen || function () { }).call(d); } catch (e) { }
  });
  $('#resetTimer').addEventListener('click', () => { playSec = 0; });
  $('#resetProg').addEventListener('click', () => { S.done = {}; S.lv = {}; BE.save(); $('#resetProg').textContent = '✓ Done'; setTimeout(() => { $('#resetProg').textContent = '↺ Start the stars over'; }, 1500); });

  /* ---------- Screen lock (Android screen pinning, native app only) ---------- */
  const nativePlugin = name => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name]) || null;
  const unlockBtn = $('#unlock');
  let locked = false;
  function setLocked(v) { locked = !!v; unlockBtn.classList.toggle('hidden', !locked); }
  async function pollLock() {
    const p = nativePlugin('ScreenLock'); if (!p) return;
    try { const r = await p.state(); setLocked(r && r.locked); } catch (e) { }
  }
  $('#lockBtn').addEventListener('click', async () => {
    const p = nativePlugin('ScreenLock'); if (!p) return;
    panel.classList.add('hidden'); if (!cur) renderMenu();
    try { await p.start(); } catch (e) { }
    setTimeout(pollLock, 600); setTimeout(pollLock, 2500);
  });
  gate(unlockBtn, 3000, async () => {
    const p = nativePlugin('ScreenLock');
    if (p) { try { await p.stop(); } catch (e) { } }
    setLocked(false); setTimeout(pollLock, 400);
  });
  // Back button: blocked while locked, otherwise goes back one step instead of closing the app by accident
  function wireBackButton() {
    const App = nativePlugin('App'); if (!App || !App.addListener) return;
    App.addListener('backButton', () => {
      if (locked) return;
      if (!$('#adult').classList.contains('hidden')) { $('#adult').classList.add('hidden'); adultOk = null; return; }
      if (!panel.classList.contains('hidden')) { $('#panelClose').click(); return; }
      if (!bye.classList.contains('hidden')) return;
      if (cur) { Snd.whoosh(); exitGame(false); return; }
      if (view) { view = null; renderMenu(); return; }
      try { App.minimizeApp(); } catch (e) { }
    });
  }

  /* ---------- Play timer: counts only while a child is in a game ---------- */
  setInterval(() => {
    if (stage.classList.contains('hidden') || document.hidden) return;
    playSec++;
    if (S.timer > 0 && playSec >= S.timer * 60) showBye();
  }, 1000);
  function showBye() {
    exitGame(false);
    bye.classList.remove('hidden');
    Snd.lullaby();
    setTimeout(() => Voice.say('All done playing. See you next time!'), 400);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) Voice.stop(); });

  /* ---------- Start ---------- */
  function boot() {
    renderMenu();
    if (isNative()) {
      const root = document.documentElement;
      root.classList.add('native');
      let platform = ''; try { platform = window.Capacitor.getPlatform(); } catch (e) { }
      root.classList.add(platform === 'ios' ? 'ios' : 'android');
      try { window.Capacitor.Plugins.StatusBar.hide(); } catch (e) { }
      wireBackButton();
      if (platform !== 'ios') { pollLock(); setInterval(pollLock, 1500); }
    } else if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
  }
  boot();
})();
