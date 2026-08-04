// js/404.js - Asobi Lab. 前例のない遊び心404
// Canvas粒子 + 物理浮遊オブジェクト + ミニキャッチゲーム
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Messages                                                          */
  /* ------------------------------------------------------------------ */
  const messages = [
    'このページは遊びすぎて、時空の隙間に落ちてしまったようです。',
    '404。実験が暴走したか、ページがサボっている可能性大。',
    '迷子のページを発見…中身は空っぽでした。',
    'ここは存在しない座標です。Asobi Lab. の地図に載っていません。',
    'ページが「もっと遊ぼう」と言って行方不明になりました。',
    '多次元の遊び空間で座標がズレました。',
    'このURLはまだ生まれていません。もしくは既に遊び終わっています。',
    '探索失敗。代わりにこの場で遊んでみませんか？',
    'ページが見つかりません。想像で埋めてみては？',
    'エラーコード: PLAY_TOO_HARD。遊びすぎ注意報です。',
    '実験ログに「帰ってこない」とだけ書かれていました。',
    '404は「失敗」ではなく「新しい遊びの始まり」です。',
    '座標が消えた代わりに、遊び場が生まれました。',
    'このページは「存在しないこと」を全力で楽しんでいます。'
  ];

  const searchingPhrases = [
    '座標を走査中…',
    '遊び空間をスキャン中…',
    '多次元マップを照合中…',
    'ページの気配を探しています…',
    '実験ログを解析中…',
    '時空の隙間を覗き込んでいます…',
    '消えた遊びを再構築中…'
  ];

  const titles = [
    '遊びの座標が消滅しました',
    '存在しない遊び場',
    '迷子の実験室',
    '座標ロスト',
    '遊びが消えた',
    '404次元への入り口'
  ];

  const objLabels = ['あそび', '?', '遊', '!', '実験', '∞', '?', '遊', '!', 'あそ'];

  /* ------------------------------------------------------------------ */
  /*  DOM                                                               */
  /* ------------------------------------------------------------------ */
  const msgEl     = document.getElementById('errorMessage');
  const codeEl    = document.getElementById('errorCode');
  const titleEl   = document.getElementById('errorTitle');
  const hintEl    = document.getElementById('errorHint');
  const reroll    = document.getElementById('rerollBtn');
  const scoreBoard = document.getElementById('scoreBoard');
  const catchCountEl = document.getElementById('catchCount');
  const playObjects = document.getElementById('playObjects');
  const canvas    = document.getElementById('playCanvas');
  const ctx       = canvas.getContext('2d');

  if (!msgEl || !reroll || !canvas) return;

  let currentIndex = Math.floor(Math.random() * messages.length);
  msgEl.textContent = messages[currentIndex];
  titleEl.textContent = titles[Math.floor(Math.random() * titles.length)];

  let isBusy = false;
  let catchCount = 0;
  let clickCount = 0;

  /* ------------------------------------------------------------------ */
  /*  Canvas Particle System                                            */
  /* ------------------------------------------------------------------ */
  let W, H, dpr;
  const particles = [];
  const MAX_PARTICLES = 180;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function getMainColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--main-color').trim() || '#d65f01';
  }
  function getBalanceColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--balance-color').trim() || '#b1c586';
  }

  function createParticle(x, y, opts = {}) {
    const angle = opts.angle ?? Math.random() * Math.PI * 2;
    const speed = opts.speed ?? (2 + Math.random() * 6);
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: opts.decay ?? (0.008 + Math.random() * 0.015),
      size: opts.size ?? (2 + Math.random() * 5),
      color: opts.color || (Math.random() > 0.5 ? getMainColor() : getBalanceColor()),
      gravity: opts.gravity ?? 0.04,
      friction: 0.985
    };
  }

  function burst(x, y, count = 30, opts = {}) {
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push(createParticle(x, y, opts));
    }
  }

  function ambientSpawn() {
    if (particles.length > MAX_PARTICLES * 0.7) return;
    const x = Math.random() * W;
    const y = Math.random() * H;
    particles.push(createParticle(x, y, {
      speed: 0.3 + Math.random() * 0.8,
      size: 1 + Math.random() * 2.5,
      decay: 0.002 + Math.random() * 0.004,
      gravity: 0
    }));
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------ */
  /*  Floating Play Objects (catch game)                                */
  /* ------------------------------------------------------------------ */
  const objects = [];
  const MAX_OBJECTS = 8;

  function spawnObject(isRare = false) {
    if (objects.length >= MAX_OBJECTS) return;

    const size = isRare ? 52 : (36 + Math.random() * 20);
    const el = document.createElement('div');
    el.className = 'play-obj' + (isRare ? ' rare' : '');
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.fontSize = (size * 0.28) + 'px';
    el.textContent = isRare ? '★' : objLabels[Math.floor(Math.random() * objLabels.length)];

    const x = 40 + Math.random() * (W - 80 - size);
    const y = 40 + Math.random() * (H - 120 - size);
    el.style.left = x + 'px';
    el.style.top = y + 'px';

    playObjects.appendChild(el);

    const obj = {
      el,
      x, y,
      vx: (Math.random() - 0.5) * 2.2,
      vy: (Math.random() - 0.5) * 2.2,
      size,
      isRare,
      dragging: false,
      offsetX: 0,
      offsetY: 0
    };

    // Pointer events for drag + catch
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      obj.dragging = true;
      obj.offsetX = e.clientX - obj.x;
      obj.offsetY = e.clientY - obj.y;
      el.setPointerCapture(e.pointerId);
      el.style.zIndex = 10;
    });

    el.addEventListener('pointermove', (e) => {
      if (!obj.dragging) return;
      obj.x = e.clientX - obj.offsetX;
      obj.y = e.clientY - obj.offsetY;
      obj.vx = 0;
      obj.vy = 0;
      el.style.left = obj.x + 'px';
      el.style.top = obj.y + 'px';
    });

    el.addEventListener('pointerup', (e) => {
      if (!obj.dragging) return;
      obj.dragging = false;
      el.style.zIndex = '';

      // Catch!
      catchObject(obj);
    });

    // Click also catches (for touch friendliness)
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!obj.dragging) catchObject(obj);
    });

    objects.push(obj);
  }

  function catchObject(obj) {
    if (obj.el.classList.contains('caught')) return;
    obj.el.classList.add('caught');

    const rect = obj.el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    burst(cx, cy, obj.isRare ? 55 : 28, {
      speed: 3 + Math.random() * 5,
      size: 2 + Math.random() * 4,
      color: obj.isRare ? '#feca57' : getMainColor()
    });

    catchCount += obj.isRare ? 5 : 1;
    catchCountEl.textContent = catchCount;
    scoreBoard.hidden = false;

    // Remove after animation
    setTimeout(() => {
      obj.el.remove();
      const idx = objects.indexOf(obj);
      if (idx !== -1) objects.splice(idx, 1);
    }, 560);

    // Spawn replacement after a bit
    setTimeout(() => {
      if (objects.length < MAX_OBJECTS) {
        spawnObject(Math.random() < 0.12);
      }
    }, 900 + Math.random() * 800);
  }

  function updateObjects() {
    for (const obj of objects) {
      if (obj.dragging) continue;

      obj.x += obj.vx;
      obj.y += obj.vy;

      // Bounce off walls
      if (obj.x < 0) { obj.x = 0; obj.vx *= -0.9; }
      if (obj.y < 0) { obj.y = 0; obj.vy *= -0.9; }
      if (obj.x > W - obj.size) { obj.x = W - obj.size; obj.vx *= -0.9; }
      if (obj.y > H - obj.size) { obj.y = H - obj.size; obj.vy *= -0.9; }

      // Slight gravity + random drift
      obj.vy += 0.01;
      obj.vx += (Math.random() - 0.5) * 0.04;
      obj.vy += (Math.random() - 0.5) * 0.04;

      // Damping
      obj.vx *= 0.998;
      obj.vy *= 0.998;

      obj.el.style.left = obj.x + 'px';
      obj.el.style.top = obj.y + 'px';
    }
  }

  // Initial spawn
  for (let i = 0; i < 5; i++) {
    setTimeout(() => spawnObject(i === 3), 300 + i * 200);
  }

  /* ------------------------------------------------------------------ */
  /*  404 Click → Explode                                               */
  /* ------------------------------------------------------------------ */
  codeEl.addEventListener('click', () => {
    if (isBusy) return;
    clickCount++;

    const rect = codeEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    codeEl.classList.add('is-exploding');
    burst(cx, cy, 70, {
      speed: 4 + Math.random() * 8,
      size: 3 + Math.random() * 6,
      gravity: 0.06
    });

    // Extra ambient particles
    for (let i = 0; i < 20; i++) ambientSpawn();

    setTimeout(() => {
      codeEl.classList.remove('is-exploding');
      codeEl.style.opacity = '1';
      codeEl.style.transform = '';
    }, 600);

    // Easter egg after many clicks
    if (clickCount === 7) {
      hintEl.textContent = '遊び心が溢れてきました…';
      for (let i = 0; i < 3; i++) spawnObject(true);
    }
    if (clickCount === 15) {
      hintEl.textContent = 'あなたは遊びの達人です';
      burst(W / 2, H / 2, 100, { speed: 6, size: 4 });
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Reroll / Search                                                   */
  /* ------------------------------------------------------------------ */
  function pickNext(arr, current) {
    let next;
    do { next = Math.floor(Math.random() * arr.length); }
    while (next === current && arr.length > 1);
    return next;
  }

  function fakeSearch() {
    if (isBusy) return;
    isBusy = true;

    const phrase = searchingPhrases[Math.floor(Math.random() * searchingPhrases.length)];
    hintEl.textContent = phrase;
    hintEl.classList.add('is-searching');
    codeEl.classList.add('is-searching');
    msgEl.classList.add('is-fading');

    // Visual scan effect
    const scanBurst = setInterval(() => {
      burst(Math.random() * W, Math.random() * H, 4, {
        speed: 1 + Math.random() * 2,
        size: 1.5,
        gravity: 0,
        decay: 0.03
      });
    }, 80);

    setTimeout(() => {
      clearInterval(scanBurst);
      currentIndex = pickNext(messages, currentIndex);
      msgEl.textContent = messages[currentIndex];
      titleEl.textContent = titles[Math.floor(Math.random() * titles.length)];
      msgEl.classList.remove('is-fading');

      setTimeout(() => {
        codeEl.classList.remove('is-searching');
        hintEl.classList.remove('is-searching');
        hintEl.textContent = catchCount > 0
          ? `捕まえた遊び: ${catchCount} ｜ 画面の丸を触ってみて`
          : '画面を触ったり、404をクリックしたりしてみてください';
        isBusy = false;
      }, 400);
    }, 900);
  }

  reroll.addEventListener('click', fakeSearch);

  /* ------------------------------------------------------------------ */
  /*  Pointer interaction → particles                                   */
  /* ------------------------------------------------------------------ */
  let lastPointer = { x: 0, y: 0 };
  document.addEventListener('pointermove', (e) => {
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 18) {
      burst(e.clientX, e.clientY, 2, {
        speed: 0.8 + Math.random(),
        size: 1.5 + Math.random() * 2,
        gravity: 0,
        decay: 0.025
      });
      lastPointer = { x: e.clientX, y: e.clientY };
    }
  });

  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.error-btn, .play-obj, a')) return;
    burst(e.clientX, e.clientY, 12, {
      speed: 2 + Math.random() * 4,
      size: 2 + Math.random() * 3
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Main Loop                                                         */
  /* ------------------------------------------------------------------ */
  let lastAmbient = 0;
  function loop(t) {
    updateParticles();
    updateObjects();
    drawParticles();

    if (t - lastAmbient > 180) {
      ambientSpawn();
      lastAmbient = t;
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Occasional rare spawn
  setInterval(() => {
    if (objects.length < MAX_OBJECTS && Math.random() < 0.35) {
      spawnObject(Math.random() < 0.25);
    }
  }, 4500);

})();
