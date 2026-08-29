(function () {
  'use strict';
  var OWNER = 'r25347sh', REPO = 'asobiseminar';
  var TOKEN = 'github_pat_11BXRNCFA0kvDdfLcu15XM_' + '9TNWM8KR76lnIY89JkNCNWGHtCRchcNJPFB6jvx4JH9RW37WFEGILTGVh9t';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents';
  var SITE = 'https://r25347sh.github.io/asobiseminar/';
  var SESSION = 'asobilab_user';

  /* ユーザー定義（権限・個人スペース用） */
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
    mode: 'visual', /* visual | code */
    selected: [],
    isHtml: true
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
      .then(function (data) {
        return Array.isArray(data) ? data : [];
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
      id: id,
      name: u.name,
      semi_name: u.semi_name,
      permissions: u.permissions.slice(),
      advanced: !!u.advanced,
      isAdmin: !!u.isAdmin
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
      }).catch(function () {
        return { path: p, title: p };
      });
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
    var dir = userDir();
    listDir(dir).then(function (items) {
      var files = items.filter(function (i) { return i.type === 'file'; });
      if (st) st.textContent = files.length ? '' : 'まだファイルがありません。「新規ファイル」から作成できます';
      files.forEach(function (f) {
        var row = document.createElement('div');
        row.className = 'file-row';
        var sizeKb = f.size ? (f.size / 1024).toFixed(1) + ' KB' : '';
        row.innerHTML =
          '<span class="name"></span>' +
          '<span class="meta mono"></span>' +
          '<div class="actions">' +
          '<button type="button" class="btn ghost btn-edit">編集</button>' +
          '<button type="button" class="btn danger btn-del">削除</button>' +
          '</div>';
        row.querySelector('.name').textContent = f.name;
        row.querySelector('.meta').textContent = sizeKb;
        row.querySelector('.btn-edit').onclick = function () {
          var isHtml = /\.html?$/i.test(f.name);
          openEditor(f.path, isHtml);
        };
        row.querySelector('.btn-del').onclick = function () {
          if (!confirm(f.name + ' を削除しますか？')) return;
          if (st) st.textContent = '削除中…';
          getFile(f.path).then(function (meta) {
            return deleteFile(f.path, meta.sha, 'CMS: delete ' + f.path);
          }).then(function () {
            loadFiles();
          }).catch(function (e) {
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
    var style = '<style id="cms-ui">.cms-sel{outline:3px solid #ff6b6b!important;outline-offset:2px}</style>';
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + base + '">' + style);
    } else {
      html = '<base href="' + base + '">' + style + html;
    }
    return html;
  }

  function setEditorMode(isHtml) {
    state.isHtml = isHtml;
    state.mode = isHtml ? 'visual' : 'code';
    var railV = $('rail-visual'), railC = $('rail-code');
    var stageF = frame(), codeStage = $('code-stage');
    if (isHtml) {
      if (railV) railV.classList.remove('hidden');
      if (railC) railC.classList.add('hidden');
      if (stageF) stageF.classList.remove('hidden');
      if (codeStage) codeStage.classList.add('hidden');
    } else {
      if (railV) railV.classList.add('hidden');
      if (railC) railC.classList.remove('hidden');
      if (stageF) stageF.classList.add('hidden');
      if (codeStage) codeStage.classList.remove('hidden');
    }
  }

  function openEditor(path, isHtml) {
    state.path = path;
    state.selected = [];
    show('view-editor');
    if ($('ed-path')) $('ed-path').textContent = path;
    if ($('ed-title')) $('ed-title').textContent = '読み込み中…';
    status('読み込み中…');
    setEditorMode(!!isHtml);

    getFile(path).then(function (f) {
      var content = decode(f.content);
      if (isHtml) {
        var title = extractTitle(content);
        if ($('ed-title')) $('ed-title').textContent = title || path;
        var fEl = frame();
        fEl.onload = function () {
          var d = doc();
          if (!d) return;
          d.addEventListener('click', function (e) {
            e.preventDefault();
            var t = e.target;
            if (!t || t === d.body || t === d.documentElement) return;
            d.querySelectorAll('.cms-sel').forEach(function (n) { n.classList.remove('cms-sel'); });
            t.classList.add('cms-sel');
            state.selected = [t];
            if ($('p-text')) $('p-text').value = (t.innerText || '').trim().slice(0, 2000);
          }, true);
          status('編集可能 — 要素をクリックして変更');
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
    var clone = d.documentElement.cloneNode(true);
    clone.querySelectorAll('#cms-ui,base').forEach(function (n) { n.remove(); });
    clone.querySelectorAll('.cms-sel').forEach(function (n) { n.classList.remove('cms-sel'); });
    return '<!DOCTYPE html>\n' + clone.outerHTML;
  }

  function save() {
    if (!state.path || !state.user) return;
    status('保存中…');
    var out;
    try {
      if (state.isHtml) {
        out = exportHtml();
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
    }).catch(function (err) {
      status('保存失敗: ' + err.message);
    });
  }

  function applyStyle() {
    var el = state.selected[0];
    if (!el) {
      status('先に要素を選択してください');
      return;
    }
    if ($('p-text') && $('p-text').value !== '') el.textContent = $('p-text').value;
    if ($('p-color')) el.style.color = $('p-color').value;
    if ($('p-bg')) el.style.backgroundColor = $('p-bg').value;
    if ($('p-size')) {
      el.style.fontSize = $('p-size').value + 'px';
      if ($('p-size-v')) $('p-size-v').textContent = $('p-size').value;
    }
    status('スタイル適用しました');
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
    putFile(path, content || '/* 新規ファイル */\n', 'CMS: create ' + path, null)
      .then(function () {
        closeNewModal();
        switchTab('files');
        loadFiles();
      })
      .catch(function (e) {
        if (msgEl) msgEl.textContent = '作成失敗: ' + e.message;
      });
  }

  /* アップロード */
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
            var body = {
              message: 'CMS: upload ' + path,
              content: b64,
              branch: 'main'
            };
            fetch(API + '/' + path, {
              method: 'PUT',
              headers: headers(),
              body: JSON.stringify(body)
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
    if (s && s.id) {
      state.user = s;
      openDash();
    } else {
      show('view-login');
    }

    if ($('btn-login')) $('btn-login').onclick = login;
    ['uid', 'pw'].forEach(function (id) {
      if ($(id)) $(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') login();
      });
    });
    if ($('btn-logout')) $('btn-logout').onclick = function () {
      clearSession();
      state.user = null;
      show('view-login');
    };
    if ($('btn-back')) $('btn-back').onclick = function () { openDash(); };
    if ($('btn-save')) $('btn-save').onclick = save;
    if ($('btn-apply-style')) $('btn-apply-style').onclick = applyStyle;
    if ($('p-size')) {
      $('p-size').oninput = function () {
        if ($('p-size-v')) $('p-size-v').textContent = $('p-size').value;
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
        var lines = Object.keys(USERS).map(function (id) {
          var u = USERS[id];
          return id + ' | ' + u.name + ' | ' + (u.semi_name || '') + ' | admin=' + !!u.isAdmin;
        });
        out.textContent = lines.join('\n');
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
