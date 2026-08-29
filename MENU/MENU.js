/**
 * Asobi Lab. Radial Menu — 大幅強化版
 * パーティクル・ガラス表現・アニメーション強化
 * MAP なし / 個人スペース対応
 */
(function () {
  'use strict';
  var SESSION_KEY = 'asobilab_user';
  var path = location.pathname;
  var root = '';
  if (path.indexOf('/pages/members/') >= 0 || path.indexOf('/pages/groups/') >= 0) root = '../../';
  else if (path.indexOf('/pages/') >= 0 || path.indexOf('/users/') >= 0) root = '../';

  function getUser() {
    try {
      var raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  var menuIcons = {};
  function loadMenuIcons(cb) {
    var url = root + 'src/cms/menu-icons.json';
    fetch(url + '?t=' + Date.now()).then(function (r) {
      if (!r.ok) return {};
      return r.json();
    }).then(function (data) {
      menuIcons = data || {};
      if (cb) cb();
    }).catch(function () {
      menuIcons = {};
      if (cb) cb();
    });
  }

  function iconFor(urlPath, fallbackEmoji) {
    if (menuIcons && menuIcons[urlPath]) {
      return { type: 'img', src: menuIcons[urlPath] };
    }
    return { type: 'emoji', src: fallbackEmoji };
  }

  function buildMenuData() {
    var data = [
      { label: 'ホーム', icon: '🏠', url: root + 'index.html' },
      { label: 'Asobi Labとは', icon: '🎮', url: root + 'pages/about_asobi.html' },
      { label: 'サイトについて', icon: 'ℹ️', url: root + 'pages/about_This_Site.html' },
      {
        label: 'グループ', icon: '👥', items: [
          { label: 'すけぼぉ', icon: '🛹', url: root + 'pages/groups/skate.html' },
          { label: 'ファッション', icon: '👗', url: root + 'pages/groups/fashion.html' },
          { label: '建築', icon: '🏗️', url: root + 'pages/groups/arch.html' }
        ]
      },
      {
        label: 'メンバー', icon: '🧑‍🤝‍🧑', items: [
          { label: '樊澤熙', icon: '✨', url: root + 'pages/members/r22289hh.html' },
          { label: '福島駿', icon: '✨', url: root + 'pages/members/r22321fs.html' },
          { label: '川端也大', icon: '✨', url: root + 'pages/members/r22497kk.html' },
          { label: '草深りお', icon: '✨', url: root + 'pages/members/r22570kr.html' },
          { label: '小林和輝', icon: '✨', url: root + 'pages/members/r22661kk.html' },
          { label: '奥村京太', icon: '✨', url: root + 'pages/members/r25173ok.html' },
          { label: '齊藤絢太', icon: '✨', url: root + 'pages/members/r25321sa.html' },
          { label: '佐藤ちほ', icon: '✨', url: root + 'pages/members/r25339sc.html' },
          { label: '神季美花', icon: '✨', url: root + 'pages/members/r25404jk.html' },
          { label: '野田彩夏', icon: '✨', url: root + 'pages/members/r25660na.html' },
          { label: '柳原康希', icon: '✨', url: root + 'pages/members/r25917yk.html' }
        ]
      },
      { label: '松丸先生', icon: '🎯', url: root + 'pages/Matsumaru_T.html' }
    ];
    if (getUser()) data.push({ label: 'CMS', icon: '✏️', url: root + 'admin.html' });
    /* ファビコン由来のアイコンを適用 */
    function enrich(items) {
      items.forEach(function (it) {
        if (it.url) {
          var key = it.url.replace(root, '');
          if (menuIcons[key]) it.iconUrl = menuIcons[key];
        }
        if (it.items) enrich(it.items);
      });
    }
    enrich(data);
    return data;
  }

  var LONG_PRESS_MS = 360;
  var TRIPLE_TAP_DELAY_MS = 300;
  var MOVE_THRESHOLD = 8;
  var SHELL_CAPACITIES = [6, 10, 14];
  var SHELL_RADII = [118, 190, 262];

  var menuEl, itemsContainer, orbitsContainer, coreBtn, canvas, ctx;
  var timer, startX, startY, isOpen = false, menuStack = [];
  var tapCount = 0, tapTimer = null;

  function navigateWithDelay(url) {
    closeMenu();
    setTimeout(function () { location.href = url; }, 180);
  }

  function triggerParticleBurst() {
    if (!canvas || !ctx) return;
    canvas.width = 640;
    canvas.height = 640;
    var cX = 320, cY = 320;
    var ring1R = 12, ring1A = 1;
    var ring2R = 6, ring2A = 0.85;
    var particles = [];
    for (var i = 0; i < 32; i++) {
      var a = (i / 32) * Math.PI * 2 + Math.random() * 0.2;
      var spd = Math.random() * 7.5 + 3.2;
      particles.push({
        x: cX, y: cY,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        size: Math.random() * 3.2 + 1.4,
        color: 'hsl(' + (Math.random() * 40 + 350) + ', 90%, 65%)',
        alpha: 1
      });
    }
    function draw() {
      ctx.clearRect(0, 0, 640, 640);
      if (ring1A > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, ring1R, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,107,107,' + ring1A + ')';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ring1R += 8.5;
        ring1A -= 0.045;
      }
      if (ring2A > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, ring2R, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,209,102,' + ring2A + ')';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ring2R += 6.8;
        ring2A -= 0.036;
      }
      var alive = false;
      particles.forEach(function (p) {
        if (p.alpha > 0) {
          alive = true;
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.92; p.vy *= 0.92;
          p.alpha -= 0.032;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      if (ring1A > 0 || ring2A > 0 || alive) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, 640, 640);
    }
    draw();
  }

  function calculateShellLayout(items) {
    var layout = [], remaining = items.length, itemIdx = 0;
    for (var sIdx = 0; sIdx < SHELL_CAPACITIES.length && remaining > 0; sIdx++) {
      var count = Math.min(remaining, SHELL_CAPACITIES[sIdx]);
      var radius = SHELL_RADII[sIdx];
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        layout.push({
          item: items[itemIdx],
          x: Math.round(Math.cos(angle) * radius),
          y: Math.round(Math.sin(angle) * radius),
          shellIndex: sIdx
        });
        itemIdx++;
      }
      remaining -= count;
    }
    return layout;
  }

  function renderMenuLevel(items) {
    var old = itemsContainer.querySelectorAll('.rm-item');
    for (var i = 0; i < old.length; i++) {
      old[i].classList.remove('rendered');
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220); })(old[i]);
    }
    orbitsContainer.innerHTML = '';
    var layout = calculateShellLayout(items);
    var activeShells = {};
    layout.forEach(function (data, index) {
      activeShells[data.shellIndex] = true;
      var btn = document.createElement('button');
      btn.className = 'rm-item' + (data.item.items ? ' has-sub' : '');
      btn.setAttribute('data-label', data.item.label);
      if (data.item.iconUrl) {
        btn.innerHTML = '<img src="' + data.item.iconUrl + '" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover">';
      } else {
        btn.innerHTML = data.item.icon;
      }
      btn.style.setProperty('--x', data.x + 'px');
      btn.style.setProperty('--y', data.y + 'px');
      btn.style.transitionDelay = (index * 0.024) + 's';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (data.item.items && data.item.items.length) {
          menuStack.push(items);
          renderMenuLevel(data.item.items);
          triggerParticleBurst();
        } else if (data.item.url) {
          navigateWithDelay(data.item.url);
        }
      });
      itemsContainer.appendChild(btn);
      requestAnimationFrame(function () {
        setTimeout(function () { btn.classList.add('rendered'); }, 14);
      });
    });
    Object.keys(activeShells).forEach(function (sIdx) {
      sIdx = +sIdx;
      var orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      var d = SHELL_RADII[sIdx] * 2;
      orbit.style.width = d + 'px';
      orbit.style.height = d + 'px';
      orbit.style.marginTop = -SHELL_RADII[sIdx] + 'px';
      orbit.style.marginLeft = -SHELL_RADII[sIdx] + 'px';
      orbitsContainer.appendChild(orbit);
    });
    coreBtn.classList.toggle('visible', menuStack.length > 0);
  }

  function createMenuDOM() {
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
    coreBtn.innerHTML = '←';
    coreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menuStack.length) {
        renderMenuLevel(menuStack.pop());
        triggerParticleBurst();
      } else closeMenu();
    });
    menuEl.appendChild(coreBtn);
    document.body.appendChild(menuEl);
  }

  function openMenu(x, y) {
    if (!menuEl) return;
    var margin = 180;
    menuEl.style.left = Math.max(margin, Math.min(x || window.innerWidth / 2, window.innerWidth - margin)) + 'px';
    menuEl.style.top = Math.max(margin, Math.min(y || window.innerHeight / 2, window.innerHeight - margin)) + 'px';
    menuEl.classList.add('active');
    isOpen = true;
    menuStack = [];
    loadMenuIcons(function () {
      renderMenuLevel(buildMenuData());
      triggerParticleBurst();
    });
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    itemsContainer.querySelectorAll('.rm-item').forEach(function (i) { i.classList.remove('rendered'); });
    coreBtn.classList.remove('visible');
    isOpen = false;
  }

  function mountAuthHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var old = header.querySelector('.header-auth');
    if (old) old.remove();
    var box = document.createElement('div');
    box.className = 'header-auth';
    var user = getUser();
    if (user) {
      box.innerHTML = '<span class="auth-name">' + (user.name || user.id) + '</span>' +
        '<a class="auth-btn auth-cms" href="' + root + 'admin.html">CMS</a>' +
        '<button type="button" class="auth-btn" id="auth-logout">ログアウト</button>';
      header.appendChild(box);
      var lo = document.getElementById('auth-logout');
      if (lo) lo.onclick = function () {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        location.reload();
      };
    } else {
      box.innerHTML = '<a class="auth-btn" href="' + root + 'admin.html">ログイン</a>';
      header.appendChild(box);
    }
    if (!document.querySelector('.menu-fab')) {
      var fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'menu-fab';
      fab.setAttribute('aria-label', 'メニューを開く');
      fab.innerHTML = '☰';
      document.body.appendChild(fab);
      fab.onclick = function (e) {
        e.stopPropagation();
        openMenu(window.innerWidth / 2, window.innerHeight * 0.42);
      };
    }
  }

  function initEvents() {
    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest && (e.target.closest('.menu-fab') || e.target.closest('.header-auth'))) return;
      if (isOpen && menuEl && !menuEl.contains(e.target)) {
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
      tapTimer = setTimeout(function () { tapCount = 0; }, TRIPLE_TAP_DELAY_MS);
      clearTimeout(timer);
      timer = setTimeout(function () {
        tapCount = 0;
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    });
    document.addEventListener('pointermove', function (e) {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(timer);
        timer = null;
      }
    });
    document.addEventListener('pointerup', function () {
      if (timer && !isOpen) {
        clearTimeout(timer);
        timer = null;
      }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) closeMenu();
        else openMenu();
      }
      if (e.key === 'Escape' && isOpen) closeMenu();
    });
  }

  function boot() {
    createMenuDOM();
    initEvents();
    mountAuthHeader();
    loadMenuIcons(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
