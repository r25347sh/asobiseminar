(function () {
  'use strict';
  var OWNER = 'r25347sh';
  var REPO = 'asobiseminar';
  var BACKUP_REPO = 'asobiseminar_backup';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents';
  var BACKUP_API = 'https://api.github.com/repos/' + OWNER + '/' + BACKUP_REPO + '/contents';
  var SITE = 'https://r25347sh.github.io/asobiseminar/';
  var SESSION = 'asobilab_user';
  // Token intentionally invalidated (1 char) to lock CMS writes
  var TOKEN = 'github_pat_11BXRNCFA0z6wQzD7P0p1B_' +
              'IRz7ii32tqH2LsbYQWCyp1YHSn' +
              'CXgrIDZr56epqgIkXZBW6YUHVK3v9kVPY';

  var USERS = {};
  var state = { user: null, path: null, mode: 'visual', selected: null, isHtml: true, originalHtml: null, fileSha: null, pageStyles: {}, pageKeyframes: {}, undoStack: [], redoStack: [], undoLock: false, chromeLayer: null, chromeRaf: null };

  function $(id) { return document.getElementById(id); }
  function show(v) {
    ['view-login', 'view-dash', 'view-editor'].forEach(function (id) {
      var el = $(id);
      if (el) el.classList.toggle('hidden', id !== v);
    });
  }
  function status(t) { var s = $('status'); if (s) s.textContent = t; }
  function headers() {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + TOKEN,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }
  function decode(c) { return decodeURIComponent(escape(atob(String(c).replace(/\n/g, '')))); }
  function encode(t) { return btoa(unescape(encodeURIComponent(t))); }

  function friendlyErr(text, statusCode) {
    if (statusCode === 403 || (text && text.indexOf('Resource not accessible') >= 0)) {
      return '403: Tokenに書き込み権限がありません。';
    }
    if (statusCode === 401) return '401: Tokenが無効です（CMSは現在ロック中）。';
    if (statusCode === 409) return '409: 競合しました。';
    return text || ('HTTP ' + statusCode);
  }

  function getFile(path, apiBase) {
    var base = apiBase || API;
    function doFetch(withAuth) {
      var h = withAuth ? headers() : { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
      return fetch(base + '/' + path + '?ref=main', { headers: h })
        .then(function (r) {
          if (r.status === 401 && withAuth) {
            return doFetch(false);
          }
          if (!r.ok) throw new Error(friendlyErr('', r.status) || ('GET ' + path + ' ' + r.status));
          return r.json();
        });
    }
    return doFetch(true);
  }

  function putFile(path, content, message, sha, apiBase) {
    var base = apiBase || API;
    var body = { message: message || 'CMS update', content: encode(content), branch: 'main' };
    if (sha) body.sha = sha;
    return fetch(base + '/' + path, { method: 'PUT', headers: headers(), body: JSON.stringify(body) })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(friendlyErr(t, r.status)); });
        return r.json();
      });
  }

  function loadUsers() {
    return getFile('src/users.json').then(function (f) {
      USERS = JSON.parse(decode(f.content));
      return USERS;
    });
  }

  function getSession() {
    try {
      var r = localStorage.getItem(SESSION) || sessionStorage.getItem(SESSION);
      return r ? JSON.parse(r) : null;
    } catch (e) { return null; }
  }
  function setSession(u) {
    var s = JSON.stringify(u);
    try { localStorage.setItem(SESSION, s); } catch (e) {}
    try { sessionStorage.setItem(SESSION, s); } catch (e) {}
  }
  function clearSession() {
    try { localStorage.removeItem(SESSION); } catch (e) {}
    try { sessionStorage.removeItem(SESSION); } catch (e) {}
  }

  function openDash() {
    show('view-dash');
    if ($('dash-user') && state.user) {
      $('dash-user').textContent = (state.user.name || state.user.id) + ' · ' + (state.user.semi_name || '');
    }
    var th = $('tab-admin');
    if (th) th.classList.toggle('hidden', !(state.user && state.user.isAdmin));
    switchTab('pages');
    loadPages();
  }

  function switchTab(name) {
    document.querySelectorAll('.dash-tabs .tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === name);
    });
    ['pages', 'files', 'history', 'admin'].forEach(function (p) {
      var el = $('panel-' + p);
      if (el) el.classList.toggle('hidden', p !== name);
    });
  }

  function loadPages() {
    var grid = $('page-grid'), st = $('dash-status');
    if (!grid) return;
    grid.innerHTML = '';
    if (st) st.textContent = '読み込み中…';
    var perms = (state.user && (state.user.permissions || [])) || [];
    if (state.user && (state.user.fullAccess || state.user.isAdmin)) {
      perms = (state.user.permissions || []).slice();
    }
    if (!perms.length) {
      if (st) st.textContent = '権限のあるページがありません';
      return;
    }
    Promise.all(perms.map(function (p) {
      return getFile(p).then(function (f) {
        var title = '';
        try {
          var m = decode(f.content).match(/<title[^>]*>([^<]*)<\/title>/i);
          title = m ? m[1].trim() : p;
        } catch (e) { title = p; }
        return { path: p, title: title };
      }).catch(function (e) {
        return { path: p, title: p + ' (取得失敗)' };
      });
    })).then(function (items) {
      if (st) st.textContent = items.length + ' ページ（Tokenロック中のため保存は不可）';
      items.forEach(function (it) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'page-card';
        b.innerHTML = '<span class="t"></span><span class="p mono"></span>';
        b.querySelector('.t').textContent = it.title;
        b.querySelector('.p').textContent = it.path;
        b.onclick = function () {
          status('CMSは現在ロック中です。Tokenを有効に戻すまで保存できません。');
        };
        grid.appendChild(b);
      });
    }).catch(function (e) {
      if (st) st.textContent = '読込失敗: ' + (e.message || e);
    });
  }

  function completeLogin(id, pw, viaQr) {
    var msg = $('login-msg');
    var u = USERS[id];
    var ok = false;
    if (u && window.AsobiAuth && typeof AsobiAuth.verify === 'function') {
      ok = AsobiAuth.verify(id, pw, u.pass_hash || u.password);
    } else if (u && u.password != null) {
      ok = String(u.password) === String(pw);
    } else if (u) {
      ok = true;
    }
    if (!u || !ok) {
      if (msg) msg.textContent = viaQr ? 'QRのIDまたはパスワードが違います' : 'ID またはパスワードが違います';
      return false;
    }
    state.user = {
      id: id, name: u.name, semi_name: u.semi_name || '',
      group: u.group || '', class: u.class || '', role: u.role || 'member',
      permissions: (u.permissions || []).slice(),
      isAdmin: !!u.isAdmin, advanced: !!u.advanced,
      canEditMeta: u.canEditMeta !== false,
      canUpload: u.canUpload !== false,
      canDelete: u.canDelete !== false,
      canBackupRestore: !!u.canBackupRestore || !!u.isAdmin,
      fullAccess: !!u.fullAccess || !!u.isAdmin
    };
    setSession(state.user);
    if (msg) msg.textContent = viaQr ? 'QRログイン成功…' : '';
    openDash();
    return true;
  }

  function login() {
    var id = (($('uid') && $('uid').value) || '').trim();
    var pw = ($('pw') && $('pw').value) || '';
    var msg = $('login-msg');
    loadUsers().then(function () {
      completeLogin(id, pw, false);
    }).catch(function (e) {
      if (msg) msg.textContent = 'users.json 読込失敗: ' + e.message;
    });
  }

  function boot() {
    loadUsers().then(function () {
      var sess = getSession();
      if (sess && USERS[sess.id]) {
        state.user = sess;
        openDash();
      } else {
        show('view-login');
      }
    }).catch(function (e) {
      var msg = $('login-msg');
      if (msg) msg.textContent = 'users.json 読込失敗: ' + e.message;
      show('view-login');
    });

    if ($('btn-login')) $('btn-login').onclick = login;
    if ($('btn-logout')) $('btn-logout').onclick = function () {
      clearSession(); state.user = null; show('view-login');
    };
    if ($('pw')) {
      $('pw').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') login();
      });
    }
    document.querySelectorAll('.dash-tabs .tab').forEach(function (t) {
      t.addEventListener('click', function () { switchTab(t.getAttribute('data-tab')); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
