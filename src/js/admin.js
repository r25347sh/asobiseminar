(function () {
  'use strict';
  var OWNER = 'r25347sh', REPO = 'asobiseminar';
  var TOKEN = 'github_pat_11BXRNCFA0kvDdfLcu15XM_' + '9TNWM8KR76lnIY89JkNCNWGHtCRchcNJPFB6jvx4JH9RW37WFEGILTGVh9t';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents';
  var SITE = 'https://r25347sh.github.io/asobiseminar/';
  var SESSION = 'asobilab_user';

  var USERS = {
    "r22289hh": { password: "jL5!KsOnKS2!", name: "樊澤熙", semi_name: "遊びの探究ゼミ・ファッション", permissions: ["pages/members/r22289hh.html", "pages/groups/fashion.html"], advanced: false, isAdmin: false },
    "r22321fs": { password: "gI9#CYzMDQmr", name: "福島駿", semi_name: "遊びの探究ゼミ・すけぼぉ", permissions: ["pages/members/r22321fs.html", "pages/groups/skate.html"], advanced: false, isAdmin: false },
    "r22497kk": { password: "FMBCgQwYBJBv", name: "川端也大", semi_name: "遊びの探究ゼミ・すけぼぉ", permissions: ["pages/members/r22497kk.html", "pages/groups/skate.html"], advanced: false, isAdmin: false },
    "r22570kr": { password: "7$8PLjCwXu%f", name: "草深りお", semi_name: "遊びの探究ゼミ・ファッション", permissions: ["pages/members/r22570kr.html", "pages/groups/fashion.html"], advanced: false, isAdmin: false },
    "r22661kk": { password: "5FFVNXbCuD1X", name: "小林和輝", semi_name: "遊びの探究ゼミ・建築", permissions: ["pages/members/r22661kk.html", "pages/groups/arch.html"], advanced: false, isAdmin: false },
    "r25173ok": { password: "4lsgva0SfwTc", name: "奥村京太", semi_name: "遊びの探究ゼミ・すけぼぉ", permissions: ["pages/members/r25173ok.html", "pages/groups/skate.html"], advanced: false, isAdmin: false },
    "r25321sa": { password: "Ipd#cWeFZe1H", name: "齊藤絢太", semi_name: "遊びの探究ゼミ・建築", permissions: ["pages/members/r25321sa.html", "pages/groups/arch.html"], advanced: false, isAdmin: false },
    "r25339sc": { password: "NgYqQ95mDwDX", name: "佐藤ちほ", semi_name: "遊びの探究ゼミ・ファッション", permissions: ["pages/members/r25339sc.html", "pages/groups/fashion.html"], advanced: false, isAdmin: false },
    "r25404jk": { password: "QlOcL2m!fkD1", name: "神季美花", semi_name: "遊びの探究ゼミ・ファッション", permissions: ["pages/members/r25404jk.html", "pages/groups/fashion.html"], advanced: false, isAdmin: false },
    "r25660na": { password: "%4!MRq84W4nY", name: "野田彩夏", semi_name: "遊びの探究ゼミ・建築", permissions: ["pages/members/r25660na.html", "pages/groups/arch.html"], advanced: false, isAdmin: false },
    "r25917yk": { password: "XE21qDXeMUx2", name: "柳原康希", semi_name: "遊びの探究ゼミ・すけぼぉ", permissions: ["pages/members/r25917yk.html", "pages/groups/skate.html"], advanced: false, isAdmin: false },
    "matsumaru": { password: "Asobi#2026$Play!", name: "松丸先生", semi_name: "遊びの探究ゼミ・全体管理", permissions: ["pages/Matsumaru_T.html", "pages/about_This_Site.html", "pages/about_asobi.html", "pages/members/r22289hh.html", "pages/members/r22321fs.html", "pages/members/r22497kk.html", "pages/members/r22570kr.html", "pages/members/r22661kk.html", "pages/members/r25173ok.html", "pages/members/r25321sa.html", "pages/members/r25339sc.html", "pages/members/r25404jk.html", "pages/members/r25660na.html", "pages/members/r25917yk.html", "pages/groups/skate.html", "pages/groups/fashion.html", "pages/groups/arch.html"], advanced: true, isAdmin: false },
    "r25347sh": { password: "kes-2592", name: "r25347sh", semi_name: "サイト管理者", permissions: ["index.html", "admin.html", "pages/Matsumaru_T.html", "pages/about_This_Site.html", "pages/about_asobi.html", "pages/members/r22289hh.html", "pages/members/r22321fs.html", "pages/members/r22497kk.html", "pages/members/r22570kr.html", "pages/members/r22661kk.html", "pages/members/r25173ok.html", "pages/members/r25321sa.html", "pages/members/r25339sc.html", "pages/members/r25404jk.html", "pages/members/r25660na.html", "pages/members/r25917yk.html", "pages/groups/skate.html", "pages/groups/fashion.html", "pages/groups/arch.html"], advanced: true, isAdmin: true }
  };

  var state = {
    user: null,
    path: null,
    mode: 'visual',
    selected: null,
    isHtml: true,
    drag: null,
    resize: null
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

  function getFile(path) {
    return fetch(API + '/' + path + '?ref=main', { headers: headers() })
      .then(function (r) {
        if (!r.ok) throw new Error('GET ' + path + ' ' + r.status);
        return r.json();
      });
  }
  function putFile(path, content, message, sha) {
    var body = { message: message || 'CMS update', content: encode(content), branch: 'main' };
    if (sha) body.sha = sha;
    return fetch(API + '/' + path, { method: 'PUT', headers: headers(), body: JSON.stringify(body) })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
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

  function login() {
    var id = (($('uid') && $('uid').value) || '').trim();
    var pw = ($('pw') && $('pw').value) || '';
    var u = USERS[id];
    var msg = $('login-msg');
    if (!u || String(u.password) !== String(pw)) {
      if (msg) msg.textContent = 'ID またはパスワードが違います';
      return;
    }
    state.user = {
      id: id, name: u.name, semi_name: u.semi_name,
      permissions: u.permissions.slice(), advanced: !!u.advanced, isAdmin: !!u.isAdmin
    };
    setSession(state.user);
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
    ['pages', 'files', 'admin'].forEach(function (p) {
      var el = $('panel-' + p);
      if (el) el.classList.toggle('hidden', p !== name);
    });
    if (name === 'files') loadFiles();
  }

  function openDash() {
    show('view-dash');
    if ($('dash-user') && state.user) {
      $('dash-user').textContent = (state.user.name || state.user.id) + ' · ' + (state.user.semi_name || '');
    }
    if ($('files-path')) $('files-path').textContent = userDir() + '/';
    if (state.user && state.user.isAdmin) {
      var ta = $('tab-admin');
      if (ta) ta.classList.remove('hidden');
    }
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
        return { path: p, title: extractTitle(decode(f.content)) || p };
      }).catch(function () { return { path: p, title: p }; });
    })).then(function (items) {
      if (st) st.textContent = items.length ? '' : '編集可能なページがありません';
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
    });
  }

  function loadFiles() {
    var list = $('files-list'), st = $('files-status');
    if (!list) return;
    list.innerHTML = '';
    if (st) st.textContent = '読み込み中…';
    listDir(userDir()).then(function (items) {
      var files = items.filter(function (i) { return i.type === 'file'; });
      if (st) st.textContent = files.length ? '' : 'まだファイルがありません。「新規ファイル」から作成できます';
      files.forEach(function (f) {
        var row = document.createElement('div');
        row.className = 'file-row';
        var sizeKb = f.size ? (f.size / 1024).toFixed(1) + ' KB' : '';
        row.innerHTML =
          '<span class="name"></span><span class="meta mono"></span>' +
          '<div class="actions">' +
          '<button type="button" class="btn ghost btn-edit">編集</button>' +
          '<button type="button" class="btn danger btn-del">削除</button></div>';
        row.querySelector('.name').textContent = f.name;
        row.querySelector('.meta').textContent = sizeKb;
        row.querySelector('.btn-edit').onclick = function () {
          openEditor(f.path, /\.html?$/i.test(f.name));
        };
        row.querySelector('.btn-del').onclick = function () {
          if (!confirm(f.name + ' を削除しますか？')) return;
          if (st) st.textContent = '削除中…';
          getFile(f.path).then(function (meta) {
            return deleteFile(f.path, meta.sha, 'CMS: delete ' + f.path);
          }).then(loadFiles).catch(function (e) {
            if (st) st.textContent = '削除失敗: ' + e.message;
          });
        };
        list.appendChild(row);
      });
    }).catch(function (e) {
      if (st) st.textContent = '読込失敗: ' + e.message;
    });
  }

  function frame() { return $('frame'); }
  function doc() {
    var f = frame();
    return f && f.contentDocument;
  }

  function injectChrome(html, pagePath) {
    var dir = pagePath.indexOf('/') >= 0 ? pagePath.replace(/\/[^\/]*$/, '/') : '';
    var base = SITE + dir;
    /* CMS編集中は MENU / FAB を完全に無効化（被り防止） */
    html = html.replace(/<script[^>]*MENU\/MENU\.js[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']*MENU\/MENU\.js["'][^>]*><\/script>/gi, '');
    html = html.replace(/<link[^>]*MENU\/MENU\.css[^>]*>/gi, '');
    html = html.replace(/<div[^>]*class=["'][^"']*radial-menu-wrapper[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
    html = html.replace(/<button[^>]*class=["'][^"']*menu-fab[^"']*["'][^>]*>[\s\S]*?<\/button>/gi, '');
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
      /* プレビュー内のMENU残骸を強制非表示 */
      '.radial-menu-wrapper,.menu-fab,.header-auth{display:none!important;visibility:hidden!important;pointer-events:none!important}',
      'body{padding-bottom:0!important}',
      '</style>'
    ].join('');
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + base + '">' + style);
    } else {
      html = '<base href="' + base + '">' + style + html;
    }
    return html;
  }

  /* ---- 選択・インライン編集・ドラッグ ---- */
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
    showRtToolbar(el);
    if ($('sel-info')) {
      $('sel-info').textContent = '<' + el.tagName.toLowerCase() + '> 選択中 — 直接入力 or ツールバー';
    }
    /* スタイルパネル同期 */
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
    status('編集中 — 文字入力・ツールバー・ドラッグで変更');
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

  function showRtToolbar(el) {
    var tb = $('rt-toolbar');
    if (!tb) return;
    tb.classList.remove('hidden');
    tb.style.top = '';
    tb.style.left = '';
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
      if (t.classList && t.classList.contains('cms-handle')) return;
      if (t.classList && t.classList.contains('cms-drag-bar')) return;
      selectElement(t);
    }, true);

    d.addEventListener('mousedown', function (e) {
      var t = e.target;
      if (!state.selected) return;
      /* リサイズ */
      if (t.classList && t.classList.contains('cms-handle')) {
        e.preventDefault();
        e.stopPropagation();
        var handle = t.dataset.handle;
        var el = state.selected;
        var rect = el.getBoundingClientRect();
        var startX = e.clientX, startY = e.clientY;
        var startW = el.offsetWidth, startH = el.offsetHeight;
        var startL = el.offsetLeft, startT = el.offsetTop;
        state.resize = { handle: handle, el: el, startX: startX, startY: startY, startW: startW, startH: startH, startL: startL, startT: startT };
        return;
      }
      /* ドラッグ */
      if (t.classList && t.classList.contains('cms-drag-bar')) {
        e.preventDefault();
        e.stopPropagation();
        var el2 = state.selected;
        ensureAbsolute(el2);
        state.drag = {
          el: el2,
          startX: e.clientX,
          startY: e.clientY,
          origL: parseFloat(el2.style.left) || el2.offsetLeft,
          origT: parseFloat(el2.style.top) || el2.offsetTop
        };
      }
    }, true);

    d.addEventListener('mousemove', function (e) {
      if (state.drag) {
        e.preventDefault();
        var dx = e.clientX - state.drag.startX;
        var dy = e.clientY - state.drag.startY;
        state.drag.el.style.left = (state.drag.origL + dx) + 'px';
        state.drag.el.style.top = (state.drag.origT + dy) + 'px';
      }
      if (state.resize) {
        e.preventDefault();
        var r = state.resize;
        var dx2 = e.clientX - r.startX;
        var dy2 = e.clientY - r.startY;
        var w = r.startW, h = r.startH, l = r.startL, t = r.startT;
        if (r.handle.indexOf('e') >= 0) w = Math.max(40, r.startW + dx2);
        if (r.handle.indexOf('s') >= 0) h = Math.max(20, r.startH + dy2);
        if (r.handle.indexOf('w') >= 0) {
          w = Math.max(40, r.startW - dx2);
          l = r.startL + dx2;
        }
        if (r.handle.indexOf('n') >= 0) {
          h = Math.max(20, r.startH - dy2);
          t = r.startT + dy2;
        }
        ensureAbsolute(r.el);
        r.el.style.width = w + 'px';
        r.el.style.height = h + 'px';
        if (r.handle.indexOf('w') >= 0) r.el.style.left = l + 'px';
        if (r.handle.indexOf('n') >= 0) r.el.style.top = t + 'px';
      }
    }, true);

    d.addEventListener('mouseup', function () {
      state.drag = null;
      state.resize = null;
    }, true);

    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        clearSelection();
      }
    });
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
      /* iframe → textarea */
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
    show('view-editor');
    if ($('ed-path')) $('ed-path').textContent = path;
    if ($('ed-title')) $('ed-title').textContent = '読み込み中…';
    status('読み込み中…');
    hideRtToolbar();
    setEditorMode(isHtml ? 'visual' : 'code');

    getFile(path).then(function (f) {
      var content = decode(f.content);
      if (isHtml) {
        var title = extractTitle(content);
        if ($('ed-title')) $('ed-title').textContent = title || path;
        var fEl = frame();
        fEl.onload = function () {
          var d = doc();
          if (d) {
            d.querySelectorAll('.radial-menu-wrapper,.menu-fab,.header-auth').forEach(function (n) { n.remove(); });
            /* 長押しメニューが起動しないよう pointer 系を抑制しないが、MENU script は既に除去済み */
          }
          setupFrameEvents();
          status('編集可能 — 要素をクリックしてインライン編集（MENUは編集中非表示）');
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
    var d = doc();
    if (!d) throw new Error('no doc');
    clearSelection();
    var clone = d.documentElement.cloneNode(true);
    clone.querySelectorAll('#cms-ui,base').forEach(function (n) { n.remove(); });
    clone.querySelectorAll('.cms-sel,.cms-handle,.cms-drag-bar,.radial-menu-wrapper,.menu-fab').forEach(function (n) {
      if (n.classList.contains('cms-handle') || n.classList.contains('cms-drag-bar') ||
          n.classList.contains('radial-menu-wrapper') || n.classList.contains('menu-fab')) {
        n.remove();
      } else {
        n.classList.remove('cms-sel');
        n.removeAttribute('contenteditable');
      }
    });
    /* MENUスクリプトは保存時も除去しない（本番で必要）。編集用注入分だけ消す */
    return '<!DOCTYPE html>\n' + clone.outerHTML;
  }

  function save() {
    if (!state.path || !state.user) return;
    status('保存中…');
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
    var msg = ($('commit-msg') && $('commit-msg').value.trim()) || ('CMS: ' + state.path);
    getFile(state.path).then(function (f) {
      return putFile(state.path, out, msg, f.sha);
    }).then(function () {
      status('保存完了 ✓ 反映まで数十秒かかることがあります');
      /* MENUアイコン連携 */
      if ($('meta-use-menu-icon') && $('meta-use-menu-icon').checked) {
        updateMenuIcon(state.path, ($('meta-favicon') && $('meta-favicon').value) || '');
      }
    }).catch(function (err) {
      status('保存失敗: ' + err.message);
    });
  }

  function applyStyle() {
    var el = state.selected;
    if (!el) {
      status('先に要素を選択してください');
      return;
    }
    if ($('p-color')) el.style.color = $('p-color').value;
    if ($('p-bg')) el.style.backgroundColor = $('p-bg').value;
    if ($('p-size')) {
      el.style.fontSize = $('p-size').value + 'px';
      if ($('p-size-v')) $('p-size-v').textContent = $('p-size').value;
    }
    if ($('p-weight') && $('p-weight').value) el.style.fontWeight = $('p-weight').value;
    status('スタイル適用しました');
  }

  /* ---- メタ / ファビコン ---- */
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
    var d = doc();
    if (!d) {
      status('プレビューがありません');
      return;
    }
    var head = d.head || d.querySelector('head');
    if (!head) return;

    var titleVal = ($('meta-title') && $('meta-title').value) || '';
    var titleEl = head.querySelector('title');
    if (!titleEl) {
      titleEl = d.createElement('title');
      head.appendChild(titleEl);
    }
    titleEl.textContent = titleVal;
    if ($('ed-title')) $('ed-title').textContent = titleVal || state.path;

    function setMeta(name, val) {
      var el = head.querySelector('meta[name="' + name + '"]');
      if (!val) {
        if (el) el.remove();
        return;
      }
      if (!el) {
        el = d.createElement('meta');
        el.setAttribute('name', name);
        head.appendChild(el);
      }
      el.setAttribute('content', val);
    }
    setMeta('description', ($('meta-desc') && $('meta-desc').value) || '');
    setMeta('keywords', ($('meta-keywords') && $('meta-keywords').value) || '');

    var fav = ($('meta-favicon') && $('meta-favicon').value.trim()) || '';
    var icon = head.querySelector('link[rel="icon"],link[rel="shortcut icon"]');
    if (fav) {
      if (!icon) {
        icon = d.createElement('link');
        icon.setAttribute('rel', 'icon');
        head.appendChild(icon);
      }
      icon.setAttribute('href', fav);
    } else if (icon) {
      icon.remove();
    }
    var prev = $('favicon-preview');
    if (prev) {
      if (fav) { prev.src = fav; prev.style.display = 'block'; }
      else { prev.removeAttribute('src'); prev.style.display = 'none'; }
    }
    status('メタ情報を適用しました（保存で確定）');
  }

  function updateMenuIcon(pagePath, iconUrl) {
    if (!iconUrl) return;
    var path = 'src/cms/menu-icons.json';
    getFile(path).then(function (f) {
      var map = {};
      try { map = JSON.parse(decode(f.content)); } catch (e) {}
      map[pagePath] = iconUrl;
      return putFile(path, JSON.stringify(map, null, 2), 'CMS: menu icon for ' + pagePath, f.sha);
    }).catch(function () {
      /* 新規作成 */
      var map = {};
      map[pagePath] = iconUrl;
      return putFile(path, JSON.stringify(map, null, 2), 'CMS: create menu-icons.json', null);
    }).then(function () {
      status('MENUアイコンも更新しました');
    }).catch(function (e) {
      console.warn('menu-icons update failed', e);
    });
  }

  /* ファビコン画像アップロード → 個人 or ページ隣に保存 */
  function uploadFavicon(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var result = reader.result;
      var b64 = typeof result === 'string' ? result.split(',')[1] : '';
      if (!b64) return;
      var ext = (file.name.split('.').pop() || 'png').toLowerCase();
      var dir = state.path.indexOf('/') >= 0 ? state.path.replace(/\/[^\/]*$/, '/') : '';
      var fname = 'favicon-' + Date.now() + '.' + ext;
      var fpath = dir + fname;
      var body = { message: 'CMS: favicon ' + fpath, content: b64, branch: 'main' };
      fetch(API + '/' + fpath, {
        method: 'PUT', headers: headers(), body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
        var url = SITE + fpath;
        if ($('meta-favicon')) $('meta-favicon').value = url;
        var prev = $('favicon-preview');
        if (prev) { prev.src = url; prev.style.display = 'block'; }
        status('ファビコンをアップロードしました。適用ボタンを押してください');
      }).catch(function (e) {
        status('アップロード失敗: ' + e.message);
      });
    };
    reader.readAsDataURL(file);
  }

  /* 新規ファイル */
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
    var name = (($('new-filename') && $('new-filename').value) || '').trim();
    var content = ($('new-content') && $('new-content').value) || '';
    var msgEl = $('new-msg');
    if (!name || /[\/\\]/.test(name) || name.indexOf('..') >= 0) {
      if (msgEl) msgEl.textContent = 'ファイル名が不正です（スラッシュ不可）';
      return;
    }
    var path = userDir() + '/' + name;
    if (msgEl) msgEl.textContent = '作成中…';
    putFile(path, content || '', 'CMS: create ' + path, null)
      .then(function () {
        closeNewModal();
        switchTab('files');
        loadFiles();
      })
      .catch(function (e) {
        if (msgEl) msgEl.textContent = '作成失敗: ' + e.message;
      });
  }

  function handleUpload(files) {
    if (!files || !files.length) return;
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
            fetch(API + '/' + path, {
              method: 'PUT', headers: headers(),
              body: JSON.stringify({ message: 'CMS: upload ' + path, content: b64, branch: 'main' })
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

  function boot() {
    var s = getSession();
    if (s && s.id) { state.user = s; openDash(); }
    else show('view-login');

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
      clearSelection(); hideRtToolbar(); openDash();
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
        status('ドラッグ・リサイズ可能にしました');
      };
    }
    if ($('btn-delete-el')) {
      $('btn-delete-el').onclick = function () {
        if (!state.selected) return;
        if (!confirm('この要素を削除しますか？')) return;
        state.selected.remove();
        state.selected = null;
        hideRtToolbar();
        status('要素を削除しました');
      };
    }

    /* リッチテキスト */
    var tb = $('rt-toolbar');
    if (tb) {
      tb.addEventListener('mousedown', function (e) { e.preventDefault(); }); /* フォーカス維持 */
      tb.querySelectorAll('button[data-cmd]').forEach(function (btn) {
        btn.onclick = function () {
          var cmd = btn.getAttribute('data-cmd');
          var val = btn.getAttribute('data-val') || null;
          var d = doc();
          if (!d) return;
          d.defaultView.focus();
          if (cmd === 'createLink') {
            var url = prompt('リンクURLを入力', 'https://');
            if (url) d.execCommand('createLink', false, url);
          } else if (cmd === 'formatBlock' && val) {
            d.execCommand('formatBlock', false, val);
          } else {
            d.execCommand(cmd, false, val);
          }
          status('書式を適用しました');
        };
      });
      if ($('rt-done')) {
        $('rt-done').onclick = function () {
          if (state.selected) {
            state.selected.removeAttribute('contenteditable');
          }
          hideRtToolbar();
        };
      }
    }

    document.querySelectorAll('.mode-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        setEditorMode(b.getAttribute('data-mode'));
      });
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
      t.addEventListener('click', function () {
        switchTab(t.getAttribute('data-tab'));
      });
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
          return id + ' | ' + u.name + ' | ' + (u.semi_name || '') + ' | admin=' + !!u.isAdmin;
        }).join('\n');
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
