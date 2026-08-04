// js/asobi-play.js — compact + Konami POWER continuous effect
(function () {
  'use strict';
  if (window.__ASOBI_PLAY_BOOTED__) return;
  window.__ASOBI_PLAY_BOOTED__ = true;

  const STORAGE_SCORE = 'asobi-play-score';
  const STORAGE_CHAOS = 'asobi-chaos';
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
  const ASOBI = ['KeyA','KeyS','KeyO','KeyB','KeyI'];
  let konamiIdx = 0, asobiIdx = 0;
  let score = parseInt(localStorage.getItem(STORAGE_SCORE) || '0', 10) || 0;
  localStorage.setItem(STORAGE_CHAOS, '0');
  let chaosOn = false, scoreEl = null, lastSpark = 0;
  let chaosTimers = [], konamiOn = false, konamiTimers = [], konamiEndAt = 0;

  function isTypingTarget(el) {
    if (!el) return false;
    if (el.matches && el.matches('input,textarea,select,[contenteditable="true"]')) return true;
    if (el.closest && el.closest('.asobi-term-panel,.asobi-tool-panel,.asobi-console-panel,.asobi-fx-overlay')) return true;
    return false;
  }
  function ensureToastHost() {
    let h = document.querySelector('.asobi-toast-host');
    if (!h) { h = document.createElement('div'); h.className = 'asobi-toast-host'; document.body.appendChild(h); }
    return h;
  }
  function showToast(text, duration) {
    const host = ensureToastHost();
    const el = document.createElement('div');
    el.className = 'asobi-toast'; el.textContent = text; host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-show'));
    setTimeout(() => { el.classList.remove('is-show'); setTimeout(() => el.remove(), 400); }, duration || 2800);
  }
  function updateScoreUI() {
    if (!scoreEl) return;
    scoreEl.textContent = '遊び ' + score;
    scoreEl.classList.add('is-pop');
    setTimeout(() => scoreEl.classList.remove('is-pop'), 280);
  }
  function addScore(n) {
    score += n;
    localStorage.setItem(STORAGE_SCORE, String(score));
    updateScoreUI();
  }
  function initHud() {
    if (document.querySelector('.asobi-hud')) return;
    const hud = document.createElement('div'); hud.className = 'asobi-hud';
    scoreEl = document.createElement('div'); scoreEl.className = 'asobi-hud-score';
    scoreEl.title = '遊びスコア'; scoreEl.textContent = '遊び ' + score;
    scoreEl.addEventListener('click', () => {
      if (score > 0 && confirm('遊びスコアをリセットする？')) {
        score = 0; localStorage.setItem(STORAGE_SCORE, '0'); updateScoreUI(); showToast('スコアをリセットしたよ');
      } else showToast('遊びスコア: ' + score + ' pt');
    });
    hud.appendChild(scoreEl); document.body.appendChild(hud);
    document.body.classList.remove('asobi-chaos');
  }

  function ensureChaosLayers() {
    ['scanlines','vignette','glyph-layer','flash'].forEach(n => {
      if (!document.querySelector('.asobi-chaos-' + n)) {
        const d = document.createElement('div'); d.className = 'asobi-chaos-' + n; document.body.appendChild(d);
      }
    });
  }
  function flashScreen() {
    const f = document.querySelector('.asobi-chaos-flash'); if (!f) return;
    f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on');
    setTimeout(() => f.classList.remove('is-on'), 400);
  }
  function spawnChaosGlyph() {
    const layer = document.querySelector('.asobi-chaos-glyph-layer'); if (!layer) return;
    const g = document.createElement('div'); g.className = 'asobi-chaos-glyph';
    const glyphs = ['ア','ソ','ビ','?','!','※','★','◆','∞','⚡'];
    g.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
    g.style.left = Math.random()*100+'vw';
    g.style.animationDuration = (2.2+Math.random()*3.5)+'s';
    g.style.fontSize = (0.9+Math.random()*1.6)+'rem';
    layer.appendChild(g); setTimeout(() => g.remove(), 6000);
  }
  function startChaosEngine() {
    stopChaosEngine(); ensureChaosLayers();
    chaosTimers.push(setInterval(() => { if (!chaosOn) return; for (let i=0;i<2+Math.floor(Math.random()*3);i++) spawnChaosGlyph(); }, 700));
    chaosTimers.push(setInterval(() => { if (chaosOn && Math.random()>0.5) spawnConfetti(20); }, 4200));
  }
  function stopChaosEngine() {
    chaosTimers.forEach(t => clearInterval(t)); chaosTimers = [];
    const layer = document.querySelector('.asobi-chaos-glyph-layer'); if (layer) layer.innerHTML = '';
  }
  function toggleChaos(force) {
    chaosOn = typeof force === 'boolean' ? force : !chaosOn;
    localStorage.setItem(STORAGE_CHAOS, chaosOn ? '1' : '0');
    document.body.classList.toggle('asobi-chaos', chaosOn);
    if (chaosOn) { ensureChaosLayers(); flashScreen(); spawnConfetti(40); addScore(5); showToast('混沌モード発動'); startChaosEngine(); }
    else { stopChaosEngine(); showToast('混沌モード解除'); }
  }

  function spawnConfetti(count) {
    let layer = document.querySelector('.asobi-confetti-layer');
    if (!layer) { layer = document.createElement('div'); layer.className = 'asobi-confetti-layer'; document.body.appendChild(layer); }
    const colors = ['var(--main-color)','var(--balance-color)','#fff','#ffee88','#ff88cc'];
    for (let i = 0; i < (count||40); i++) {
      const p = document.createElement('div'); p.className = 'asobi-confetti-piece';
      p.style.left = Math.random()*100+'vw'; p.style.background = colors[i%colors.length];
      p.style.animationDuration = (1.4+Math.random()*2)+'s';
      layer.appendChild(p); setTimeout(() => p.remove(), 4200);
    }
  }
  function spawnRipple(x, y, big) {
    const r = document.createElement('div'); r.className = 'asobi-ripple';
    r.style.left = x+'px'; r.style.top = y+'px';
    const size = (big?70:40)+Math.random()*(big?80:50);
    r.style.width = size+'px'; r.style.height = size+'px';
    document.body.appendChild(r); setTimeout(() => r.remove(), 700);
  }

  function ensureKonamiLayers() {
    if (!document.querySelector('.asobi-konami-layer')) {
      const layer = document.createElement('div'); layer.className = 'asobi-konami-layer';
      layer.innerHTML = '<div class="asobi-konami-aurora"></div><div class="asobi-konami-stars"></div><div class="asobi-konami-banner">KONAMI POWER</div>';
      document.body.appendChild(layer);
    }
    if (!document.getElementById('asobi-konami-style')) {
      const st = document.createElement('style'); st.id = 'asobi-konami-style';
      st.textContent = `
.asobi-konami-layer{position:fixed;inset:0;pointer-events:none;z-index:99990;overflow:hidden}
.asobi-konami-aurora{position:absolute;inset:-20%;background:conic-gradient(from 0deg,rgba(0,255,136,.14),rgba(0,200,255,.12),rgba(255,0,200,.12),rgba(255,200,0,.12),rgba(0,255,136,.14));animation:asobi-kspin 12s linear infinite;filter:blur(40px);opacity:0;transition:opacity .6s}
body.asobi-konami .asobi-konami-aurora{opacity:1}
.asobi-konami-stars{position:absolute;inset:0}
.asobi-konami-star{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 8px #0f8;animation:asobi-kdrift linear forwards;opacity:.9}
.asobi-konami-banner{position:fixed;top:18px;left:50%;transform:translateX(-50%) translateY(-120%);background:linear-gradient(90deg,#00ff88,#00c8ff,#ff00c8);color:#0b0f0c;font:700 12px/1.2 ui-monospace,monospace;padding:8px 18px;border-radius:999px;letter-spacing:.12em;box-shadow:0 0 24px rgba(0,255,136,.45);opacity:0;transition:transform .45s,opacity .45s;z-index:99991}
body.asobi-konami .asobi-konami-banner{transform:translateX(-50%) translateY(0);opacity:1}
@keyframes asobi-kspin{to{transform:rotate(360deg)}}
@keyframes asobi-kdrift{0%{transform:translateY(0) scale(1);opacity:.9}100%{transform:translateY(-100vh) scale(.4);opacity:0}}
body.asobi-konami .asobi-hud-score{animation:asobi-kpulse 1.2s ease-in-out infinite;box-shadow:0 0 16px rgba(0,255,136,.5)}
@keyframes asobi-kpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.asobi-konami-ring{position:fixed;border:2px solid rgba(0,255,136,.55);border-radius:50%;pointer-events:none;z-index:99989;animation:asobi-kring 1.1s ease-out forwards}
@keyframes asobi-kring{0%{width:20px;height:20px;opacity:.8;margin:-10px 0 0 -10px}100%{width:220px;height:220px;opacity:0;margin:-110px 0 0 -110px}}
`;
      document.head.appendChild(st);
    }
  }
  function spawnKonamiStar() {
    const host = document.querySelector('.asobi-konami-stars'); if (!host) return;
    const s = document.createElement('div'); s.className = 'asobi-konami-star';
    s.style.left = Math.random()*100+'vw'; s.style.bottom = '-8px';
    s.style.animationDuration = (2.5+Math.random()*3.5)+'s';
    const colors = ['#00ff88','#00c8ff','#ff66cc','#ffee66','#fff'];
    s.style.background = colors[Math.floor(Math.random()*colors.length)];
    s.style.boxShadow = '0 0 8px '+s.style.background;
    host.appendChild(s); setTimeout(() => s.remove(), 7000);
  }
  function spawnKonamiRing(x, y) {
    const r = document.createElement('div'); r.className = 'asobi-konami-ring';
    r.style.left = x+'px'; r.style.top = y+'px';
    document.body.appendChild(r); setTimeout(() => r.remove(), 1200);
  }
  function stopKonamiPower() {
    konamiOn = false; konamiTimers.forEach(t => clearInterval(t)); konamiTimers = [];
    document.body.classList.remove('asobi-konami');
    const host = document.querySelector('.asobi-konami-stars'); if (host) host.innerHTML = '';
    showToast('KONAMI POWER 終了');
  }
  function startKonamiPower(seconds) {
    const dur = (seconds || 45) * 1000;
    ensureKonamiLayers();
    if (konamiOn) {
      konamiEndAt = Math.max(konamiEndAt, Date.now()) + dur;
      showToast('KONAMI POWER 延長 +'+(seconds||45)+'s'); addScore(25); spawnConfetti(40); return;
    }
    konamiOn = true; konamiEndAt = Date.now() + dur;
    document.body.classList.add('asobi-konami');
    spawnConfetti(72); addScore(50); showToast('KONAMI POWER 発動！ '+(seconds||45)+'秒'); flashScreen();
    for (let i=0;i<16;i++) setTimeout(spawnKonamiStar, i*40);
    konamiTimers.push(setInterval(() => {
      if (!konamiOn) return;
      if (Date.now() >= konamiEndAt) { stopKonamiPower(); return; }
      for (let i=0;i<2+Math.floor(Math.random()*4);i++) spawnKonamiStar();
    }, 380));
    konamiTimers.push(setInterval(() => {
      if (!konamiOn || Math.random()>0.55) return;
      spawnKonamiRing(40+Math.random()*(window.innerWidth-80), 40+Math.random()*(window.innerHeight-80));
    }, 900));
    konamiTimers.push(setInterval(() => { if (konamiOn) addScore(1); }, 2000));
  }

  function initClicks() {
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.radial-menu-wrapper,.asobi-term-panel,.asobi-term-toggle,.asobi-tool-panel,.asobi-console-panel,.asobi-fx-overlay')) return;
      spawnRipple(e.clientX, e.clientY, chaosOn || konamiOn);
      if (chaosOn) { addScore(3); if (Math.random()>0.85) { spawnChaosGlyph(); spawnChaosGlyph(); } }
      else if (konamiOn) { addScore(2); if (Math.random()>0.7) spawnKonamiRing(e.clientX, e.clientY); }
      else addScore(1);
    }, { passive: true });
  }
  function initSparks() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.addEventListener('pointermove', (e) => {
      const now = performance.now();
      const throttle = (chaosOn || konamiOn) ? 16 : 40;
      if (now - lastSpark < throttle) return; lastSpark = now;
      const count = (chaosOn || konamiOn) ? 2 : 1;
      for (let i=0;i<count;i++) {
        const s = document.createElement('div'); s.className = 'asobi-spark';
        s.style.left = e.clientX+'px'; s.style.top = e.clientY+'px';
        s.style.background = Math.random()>0.5 ? 'var(--main-color)' : 'var(--balance-color)';
        document.body.appendChild(s); setTimeout(() => s.remove(), 560);
      }
    }, { passive: true });
  }
  function initOrbs() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (document.querySelector('.asobi-orb-layer')) return;
    const layer = document.createElement('div'); layer.className = 'asobi-orb-layer'; document.body.appendChild(layer);
    const orbs = [];
    for (let i=0;i<4;i++) {
      const orb = document.createElement('div'); orb.className = 'asobi-orb';
      const size = 28+Math.random()*36; orb.style.width = size+'px'; orb.style.height = size+'px';
      const state = { el:orb, x:Math.random()*(window.innerWidth-80)+20, y:Math.random()*(window.innerHeight-80)+20, vx:(Math.random()-0.5)*1.4, vy:(Math.random()-0.5)*1.4, dragging:false, size };
      orb.style.left = state.x+'px'; orb.style.top = state.y+'px';
      orb.addEventListener('pointerdown', (e) => { e.stopPropagation(); state.dragging=true; orb.setPointerCapture(e.pointerId); addScore(chaosOn||konamiOn?5:2); showToast(konamiOn?'POWER オーブ':'オーブ捕獲'); });
      orb.addEventListener('pointermove', (e) => { if (!state.dragging) return; state.x=e.clientX-size/2; state.y=e.clientY-size/2; orb.style.left=state.x+'px'; orb.style.top=state.y+'px'; });
      orb.addEventListener('pointerup', () => { state.dragging=false; state.vx=(Math.random()-0.5)*2; state.vy=(Math.random()-0.5)*2; });
      layer.appendChild(orb); orbs.push(state);
    }
    (function tick() {
      const w=window.innerWidth, h=window.innerHeight, mul=(chaosOn||konamiOn)?2.2:1;
      orbs.forEach(o => {
        if (o.dragging) return;
        o.x+=o.vx*mul; o.y+=o.vy*mul;
        if (o.x<0||o.x>w-40) o.vx*=-1; if (o.y<0||o.y>h-40) o.vy*=-1;
        o.x=Math.max(0,Math.min(w-40,o.x)); o.y=Math.max(0,Math.min(h-40,o.y));
        o.el.style.left=o.x+'px'; o.el.style.top=o.y+'px';
      });
      requestAnimationFrame(tick);
    })();
  }
  function initReveal() {
    document.querySelectorAll('main section,.member-card,.group-card,.gallery-item,.asobi-card,.play-panel').forEach((el,i) => {
      if (el.classList.contains('asobi-reveal')) return;
      el.classList.add('asobi-reveal');
      const d=Math.min(i%4,3); if (d>0) el.classList.add('asobi-reveal-delay-'+d);
    });
    const hero = document.querySelector('main header h1');
    if (hero) {
      hero.classList.add('asobi-float','asobi-glitch');
      let clicks=0, t=null;
      hero.addEventListener('click', (e) => {
        e.stopPropagation(); clicks++; addScore(chaosOn||konamiOn?6:3); spawnRipple(e.clientX,e.clientY,true);
        if (clicks>=5) { clicks=0; spawnConfetti(konamiOn?80:40); showToast(konamiOn?'POWER タイトルボーナス':'タイトル連打ボーナス'); addScore(konamiOn?40:20); }
        clearTimeout(t); t=setTimeout(()=>{clicks=0;},900);
      });
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } }), { threshold:0.1 });
      document.querySelectorAll('.asobi-reveal').forEach(el => io.observe(el));
    } else document.querySelectorAll('.asobi-reveal').forEach(el => el.classList.add('is-visible'));
  }
  function initKeys() {
    document.addEventListener('keydown', (e) => {
      if (isTypingTarget(e.target)) return;
      const code = e.code;
      if (code === KONAMI[konamiIdx]) {
        konamiIdx++;
        if (konamiIdx === KONAMI.length) { konamiIdx = 0; startKonamiPower(45); }
      } else konamiIdx = (code === 'ArrowUp') ? 1 : 0;
      if (code === ASOBI[asobiIdx]) {
        asobiIdx++;
        if (asobiIdx === ASOBI.length) { asobiIdx = 0; spawnConfetti(36); addScore(15); showToast('asobi 入力成功'); }
      } else asobiIdx = code === 'KeyA' ? 1 : 0;
    });
  }
  function initHint() {
    if (document.querySelector('.asobi-easter-hint')) return;
    const h = document.createElement('div'); h.className = 'asobi-easter-hint';
    h.innerHTML = '↑↑↓↓←→←→BA → POWER<br>type: asobi';
    document.body.appendChild(h);
  }
  function boot() {
    initHud(); initReveal(); initClicks(); initSparks(); initOrbs(); initKeys(); initHint();
    window.AsobiPlay = {
      toast: showToast, confetti: spawnConfetti, addScore, toggleChaos,
      getScore: () => score, flash: flashScreen, konamiPower: startKonamiPower, isKonami: () => konamiOn
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
