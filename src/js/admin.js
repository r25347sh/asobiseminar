(function () {
  'use strict';
  var OWNER = 'r25347sh';
  var REPO = 'asobiseminar';
  var BACKUP_REPO = 'asobiseminar_backup';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents';
  var BACKUP_API = 'https://api.github.com/repos/' + OWNER + '/' + BACKUP_REPO + '/contents';
  var SITE = 'https://r25347sh.github.io/asobiseminar/';
  var SESSION = 'asobilab_user';
  /* Token 分割直書き（2〜4分割） */
  var TOKEN = 'github_pat_11BXRNCFA0z6wQzD7P0p1A_' +
              'IRz7ii32tqH2LsbYQWCyp1YHSn' +
              'CXgrIDZr56epqgIkXZBW6YUHVK3v9kVPY';

  var USERS = {}; /* users.json から動的ロード */
  var state = {
    user: null,
    path: null,
    mode: 'visual',
    selected: null,
    isHtml: true,
    originalHtml: null,
    fileSha: null,
    drag: null,
    resize: null,
    draftTimer: null,
    history: []
  };

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

  function getFile(path, apiBase) {
    var base = apiBase || API;
    return fetch(base + '/' + path + '?ref=main', { headers: headers() })
      .then(function (r) {
        if (!r.ok) throw new Error('GET ' + path + ' ' + r.status + (r.status === 401 ? ' (Token無効)' : ''));
        return r.json();
      });
  }
  function putFile(path, content, message, sha, apiBase) {
    var base = apiBase || API;
    var body = { message: message || 'CMS update', content: encode(content), branch: 'main' };
    if (sha) body.sha = sha;
    return fetch(base + '/' + path, { method: 'PUT', headers: headers(), body: JSON.stringify(body) })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t || ('PUT ' + r.status)); });
        return r.json();
      });
  }
  function deleteFile(path, sha, message) {
    return fetch(API + '/' + path, {
      method: 'DELETE',
      headers: headers(),
      body: JSON.stringify({ message: message || 'CMS delete', sha: sha, branch: 'main' })
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
      return r.json();
    });
  }
  function listDir(path) {
    return fetch(API + '/' + path + '?ref=main', { headers: headers() })
      .then(function (r) {
        if (r.status === 404) return [];
        if (!r.ok) throw new Error('LIST ' + path + ' ' + r.status);
        return r.json();
      })
      .then(function (data) { return Array.isArray(data) ? data : []; });
  }

  function loadUsers() {
    return getFile('src/users.json').then(function (f) {
      USERS = JSON.parse(decode(f.content));
      return USERS;
    }).catch(function (e) {
      console.error('users.json load failed', e);
      throw e;
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
  function userDir() {
    return 'users/' + (state.user && state.user.id ? state.user.id : 'guest');
  }

  function getClientIp() {
    return fetch('https://api.ipify.org/?format=text', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) { return (t || '').trim(); })
      .catch(function () { return ''; });
  }

  function formatNow() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function buildCommitMessage(userMsg) {
    var uid = state.user ? state.user.id : 'unknown';
    var uname = state.user ? (state.user.name || uid) : 'unknown';
    var msg = (userMsg || '').trim() || '(no message)';
    var dt = formatNow();
    return getClientIp().then(function (ip) {
      var ipPart = ip || 'N/A';
      return '[' + uid + '] | [' + uname + '] | [' + msg + '] | [' + dt + '] | [' + ipPart + ']';
    });
  }

  function login() {
    var id = (($('uid') && $('uid').value) || '').trim();
    var pw = ($('pw') && $('pw').value) || '';
    var msg = $('login-msg');
    var u = USERS[id];
    if (!u || String(u.password) !== String(pw)) {
      if (msg) msg.textContent = 'ID またはパスワードが違います';
      return;
    }
    state.user = {
      id: id,
      name: u.name,
      semi_name: u.semi_name || '',
      group: u.group || '',
      class: u.class || '',
      role: u.role || 'member',
      permissions: (u.permissions || []).slice(),
      isAdmin: !!u.isAdmin,
      advanced: !!u.advanced,
      canEditMeta: u.canEditMeta !== false,
      canUpload: u.canUpload !== false,
      canDelete: u.canDelete !== false,
      canBackupRestore: !!u.canBackupRestore || !!u.isAdmin
    };
    setSession(state.user);
    if (msg) msg.textContent = '';
    openDash();
  }

  function extractTitle(html) {
    var m = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return m ? m[1].replace(/\s+/g, ' ').trim() : '';
  }

  function switchTab(name) {
    document.querySelectorAll('.dash-tabs .tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === name);
    });
    ['pages', 'files', 'history', 'admin'].forEach(function (p) {
      var el = $('panel-' + p);
      if (el) el.classList.toggle('hidden', p !== name);
    });
    if (name === 'files') loadFiles();
    if (name === 'history') loadHistory();
  }

  function openDash() {
    show('view-dash');
    if ($('dash-user') && state.user) {
      $('dash-user').textContent = (state.user.name || state.user.id) + ' · ' + (state.user.semi_name || state.user.role || '');
    }
    if ($('files-path')) $('files-path').textContent = userDir() + '/';
    if (state.user && state.user.isAdmin) {
      var ta = $('tab-admin');
      if (ta) ta.classList.remove('hidden');
    }
    var th = $('tab-history');
    if (th) th.classList.remove('hidden');
    switchTab('pages');
    loadPages();
  }

  function loadPages() {
    var grid = $('page-grid'), st = $('dash-status');
    if (!grid) return;
    grid.innerHTML = '';
    if (st) st.textContent = '読み込み中…';
    var perms = (state.user && state.user.permissions) || [];
    Promise.all(perms.map(function (p) {
      return getFile(p).then(function (f) {
        return { path: p, title: extractTitle(decode(f.content)) || p, sha: f.sha };
      }).catch(function () { return { path: p, title: p + ' (読込失敗)', sha: null }; });
    })).then(function (items) {
      if (st) st.textContent = items.length ? items.length + ' ページ' : '編集可能なページがありません';
      items.forEach(function (it) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'page-card';
        b.innerHTML = '<span class="t"></span><span class="p mono"></span>';
        b.querySelector('.t').textContent = it.title;
        b.querySelector('.p').textContent = it.path;
        b.onclick = function () { openEditor(it.path, true); };
        grid.appendChild(b);
      });
    }).catch(function (e) {
      if (st) st.textContent = '読込失敗: ' + e.message;
    });
  }

  function loadFiles() {
    var list = $('files-list'), st = $('files-status');
    if (!list) return;
    list.innerHTML = '';
    if (st) st.textContent = '読み込み中…';
    listDir(userDir()).then(function (items) {
      var files = items.filter(function (i) { return i.type === 'file'; });
      if (st) st.textContent = files.length ? files.length + ' ファイル' : 'まだファイルがありません';
      files.forEach(function (f) {
        var row = document.createElement('div');
        row.className = 'file-row';
        var sizeKb = f.size ? (f.size / 1024).toFixed(1) + ' KB' : '';
        var isImg = /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);
        row.innerHTML =
          '<span class="name"></span><span class="meta mono"></span>' +
          '<div class="actions">' +
          '<button type="button" class="btn ghost btn-edit">編集</button>' +
          (isImg ? '<button type="button" class="btn ghost btn-preview">プレビュー</button>' : '') +
          (state.user.canDelete ? '<button type="button" class="btn danger btn-del">削除</button>' : '') +
          '</div>';
        row.querySelector('.name').textContent = (isImg ? '🖼️ ' : '📄 ') + f.name;
        row.querySelector('.meta').textContent = sizeKb;
        row.querySelector('.btn-edit').onclick = function () {
          openEditor(f.path, /\.html?$/i.test(f.name));
        };
        if (isImg) {
          var prevBtn = row.querySelector('.btn-preview');
          if (prevBtn) prevBtn.onclick = function () { window.open(SITE + f.path, '_blank'); };
        }
        var delBtn = row.querySelector('.btn-del');
        if (delBtn) {
          delBtn.onclick = function () {
            if (!confirm(f.name + ' を削除しますか？')) return;
            if (st) st.textContent = '削除中…';
            getFile(f.path).then(function (meta) {
              return buildCommitMessage('delete ' + f.name).then(function (cm) {
                return deleteFile(f.path, meta.sha, cm);
              });
            }).then(function () {
              loadFiles();
              appendLocalLog('delete', f.path, 'deleted');
            }).catch(function (e) {
              if (st) st.textContent = '削除失敗: ' + e.message;
            });
          };
        }
        list.appendChild(row);
      });
    }).catch(function (e) {
      if (st) st.textContent = '読込失敗: ' + e.message;
    });
  }

  function loadHistory() {
    var list = $('history-list'), st = $('history-status');
    if (!list) return;
    list.innerHTML = '';
    if (st) st.textContent = '読み込み中…';
    getFile('src/backup.json', BACKUP_API).then(function (f) {
      var data = [];
      try { data = JSON.parse(decode(f.content)); } catch (e) {}
      if (!Array.isArray(data)) data = [];
      data = data.slice().reverse().slice(0, 80);
      if (st) st.textContent = data.length ? data.length + ' 件の変更履歴' : '履歴がありません';
      data.forEach(function (entry) {
        var row = document.createElement('div');
        row.className = 'file-row history-row';
        row.innerHTML =
          '<div class="hist-main">' +
          '<span class="name"></span>' +
          '<span class="meta mono"></span>' +
          '<span class="hist-msg"></span></div>' +
          '<div class="actions">' +
          (state.user.canBackupRestore && entry.backupPath ?
            '<button type="button" class="btn primary btn-restore">復元</button>' : '') +
          '</div>';
        row.querySelector('.name').textContent = entry.path || '(unknown)';
        row.querySelector('.meta').textContent =
          (entry.userId || '') + ' · ' + (entry.datetime || '') + (entry.ip ? ' · IP:' + entry.ip : '');
        row.querySelector('.hist-msg').textContent = entry.message || '';
        var rb = row.querySelector('.btn-restore');
        if (rb) {
          rb.onclick = function () {
            if (!confirm(entry.path + ' をこのバックアップから復元しますか？\n' + (entry.datetime || ''))) return;
            restoreFromBackup(entry);
          };
        }
        list.appendChild(row);
      });
    }).catch(function (e) {
      if (st) st.textContent = '履歴読込失敗（バックアップリポジトリ未初期化の可能性）: ' + e.message;
    });
  }

  function appendLocalLog(action, path, note) {
    /* UI用の簡易メモ */
  }

  function frame() { return $('frame'); }
  function doc() {
    var f = frame();
    return f && f.contentDocument;
  }

  function injectChrome(html, pagePath) {
    var dir = pagePath.indexOf('/') >= 0 ? pagePath.replace(/\/[^\/]*$/, '/') : '';
    var base = SITE + dir;
    var cleaned = html
      .replace(/<script[^>]*MENU\/MENU\.js[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<script[^>]*src=["'][^"']*MENU\/MENU\.js["'][^>]*><\/script>/gi, '')
      .replace(/<link[^>]*MENU\/MENU\.css[^>]*>/gi, '')
      .replace(/<div[^>]*class=["'][^"']*radial-menu-wrapper[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<button[^>]*class=["'][^"']*menu-fab[^"']*["'][^>]*>[\s\S]*?<\/button>/gi, '');
    var style = [
      '<style id="cms-ui">',
      '.cms-sel{outline:3px solid #ff6b6b!important;outline-offset:2px;position:relative}',
      '.cms-sel[contenteditable=true]{outline:3px solid #2ec4b6!important;cursor:text}',
      '.cms-handle{position:absolute;width:12px;height:12px;background:#ff6b6b;border:2px solid #fff;',
      'border-radius:2px;z-index:99999;box-shadow:0 1px 4px rgba(0,0,0,.3)}',
      '.cms-handle.nw{top:-6px;left:-6px;cursor:nw-resize}',
      '.cms-handle.ne{top:-6px;right:-6px;cursor:ne-resize}',
      '.cms-handle.sw{bottom:-6px;left:-6px;cursor:sw-resize}',
      '.cms-handle.se{bottom:-6px;right:-6px;cursor:se-resize}',
      '.cms-drag-bar{position:absolute;top:-22px;left:0;height:18px;padding:0 8px;font-size:11px;',
      'background:#ff6b6b;color:#fff;border-radius:4px 4px 0 0;cursor:move;user-select:none;white-space:nowrap}',
      '.radial-menu-wrapper,.menu-fab,.header-auth{display:none!important;visibility:hidden!important;pointer-events:none!important}',
      'body{padding-bottom:0!important}',
      '</style>'
    ].join('');
    if (/<head[^>]*>/i.test(cleaned)) {
      cleaned = cleaned.replace(/<head([^>]*)>/i, '<head$1><base href="' + base + '">' + style);
    } else {
      cleaned = '<base href="' + base + '">' + style + cleaned;
    }
    return cleaned;
  }

  function clearSelection() {
    var d = doc();
    if (!d) return;
    d.querySelectorAll('.cms-sel').forEach(function (n) {
      n.classList.remove('cms-sel');
      n.removeAttribute('contenteditable');
      n.querySelectorAll('.cms-handle,.cms-drag-bar').forEach(function (h) { h.remove(); });
    });
    state.selected = null;
    hideRtToolbar();
    if ($('sel-info')) $('sel-info').textContent = '要素をクリック → その場で編集できます';
  }

  function attachHandles(el) {
    el.querySelectorAll('.cms-handle,.cms-drag-bar').forEach(function (h) { h.remove(); });
    var bar = document.createElement('div');
    bar.className = 'cms-drag-bar';
    bar.textContent = '⋮⋮ ドラッグで移動';
    bar.setAttribute('contenteditable', 'false');
    el.appendChild(bar);
    ['nw', 'ne', 'sw', 'se'].forEach(function (pos) {
      var h = document.createElement('div');
      h.className = 'cms-handle ' + pos;
      h.setAttribute('contenteditable', 'false');
      h.dataset.handle = pos;
      el.appendChild(h);
    });
  }

  function selectElement(el) {
    if (!el || el === doc().body || el === doc().documentElement) return;
    if (el.classList && (el.classList.contains('cms-handle') || el.classList.contains('cms-drag-bar'))) return;
    clearSelection();
    el.classList.add('cms-sel');
    el.setAttribute('contenteditable', 'true');
    state.selected = el;
    attachHandles(el);
    showRtToolbar();
    if ($('sel-info')) {
      $('sel-info').textContent = '<' + el.tagName.toLowerCase() + '> 選択中 — 直接入力 or ツールバー';
    }
    try {
      var cs = doc().defaultView.getComputedStyle(el);
      if ($('p-color')) $('p-color').value = rgbToHex(cs.color) || '#2b2140';
      if ($('p-bg')) {
        var bg = cs.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          $('p-bg').value = rgbToHex(bg) || '#ffffff';
        }
      }
      var fs = parseInt(cs.fontSize, 10);
      if (fs && $('p-size')) {
        $('p-size').value = fs;
        if ($('p-size-v')) $('p-size-v').textContent = fs;
      }
    } catch (e) {}
    status('編集中');
  }

  function rgbToHex(rgb) {
    if (!rgb) return null;
    if (rgb.charAt(0) === '#') return rgb;
    var m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return '#' + [m[1], m[2], m[3]].map(function (x) {
      var h = parseInt(x, 10).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  }

  function showRtToolbar() {
    var tb = $('rt-toolbar');
    if (!tb) return;
    tb.classList.remove('hidden');
    tb.classList.add('rt-docked');
    var ve = document.getElementById('view-editor');
    if (ve) ve.classList.add('rt-open');
  }
  function hideRtToolbar() {
    var tb = $('rt-toolbar');
    if (tb) {
      tb.classList.add('hidden');
      tb.classList.remove('rt-docked');
    }
    var ve = document.getElementById('view-editor');
    if (ve) ve.classList.remove('rt-open');
  }

  function setupFrameEvents() {
    var d = doc();
    if (!d) return;
    d.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var t = e.target;
      if (t.classList && (t.classList.contains('cms-handle') || t.classList.contains('cms-drag-bar'))) return;
      selectElement(t);
    }, true);
    d.addEventListener('mousedown', function (e) {
      var t = e.target;
      if (!state.selected) return;
      if (t.classList && t.classList.contains('cms-handle')) {
        e.preventDefault(); e.stopPropagation();
        state.resize = {
          handle: t.dataset.handle, el: state.selected,
          startX: e.clientX, startY: e.clientY,
          startW: state.selected.offsetWidth, startH: state.selected.offsetHeight,
          startL: state.selected.offsetLeft, startT: state.selected.offsetTop
        };
        return;
      }
      if (t.classList && t.classList.contains('cms-drag-bar')) {
        e.preventDefault(); e.stopPropagation();
        ensureAbsolute(state.selected);
        state.drag = {
          el: state.selected,
          startX: e.clientX, startY: e.clientY,
          origL: parseFloat(state.selected.style.left) || state.selected.offsetLeft,
          origT: parseFloat(state.selected.style.top) || state.selected.offsetTop
        };
      }
    }, true);
    d.addEventListener('mousemove', function (e) {
      if (state.drag) {
        e.preventDefault();
        state.drag.el.style.left = (state.drag.origL + e.clientX - state.drag.startX) + 'px';
        state.drag.el.style.top = (state.drag.origT + e.clientY - state.drag.startY) + 'px';
      }
      if (state.resize) {
        e.preventDefault();
        var r = state.resize;
        var dx = e.clientX - r.startX, dy = e.clientY - r.startY;
        var w = r.startW, h = r.startH, l = r.startL, t = r.startT;
        if (r.handle.indexOf('e') >= 0) w = Math.max(40, r.startW + dx);
        if (r.handle.indexOf('s') >= 0) h = Math.max(20, r.startH + dy);
        if (r.handle.indexOf('w') >= 0) { w = Math.max(40, r.startW - dx); l = r.startL + dx; }
        if (r.handle.indexOf('n') >= 0) { h = Math.max(20, r.startH - dy); t = r.startT + dy; }
        ensureAbsolute(r.el);
        r.el.style.width = w + 'px';
        r.el.style.height = h + 'px';
        if (r.handle.indexOf('w') >= 0) r.el.style.left = l + 'px';
        if (r.handle.indexOf('n') >= 0) r.el.style.top = t + 'px';
      }
    }, true);
    d.addEventListener('mouseup', function () { state.drag = null; state.resize = null; }, true);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') clearSelection(); });
  }

  function ensureAbsolute(el) {
    var cs = doc().defaultView.getComputedStyle(el);
    if (cs.position === 'static' || !cs.position) {
      var rect = el.getBoundingClientRect();
      var parent = el.offsetParent || doc().body;
      var pr = parent.getBoundingClientRect();
      el.style.position = 'absolute';
      el.style.left = (rect.left - pr.left) + 'px';
      el.style.top = (rect.top - pr.top) + 'px';
      el.style.width = el.offsetWidth + 'px';
      el.style.margin = '0';
    }
  }

  function setEditorMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });
    var railV = $('rail-visual'), railM = $('rail-meta'), railC = $('rail-code');
    var stageF = frame(), codeStage = $('code-stage');
    if (railV) railV.classList.toggle('hidden', mode !== 'visual');
    if (railM) railM.classList.toggle('hidden', mode !== 'meta');
    if (railC) railC.classList.toggle('hidden', mode !== 'code');
    if (mode === 'code') {
      if (stageF) stageF.classList.add('hidden');
      if (codeStage) codeStage.classList.remove('hidden');
      try {
        if (state.isHtml) {
          var html = exportHtml();
          if ($('code-main')) $('code-main').value = html;
          if ($('code-area')) $('code-area').value = html;
        }
      } catch (e) {}
    } else {
      if (stageF) stageF.classList.remove('hidden');
      if (codeStage) codeStage.classList.add('hidden');
      if (mode === 'meta') loadMetaPanel();
    }
  }

  function openEditor(path, isHtml) {
    state.path = path;
    state.selected = null;
    state.isHtml = !!isHtml;
    state.originalHtml = null;
    state.fileSha = null;
    show('view-editor');
    if ($('ed-path')) $('ed-path').textContent = path;
    if ($('ed-title')) $('ed-title').textContent = '読み込み中…';
    if ($('commit-msg')) $('commit-msg').value = '';
    status('読み込み中…');
    hideRtToolbar();
    setEditorMode(isHtml ? 'visual' : 'code');

    getFile(path).then(function (f) {
      var content = decode(f.content);
      state.originalHtml = content;
      state.fileSha = f.sha;
      if (isHtml) {
        var title = extractTitle(content);
        if ($('ed-title')) $('ed-title').textContent = title || path;
        var fEl = frame();
        fEl.onload = function () {
          var d = doc();
          if (d) d.querySelectorAll('.radial-menu-wrapper,.menu-fab,.header-auth').forEach(function (n) { n.remove(); });
          setupFrameEvents();
          status('編集可能 — 保存前にコミットメッセージを入力してください');
          startDraftTimer();
        };
        fEl.srcdoc = injectChrome(content, path);
      } else {
        if ($('ed-title')) $('ed-title').textContent = path.split('/').pop();
        if ($('code-main')) $('code-main').value = content;
        if ($('code-area')) $('code-area').value = content;
        status('テキスト編集モード');
      }
    }).catch(function (e) {
      status('読込失敗: ' + e.message);
    });
  }

  function exportHtml() {
    if (!state.originalHtml) throw new Error('originalHtml がありません');
    var d = doc();
    if (!d) throw new Error('プレビュードキュメントがありません');
    clearSelection();
    var bodyClone = d.body.cloneNode(true);
    bodyClone.querySelectorAll('.cms-sel, .cms-handle, .cms-drag-bar, .radial-menu-wrapper, .menu-fab, .header-auth, #cms-ui').forEach(function (n) {
      if (n.classList.contains('cms-handle') || n.classList.contains('cms-drag-bar') ||
          n.classList.contains('radial-menu-wrapper') || n.classList.contains('menu-fab') ||
          n.classList.contains('header-auth') || n.id === 'cms-ui') {
        n.remove();
      } else {
        n.classList.remove('cms-sel');
        n.removeAttribute('contenteditable');
      }
    });
    var parser = new DOMParser();
    var origDoc = parser.parseFromString(state.originalHtml, 'text/html');
    var curTitle = d.querySelector('title');
    if (curTitle) {
      var ot = origDoc.querySelector('title');
      if (ot) ot.textContent = curTitle.textContent;
      else {
        var nt = origDoc.createElement('title');
        nt.textContent = curTitle.textContent;
        (origDoc.head || origDoc.querySelector('head')).appendChild(nt);
      }
    }
    ['description', 'keywords'].forEach(function (name) {
      var cur = d.querySelector('meta[name="' + name + '"]');
      var o = origDoc.querySelector('meta[name="' + name + '"]');
      if (cur && cur.getAttribute('content')) {
        if (!o) {
          o = origDoc.createElement('meta');
          o.setAttribute('name', name);
          (origDoc.head || origDoc.querySelector('head')).appendChild(o);
        }
        o.setAttribute('content', cur.getAttribute('content') || '');
      } else if (o) o.remove();
    });
    var curIcon = d.querySelector('link[rel="icon"],link[rel="shortcut icon"]');
    var oIcon = origDoc.querySelector('link[rel="icon"],link[rel="shortcut icon"]');
    if (curIcon && curIcon.getAttribute('href')) {
      if (!oIcon) {
        oIcon = origDoc.createElement('link');
        oIcon.setAttribute('rel', 'icon');
        (origDoc.head || origDoc.querySelector('head')).appendChild(oIcon);
      }
      oIcon.setAttribute('href', curIcon.getAttribute('href') || '');
    } else if (oIcon) oIcon.remove();
    var oBody = origDoc.body || origDoc.querySelector('body');
    if (oBody) oBody.innerHTML = bodyClone.innerHTML;
    return '<!DOCTYPE html>\n' + origDoc.documentElement.outerHTML;
  }

  /** バックアップリポジトリへフルバックアップ + backup.json ログ追記 */
  function saveBackup(path, content, commitMsg, ip) {
    var ts = formatNow().replace(/[:T]/g, '-');
    var safePath = path.replace(/[^a-zA-Z0-9._\/-]/g, '_');
    var backupPath = 'data/' + safePath + '/' + ts + '.html';
    var entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      path: path,
      userId: state.user ? state.user.id : '',
      userName: state.user ? state.user.name : '',
      message: commitMsg,
      datetime: formatNow(),
      ip: ip || '',
      backupPath: backupPath
    };

    /* 1. コンテンツをバックアップrepoに保存 */
    return putFile(backupPath, content, 'backup: ' + path + ' @ ' + ts, null, BACKUP_API)
      .then(function () {
        /* 2. backup.json を更新 */
        return getFile('src/backup.json', BACKUP_API).then(function (f) {
          var arr = [];
          try { arr = JSON.parse(decode(f.content)); } catch (e) {}
          if (!Array.isArray(arr)) arr = [];
          arr.push(entry);
          /* 最新500件に制限 */
          if (arr.length > 500) arr = arr.slice(arr.length - 500);
          return putFile('src/backup.json', JSON.stringify(arr, null, 2), 'log: ' + path, f.sha, BACKUP_API);
        }).catch(function () {
          /* 初回作成 */
          return putFile('src/backup.json', JSON.stringify([entry], null, 2), 'log: init + ' + path, null, BACKUP_API);
        });
      })
      .then(function () { return entry; });
  }

  function restoreFromBackup(entry) {
    if (!entry || !entry.backupPath || !entry.path) return;
    status('復元中…');
    getFile(entry.backupPath, BACKUP_API).then(function (bf) {
      var content = decode(bf.content);
      return getFile(entry.path).then(function (cur) {
        return buildCommitMessage('RESTORE from backup ' + (entry.datetime || '')).then(function (cm) {
          return putFile(entry.path, content, cm, cur.sha).then(function () {
            status('復元完了 ✓ ' + entry.path);
            if (state.path === entry.path) openEditor(entry.path, /\.html?$/i.test(entry.path));
          });
        });
      });
    }).catch(function (e) {
      status('復元失敗: ' + e.message);
      alert('復元失敗: ' + e.message);
    });
  }

  function save() {
    if (!state.path || !state.user) return;
    var userMsg = ($('commit-msg') && $('commit-msg').value.trim()) || '';
    if (!userMsg) {
      status('コミットメッセージを入力してください');
      if ($('commit-msg')) $('commit-msg').focus();
      return;
    }
    status('保存中…（SHA取得 → Push → バックアップ）');
    var out;
    try {
      if (state.isHtml) {
        if (state.mode === 'code') {
          out = ($('code-main') && $('code-main').value) || ($('code-area') && $('code-area').value) || '';
        } else {
          out = exportHtml();
        }
      } else {
        out = ($('code-main') && $('code-main').value) || ($('code-area') && $('code-area').value) || '';
      }
    } catch (e) {
      status('保存失敗: ' + e.message);
      return;
    }

    /* 必ず最新SHAを取得してからPUT（競合回避） */
    getFile(state.path).then(function (f) {
      state.fileSha = f.sha;
      return buildCommitMessage(userMsg).then(function (cm) {
        return putFile(state.path, out, cm, f.sha).then(function (res) {
          state.originalHtml = out;
          state.fileSha = res.content && res.content.sha ? res.content.sha : state.fileSha;
          /* IPはコミットメッセージに既に入っているので再取得してバックアップへ */
          return getClientIp().then(function (ip) {
            return saveBackup(state.path, out, userMsg, ip).then(function () {
              status('保存完了 ✓ バックアップも作成しました');
              clearDraft();
              if ($('meta-use-menu-icon') && $('meta-use-menu-icon').checked) {
                updateMenuIcon(state.path, ($('meta-favicon') && $('meta-favicon').value) || '');
              }
            });
          });
        });
      });
    }).catch(function (err) {
      status('保存失敗: ' + err.message);
    });
  }

  function applyStyle() {
    var el = state.selected;
    if (!el) { status('先に要素を選択'); return; }
    if ($('p-color')) el.style.color = $('p-color').value;
    if ($('p-bg')) el.style.backgroundColor = $('p-bg').value;
    if ($('p-size')) {
      el.style.fontSize = $('p-size').value + 'px';
      if ($('p-size-v')) $('p-size-v').textContent = $('p-size').value;
    }
    if ($('p-weight') && $('p-weight').value) el.style.fontWeight = $('p-weight').value;
    status('スタイル適用');
  }

  function loadMetaPanel() {
    var d = doc();
    if (!d) return;
    var titleEl = d.querySelector('title');
    if ($('meta-title')) $('meta-title').value = titleEl ? titleEl.textContent : '';
    var desc = d.querySelector('meta[name="description"]');
    if ($('meta-desc')) $('meta-desc').value = desc ? (desc.getAttribute('content') || '') : '';
    var kw = d.querySelector('meta[name="keywords"]');
    if ($('meta-keywords')) $('meta-keywords').value = kw ? (kw.getAttribute('content') || '') : '';
    var icon = d.querySelector('link[rel="icon"],link[rel="shortcut icon"]');
    var fav = icon ? (icon.getAttribute('href') || '') : '';
    if ($('meta-favicon')) $('meta-favicon').value = fav;
    var prev = $('favicon-preview');
    if (prev) {
      if (fav) { prev.src = fav; prev.style.display = 'block'; }
      else { prev.removeAttribute('src'); prev.style.display = 'none'; }
    }
  }

  function applyMeta() {
    if (!state.user.canEditMeta) { status('メタ編集権限がありません'); return; }
    var d = doc();
    if (!d) { status('プレビューがありません'); return; }
    var head = d.head || d.querySelector('head');
    if (!head) return;
    var titleVal = ($('meta-title') && $('meta-title').value) || '';
    var titleEl = head.querySelector('title');
    if (!titleEl) { titleEl = d.createElement('title'); head.appendChild(titleEl); }
    titleEl.textContent = titleVal;
    if ($('ed-title')) $('ed-title').textContent = titleVal || state.path;
    function setMeta(name, val) {
      var el = head.querySelector('meta[name="' + name + '"]');
      if (!val) { if (el) el.remove(); return; }
      if (!el) { el = d.createElement('meta'); el.setAttribute('name', name); head.appendChild(el); }
      el.setAttribute('content', val);
    }
    setMeta('description', ($('meta-desc') && $('meta-desc').value) || '');
    setMeta('keywords', ($('meta-keywords') && $('meta-keywords').value) || '');
    var fav = ($('meta-favicon') && $('meta-favicon').value.trim()) || '';
    var icon = head.querySelector('link[rel="icon"],link[rel="shortcut icon"]');
    if (fav) {
      if (!icon) { icon = d.createElement('link'); icon.setAttribute('rel', 'icon'); head.appendChild(icon); }
      icon.setAttribute('href', fav);
    } else if (icon) icon.remove();
    var prev = $('favicon-preview');
    if (prev) {
      if (fav) { prev.src = fav; prev.style.display = 'block'; }
      else { prev.removeAttribute('src'); prev.style.display = 'none'; }
    }
    status('メタ情報を適用（保存で確定）');
  }

  function updateMenuIcon(pagePath, iconUrl) {
    if (!iconUrl) return;
    var path = 'src/cms/menu-icons.json';
    getFile(path).then(function (f) {
      var map = {};
      try { map = JSON.parse(decode(f.content)); } catch (e) {}
      map[pagePath] = iconUrl;
      return putFile(path, JSON.stringify(map, null, 2), 'CMS: menu icon ' + pagePath, f.sha);
    }).catch(function () {
      var map = {}; map[pagePath] = iconUrl;
      return putFile(path, JSON.stringify(map, null, 2), 'CMS: create menu-icons', null);
    }).then(function () { status('MENUアイコンも更新'); }).catch(function () {});
  }

  function uploadFavicon(file) {
    if (!file || !state.user.canUpload) return;
    var reader = new FileReader();
    reader.onload = function () {
      var result = reader.result;
      var b64 = typeof result === 'string' ? result.split(',')[1] : '';
      if (!b64) return;
      var ext = (file.name.split('.').pop() || 'png').toLowerCase();
      var dir = state.path.indexOf('/') >= 0 ? state.path.replace(/\/[^\/]*$/, '/') : '';
      var fname = 'favicon-' + Date.now() + '.' + ext;
      var fpath = dir + fname;
      putFile(fpath, atob(b64) ? null : '', 'CMS: favicon', null).catch(function () {});
      /* binaryはbase64で送る */
      var body = { message: 'CMS: favicon ' + fpath, content: b64, branch: 'main' };
      fetch(API + '/' + fpath, { method: 'PUT', headers: headers(), body: JSON.stringify(body) })
        .then(function (r) {
          if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
          var url = SITE + fpath;
          if ($('meta-favicon')) $('meta-favicon').value = url;
          var prev = $('favicon-preview');
          if (prev) { prev.src = url; prev.style.display = 'block'; }
          status('ファビコンアップロード完了');
        }).catch(function (e) { status('アップロード失敗: ' + e.message); });
    };
    reader.readAsDataURL(file);
  }

  function openNewModal() {
    var m = $('modal-new');
    if (m) m.classList.remove('hidden');
    if ($('new-filename')) $('new-filename').value = '';
    if ($('new-content')) $('new-content').value = '';
    if ($('new-msg')) $('new-msg').textContent = '';
  }
  function closeNewModal() {
    var m = $('modal-new');
    if (m) m.classList.add('hidden');
  }
  function createNewFile() {
    if (!state.user.canUpload) { if ($('new-msg')) $('new-msg').textContent = '権限がありません'; return; }
    var name = (($('new-filename') && $('new-filename').value) || '').trim();
    var content = ($('new-content') && $('new-content').value) || '';
    var msgEl = $('new-msg');
    if (!name || /[\/\\]/.test(name) || name.indexOf('..') >= 0) {
      if (msgEl) msgEl.textContent = 'ファイル名が不正です';
      return;
    }
    var path = userDir() + '/' + name;
    if (msgEl) msgEl.textContent = '作成中…';
    buildCommitMessage('create ' + name).then(function (cm) {
      return putFile(path, content || '', cm, null);
    }).then(function () {
      closeNewModal();
      switchTab('files');
      loadFiles();
    }).catch(function (e) {
      if (msgEl) msgEl.textContent = '作成失敗: ' + e.message;
    });
  }

  function handleUpload(files) {
    if (!files || !files.length || !state.user.canUpload) return;
    var st = $('files-status');
    if (st) st.textContent = 'アップロード中…';
    var chain = Promise.resolve();
    Array.prototype.forEach.call(files, function (file) {
      chain = chain.then(function () {
        return new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function () {
            var result = reader.result;
            var b64 = typeof result === 'string' ? result.split(',')[1] : '';
            if (!b64) { reject(new Error('読込失敗')); return; }
            var path = userDir() + '/' + file.name.replace(/[\/\\]/g, '_');
            buildCommitMessage('upload ' + file.name).then(function (cm) {
              return fetch(API + '/' + path, {
                method: 'PUT', headers: headers(),
                body: JSON.stringify({ message: cm, content: b64, branch: 'main' })
              });
            }).then(function (r) {
              if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
              resolve();
            }).catch(reject);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
    });
    chain.then(function () {
      loadFiles();
      if (st) st.textContent = 'アップロード完了';
    }).catch(function (e) {
      if (st) st.textContent = '失敗: ' + e.message;
    });
  }

  function startDraftTimer() {
    clearInterval(state.draftTimer);
    state.draftTimer = setInterval(function () {
      try {
        if (!state.path || !state.isHtml) return;
        var draft = exportHtml();
        localStorage.setItem('cms_draft_' + state.path, draft);
      } catch (e) {}
    }, 30000);
  }
  function clearDraft() {
    if (state.path) try { localStorage.removeItem('cms_draft_' + state.path); } catch (e) {}
  }

  function boot() {
    status('ユーザー情報を読み込み中…');
    loadUsers().then(function () {
      var s = getSession();
      if (s && s.id && USERS[s.id]) {
        /* セッション復元時も最新の権限をusers.jsonから反映 */
        var u = USERS[s.id];
        state.user = {
          id: s.id,
          name: u.name,
          semi_name: u.semi_name || '',
          group: u.group || '',
          class: u.class || '',
          role: u.role || 'member',
          permissions: (u.permissions || []).slice(),
          isAdmin: !!u.isAdmin,
          advanced: !!u.advanced,
          canEditMeta: u.canEditMeta !== false,
          canUpload: u.canUpload !== false,
          canDelete: u.canDelete !== false,
          canBackupRestore: !!u.canBackupRestore || !!u.isAdmin
        };
        setSession(state.user);
        openDash();
      } else {
        show('view-login');
      }
    }).catch(function (e) {
      var msg = $('login-msg');
      if (msg) msg.textContent = 'users.json の読込に失敗: ' + e.message;
      show('view-login');
    });

    if ($('btn-login')) $('btn-login').onclick = login;
    ['uid', 'pw'].forEach(function (id) {
      if ($(id)) $(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') login();
      });
    });
    if ($('btn-logout')) $('btn-logout').onclick = function () {
      clearSession(); state.user = null; show('view-login');
    };
    if ($('btn-back')) $('btn-back').onclick = function () {
      clearSelection(); hideRtToolbar(); clearInterval(state.draftTimer); openDash();
    };
    if ($('btn-save')) $('btn-save').onclick = save;
    if ($('btn-apply-style')) $('btn-apply-style').onclick = applyStyle;
    if ($('p-size')) {
      $('p-size').oninput = function () {
        if ($('p-size-v')) $('p-size-v').textContent = $('p-size').value;
      };
    }
    if ($('btn-make-absolute')) {
      $('btn-make-absolute').onclick = function () {
        if (!state.selected) { status('先に要素を選択'); return; }
        ensureAbsolute(state.selected);
        attachHandles(state.selected);
        status('ドラッグ・リサイズ可能');
      };
    }
    if ($('btn-delete-el')) {
      $('btn-delete-el').onclick = function () {
        if (!state.selected) return;
        if (!confirm('この要素を削除しますか？')) return;
        state.selected.remove();
        state.selected = null;
        hideRtToolbar();
        status('要素を削除');
      };
    }

    var tb = $('rt-toolbar');
    if (tb) {
      tb.addEventListener('mousedown', function (e) { e.preventDefault(); });
      tb.querySelectorAll('button[data-cmd]').forEach(function (btn) {
        btn.onclick = function () {
          var cmd = btn.getAttribute('data-cmd');
          var val = btn.getAttribute('data-val') || null;
          var d = doc();
          if (!d) return;
          d.defaultView.focus();
          if (cmd === 'createLink') {
            var url = prompt('リンクURL', 'https://');
            if (url) d.execCommand('createLink', false, url);
          } else if (cmd === 'formatBlock' && val) {
            d.execCommand('formatBlock', false, val);
          } else {
            d.execCommand(cmd, false, val);
          }
          status('書式適用');
        };
      });
      if ($('rt-done')) {
        $('rt-done').onclick = function () {
          if (state.selected) state.selected.removeAttribute('contenteditable');
          hideRtToolbar();
        };
      }
    }

    document.querySelectorAll('.mode-btn').forEach(function (b) {
      b.addEventListener('click', function () { setEditorMode(b.getAttribute('data-mode')); });
    });

    if ($('btn-apply-meta')) $('btn-apply-meta').onclick = applyMeta;
    if ($('btn-favicon-upload')) {
      $('btn-favicon-upload').onclick = function () {
        var fi = $('favicon-input');
        if (fi) fi.click();
      };
    }
    if ($('favicon-input')) {
      $('favicon-input').onchange = function () {
        if ($('favicon-input').files[0]) uploadFavicon($('favicon-input').files[0]);
        $('favicon-input').value = '';
      };
    }

    document.querySelectorAll('.dash-tabs .tab').forEach(function (t) {
      t.addEventListener('click', function () { switchTab(t.getAttribute('data-tab')); });
    });

    if ($('btn-new-file')) $('btn-new-file').onclick = openNewModal;
    if ($('btn-new-cancel')) $('btn-new-cancel').onclick = closeNewModal;
    if ($('btn-new-create')) $('btn-new-create').onclick = createNewFile;
    if ($('btn-refresh-files')) $('btn-refresh-files').onclick = loadFiles;
    if ($('btn-upload')) $('btn-upload').onclick = function () {
      var fi = $('file-input');
      if (fi) fi.click();
    };
    if ($('file-input')) {
      $('file-input').onchange = function () {
        handleUpload($('file-input').files);
        $('file-input').value = '';
      };
    }
    if ($('btn-list-all-users')) {
      $('btn-list-all-users').onclick = function () {
        var out = $('admin-out');
        if (!out) return;
        out.textContent = Object.keys(USERS).map(function (id) {
          var u = USERS[id];
          return id + ' | ' + u.name + ' | ' + (u.role || '') + ' | admin=' + !!u.isAdmin +
            ' | restore=' + !!u.canBackupRestore + ' | ' + (u.semi_name || '');
        }).join('\n');
      };
    }
    if ($('btn-open-backup')) {
      $('btn-open-backup').onclick = function () {
        window.open('https://r25347sh.github.io/asobiseminar_backup/', '_blank');
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
