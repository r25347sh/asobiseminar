/*! Asobi CMS select */
(function () {
  var C = window.ASOBI_CMS;
  var S = window.ASOBI_SESSION;
  var API = window.ASOBI_API;
  var $ = function (id) { return document.getElementById(id); };
  var user = null;

  function switchTab(name) {
    document.querySelectorAll('.seg').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === name);
    });
    ['pages', 'files', 'help'].forEach(function (n) {
      var p = $('panel-' + n);
      if (p) p.classList.toggle('hidden', n !== name);
    });
  }

  function labelForPath(path) {
    var g = C.groupByPath(path);
    if (g) return { kind: 'group', title: g.label, id: g.key, type: 'group' };
    var m = path.match(/^pages\/members\/([^/]+)\.html$/);
    if (m) return { kind: 'member', title: m[1], id: m[1], type: 'member' };
    return { kind: 'other', title: path.split('/').pop(), id: path, type: 'other' };
  }

  function openEditor(item) {
    if (item.type === 'other') {
      alert('このページはフォーム編集の対象外です: ' + item.title);
      return;
    }
    location.href = C.PAGES.editor + '?type=' + encodeURIComponent(item.type) + '&id=' + encodeURIComponent(item.id);
  }

  function renderPages(perms) {
    var grid = $('page-grid');
    var st = $('pages-status');
    if (!grid) return;
    grid.innerHTML = '';
    var items = [];
    var seen = {};
    (perms || []).forEach(function (path) {
      if (seen[path]) return;
      seen[path] = true;
      var meta = labelForPath(path);
      meta.path = path;
      items.push(meta);
    });
    if (user && (user.isAdmin || user.fullAccess)) {
      C.GROUPS.forEach(function (g) {
        if (!seen[g.htmlPath]) {
          seen[g.htmlPath] = true;
          items.push({ kind: 'group', title: g.label, id: g.key, type: 'group', path: g.htmlPath });
        }
      });
    }
    items.sort(function (a, b) {
      if (a.type !== b.type) return a.type === 'member' ? -1 : 1;
      return String(a.title).localeCompare(String(b.title), 'ja');
    });
    if (!items.length) {
      if (st) st.textContent = '編集可能なページがありません';
      return;
    }
    if (st) st.textContent = items.length + ' 件';
    items.forEach(function (it, idx) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'page-card type-' + it.type;
      card.style.animationDelay = (idx * 0.04) + 's';
      card.innerHTML =
        '<span class="badge">' + (it.type === 'member' ? '個人' : it.type === 'group' ? 'グループ' : 'その他') + '</span>' +
        '<span class="title"></span><span class="path mono"></span>';
      card.querySelector('.title').textContent = it.title;
      card.querySelector('.path').textContent = it.path;
      card.onclick = function () { openEditor(it); };
      grid.appendChild(card);
    });
  }

  function enrichMemberTitles(perms) {
    var tasks = [];
    (perms || []).forEach(function (path) {
      var m = path.match(/^pages\/members\/([^/]+)\.html$/);
      if (!m) return;
      var id = m[1];
      tasks.push(
        API.loadJson('src/cms/pages/member/' + id + '.json').then(function (j) {
          return { id: id, name: j.displayName || id };
        }).catch(function () { return null; })
      );
    });
    return Promise.all(tasks).then(function (rows) {
      var map = {};
      rows.forEach(function (r) { if (r) map[r.id] = r.name; });
      document.querySelectorAll('.page-card.type-member').forEach(function (card) {
        var path = card.querySelector('.path');
        if (!path) return;
        var m = path.textContent.match(/members\/([^/]+)\.html/);
        if (m && map[m[1]]) card.querySelector('.title').textContent = map[m[1]];
      });
    });
  }

  function loadFiles() {
    var box = $('files-list');
    if (!box || !user) return;
    box.textContent = '読み込み中…';
    var path = 'users/' + user.id;
    API.listDir(path).then(function (items) {
      if (!items || !items.length) {
        box.innerHTML = '<p class="muted">フォルダは空か、まだありません。<code>' + path + '/</code></p>';
        return;
      }
      var ul = document.createElement('ul');
      ul.className = 'file-list';
      items.forEach(function (it) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = (it.html_url || ('https://github.com/r25347sh/asobiseminar/blob/main/' + it.path));
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = (it.type === 'dir' ? '📁 ' : '📄 ') + (it.name || it.path);
        li.appendChild(a);
        ul.appendChild(li);
      });
      box.innerHTML = '';
      box.appendChild(ul);
    }).catch(function (e) {
      box.textContent = '一覧を取得できません: ' + (e.message || e);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    user = S.require(true);
    if (!user) return;
    if ($('user-pill')) {
      $('user-pill').textContent = (user.name || user.id) + (user.semi_name ? ' · ' + user.semi_name : '');
    }
    if ($('files-path')) $('files-path').textContent = 'users/' + user.id + '/';
    if ($('btn-logout')) {
      $('btn-logout').onclick = function () {
        S.clear();
        location.href = C.PAGES.login;
      };
    }
    document.querySelectorAll('.seg').forEach(function (b) {
      b.onclick = function () {
        var tab = b.getAttribute('data-tab');
        switchTab(tab);
        if (tab === 'files') loadFiles();
      };
    });
    if ($('btn-refresh-pages')) $('btn-refresh-pages').onclick = function () { bootPages(); };
    if ($('btn-refresh-files')) $('btn-refresh-files').onclick = function () { loadFiles(); };

    function bootPages() {
      var perms = (user.permissions || []).slice();
      renderPages(perms);
      enrichMemberTitles(perms);
    }
    bootPages();
  });
})();
