/**
 * Asobi Lab. Radial Menu — restored full + updated routes
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
  var menuIconsLoaded = false;
  function loadMenuIcons(cb) {
    if (menuIconsLoaded) { if (cb) cb(); return; }
    fetch(root + 'src/cms/menu-icons.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (data) { menuIcons = data || {}; menuIconsLoaded = true; if (cb) cb(); })
      .catch(function () { menuIcons = {}; menuIconsLoaded = true; if (cb) cb(); });
  }

  function buildMenuData() {
    var data = [
      { label: 'ホーム', icon: '🏠', url: root + 'index.html' },
      { label: 'Asobi Labとは', icon: '🎮', url: root + 'pages/about_asobi.html' },
      { label: 'サイトについて', icon: 'ℹ️', url: root + 'pages/about_This_Site.html' },
      {
        label: 'グループ', icon: '👥', items: [
          { label: 'オンラインゲーム×英語', icon: '🎮', url: root + 'pages/groups/english.html' },
          { label: 'ファッションについて', icon: '👗', url: root + 'pages/groups/fashion.html' },
          { label: 'スケボーと俺等の青春', icon: '🛹', url: root + 'pages/groups/skate.html' },
          { label: '脆い割り箸ビルを探求で強くする', icon: '🏗️', url: root + 'pages/groups/arch.html' },
          { label: 'サイト作成', icon: '💻', url: root + 'pages/about_This_Site.html' }
        ]
      },
      {
        label: 'メンバー', icon: '🧑‍🤝‍🧑', items: [
          { label: '奥村京太', icon: '🛹', url: root + 'pages/members/r25173ok.html' },
          { label: '柳原康希', icon: '🛹', url: root + 'pages/members/r25917yk.html' },
          { label: '福島駿', icon: '🛹', url: root + 'pages/members/r22321fs.html' },
          { label: '川端也大', icon: '🌐', url: root + 'pages/members/r22497kk.html' },
          { label: '齊藤絢太', icon: '🏗️', url: root + 'pages/members/r25321sa.html' },
          { label: '野田彩夏', icon: '🏗️', url: root + 'pages/members/r25660na.html' },
          { label: '小林和輝', icon: '🏗️', url: root + 'pages/members/r22661kk.html' },
          { label: '草深りお', icon: '👗', url: root + 'pages/members/r22570kr.html' },
          { label: '神季美花', icon: '👗', url: root + 'pages/members/r25404jk.html' },
          { label: '樊澤熙', icon: '👗', url: root + 'pages/members/r22289hh.html' },
          { label: '佐藤ちほ', icon: '👗', url: root + 'pages/members/r25339sc.html' },
          { label: '佐藤晴', icon: '💻', url: root + 'pages/members/r25347sh.html' }
        ]
      },
      { label: '松丸先生', icon: '🎯', url: root + 'pages/Matsumaru_T.html' }
    ];
    if (getUser()) data.push({ label: 'CMS', icon: '✏️', url: root + 'login.html' });
    else data.push({ label: 'CMSログイン', icon: '🔑', url: root + 'login.html' });
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
  var pieDisabled = false;
  var tapCount = 0, tapTimer = null;

  function navigateWithDelay(url) {
    closeMenu();
    setTimeout(function () { location.href = url; }, 180);
  }

  function createMenuDOM() {
    if (document.getElementById('radial-menu')) return;
    var wrap = document.createElement('div');
    wrap.id = 'radial-menu';
    wrap.innerHTML = '<canvas id="rm-canvas"></canvas><div class="rm-orbits"></div><div class="rm-items"></div><button type="button" class="rm-core" id="rm-core" aria-label="メニュー">☰</button>';
    document.body.appendChild(wrap);
    menuEl = wrap;
    itemsContainer = wrap.querySelector('.rm-items');
    orbitsContainer = wrap.querySelector('.rm-orbits');
    coreBtn = wrap.querySelector('#rm-core');
    canvas = wrap.querySelector('#rm-canvas');
    if (canvas) ctx = canvas.getContext('2d');
  }

  function closeMenu() {
    isOpen = false;
    menuStack = [];
    if (menuEl) menuEl.classList.remove('open');
    if (itemsContainer) itemsContainer.innerHTML = '';
    if (orbitsContainer) orbitsContainer.innerHTML = '';
  }

  function openMenu(items) {
    if (pieDisabled) return;
    isOpen = true;
    if (menuEl) menuEl.classList.add('open');
    renderShell(items || buildMenuData());
  }

  function renderShell(items) {
    if (!itemsContainer) return;
    itemsContainer.innerHTML = '';
    if (orbitsContainer) orbitsContainer.innerHTML = '';
    var list = items || [];
    var n = list.length;
    var shell = 0;
    var radius = SHELL_RADII[0];
    for (var i = 0; i < n; i++) {
      if (i >= SHELL_CAPACITIES[shell] && shell < SHELL_RADII.length - 1) {
        shell++;
        radius = SHELL_RADII[shell];
      }
      var item = list[i];
      var angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
      var x = Math.cos(angle) * radius;
      var y = Math.sin(angle) * radius;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rm-item' + (item.items ? ' has-children' : '');
      btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      btn.innerHTML = '<span class="rm-emoji">' + (item.icon || '•') + '</span><span class="rm-label">' + (item.label || '') + '</span>';
      (function (it) {
        btn.onclick = function (e) {
          e.stopPropagation();
          if (it.items && it.items.length) {
            menuStack.push(buildMenuData());
            renderShell(it.items);
          } else if (it.url) {
            navigateWithDelay(it.url);
          }
        };
      })(item);
      itemsContainer.appendChild(btn);
    }
    if (menuStack.length) {
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'rm-item rm-back';
      back.textContent = '← 戻る';
      back.onclick = function (e) {
        e.stopPropagation();
        var prev = menuStack.pop();
        renderShell(prev || buildMenuData());
      };
      itemsContainer.appendChild(back);
    }
  }

  function initEvents() {
    if (!coreBtn) return;
    coreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isOpen) closeMenu();
      else {
        loadMenuIcons(function () { openMenu(buildMenuData()); });
      }
    });
    document.addEventListener('click', function (e) {
      if (isOpen && menuEl && !menuEl.contains(e.target)) closeMenu();
    });
    var pressTimer = null;
    document.addEventListener('touchstart', function (e) {
      if (pieDisabled) return;
      if (e.touches.length !== 1) return;
      var t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      pressTimer = setTimeout(function () {
        loadMenuIcons(function () { openMenu(buildMenuData()); });
      }, LONG_PRESS_MS);
    }, { passive: true });
    document.addEventListener('touchend', function () {
      if (pressTimer) clearTimeout(pressTimer);
    });
    document.addEventListener('touchmove', function (e) {
      if (!pressTimer || !e.touches[0]) return;
      var t = e.touches[0];
      if (Math.abs(t.clientX - startX) > MOVE_THRESHOLD || Math.abs(t.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }, { passive: true });
  }

  function mountAuthHeader() {
    var host = document.querySelector('.site-header') || document.body;
    if (document.getElementById('auth-box')) return;
    var box = document.createElement('div');
    box.id = 'auth-box';
    box.className = 'auth-box';
    var u = getUser();
    if (u) {
      box.innerHTML = '<span class="auth-name">' + (u.name || u.id || '') + '</span>' +
        '<a class="auth-btn auth-cms" href="' + root + 'login.html">CMS</a>' +
        '<button type="button" class="auth-btn" id="auth-logout">ログアウト</button>';
    } else {
      box.innerHTML = '<a class="auth-btn" href="' + root + 'login.html">ログイン</a>';
    }
    host.appendChild(box);
    var lo = document.getElementById('auth-logout');
    if (lo) lo.onclick = function () {
      try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
      location.reload();
    };
  }

  function ensureHamburgerUI() {
    if (document.getElementById('ham-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'ham-overlay';
    ov.className = 'ham-overlay';
    var panel = document.createElement('div');
    panel.id = 'ham-panel';
    panel.className = 'ham-panel';
    panel.innerHTML = '<button type="button" id="ham-close" class="ham-close">×</button><div id="ham-list" class="ham-list"></div>';
    document.body.appendChild(ov);
    document.body.appendChild(panel);
    document.getElementById('ham-close').onclick = closeHamburger;
    ov.onclick = closeHamburger;
  }

  function openHamburger() {
    ensureHamburgerUI();
    pieDisabled = true;
    closeMenu();
    var list = document.getElementById('ham-list');
    list.innerHTML = '';
    loadMenuIcons(function () {
      buildMenuData().forEach(function (item) {
        if (item.items && item.items.length) {
          var wrap = document.createElement('div');
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ham-group-btn';
          btn.textContent = (item.icon ? item.icon + ' ' : '') + item.label;
          var sub = document.createElement('div');
          sub.className = 'ham-sub';
          sub.style.display = 'none';
          item.items.forEach(function (subItem) {
            var a = document.createElement('a');
            a.href = subItem.url || '#';
            a.textContent = (subItem.icon ? subItem.icon + ' ' : '') + subItem.label;
            sub.appendChild(a);
          });
          btn.onclick = function () { sub.style.display = sub.style.display === 'none' ? 'flex' : 'none'; };
          wrap.appendChild(btn);
          wrap.appendChild(sub);
          list.appendChild(wrap);
        } else {
          var a = document.createElement('a');
          a.className = 'ham-link';
          a.href = item.url || '#';
          a.textContent = (item.icon ? item.icon + ' ' : '') + item.label;
          list.appendChild(a);
        }
      });
      document.getElementById('ham-overlay').classList.add('open');
      document.getElementById('ham-panel').classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  function closeHamburger() {
    var ov = document.getElementById('ham-overlay');
    var panel = document.getElementById('ham-panel');
    if (ov) ov.classList.remove('open');
    if (panel) panel.classList.remove('open');
    document.body.style.overflow = '';
    pieDisabled = false;
  }

  function boot() {
    createMenuDOM();
    initEvents();
    mountAuthHeader();
    loadMenuIcons(function () {});
    var hamBtn = document.createElement('button');
    hamBtn.type = 'button';
    hamBtn.className = 'ham-fab';
    hamBtn.setAttribute('aria-label', 'メニュー');
    hamBtn.textContent = '☰';
    hamBtn.onclick = openHamburger;
    document.body.appendChild(hamBtn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
