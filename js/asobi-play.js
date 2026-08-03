// js/asobi-play.js
// Asobi Lab. 遊び心エンジン MAX + 混沌エンジン
(function () {
  'use strict';

  const STORAGE_SCORE = 'asobi-play-score';
  const STORAGE_CHAOS = 'asobi-chaos';

  const KONAMI = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  let konamiIndex = 0;

  const ASOBI_SEQ = ['a', 's', 'o', 'b', 'i'];
  let asobiIndex = 0;

  const funToasts = [
    'クリックするたび遊びポイントが増えるよ',
    '右上の「混沌」を押してみて',
    '長押し or 3回タップでメニュー',
    'タイトルを連打すると…？',
    '浮いてる玉をドラッグできる',
    'キーボードで asobi と打ってみて',
    '↑↑↓↓←→←→BA はまだ健在',
    '遊び場ページにミニゲームがあるよ',
    '制約は創造性の敵',
    '実験成功！…たぶん'
  ];

  const chaosToasts = [
    '🌀 現実が歪んでいる…',
    '警告: 遊び心が臨界点',
    '色が逃げ出した',
    '重力の契約が一時停止中',
    'ERROR: FUN_OVERFLOW',
    'このモードは仕様です',
    'カードが踊り始めた',
    'スキャンライン検出',
    '混沌ポイント +α',
    'もう普通には戻れない（気のせい）',
    '実験ログ: 全てが面白い',
    'Asobi Lab. プロトコル逸脱中'
  ];

  const chaosGlyphs = ['ア', 'ソ', 'ビ', '?', '!', '※', '★', '◆', '∞', '⚡', '🧪', '🌀', 'A', '#', '%', '&'];

  let score = parseInt(localStorage.getItem(STORAGE_SCORE) || '0', 10) || 0;
  let chaosOn = localStorage.getItem(STORAGE_CHAOS) === '1';
  let scoreEl = null;
  let lastSpark = 0;
  let chaosTimers = [];
  let chaosClickBonus = false;

  // ---------- toast ----------
  function ensureToastHost() {
    let host = document.querySelector('.asobi-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'asobi-toast-host';
      document.body.appendChild(host);
    }
    return host;
  }

  function showToast(text, duration) {
    const host = ensureToastHost();
    const el = document.createElement('div');
    el.className = 'asobi-toast';
    el.textContent = text;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-show'));
    setTimeout(() => {
      el.classList.remove('is-show');
      setTimeout(() => el.remove(), 400);
    }, duration || 2800);
  }

  // ---------- score ----------
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

    const hud = document.createElement('div');
    hud.className = 'asobi-hud';

    scoreEl = document.createElement('div');
    scoreEl.className = 'asobi-hud-score';
    scoreEl.title = '遊びスコア（クリックで確認/リセット）';
    scoreEl.textContent = '遊び ' + score;
    scoreEl.addEventListener('click', () => {
      if (score > 0 && confirm('遊びスコアをリセットする？')) {
        score = 0;
        localStorage.setItem(STORAGE_SCORE, '0');
        updateScoreUI();
        showToast('スコアをリセットしたよ');
      } else {
        showToast('遊びスコア: ' + score + ' pt');
      }
    });

    const chaosBtn = document.createElement('button');
    chaosBtn.type = 'button';
    chaosBtn.className = 'asobi-hud-chaos' + (chaosOn ? ' is-on' : '');
    chaosBtn.textContent = chaosOn ? '混沌 ON' : '混沌';
    chaosBtn.addEventListener('click', () => toggleChaos());

    hud.appendChild(scoreEl);
    hud.appendChild(chaosBtn);
    document.body.appendChild(hud);

    if (chaosOn) {
      document.body.classList.add('asobi-chaos');
      startChaosEngine();
    }
  }

  // ---------- chaos layers ----------
  function ensureChaosLayers() {
    if (!document.querySelector('.asobi-chaos-scanlines')) {
      const s = document.createElement('div');
      s.className = 'asobi-chaos-scanlines';
      document.body.appendChild(s);
    }
    if (!document.querySelector('.asobi-chaos-vignette')) {
      const v = document.createElement('div');
      v.className = 'asobi-chaos-vignette';
      document.body.appendChild(v);
    }
    if (!document.querySelector('.asobi-chaos-glyph-layer')) {
      const g = document.createElement('div');
      g.className = 'asobi-chaos-glyph-layer';
      document.body.appendChild(g);
    }
    if (!document.querySelector('.asobi-chaos-flash')) {
      const f = document.createElement('div');
      f.className = 'asobi-chaos-flash';
      document.body.appendChild(f);
    }
  }

  function flashScreen() {
    const f = document.querySelector('.asobi-chaos-flash');
    if (!f) return;
    f.classList.remove('is-on');
    void f.offsetWidth;
    f.classList.add('is-on');
    setTimeout(() => f.classList.remove('is-on'), 400);
  }

  function spawnChaosGlyph() {
    const layer = document.querySelector('.asobi-chaos-glyph-layer');
    if (!layer) return;
    const g = document.createElement('div');
    g.className = 'asobi-chaos-glyph';
    g.textContent = chaosGlyphs[Math.floor(Math.random() * chaosGlyphs.length)];
    g.style.left = Math.random() * 100 + 'vw';
    g.style.animationDuration = (2.2 + Math.random() * 3.5) + 's';
    g.style.fontSize = (0.9 + Math.random() * 1.6) + 'rem';
    g.style.color = Math.random() > 0.5 ? 'var(--main-color)' : 'var(--balance-color)';
    layer.appendChild(g);
    setTimeout(() => g.remove(), 6000);
  }

  function startChaosEngine() {
    stopChaosEngine();
    ensureChaosLayers();
    chaosClickBonus = true;

    // 定期グリフ雨
    chaosTimers.push(setInterval(() => {
      if (!chaosOn) return;
      const n = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) spawnChaosGlyph();
    }, 700));

    // たまに紙吹雪
    chaosTimers.push(setInterval(() => {
      if (!chaosOn) return;
      if (Math.random() > 0.55) spawnConfetti(18 + Math.floor(Math.random() * 20));
    }, 4200));

    // 混沌トースト
    chaosTimers.push(setInterval(() => {
      if (!chaosOn) return;
      if (Math.random() > 0.4) return;
      const msg = chaosToasts[Math.floor(Math.random() * chaosToasts.length)];
      showToast(msg, 2600);
      addScore(2);
    }, 5500));

    // たまにフラッシュ
    chaosTimers.push(setInterval(() => {
      if (!chaosOn) return;
      if (Math.random() > 0.7) flashScreen();
    }, 8000));

    // オーブ加速
    document.querySelectorAll('.asobi-orb').forEach(o => {
      o.style.transition = 'none';
    });
  }

  function stopChaosEngine() {
    chaosTimers.forEach(t => clearInterval(t));
    chaosTimers = [];
    chaosClickBonus = false;
    const layer = document.querySelector('.asobi-chaos-glyph-layer');
    if (layer) layer.innerHTML = '';
  }

  function toggleChaos(force) {
    chaosOn = typeof force === 'boolean' ? force : !chaosOn;
    localStorage.setItem(STORAGE_CHAOS, chaosOn ? '1' : '0');
    document.body.classList.toggle('asobi-chaos', chaosOn);
    const btn = document.querySelector('.asobi-hud-chaos');
    if (btn) {
      btn.classList.toggle('is-on', chaosOn);
      btn.textContent = chaosOn ? '混沌 ON' : '混沌';
    }

    if (chaosOn) {
      ensureChaosLayers();
      flashScreen();
      spawnConfetti(40);
      addScore(5);
      showToast('🌀 混沌モード発動！遊び心が暴走します');
      startChaosEngine();
      for (let i = 0; i < 8; i++) setTimeout(spawnChaosGlyph, i * 80);
    } else {
      stopChaosEngine();
      showToast('混沌モード解除。世界が落ち着いた');
    }
  }

  // ---------- confetti ----------
  function spawnConfetti(count) {
    let layer = document.querySelector('.asobi-confetti-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'asobi-confetti-layer';
      document.body.appendChild(layer);
    }
    const colors = ['var(--main-color)', 'var(--balance-color)', '#fff', '#ffee88', '#ff88cc', '#88ffee'];
    const n = count || 56;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'asobi-confetti-piece';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.4 + Math.random() * 2) + 's';
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      p.style.width = (5 + Math.random() * 10) + 'px';
      p.style.height = (5 + Math.random() * 10) + 'px';
      p.style.borderRadius = Math.random() > 0.45 ? '50%' : '2px';
      layer.appendChild(p);
      setTimeout(() => p.remove(), 4200);
    }
  }

  // ---------- ripple + click ----------
  function spawnRipple(x, y, big) {
    const r = document.createElement('div');
    r.className = 'asobi-ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    const size = (big ? 70 : 40) + Math.random() * (big ? 80 : 50);
    r.style.width = size + 'px';
    r.style.height = size + 'px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 700);
  }

  function initClicks() {
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.radial-menu-wrapper')) return;
      spawnRipple(e.clientX, e.clientY, chaosOn);

      if (chaosOn) {
        // 三重波紋
        setTimeout(() => spawnRipple(e.clientX + 12, e.clientY - 8, true), 60);
        setTimeout(() => spawnRipple(e.clientX - 10, e.clientY + 10, true), 120);
        addScore(3);
        if (Math.random() > 0.85) {
          spawnChaosGlyph();
          spawnChaosGlyph();
        }
      } else {
        addScore(1);
      }
    }, { passive: true });
  }

  // ---------- sparks ----------
  function initSparks() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    document.addEventListener('pointermove', (e) => {
      const now = performance.now();
      const throttle = chaosOn ? 18 : 40;
      if (now - lastSpark < throttle) return;
      lastSpark = now;

      const count = chaosOn ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'asobi-spark';
        s.style.left = (e.clientX + (Math.random() - 0.5) * (chaosOn ? 16 : 0)) + 'px';
        s.style.top = (e.clientY + (Math.random() - 0.5) * (chaosOn ? 16 : 0)) + 'px';
        s.style.background = Math.random() > 0.5 ? 'var(--main-color)' : 'var(--balance-color)';
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 560);
      }
    }, { passive: true });
  }

  // ---------- orbs ----------
  function initOrbs() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (document.querySelector('.asobi-orb-layer')) return;

    const layer = document.createElement('div');
    layer.className = 'asobi-orb-layer';
    document.body.appendChild(layer);

    const orbs = [];
    for (let i = 0; i < 4; i++) {
      const orb = document.createElement('div');
      orb.className = 'asobi-orb';
      const size = 28 + Math.random() * 36;
      orb.style.width = size + 'px';
      orb.style.height = size + 'px';
      const state = {
        el: orb,
        x: Math.random() * (window.innerWidth - 80) + 20,
        y: Math.random() * (window.innerHeight - 80) + 20,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        dragging: false,
        size: size
      };
      orb.style.left = state.x + 'px';
      orb.style.top = state.y + 'px';

      orb.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        state.dragging = true;
        orb.setPointerCapture(e.pointerId);
        addScore(chaosOn ? 5 : 2);
        showToast(chaosOn ? '混沌オーブ捕獲！！' : 'オーブ捕獲！');
        if (chaosOn) {
          spawnConfetti(12);
          flashScreen();
        }
      });
      orb.addEventListener('pointermove', (e) => {
        if (!state.dragging) return;
        state.x = e.clientX - size / 2;
        state.y = e.clientY - size / 2;
        orb.style.left = state.x + 'px';
        orb.style.top = state.y + 'px';
      });
      orb.addEventListener('pointerup', () => {
        state.dragging = false;
        const boost = chaosOn ? 4.5 : 2;
        state.vx = (Math.random() - 0.5) * boost;
        state.vy = (Math.random() - 0.5) * boost;
      });
      orb.addEventListener('click', (e) => e.stopPropagation());

      layer.appendChild(orb);
      orbs.push(state);
    }

    function tick() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const speedMul = chaosOn ? 2.2 : 1;
      orbs.forEach(o => {
        if (o.dragging) return;
        o.x += o.vx * speedMul;
        o.y += o.vy * speedMul;
        if (o.x < 0 || o.x > w - 40) o.vx *= -1;
        if (o.y < 0 || o.y > h - 40) o.vy *= -1;
        o.x = Math.max(0, Math.min(w - 40, o.x));
        o.y = Math.max(0, Math.min(h - 40, o.y));
        o.el.style.left = o.x + 'px';
        o.el.style.top = o.y + 'px';
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------- reveal ----------
  function initReveal() {
    const targets = document.querySelectorAll(
      'main section, .member-card, .group-card, .gallery-item, .asobi-card, .play-panel'
    );
    targets.forEach((el, i) => {
      if (el.classList.contains('asobi-reveal')) return;
      el.classList.add('asobi-reveal');
      const delay = Math.min(i % 4, 3);
      if (delay > 0) el.classList.add('asobi-reveal-delay-' + delay);
    });

    const hero = document.querySelector('main header h1');
    if (hero) {
      hero.classList.add('asobi-float', 'asobi-glitch');
      let clicks = 0;
      let clickTimer = null;
      hero.addEventListener('click', (e) => {
        e.stopPropagation();
        clicks++;
        addScore(chaosOn ? 6 : 3);
        spawnRipple(e.clientX, e.clientY, true);
        if (clicks >= 5) {
          clicks = 0;
          spawnConfetti(chaosOn ? 70 : 40);
          showToast(chaosOn ? '混沌タイトルボーナス！！' : 'タイトル連打ボーナス！');
          addScore(chaosOn ? 40 : 20);
          if (chaosOn) flashScreen();
        }
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clicks = 0; }, 900);
      });
    }

    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.asobi-reveal').forEach(el => io.observe(el));
  }

  // ---------- keys ----------
  function initKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      const expected = KONAMI[konamiIndex];
      const expectedNorm = expected.length === 1 ? expected.toLowerCase() : expected;
      if (key === expectedNorm) {
        konamiIndex++;
        if (konamiIndex === KONAMI.length) {
          konamiIndex = 0;
          spawnConfetti(64);
          addScore(50);
          showToast('🎉 コナミ成功！ +50pt');
          toggleChaos(true);
        }
      } else {
        konamiIndex = (key === 'ArrowUp' || key === 'arrowup') ? 1 : 0;
      }

      if (key === ASOBI_SEQ[asobiIndex]) {
        asobiIndex++;
        if (asobiIndex === ASOBI_SEQ.length) {
          asobiIndex = 0;
          spawnConfetti(36);
          addScore(15);
          showToast('✨ asobi 入力成功！');
          if (chaosOn) {
            for (let i = 0; i < 12; i++) spawnChaosGlyph();
            flashScreen();
          }
        }
      } else {
        asobiIndex = key === 'a' ? 1 : 0;
      }
    });
  }

  function maybeFunToast() {
    const key = 'asobi-last-toast';
    const last = parseInt(sessionStorage.getItem(key) || '0', 10);
    const now = Date.now();
    if (now - last < 25000) return;
    if (Math.random() > 0.45) return;
    sessionStorage.setItem(key, String(now));
    const pool = chaosOn ? chaosToasts : funToasts;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => showToast(msg, 3400), 900);
  }

  function initHint() {
    if (document.querySelector('.asobi-easter-hint')) return;
    const hint = document.createElement('div');
    hint.className = 'asobi-easter-hint';
    hint.innerHTML = '↑↑↓↓←→←→BA<br>type: asobi';
    document.body.appendChild(hint);
  }

  function boot() {
    initHud();
    initReveal();
    initClicks();
    initSparks();
    initOrbs();
    initKeys();
    initHint();
    maybeFunToast();

    window.AsobiPlay = {
      toast: showToast,
      confetti: spawnConfetti,
      addScore: addScore,
      toggleChaos: toggleChaos,
      getScore: () => score,
      flash: flashScreen
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
