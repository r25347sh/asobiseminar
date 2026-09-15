/**
 * Asobi Lab. Radial Menu
 * 公開メニューから CMS/ログイン誘導を削除（login.html / admin は残置）
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
    var url = root + 'src/cms/menu-icons.json';
    fetch(url + '?t=' + Date.now()).then(function (r) {
      return r.ok ? r.json() : {};
    }).then(function (data) {
      menuIcons = data || {};
      menuIconsLoaded = true;
      if (cb) cb();
    }).catch(function () {
      menuIcons = {};
      menuIconsLoaded = true;
      if (cb) cb();
    });
  }

  function buildMenuData() {
    var data = [
      { label: 'ホーム', icon: '🏠', url: root + 'index.html' },
      { label: 'Asobi Labとは', icon: '🎮', url: root + 'pages/about_asobi.html' },
      { label: 'サイトについて', icon: 'ℹ️', url: root + 'pages/about_This_Site.html' },
      { label: 'サイトマップ', icon: '🗺️', url: root + 'sitemap.html' },
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
        e.preventDefault();
        e.stopPropagation();
        if (data.item.items && data.item.items.length) {
          menuStack.push(items);
          renderMenuLevel(data.item.items);
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
      if (menuStack.length) renderMenuLevel(menuStack.pop());
      else closeMenu();
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
      if (!isOpen || menuStack.length > 0) return;
      renderMenuLevel(buildMenuData());
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
        '<button type="button" class="auth-btn" id="auth-logout">ログアウト</button>';
      header.appendChild(box);
      var lo = document.getElementById('auth-logout');
      if (lo) lo.onclick = function () {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        location.reload();
      };
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
        openHamburger();
      };
    }
    ensureHamburgerUI();
  }

  function initEvents() {
    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest && (e.target.closest('.menu-fab') || e.target.closest('.header-auth') || e.target.closest('.radial-menu-wrapper') || e.target.closest('#ham-panel') || e.target.closest('#ham-overlay'))) return;
      if (isOpen && menuEl && !menuEl.contains(e.target)) { closeMenu(); return; }
      startX = e.clientX; startY = e.clientY;
      tapCount++;
      clearTimeout(tapTimer);
      if (tapCount === 3) {
        clearTimeout(timer); timer = null; tapCount = 0;
        if (!pieDisabled) openMenu(startX, startY);
        return;
      }
      tapTimer = setTimeout(function () { tapCount = 0; }, TRIPLE_TAP_DELAY_MS);
      if (pieDisabled) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (pieDisabled) return;
        tapCount = 0;
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    });
    document.addEventListener('pointermove', function (e) {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(timer); timer = null;
      }
    });
    document.addEventListener('pointerup', function () {
      if (timer && !isOpen) { clearTimeout(timer); timer = null; }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (pieDisabled) return;
        if (isOpen) closeMenu(); else openMenu();
      }
      if (e.key === 'Escape' && pieDisabled) closeHamburger();
      if (e.key === 'Escape' && isOpen) closeMenu();
    });
  }

  function ensureHamburgerUI() {
    if (document.getElementById('ham-overlay')) return;
    var style = document.createElement('style');
    style.id = 'ham-style';
    style.textContent = '#ham-overlay{position:fixed;inset:0;z-index:100000;display:none;background:rgba(20,16,32,.55);backdrop-filter:blur(6px)}#ham-overlay.open{display:block}#ham-panel{position:fixed;inset:0;z-index:100001;display:none;flex-direction:column;background:linear-gradient(165deg,#1e1b2e,#3d2a5c);color:#fff;padding:1.25rem;overflow:auto}#ham-panel.open{display:flex}#ham-list{display:flex;flex-direction:column;gap:.55rem}.ham-link,.ham-group-btn{display:block;width:100%;text-align:left;padding:.9rem 1rem;border-radius:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff;text-decoration:none;font:inherit;cursor:pointer}.ham-sub{display:none;flex-direction:column;gap:.35rem;padding-left:1rem}.ham-sub a{color:#f0eaf8;text-decoration:none;padding:.5rem}.ham-close{border:0;background:rgba(255,255,255,.12);color:#fff;width:42px;height:42px;border-radius:50%;cursor:pointer}';
    document.head.appendChild(style);
    var ov = document.createElement('div');
    ov.id = 'ham-overlay';
    var panel = document.createElement('div');
    panel.id = 'ham-panel';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><div style="font-weight:700">🎮 Asobi Lab. Menu</div><button type="button" class="ham-close" id="ham-close">✕</button></div><div id="ham-list"></div>';
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
          item.items.forEach(function (subItem) {
            var a = document.createElement('a');
            a.href = subItem.url || '#';
            a.textContent = (subItem.icon ? subItem.icon + ' ' : '') + subItem.label;
            sub.appendChild(a);
          });
          btn.onclick = function () { sub.style.display = sub.style.display === 'flex' ? 'none' : 'flex'; };
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
    });
  }

  function closeHamburger() {
    var ov = document.getElementById('ham-overlay');
    var panel = document.getElementById('ham-panel');
    if (ov) ov.classList.remove('open');
    if (panel) panel.classList.remove('open');
    pieDisabled = false;
  }

  function boot() {
    createMenuDOM();
    initEvents();
    mountAuthHeader();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
