/**
 * Asobi Lab. Radial Menu
 */
(function () {
  var SESSION_KEY = 'asobilab_user';
  var path = location.pathname;
  var root = '';
  if (path.indexOf('/pages/members/') >= 0 || path.indexOf('/pages/groups/') >= 0) root = '../../';
  else if (path.indexOf('/pages/') >= 0) root = '../';

  function getUser() {
    try {
      var raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function buildMenuData() {
    var data = [
      { label: 'ホーム', icon: '🏠', url: root + 'index.html' },
      { label: 'Asobi Labとは', icon: '🎮', url: root + 'pages/about_asobi.html' },
      { label: 'サイトについて', icon: 'ℹ️', url: root + 'pages/about_This_Site.html' },
      { label: 'MAP', icon: '🗺️', url: root + 'map.html' },
      { label: 'グループ', icon: '👥', items: [
          { label: 'すけぼぉ', icon: '🛹', url: root + 'pages/groups/skate.html' },
          { label: 'ファッション', icon: '👗', url: root + 'pages/groups/fashion.html' },
          { label: '建築', icon: '🏗️', url: root + 'pages/groups/arch.html' }
        ]},
      { label: 'メンバー', icon: '🧑‍🤝‍🧑', items: [
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
        ]},
      { label: '松丸', icon: '🎯', url: root + 'pages/Matsumaru_T.html' }
    ];
    if (getUser()) data.push({ label: 'CMS', icon: '✏️', url: root + 'admin.html' });
    return data;
  }

  var LONG_PRESS_MS = 380, MOVE_THRESHOLD = 10;
  var SHELL_CAPACITIES = [6, 10, 14], SHELL_RADII = [118, 188, 258];
  var menuEl, itemsContainer, orbitsContainer, coreBtn;
  var timer, startX, startY, isOpen = false, menuStack = [];

  function navigateWithDelay(url) {
    closeMenu();
    setTimeout(function () { location.href = url; }, 160);
  }
  function calculateShellLayout(items) {
    var layout = [], remaining = items.length, itemIdx = 0;
    for (var sIdx = 0; sIdx < SHELL_CAPACITIES.length && remaining > 0; sIdx++) {
      var count = Math.min(remaining, SHELL_CAPACITIES[sIdx]);
      var radius = SHELL_RADII[sIdx];
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        layout.push({ item: items[itemIdx], x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius), shellIndex: sIdx });
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
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200); })(old[i]);
    }
    orbitsContainer.innerHTML = '';
    var layout = calculateShellLayout(items);
    var activeShells = {};
    layout.forEach(function (data, index) {
      activeShells[data.shellIndex] = true;
      var btn = document.createElement('button');
      btn.className = 'rm-item' + (data.item.items ? ' has-sub' : '');
      btn.setAttribute('data-label', data.item.label);
      btn.innerHTML = data.item.icon;
      btn.style.setProperty('--x', data.x + 'px');
      btn.style.setProperty('--y', data.y + 'px');
      btn.style.transitionDelay = index * 0.022 + 's';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (data.item.items && data.item.items.length) { menuStack.push(items); renderMenuLevel(data.item.items); }
        else if (data.item.url) navigateWithDelay(data.item.url);
      });
      itemsContainer.appendChild(btn);
      requestAnimationFrame(function () { setTimeout(function () { btn.classList.add('rendered'); }, 12); });
    });
    Object.keys(activeShells).forEach(function (sIdx) {
      sIdx = +sIdx;
      var orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      var d = SHELL_RADII[sIdx] * 2;
      orbit.style.width = d + 'px'; orbit.style.height = d + 'px';
      orbit.style.marginTop = -SHELL_RADII[sIdx] + 'px'; orbit.style.marginLeft = -SHELL_RADII[sIdx] + 'px';
      orbitsContainer.appendChild(orbit);
    });
    coreBtn.classList.toggle('visible', menuStack.length > 0);
  }
  function createMenuDOM() {
    menuEl = document.createElement('div'); menuEl.className = 'radial-menu-wrapper';
    orbitsContainer = document.createElement('div'); menuEl.appendChild(orbitsContainer);
    itemsContainer = document.createElement('div'); menuEl.appendChild(itemsContainer);
    coreBtn = document.createElement('button'); coreBtn.className = 'rm-core-btn'; coreBtn.innerHTML = '←';
    coreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menuStack.length) renderMenuLevel(menuStack.pop()); else closeMenu();
    });
    menuEl.appendChild(coreBtn); document.body.appendChild(menuEl);
  }
  function openMenu(x, y) {
    if (!menuEl) return;
    var margin = 170;
    menuEl.style.left = Math.max(margin, Math.min(x || window.innerWidth / 2, window.innerWidth - margin)) + 'px';
    menuEl.style.top = Math.max(margin, Math.min(y || window.innerHeight / 2, window.innerHeight - margin)) + 'px';
    menuEl.classList.add('active'); isOpen = true; menuStack = [];
    renderMenuLevel(buildMenuData());
  }
  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    itemsContainer.querySelectorAll('.rm-item').forEach(function (i) { i.classList.remove('rendered'); });
    coreBtn.classList.remove('visible'); isOpen = false;
  }
  function mountAuthHeader() {
    var header = document.querySelector('.site-header'); if (!header) return;
    var old = header.querySelector('.header-auth'); if (old) old.remove();
    var box = document.createElement('div'); box.className = 'header-auth';
    var user = getUser();
    if (user) {
      box.innerHTML = '<span class="auth-name">' + (user.name || user.id) + '</span><a class="auth-btn auth-cms" href="' + root + 'admin.html">CMS</a><button type="button" class="auth-btn" id="auth-logout">ログアウト</button>';
      header.appendChild(box);
      document.getElementById('auth-logout').onclick = function () {
        localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); location.reload();
      };
    } else {
      box.innerHTML = '<a class="auth-btn" href="' + root + 'admin.html">ログイン</a>';
      header.appendChild(box);
    }
    if (!document.querySelector('.menu-fab')) {
      var fab = document.createElement('button'); fab.type = 'button'; fab.className = 'menu-fab'; fab.innerHTML = '☰';
      document.body.appendChild(fab);
      fab.onclick = function (e) { e.stopPropagation(); openMenu(window.innerWidth / 2, window.innerHeight * 0.42); };
    }
  }
  function initEvents() {
    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest && (e.target.closest('.menu-fab') || e.target.closest('.header-auth'))) return;
      if (isOpen && !menuEl.contains(e.target)) { closeMenu(); return; }
      startX = e.clientX; startY = e.clientY;
      clearTimeout(timer);
      timer = setTimeout(function () { openMenu(startX, startY); }, LONG_PRESS_MS);
    });
    document.addEventListener('pointermove', function (e) {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) { clearTimeout(timer); timer = null; }
    });
    document.addEventListener('pointerup', function () { if (timer && !isOpen) { clearTimeout(timer); timer = null; } });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (isOpen) closeMenu(); else openMenu(); }
      if (e.key === 'Escape' && isOpen) closeMenu();
    });
  }
  function boot() { createMenuDOM(); initEvents(); mountAuthHeader(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
