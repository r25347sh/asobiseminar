// js/playground.js - 遊び場ミニゲーム
(function () {
  'use strict';

  function addScore(n) {
    if (window.AsobiPlay && window.AsobiPlay.addScore) {
      window.AsobiPlay.addScore(n);
    }
  }

  function toast(msg) {
    if (window.AsobiPlay && window.AsobiPlay.toast) {
      window.AsobiPlay.toast(msg);
    }
  }

  function confetti(n) {
    if (window.AsobiPlay && window.AsobiPlay.confetti) {
      window.AsobiPlay.confetti(n);
    }
  }

  // ===== バブル叩き =====
  const arena = document.getElementById('bubbleArena');
  const overlay = document.getElementById('bubbleOverlay');
  const bubbleStart = document.getElementById('bubbleStart');
  const bubbleStat = document.getElementById('bubbleStat');
  const bubbleTime = document.getElementById('bubbleTime');

  let bubbleScore = 0;
  let bubbleRunning = false;
  let bubbleTimer = null;
  let spawnTimer = null;
  let timeLeft = 20;

  function clearBubbles() {
    arena.querySelectorAll('.bubble').forEach(b => b.remove());
  }

  function spawnBubble() {
    if (!bubbleRunning) return;
    const b = document.createElement('div');
    b.className = 'bubble';
    const size = 36 + Math.random() * 44;
    b.style.width = size + 'px';
    b.style.height = size + 'px';
    const maxX = arena.clientWidth - size - 8;
    const maxY = arena.clientHeight - size - 8;
    b.style.left = (8 + Math.random() * Math.max(0, maxX)) + 'px';
    b.style.top = (8 + Math.random() * Math.max(0, maxY)) + 'px';

    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!bubbleRunning || b.classList.contains('pop')) return;
      b.classList.add('pop');
      bubbleScore += 1;
      bubbleStat.textContent = 'スコア: ' + bubbleScore;
      addScore(2);
      setTimeout(() => b.remove(), 280);
    });

    arena.appendChild(b);
    // 放置すると消える
    setTimeout(() => {
      if (b.parentNode && !b.classList.contains('pop')) b.remove();
    }, 1800 + Math.random() * 800);
  }

  function endBubble() {
    bubbleRunning = false;
    clearInterval(bubbleTimer);
    clearInterval(spawnTimer);
    clearBubbles();
    overlay.style.display = 'flex';
    overlay.textContent = '終了！ スコア ' + bubbleScore;
    bubbleStart.disabled = false;
    addScore(bubbleScore);
    if (bubbleScore >= 15) {
      confetti(40);
      toast('バブル名人！');
    } else {
      toast('バブル終了: ' + bubbleScore + ' 個');
    }
  }

  bubbleStart.addEventListener('click', () => {
    if (bubbleRunning) return;
    bubbleRunning = true;
    bubbleScore = 0;
    timeLeft = 20;
    bubbleStat.textContent = 'スコア: 0';
    bubbleTime.textContent = '残り: 20';
    overlay.style.display = 'none';
    clearBubbles();
    bubbleStart.disabled = true;

    spawnTimer = setInterval(spawnBubble, 420);
    spawnBubble();

    bubbleTimer = setInterval(() => {
      timeLeft--;
      bubbleTime.textContent = '残り: ' + timeLeft;
      if (timeLeft <= 0) endBubble();
    }, 1000);
  });

  // ===== 反射テスト =====
  const reactArena = document.getElementById('reactArena');
  const reactStart = document.getElementById('reactStart');
  const reactStat = document.getElementById('reactStat');

  let reactState = 'idle'; // idle | wait | go
  let reactStartTime = 0;
  let reactTimeout = null;

  function resetReact() {
    reactState = 'idle';
    reactArena.className = 'react-arena';
    reactArena.textContent = '待機中…';
    reactStart.disabled = false;
  }

  reactStart.addEventListener('click', () => {
    if (reactState !== 'idle') return;
    reactState = 'wait';
    reactArena.className = 'react-arena wait';
    reactArena.textContent = 'まだ押すな…';
    reactStart.disabled = true;
    reactStat.textContent = '結果: —';

    const delay = 1200 + Math.random() * 2800;
    reactTimeout = setTimeout(() => {
      reactState = 'go';
      reactArena.className = 'react-arena go';
      reactArena.textContent = '今だ！';
      reactStartTime = performance.now();
    }, delay);
  });

  reactArena.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (reactState === 'wait') {
      clearTimeout(reactTimeout);
      reactState = 'idle';
      reactArena.className = 'react-arena early';
      reactArena.textContent = '早すぎ！';
      reactStat.textContent = '結果: フライング';
      toast('フライング…');
      setTimeout(resetReact, 1200);
      return;
    }
    if (reactState === 'go') {
      const ms = Math.round(performance.now() - reactStartTime);
      reactStat.textContent = '結果: ' + ms + ' ms';
      reactArena.textContent = ms + ' ms';
      addScore(Math.max(1, Math.round(30 - ms / 20)));
      if (ms < 250) {
        confetti(30);
        toast('神反応！ ' + ms + 'ms');
      } else {
        toast(ms + ' ms');
      }
      reactState = 'idle';
      setTimeout(resetReact, 1500);
    }
  });

  // ===== 色ぐるぐる =====
  const hue = document.getElementById('hueRange');
  const sat = document.getElementById('satRange');
  const bri = document.getElementById('briRange');
  const preview = document.getElementById('colorPreview');
  const colorReset = document.getElementById('colorReset');

  function applyColorFilter() {
    const f = `hue-rotate(${hue.value}deg) saturate(${sat.value}%) brightness(${bri.value}%)`;
    preview.style.filter = f;
    document.documentElement.style.filter = f;
  }

  hue.addEventListener('input', applyColorFilter);
  sat.addEventListener('input', applyColorFilter);
  bri.addEventListener('input', applyColorFilter);

  colorReset.addEventListener('click', () => {
    hue.value = 0;
    sat.value = 100;
    bri.value = 100;
    preview.style.filter = '';
    document.documentElement.style.filter = '';
    toast('色をリセット');
  });

  // ページ離脱時にフィルター解除
  window.addEventListener('pagehide', () => {
    document.documentElement.style.filter = '';
  });

  // ===== スローガン =====
  const slogans = [
    '遊びは最強の実験プロトコル',
    '壊して学べ、直して遊べ',
    '今日の仮説: 面白いことは正しい',
    'エラーは新しい遊びの入口',
    '制約ゼロ、想像無限',
    'クリックするたび世界が変わる（気がする）',
    'Asobi Lab. — 退屈はバグ',
    '404は迷子じゃなく冒険者',
    'テーマカラーで人格が変わる説',
    'メニューは電子殻、君は電子',
    '混沌モード推奨環境: いつでも',
    'このサイトはまだ遊んでる最中'
  ];

  const sloganBox = document.getElementById('sloganBox');
  const sloganBtn = document.getElementById('sloganBtn');

  sloganBtn.addEventListener('click', () => {
    const s = slogans[Math.floor(Math.random() * slogans.length)];
    sloganBox.style.opacity = '0';
    sloganBox.style.transform = 'scale(0.96)';
    setTimeout(() => {
      sloganBox.textContent = s;
      sloganBox.style.transition = 'opacity 0.3s, transform 0.3s';
      sloganBox.style.opacity = '1';
      sloganBox.style.transform = 'scale(1)';
    }, 150);
    addScore(1);
  });
})();
