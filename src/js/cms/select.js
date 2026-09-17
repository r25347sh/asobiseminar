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
    if (/Matsumaru_T\.html$/i.test(path) || /matsumaru/i.test(path)) {
      return { kind: 'teacher', title: '松丸先生', id: 'matsumaru', type: 'teacher' };
    }
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

  
  function filePreviewBlock(item) {
    var href = '../' + item.path; // from select.html root is site root; path is users/...
    // select is at root so href = item.path
    href = item.path;
    var ext = (item.ext || '').toLowerCase();
    var box = document.createElement('div');
    box.className = 'file-card';
    var head = document.createElement('div');
    head.className = 'file-card-head';
    var a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = '📄 ' + item.name;
    head.appendChild(a);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn ghost sm';
    btn.textContent = 'プレビュー';
    var body = document.createElement('div');
    body.className = 'file-card-preview hidden';
    btn.onclick = function () {
      var open = !body.classList.contains('hidden');
      if (open) {
        body.classList.add('hidden');
        body.innerHTML = '';
        btn.textContent = 'プレビュー';
        return;
      }
      body.classList.remove('hidden');
      btn.textContent = '閉じる';
      if (window.ASOBI_ATTACH && window.ASOBI_ATTACH.previewHtml) {
        body.innerHTML = window.ASOBI_ATTACH.previewHtml(item, 0);
      } else {
        body.innerHTML = '<a href="' + href + '" target="_blank">開く</a>';
      }
    };
    head.appendChild(btn);
    box.appendChild(head);
    box.appendChild(body);
    return box;
  }

  function loadFiles() {
    var box = $('files-list');
    if (!box || !user) return;
    box.textContent = '読み込み中…';
    var path = 'users/' + user.id;
    if ($('files-path')) $('files-path').textContent = path + '/';
    var uploadRow = document.createElement('div');
    uploadRow.className = 'files-upload-row';
    uploadRow.innerHTML = '<label class="btn ghost sm">端末から追加<input type="file" id="files-upload" multiple hidden></label><span id="files-upload-status" class="muted tiny"></span>';
    API.listDir(path).then(function (items) {
      box.innerHTML = '';
      box.appendChild(uploadRow);
      var input = uploadRow.querySelector('#files-upload');
      var st = uploadRow.querySelector('#files-upload-status');
      if (input) {
        input.onchange = function () {
          if (!input.files || !input.files.length) return;
          st.textContent = 'アップロード中…';
          var Attach = window.ASOBI_ATTACH;
          if (!Attach || !Attach.uploadUserFiles) {
            st.textContent = 'attachments 未読込';
            return;
          }
          Attach.uploadUserFiles(user.id, input.files, 'link').then(function () {
            st.textContent = '完了';
            loadFiles();
          }).catch(function (e) {
            st.textContent = e.message || String(e);
          });
        };
      }
      var files = (items || []).filter(function (it) { return it.type === 'file' && it.name && it.name.charAt(0) !== '.'; });
      if (!files.length) {
        var p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'まだファイルがありません。上から追加できます。';
        box.appendChild(p);
        return;
      }
      var grid = document.createElement('div');
      grid.className = 'file-cards';
      files.forEach(function (it) {
        grid.appendChild(filePreviewBlock({
          name: it.name,
          path: it.path,
          ext: (it.name.split('.').pop() || '').toLowerCase(),
          size: it.size
        }));
      });
      box.appendChild(grid);
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
