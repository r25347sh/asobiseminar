// js/asobi-play.js
// Asobi Lab. 全ページ共通・遊び心エンジン
(function () {
  'use strict';

  const KONAMI = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  let konamiIndex = 0;

  const funToasts = [
    '今日も遊び心を忘れずに ✨',
    '実験中…結果は想像にお任せ',
    '長押し or 3回タップでメニューが開くよ',
    'テーマを変えると世界が変わる',
    'Asobi Lab. はまだ進化中',
    '404も遊べる。見つけた？',
    '制約は創造性の敵らしい',
    'ここをクリックしても何も起きない…たぶん'
  ];

  // ---------- DOM helpers ----------
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

  // ---------- Scroll reveal ----------
  function initReveal() {
    const targets = document.querySelectorAll(
      'main section, .member-card, .group-card, .gallery-item, .asobi-card'
    );

    targets.forEach((el, i) => {
      if (el.classList.contains('asobi-reveal')) return;
      el.classList.add('asobi-reveal');
      const delay = Math.min(i % 4, 3);
      if (delay > 0) el.classList.add('asobi-reveal-delay-' + delay);
    });

    // ヒーローも少し浮かせる
    const hero = document.querySelector('main header h1');
    if (hero) hero.classList.add('asobi-float');

    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.asobi-reveal').forEach(el => io.observe(el));
  }

  // ---------- Konami + confetti ----------
  function spawnConfetti() {
    let layer = document.querySelector('.asobi-confetti-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'asobi-confetti-layer';
      document.body.appendChild(layer);
    }

    const colors = [
      'var(--main-color)',
      'var(--balance-color)',
      '#fff',
      '#ffee88',
      '#ff88cc'
    ];

    for (let i = 0; i < 48; i++) {
      const p = document.createElement('div');
      p.className = 'asobi-confetti-piece';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.6 + Math.random() * 1.8) + 's';
      p.style.animationDelay = (Math.random() * 0.4) + 's';
      p.style.width = (6 + Math.random() * 8) + 'px';
      p.style.height = (6 + Math.random() * 8) + 'px';
      p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      layer.appendChild(p);
      setTimeout(() => p.remove(), 4000);
    }

    setTimeout(() => {
      if (layer && !layer.children.length) layer.remove();
    }, 4500);
  }

  function onKonamiSuccess() {
    spawnConfetti();
    showToast('🎉 コナミコマンド成功！遊び心レベルMAX', 3500);
    // 一瞬テーマをチカっとさせる
    const root = document.documentElement;
    const prev = root.style.getPropertyValue('--main-color');
    root.style.setProperty('--main-color', '#ffee00');
    setTimeout(() => {
      if (prev) root.style.setProperty('--main-color', prev);
      else root.style.removeProperty('--main-color');
    }, 600);
  }

  function initKonami() {
    document.addEventListener('keydown', (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const expected = KONAMI[konamiIndex];
      const expectedNorm = expected.length === 1 ? expected.toLowerCase() : expected;

      if (key === expectedNorm) {
        konamiIndex++;
        if (konamiIndex === KONAMI.length) {
          konamiIndex = 0;
          onKonamiSuccess();
        }
      } else {
        konamiIndex = key === (KONAMI[0].length === 1 ? KONAMI[0].toLowerCase() : KONAMI[0]) ? 1 : 0;
      }
    });
  }

  // ---------- ランダム遊びトースト（初回訪問時など） ----------
  function maybeFunToast() {
    const key = 'asobi-last-toast';
    const last = parseInt(sessionStorage.getItem(key) || '0', 10);
    const now = Date.now();
    // 同じセッションで30秒に1回まで
    if (now - last < 30000) return;

    // 30%の確率で表示（うるさくしない）
    if (Math.random() > 0.32) return;

    sessionStorage.setItem(key, String(now));
    const msg = funToasts[Math.floor(Math.random() * funToasts.length)];
    setTimeout(() => showToast(msg, 3200), 1200);
  }

  // ---------- ヒント表示 ----------
  function initHint() {
    if (document.querySelector('.asobi-easter-hint')) return;
    const hint = document.createElement('div');
    hint.className = 'asobi-easter-hint';
    hint.textContent = '↑↑↓↓←→←→BA';
    document.body.appendChild(hint);
  }

  // ---------- リンクに少し遊びを ----------
  function enhanceLinks() {
    document.querySelectorAll('a[href]').forEach(a => {
      if (a.classList.contains('asobi-btn') || a.classList.contains('error-btn')) return;
      a.addEventListener('mouseenter', () => {
        a.style.transition = 'transform 0.2s ease';
      });
    });
  }

  // ---------- boot ----------
  function boot() {
    initReveal();
    initKonami();
    initHint();
    enhanceLinks();
    maybeFunToast();

    // 外部公開用（他スクリプトから呼べる）
    window.AsobiPlay = {
      toast: showToast,
      confetti: spawnConfetti
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
