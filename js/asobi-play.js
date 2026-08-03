// js/asobi-play.js
// Asobi Lab. 全ページ共通・遊び心エンジン MAX
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

  // asobi と打つと発動
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

  let score = parseInt(localStorage.getItem(STORAGE_SCORE) || '0', 10) || 0;
  let chaosOn = localStorage.getItem(STORAGE_CHAOS) === '1';
  let scoreEl = null;
  let lastSpark = 0;

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
    scoreEl.title = 'クリックで遊びポイント加算 / クリックでリセット確認';
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

    if (chaosOn) document.body.classList.add('asobi-chaos');
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
    showToast(chaosOn ? '🌀 混沌モード発動！' : '混沌モード解除');
    if (chaosOn) {
      spawnConfetti(24);
      addScore(5);
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

  // ---------- ripple + click score ----------
  function spawnRipple(x, y) {
    const r = document.createElement('div');
    r.className = 'asobi-ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    const size = 40 + Math.random() * 50;
    r.style.width = size + 'px';
    r.style.height = size + 'px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 600);
  }

  function initClicks() {
    document.addEventListener('pointerdown', (e) => {
      // メニュー操作中は邪魔しない
      if (e.target.closest('.radial-menu-wrapper')) return;
      spawnRipple(e.clientX, e.clientY);
      addScore(1);
    }, { passive: true });
  }

  // ---------- cursor spark (desktop) ----------
  function initSparks() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    document.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - lastSpark < 40) return;
      lastSpark = now;

      const s = document.createElement('div');
      s.className = 'asobi-spark';
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      s.style.background = Math.random() > 0.5 ? 'var(--main-color)' : 'var(--balance-color)';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 560);
    }, { passive: true });
  }

  // ---------- floating orbs ----------
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
        dragging: false
      };
      orb.style.left = state.x + 'px';
      orb.style.top = state.y + 'px';

      orb.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        state.dragging = true;
        orb.setPointerCapture(e.pointerId);
        addScore(2);
        showToast('オーブ捕獲！');
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
        state.vx = (Math.random() - 0.5) * 2;
        state.vy = (Math.random() - 0.5) * 2;
      });
      orb.addEventListener('click', (e) => e.stopPropagation());

      layer.appendChild(orb);
      orbs.push(state);
    }

    function tick() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      orbs.forEach(o => {
        if (o.dragging) return;
        o.x += o.vx;
        o.y += o.vy;
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

  // ---------- scroll reveal ----------
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
        addScore(3);
        spawnRipple(e.clientX, e.clientY);
        if (clicks >= 5) {
          clicks = 0;
          spawnConfetti(40);
          showToast('タイトル連打ボーナス！');
          addScore(20);
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

  // ---------- keyboard easter eggs ----------
  function initKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      // Konami
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
        konamiIndex = key === 'arrowup' || key === 'ArrowUp' ? 1 : 0;
      }

      // type "asobi"
      if (key === ASOBI_SEQ[asobiIndex]) {
        asobiIndex++;
        if (asobiIndex === ASOBI_SEQ.length) {
          asobiIndex = 0;
          spawnConfetti(36);
          addScore(15);
          showToast('✨ asobi 入力成功！');
        }
      } else {
        asobiIndex = key === 'a' ? 1 : 0;
      }

      // C key = chaos toggle
      if (key === 'c' && !e.metaKey && !e.ctrlKey) {
        // only if not typing sequence
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
    const msg = funToasts[Math.floor(Math.random() * funToasts.length)];
    setTimeout(() => showToast(msg, 3400), 900);
  }

  function initHint() {
    if (document.querySelector('.asobi-easter-hint')) return;
    const hint = document.createElement('div');
    hint.className = 'asobi-easter-hint';
    hint.innerHTML = '↑↑↓↓←→←→BA<br>type: asobi';
    document.body.appendChild(hint);
  }

  // ---------- boot ----------
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
      getScore: () => score
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
