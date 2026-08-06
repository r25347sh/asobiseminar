/**
 * 📋 Asobi Lab. Radial Menu v3
 * Scrim + ambient glow + refined particles
 */
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', url: '/asobiseminar/index.html' },
  { label: '遊び場', icon: '🧪', url: '/asobiseminar/subpages/playground.html' },
  { label: 'メンバー', icon: '👱', url: '/asobiseminar/subpages/members.html' },
  {
    label: 'グループ',
    icon: '📗',
    items: [
      { label: '目次', icon: '🔖', url: '/asobiseminar/subpages/groups/index.html' },
      { label: 'スケボー', icon: '🛹', url: '/asobiseminar/subpages/groups/one.html' },
      { label: '割り箸建築', icon: '🥢', url: '/asobiseminar/subpages/groups/two.html' },
      { label: 'ファッション', icon: '👗', url: '/asobiseminar/subpages/groups/three.html' },
      { label: 'Web魔道士', icon: '🔮', url: '/asobiseminar/subpages/groups/programmer.html' },
      { label: '英語ゲーマー', icon: '🎮', url: '/asobiseminar/subpages/groups/englishgame.html' }
    ]
  },
  { label: 'ギャラリー', icon: '📁', url: '/asobiseminar/subpages/gallery.html' },
  { label: 'このサイトについて', icon: '⭐', url: '/asobiseminar/subpages/aboutsite.html' },
  { label: '設定', icon: '⚙', url: '/asobiseminar/settings.html' }
];

(function () {
  const LONG_PRESS_MS = 360;
  const TRIPLE_TAP_DELAY_MS = 300;
  const MOVE_THRESHOLD = 8;
  const SHELL_CAPACITIES = [6, 10, 14];
  const SHELL_RADII = [115, 185, 255];

  let menuEl = null;
  let scrimEl = null;
  let itemsContainer = null;
  let orbitsContainer = null;
  let coreBtn = null;
  let canvas = null;
  let ctx = null;
  let timer = null;
  let startX = 0, startY = 0;
  let isOpen = false;
  let menuStack = [];
  let tapCount = 0;
  let tapTimer = null;

  function navigateWithDelay(url) {
    closeMenu();
    setTimeout(() => { location.href = url; }, 180);
  }

  function loadCssScript() {
    const existing = document.getElementById('dynamic-load-css');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'dynamic-load-css';
    script.src = '/asobiseminar/js/load-css.js';
    script.async = true;
    document.head.appendChild(script);
  }

  function triggerParticleBurst() {
    if (!canvas || !ctx) return;
    canvas.width = 600;
    canvas.height = 600;
    const cX = 300, cY = 300;
    let ring1Radius = 8, ring1Alpha = 1;
    let ring2Radius = 4, ring2Alpha = 0.9;
    let ring3Radius = 2, ring3Alpha = 0.7;

    const particles = Array.from({ length: 40 }, (_, idx) => {
      const a = (idx / 40) * Math.PI * 2 + Math.random() * 0.18;
      const spd = Math.random() * 7.5 + 2.8;
      const isGold = Math.random() > 0.4;
      return {
        x: cX, y: cY,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: Math.random() * 2.6 + 1.2,
        color: isGold
          ? `hsla(${40 + Math.random() * 20}, 92%, ${58 + Math.random() * 22}%, 1)`
          : `hsla(${130 + Math.random() * 35}, 75%, ${45 + Math.random() * 20}%, 1)`,
        alpha: 1,
        drag: 0.91 + Math.random() * 0.04
      };
    });

    function draw() {
      ctx.clearRect(0, 0, 600, 600);
      if (ring1Alpha > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, ring1Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 160, 90, ${ring1Alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ring1Radius += 9;
        ring1Alpha -= 0.045;
      }
      if (ring2Alpha > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, ring2Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 197, 71, ${ring2Alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ring2Radius += 7;
        ring2Alpha -= 0.04;
      }
      if (ring3Alpha > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, ring3Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(240, 208, 96, ${ring3Alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ring3Radius += 5.5;
        ring3Alpha -= 0.035;
      }

      let alive = false;
      particles.forEach(p => {
        if (p.alpha <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.alpha -= 0.028;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (ring1Alpha > 0 || ring2Alpha > 0 || ring3Alpha > 0 || alive) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, 600, 600);
      }
    }
    draw();
  }

  function calculateShellLayout(items) {
    const layout = [];
    let remaining = items.length, itemIdx = 0;
    for (let sIdx = 0; sIdx < SHELL_CAPACITIES.length && remaining > 0; sIdx++) {
      const capacity = SHELL_CAPACITIES[sIdx];
      const countInShell = Math.min(remaining, capacity);
      const radius = SHELL_RADII[sIdx];
      for (let i = 0; i < countInShell; i++) {
        const angle = (i / countInShell) * 2 * Math.PI - (Math.PI / 2);
        layout.push({
          item: items[itemIdx],
          x: Math.round(Math.cos(angle) * radius),
          y: Math.round(Math.sin(angle) * radius),
          shellIndex: sIdx
        });
        itemIdx++;
      }
      remaining -= countInShell;
    }
    return layout;
  }

  function renderMenuLevel(items) {
    itemsContainer.querySelectorAll('.rm-item').forEach(el => {
      el.classList.remove('rendered');
      setTimeout(() => el.remove(), 220);
    });
    orbitsContainer.innerHTML = '';
    const layout = calculateShellLayout(items);
    const activeShells = new Set();

    layout.forEach((data, index) => {
      activeShells.add(data.shellIndex);
      const btn = document.createElement('button');
      btn.className = 'rm-item' + (data.item.items ? ' has-sub' : '');
      btn.setAttribute('data-label', data.item.label);
      btn.innerHTML = data.item.icon;
      btn.style.setProperty('--x', data.x + 'px');
      btn.style.setProperty('--y', data.y + 'px');
      btn.style.transitionDelay = (index * 0.028) + 's';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (data.item.items && data.item.items.length > 0) {
          menuStack.push(items);
          renderMenuLevel(data.item.items);
          triggerParticleBurst();
        } else if (data.item.url) {
          navigateWithDelay(data.item.url);
        } else if (data.item.action) {
          data.item.action();
          closeMenu();
        }
      });
      itemsContainer.appendChild(btn);
      requestAnimationFrame(() => setTimeout(() => btn.classList.add('rendered'), 12));
    });

    activeShells.forEach(sIdx => {
      const orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      const d = SHELL_RADII[sIdx] * 2;
      orbit.style.width = d + 'px';
      orbit.style.height = d + 'px';
      orbit.style.marginTop = -SHELL_RADII[sIdx] + 'px';
      orbit.style.marginLeft = -SHELL_RADII[sIdx] + 'px';
      orbit.style.transitionDelay = (sIdx * 0.06) + 's';
      orbitsContainer.appendChild(orbit);
    });

    if (menuStack.length > 0) coreBtn.classList.add('visible');
    else coreBtn.classList.remove('visible');
  }

  function createMenuDOM() {
    if (document.querySelector('.radial-menu-wrapper')) return;

    scrimEl = document.createElement('div');
    scrimEl.className = 'rm-scrim';
    scrimEl.addEventListener('click', () => closeMenu());
    document.body.appendChild(scrimEl);

    menuEl = document.createElement('div');
    menuEl.className = 'radial-menu-wrapper';

    canvas = document.createElement('canvas');
    canvas.className = 'rm-canvas-layer';
    ctx = canvas.getContext('2d');
    menuEl.appendChild(canvas);

    orbitsContainer = document.createElement('div');
    menuEl.appendChild(orbitsContainer);

    itemsContainer = document.createElement('div');
    menuEl.appendChild(itemsContainer);

    coreBtn = document.createElement('button');
    coreBtn.className = 'rm-core-btn';
    coreBtn.innerHTML = '✕';
    coreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menuStack.length > 0) {
        renderMenuLevel(menuStack.pop());
        triggerParticleBurst();
      } else closeMenu();
    });
    menuEl.appendChild(coreBtn);
    document.body.appendChild(menuEl);
  }

  function openMenu(x, y) {
    const margin = 190;
    menuEl.style.left = Math.max(margin, Math.min(x, window.innerWidth - margin)) + 'px';
    menuEl.style.top = Math.max(margin, Math.min(y, window.innerHeight - margin)) + 'px';
    menuEl.classList.add('active');
    if (scrimEl) scrimEl.classList.add('active');
    isOpen = true;
    menuStack = [];
    renderMenuLevel(RADIAL_MENU_DATA);
    triggerParticleBurst();
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    if (scrimEl) scrimEl.classList.remove('active');
    itemsContainer.querySelectorAll('.rm-item').forEach(el => el.classList.remove('rendered'));
    coreBtn.classList.remove('visible');
    isOpen = false;
    loadCssScript();
  }

  function initEvents() {
    document.addEventListener('pointerdown', (e) => {
      if (isOpen && menuEl.contains(e.target)) return;
      if (isOpen && !menuEl.contains(e.target)) {
        closeMenu();
        return;
      }

      startX = e.clientX;
      startY = e.clientY;
      tapCount++;
      clearTimeout(tapTimer);

      if (tapCount === 3) {
        clearTimeout(timer);
        timer = null;
        tapCount = 0;
        openMenu(startX, startY);
        return;
      }

      tapTimer = setTimeout(() => { tapCount = 0; }, TRIPLE_TAP_DELAY_MS);
      clearTimeout(timer);
      timer = setTimeout(() => {
        tapCount = 0;
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    });

    document.addEventListener('pointermove', (e) => {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(timer);
        timer = null;
      }
    });

    document.addEventListener('pointerup', () => {
      if (timer && !isOpen) {
        clearTimeout(timer);
        timer = null;
      }
    });

    document.addEventListener('contextmenu', (e) => {
      if (isOpen) e.preventDefault();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { createMenuDOM(); initEvents(); });
  } else {
    createMenuDOM();
    initEvents();
  }
})();
