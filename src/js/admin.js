(function () {
  'use strict';
  var OWNER = 'r25347sh';
  var REPO = 'asobiseminar';
  var BACKUP_REPO = 'asobiseminar_backup';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents';
  var BACKUP_API = 'https://api.github.com/repos/' + OWNER + '/' + BACKUP_REPO + '/contents';
  var SITE = 'https://r25347sh.github.io/asobiseminar/';
  var SESSION = 'asobilab_user';
  var TOKEN = 'github_pat_11BXRNCFA0z6wQzD7P0p1A_' +
              'IRz7ii32tqH2LsbYQWCyp1YHSn' +
              'CXgrIDZr56epqgIkXZBW6YUHVK3v9kVPY';

  var USERS = {};
  var state = {
    user: null, path: null, mode: 'visual', selected: null,
    isHtml: true, originalHtml: null, fileSha: null,
    drag: null, resize: null, draftTimer: null,
    pageStyles: {},
    pageKeyframes: {}
  };

  var BLOCKS = [
    { id: 'h2', label: '見出し', html: '<h2>新しい見出し</h2>' },
    { id: 'h3', label: '小見出し', html: '<h3>小見出し</h3>' },
    { id: 'p', label: '段落', html: '<p>ここに本文を入力します。</p>' },
    { id: 'lead', label: 'リード文', html: '<p class="page-sub">リード文・説明をここに。</p>' },
    { id: 'card', label: 'カード', html: '<div class="card"><h3>カードタイトル</h3><p>カードの説明文です。</p></div>' },
    { id: 'section', label: 'セクション', html: '<section class="article_by_teacher"><h2>セクションタイトル</h2><p>このセクションは編集できます。</p></section>' },
    { id: 'ul', label: '箇条書き', html: '<ul><li>項目1</li><li>項目2</li><li>項目3</li></ul>' },
    { id: 'ol', label: '番号リスト', html: '<ol><li>手順1</li><li>手順2</li><li>手順3</li></ol>' },
    { id: 'btn', label: 'ボタンリンク', html: '<p style="text-align:center;margin-top:1rem"><a class="btn-play" href="#">リンク先へ →</a></p>' },
    { id: 'img', label: '画像枠', html: '<p style="text-align:center"><img src="https://placehold.co/600x300/png?text=Image" alt="画像" style="max-width:100%;height:auto;border-radius:12px"></p>' },
    { id: 'quote', label: '引用', html: '<blockquote style="border-left:4px solid #ff6b6b;padding:.75rem 1rem;margin:1rem 0;background:rgba(255,107,107,.08)">引用文をここに。</blockquote>' },
    { id: 'hr', label: '区切り線', html: '<hr style="border:0;border-top:2px dashed rgba(43,33,64,.15);margin:1.5rem 0">' },
    { id: 'two-col', label: '2カラム', html: '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"><div><h3>左</h3><p>内容</p></div><div><h3>右</h3><p>内容</p></div></div>' },
    { id: 'notice', label: 'お知らせ枠', html: '<div style="padding:1rem 1.25rem;border-radius:12px;background:rgba(46,196,182,.12);border:1px solid rgba(46,196,182,.35)"><strong>お知らせ</strong><p style="margin:.4rem 0 0">メッセージをここに。</p></div>' }
  ];

  var DESIGN_SETS = [
    { id: 'soft-card', label: 'やわらかカード', styles: { background: '#ffffff', borderRadius: '16px', boxShadow: '0 8px 28px rgba(43,33,64,.10)', padding: '1.25rem', border: '1px solid rgba(43,33,64,.06)' } },
    { id: 'glass', label: 'ガラス風', styles: { background: 'rgba(255,255,255,.55)', backdropFilter: 'blur(10px)', borderRadius: '18px', border: '1px solid rgba(255,255,255,.45)', boxShadow: '0 8px 32px rgba(43,33,64,.12)', padding: '1.2rem' } },
    { id: 'grad-warm', label: '暖色グラデ', styles: { background: 'linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)', borderRadius: '16px', padding: '1.25rem', color: '#2b2140' } },
    { id: 'grad-cool', label: '寒色グラデ', styles: { background: 'linear-gradient(135deg,#a1c4fd 0%,#c2e9fb 100%)', borderRadius: '16px', padding: '1.25rem', color: '#1a2744' } },
    { id: 'neon', label: 'ネオン枠', styles: { background: '#1a1428', color: '#fff', borderRadius: '14px', padding: '1.2rem', border: '2px solid #ff6b6b', boxShadow: '0 0 0 1px rgba(255,107,107,.25), 0 0 24px rgba(255,107,107,.35)' } },
    { id: 'minimal', label: 'ミニマル線', styles: { background: 'transparent', borderTop: '2px solid #2b2140', borderBottom: '2px solid #2b2140', borderLeft: '0', borderRight: '0', borderRadius: '0', padding: '1rem 0' } },
    { id: 'pill', label: 'ピル型', styles: { display: 'inline-block', borderRadius: '999px', padding: '.55rem 1.25rem', background: '#2ec4b6', color: '#fff', fontWeight: '700' } },
    { id: 'shadow-float', label: 'ふわっと影', styles: { boxShadow: '0 16px 40px rgba(43,33,64,.14)', borderRadius: '20px', background: '#fff', padding: '1.5rem', transform: 'translateY(0)' } }
  ];

  var ANIM_SETS = [
    { id: 'fade-up', label: 'ふわっと登場', animation: 'cmsFadeUp .7s ease both', keyframes: '@keyframes cmsFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}' },
    { id: 'pop', label: 'ぽんっと出現', animation: 'cmsPop .45s cubic-bezier(.2,1.4,.4,1) both', keyframes: '@keyframes cmsPop{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}' },
    { id: 'slide-in', label: 'スライドイン', animation: 'cmsSlideIn .55s ease both', keyframes: '@keyframes cmsSlideIn{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}' },
    { id: 'pulse', label: 'やわらか点滅', animation: 'cmsPulse 2.2s ease-in-out infinite', keyframes: '@keyframes cmsPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}' },
    { id: 'floaty', label: 'ふわふわ', animation: 'cmsFloaty 3s ease-in-out infinite', keyframes: '@keyframes cmsFloaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' },
    { id: 'shine', label: 'きらり枠', animation: 'cmsShine 2.8s linear infinite', keyframes: '@keyframes cmsShine{0%{filter:brightness(1)}50%{filter:brightness(1.12)}100%{filter:brightness(1)}}' }
  ];


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
      return '403: Tokenに書き込み権限がありません。GitHub → Settings → Developer settings → Fine-grained tokens で、asobiseminar と asobiseminar_backup の両方に Contents: Read and write を付与し、新しいTokenを admin.js に設定してください。';
    }
    if (statusCode === 401) return '401: Tokenが無効です。再発行してください。';
    if (statusCode === 409) return '409: 競合しました。ページを開き直してから再保存してください。';
    return text || ('HTTP ' + statusCode);
  }

  function getFile(path, apiBase) {
    var base = apiBase || API;
    return fetch(base + '/' + path + '?ref=main', { headers: headers() })
      .then(function (r) {
        if (!r.ok) throw new Error(friendlyErr('', r.status) || ('GET ' + path + ' ' + r.status));
        return r.json();
      });
  }
  function putFile(path, content, message, sha, apiBase) {
    var base = apiBase || API;
    var body = { message: message || 'CMS update', content: encode(content), branch: 'main' };
    if (sha) body.sha = sha;
    return fetch(base + '/' + path, { method: 'PUT', headers: headers(), body: JSON.stringify(body) })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) {
          throw new Error(friendlyErr(t, r.status));
        });
        return r.json();
      });
  }
  function deleteFile(path, sha, message) {
    return fetch(API + '/' + path, {
      method: 'DELETE',
      headers: headers(),
      body: JSON.stringify({ message: message || 'CMS delete', sha: sha, branch: 'main' })
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(friendlyErr(t, r.status)); });
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
      return '[' + uid + '] | [' + uname + '] | [' + msg + '] | [' + dt + '] | [' + (ip || 'N/A') + ']';
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
      id: id, name: u.name, semi_name: u.semi_name || '',
      group: u.group || '', class: u.class || '', role: u.role || 'member',
      permissions: (u.permissions || []).slice(),
      isAdmin: !!u.isAdmin, advanced: !!u.advanced,
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
        return { path: p, title: extractTitle(decode(f.content)) || p };
      }).catch(function () { return { path: p, title: p + ' (読込失敗)' }; });
    })).then(function (items) {
      if (st) st.textContent = items.length ? items.length + ' ページ' : 'なし';
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
      if (st) st.textContent = files.length ? files.length + ' ファイル' : 'ファイルなし';
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
            if (!confirm(f.name + ' を削除？')) return;
            getFile(f.path).then(function (meta) {
              return buildCommitMessage('delete ' + f.name).then(function (cm) {
                return deleteFile(f.path, meta.sha, cm);
              });
            }).then(loadFiles).catch(function (e) {
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
      if (st) st.textContent = data.length ? data.length + ' 件' : '履歴なし';
      data.forEach(function (entry) {
        var row = document.createElement('div');
        row.className = 'file-row history-row';
        row.innerHTML =
          '<div class="hist-main"><span class="name"></span><span class="meta mono"></span><span class="hist-msg"></span></div>' +
          '<div class="actions">' +
          (state.user.canBackupRestore && entry.backupPath ?
            '<button type="button" class="btn primary btn-restore">復元</button>' : '') +
          '</div>';
        row.querySelector('.name').textContent = entry.path || '';
        row.querySelector('.meta').textContent =
          (entry.userId || '') + ' · ' + (entry.datetime || '') + (entry.ip ? ' · ' + entry.ip : '');
        row.querySelector('.hist-msg').textContent = entry.message || '';
        var rb = row.querySelector('.btn-restore');
        if (rb) rb.onclick = function () {
          if (!confirm('復元しますか？\n' + entry.path + '\n' + entry.datetime)) return;
          restoreFromBackup(entry);
        };
        list.appendChild(row);
      });
    }).catch(function (e) {
      if (st) st.textContent = '履歴読込失敗: ' + e.message;
    });
  }

  function frame() { return $('frame'); }
  function doc() { var f = frame(); return f && f.contentDocument; }

  function isLocked(el) {
    if (!el || !el.closest) return false;
    return !!el.closest('[data-lock="true"]');
  }

  function injectChrome(html, pagePath) {
    var dir = pagePath.indexOf('/') >= 0 ? pagePath.replace(/\/[^\/]*$/, '/') : '';
    var base = SITE + dir;
    /* CMSプレビュー専用: MENUは隠すだけ（元HTMLからは消さない） */
    var cleaned = html
      .replace(/<script[^>]*MENU\/MENU\.js[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<script[^>]*src=["'][^"']*MENU\/MENU\.js["'][^>]*><\/script>/gi, '')
      .replace(/<link[^>]*MENU\/MENU\.css[^>]*>/gi, '');
    var style = [
      '<style id="cms-ui">',
      'html,body{user-select:none!important;-webkit-user-select:none!important}',
      '.cms-sel,.cms-sel *{user-select:text!important;-webkit-user-select:text!important}',
      '.cms-hover{outline:2px solid rgba(46,196,182,.75)!important;outline-offset:2px;opacity:.88!important;position:relative}',
      '.cms-sel{outline:3px solid #2ec4b6!important;outline-offset:2px;position:relative;min-height:1em;opacity:1!important;cursor:text}',
      '.cms-sel[contenteditable=true]{outline:3px solid #2ec4b6!important;cursor:text}',
      '[data-lock="true"].cms-locked-hover{',
      '  position:relative!important;',
      '  filter:blur(2.5px) saturate(.7)!important;',
      '  opacity:.75!important;',
      '  outline:2px dashed #888!important;',
      '  outline-offset:2px;',
      '  cursor:not-allowed!important;',
      '}',
      '[data-lock="true"] *{cursor:not-allowed!important}',
      '.cms-lock-badge{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);',
      '  width:40px;height:40px;border-radius:50%;background:rgba(43,33,64,.75);color:#fff;',
      '  font-size:20px;line-height:40px;text-align:center;z-index:100001;pointer-events:none;',
      '  box-shadow:0 4px 16px rgba(0,0,0,.3);filter:none!important}',
      '.cms-pen{position:absolute;top:2px;right:2px;width:30px;height:30px;border:0;border-radius:50%;',
      'background:#2ec4b6;color:#fff;font-size:15px;line-height:30px;text-align:center;cursor:pointer;',
      'z-index:100000;box-shadow:0 2px 8px rgba(0,0,0,.28);pointer-events:auto;padding:0}',
      '.cms-pen:hover{transform:scale(1.1);background:#ff6b6b}',
      '.cms-handle{position:absolute;width:14px;height:14px;background:#ff6b6b;border:2px solid #fff;',
      'border-radius:3px;z-index:99999;box-shadow:0 1px 4px rgba(0,0,0,.35);pointer-events:auto}',
      '.cms-handle.nw{top:-7px;left:-7px;cursor:nwse-resize}',
      '.cms-handle.ne{top:-7px;right:-7px;cursor:nesw-resize}',
      '.cms-handle.sw{bottom:-7px;left:-7px;cursor:nesw-resize}',
      '.cms-handle.se{bottom:-7px;right:-7px;cursor:nwse-resize}',
      '.cms-drag-bar{position:absolute;top:-26px;left:0;height:22px;padding:0 10px;font-size:12px;line-height:22px;',
      'background:#ff6b6b;color:#fff;border-radius:6px 6px 0 0;cursor:grab;user-select:none;white-space:nowrap;z-index:99999;pointer-events:auto}',
      '.cms-drag-bar:active{cursor:grabbing}',
      '.radial-menu-wrapper,.menu-fab,.header-auth{display:none!important}',
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

  function isChromeUi(el) {
    if (!el || !el.classList) return false;
    return el.classList.contains('cms-handle') || el.classList.contains('cms-drag-bar') ||
      el.classList.contains('cms-pen') || el.id === 'cms-ui';
  }

  function pickTarget(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el === doc().body || el === doc().documentElement) return null;
    if (isChromeUi(el)) return null;
    if (isLocked(el)) return null;
    var cur = el;
    var TEXTISH = { P:1, H1:1, H2:1, H3:1, H4:1, H5:1, H6:1, SPAN:1, A:1, LI:1, LABEL:1, BUTTON:1, TD:1, TH:1, BLOCKQUOTE:1, FIGCAPTION:1, STRONG:1, EM:1, B:1, I:1, SMALL:1, CODE:1 };
    while (cur && cur !== doc().body) {
      if (isLocked(cur)) return null;
      if (TEXTISH[cur.tagName]) return cur;
      if (cur.children && cur.children.length === 0 && (cur.textContent || '').trim()) return cur;
      cur = cur.parentElement;
    }
    return el !== doc().body ? el : null;
  }

  function clearHover() {
    var d = doc();
    if (!d) return;
    d.querySelectorAll('.cms-hover').forEach(function (n) { n.classList.remove('cms-hover'); });
    d.querySelectorAll('.cms-locked-hover').forEach(function (n) { n.classList.remove('cms-locked-hover'); });
    d.querySelectorAll('.cms-pen,.cms-lock-badge').forEach(function (n) { n.remove(); });
  }

  function showLockBadge(el) {
    clearHover();
    if (!el) return;
    el.classList.add('cms-locked-hover');
    var rect = el.getBoundingClientRect();
    var badge = doc().createElement('div');
    badge.className = 'cms-lock-badge';
    badge.textContent = '🔒';
    badge.style.position = 'fixed';
    badge.style.left = (rect.left + rect.width / 2) + 'px';
    badge.style.top = (rect.top + rect.height / 2) + 'px';
    badge.style.transform = 'translate(-50%, -50%)';
    badge.style.filter = 'none';
    badge.style.zIndex = '100002';
    doc().body.appendChild(badge);
  }


  function pageCssPath(htmlPath) {
    var base = String(htmlPath || 'page').replace(/\.html?$/i, '').replace(/[\/\\]+/g, '-').replace(/^-|-$/g, '');
    if (!base) base = 'page';
    return 'src/css/pages/' + base + '.css';
  }

  function ensureCmsId(el) {
    if (!el || el.nodeType !== 1) return '';
    var id = el.getAttribute('data-cms-id');
    if (!id) {
      id = 'c' + Math.random().toString(36).slice(2, 10);
      el.setAttribute('data-cms-id', id);
    }
    return id;
  }

  function recordStyle(el, styles) {
    if (!el || !styles) return;
    var id = ensureCmsId(el);
    if (!state.pageStyles[id]) state.pageStyles[id] = {};
    Object.keys(styles).forEach(function (k) {
      var v = styles[k];
      if (v === '' || v == null) {
        delete state.pageStyles[id][k];
        el.style[k] = '';
      } else {
        state.pageStyles[id][k] = v;
        el.style[k] = v;
      }
    });
    refreshPageStyleTag();
  }

  function camelToKebab(s) {
    return String(s).replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
  }

  function buildPageCss() {
    var parts = ['/* Auto-generated by Asobi Lab CMS — do not edit by hand unless needed */', ''];
    Object.keys(state.pageKeyframes || {}).forEach(function (k) {
      parts.push(state.pageKeyframes[k]);
      parts.push('');
    });
    Object.keys(state.pageStyles || {}).forEach(function (id) {
      var rules = state.pageStyles[id];
      var body = Object.keys(rules).map(function (k) {
        return '  ' + camelToKebab(k) + ': ' + rules[k] + ';';
      }).join('\n');
      if (body) parts.push('[data-cms-id="' + id + '"] {\n' + body + '\n}');
    });
    return parts.join('\n') + '\n';
  }

  function refreshPageStyleTag() {
    var d = doc();
    if (!d) return;
    var tag = d.getElementById('cms-page-style');
    if (!tag) {
      tag = d.createElement('style');
      tag.id = 'cms-page-style';
      (d.head || d.documentElement).appendChild(tag);
    }
    tag.textContent = buildPageCss();
  }

  function ensurePageCssLink(origDoc, htmlPath) {
    var href = pageCssPath(htmlPath);
    /* relative from page location */
    var depth = (htmlPath.match(/\//g) || []).length;
    var rel = '';
    for (var i = 0; i < depth; i++) rel += '../';
    rel += href;
    var head = origDoc.head || origDoc.querySelector('head');
    if (!head) return;
    var existing = head.querySelector('link[data-cms-page-css], link[href*="src/css/pages/"]');
    if (existing) {
      existing.setAttribute('href', rel);
      existing.setAttribute('data-cms-page-css', '1');
      return;
    }
    var link = origDoc.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', rel);
    link.setAttribute('data-cms-page-css', '1');
    head.appendChild(link);
  }

  function runRtCommand(cmd, val) {
    var d = doc();
    if (!d || !state.selected) return;
    try { state.selected.focus(); } catch (e) {}
    try {
      if (cmd === 'createLink') {
        var url = val || prompt('リンクURL', 'https://');
        if (!url) return;
        d.execCommand('createLink', false, url);
        return;
      }
      d.execCommand(cmd, false, val || null);
    } catch (err) {
      status('書式適用に失敗: ' + (err.message || err));
    }
  }

  function applyDesignSet(set) {
    if (!state.selected || !set) return;
    if (isLocked(state.selected)) { status('ロック要素には適用できません'); return; }
    recordStyle(state.selected, set.styles);
    status('デザインセット「' + set.label + '」を適用');
  }

  function applyAnimSet(set) {
    if (!state.selected || !set) return;
    if (isLocked(state.selected)) { status('ロック要素には適用できません'); return; }
    if (set.keyframes) {
      state.pageKeyframes[set.id] = set.keyframes;
    }
    recordStyle(state.selected, { animation: set.animation });
    status('アニメーション「' + set.label + '」を適用');
  }

  function autoLayout(all) {
    var d = doc();
    if (!d) return;
    var targets = [];
    if (all) {
      targets = Array.prototype.slice.call(d.body.querySelectorAll('section, article, .card, .article_by_teacher, h1, h2, h3, p, ul, ol, div'));
      targets = targets.filter(function (el) {
        if (isChromeUi(el) || isLocked(el)) return false;
        if (el.closest && el.closest('[data-lock="true"]')) return false;
        /* 深すぎるネストは除外 */
        var depth = 0; var n = el;
        while (n && n !== d.body) { depth++; n = n.parentElement; }
        return depth <= 4;
      });
    } else if (state.selected) {
      targets = [state.selected];
    } else {
      status('要素を選択するか「全体を自動配置」を使ってください');
      return;
    }
    targets.forEach(function (el, i) {
      var tag = el.tagName.toLowerCase();
      var styles = {};
      /* 座標のバラつきを抑える */
      var cs = d.defaultView.getComputedStyle(el);
      if (cs.position === 'absolute' || cs.position === 'fixed') {
        /* 絶対配置はグリッドにスナップ */
        var left = parseFloat(el.style.left);
        var top = parseFloat(el.style.top);
        if (!isNaN(left)) styles.left = Math.round(left / 8) * 8 + 'px';
        if (!isNaN(top)) styles.top = Math.round(top / 8) * 8 + 'px';
      } else {
        styles.position = '';
        styles.left = '';
        styles.top = '';
      }
      if (tag === 'section' || tag === 'article' || el.classList.contains('card') || el.classList.contains('article_by_teacher')) {
        styles.padding = '1.25rem';
        styles.marginTop = '1rem';
        styles.marginBottom = '1rem';
        styles.maxWidth = '100%';
        styles.boxSizing = 'border-box';
      } else if (/^h[1-3]$/.test(tag)) {
        styles.marginTop = i === 0 ? '0' : '1.25rem';
        styles.marginBottom = '0.6rem';
        styles.lineHeight = '1.35';
      } else if (tag === 'p') {
        styles.marginTop = '0.4rem';
        styles.marginBottom = '0.75rem';
        styles.lineHeight = '1.75';
      } else if (tag === 'ul' || tag === 'ol') {
        styles.marginTop = '0.5rem';
        styles.marginBottom = '0.9rem';
        styles.paddingLeft = '1.4rem';
      } else {
        styles.marginTop = '0.5rem';
        styles.marginBottom = '0.5rem';
      }
      recordStyle(el, styles);
    });
    status((all ? '全体' : '選択要素') + 'を自動配置しました（余白・座標を整列）');
  }

  function showHover(el) {
    clearHover();
    if (!el || isLocked(el) || el === state.selected) return;
    el.classList.add('cms-hover');
  }


  function fillSideText(el) {
    var ta = $('side-text');
    if (!ta) return;
    if (!el) {
      ta.value = '';
      ta.disabled = true;
      return;
    }
    ta.disabled = false;
    var asHtml = $('side-as-html') && $('side-as-html').checked;
    ta.value = asHtml ? el.innerHTML : (el.innerText || el.textContent || '');
    try { ta.focus(); } catch (e) {}
  }

  function applySideText() {
    if (!state.selected) return;
    var ta = $('side-text');
    if (!ta) return;
    var asHtml = $('side-as-html') && $('side-as-html').checked;
    if (asHtml) state.selected.innerHTML = ta.value;
    else state.selected.textContent = ta.value;
  }

  function clearSelection() {
    var d = doc();
    if (!d) return;
    clearHover();
    d.querySelectorAll('.cms-sel').forEach(function (n) {
      n.classList.remove('cms-sel');
      n.removeAttribute('contenteditable');
      n.querySelectorAll('.cms-handle,.cms-drag-bar,.cms-pen').forEach(function (h) { h.remove(); });
    });
    state.selected = null;
    hideRtToolbar();
    fillSideText(null);
    if ($('sel-info')) $('sel-info').textContent = 'クリックで編集（data-lock は不可）';
  }

  function attachHandles(el) {
    el.querySelectorAll('.cms-handle,.cms-drag-bar,.cms-pen').forEach(function (h) { h.remove(); });
    var bar = document.createElement('div');
    bar.className = 'cms-drag-bar';
    bar.textContent = '⋮⋮ 移動';
    el.appendChild(bar);
    ['nw', 'ne', 'sw', 'se'].forEach(function (pos) {
      var h = document.createElement('div');
      h.className = 'cms-handle ' + pos;
      h.dataset.handle = pos;
      el.appendChild(h);
    });
  }

  function enterEdit(el) {
    el = pickTarget(el) || el;
    if (!el || el === doc().body || el === doc().documentElement) return;
    if (isChromeUi(el)) return;
    if (isLocked(el)) {
      status('data-lock="true" のため編集できません');
      clearSelection();
      return;
    }
    clearSelection();
    el.classList.remove('cms-hover');
    el.classList.add('cms-sel');
    el.setAttribute('contenteditable', 'true');
    state.selected = el;
    attachHandles(el);
    showRtToolbar();
    fillSideText(el);
    try {
      el.focus();
      var range = doc().createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = doc().defaultView.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}
    if ($('sel-info')) {
      $('sel-info').textContent = '<' + el.tagName.toLowerCase() + '> 編集中 — Ctrl+Aで要素内全選択 / Escで終了';
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
    status('編集中 — そのまま入力 / Ctrl+A でこの要素内を全選択');
  }

  function selectElement(el) {
    enterEdit(el);
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
      tb.addEventListener('mousedown', function (e) { e.preventDefault(); });
      tb.querySelectorAll('button[data-cmd]').forEach(function (btn) {
        btn.onclick = function () {
          var cmd = btn.getAttribute('data-cmd');
          var val = btn.getAttribute('data-val') || null;
          if (!state.selected) { status('先に要素を選択'); return; }
          runRtCommand(cmd, val);
        };
      });
      if ($('rt-fore')) {
        $('rt-fore').oninput = function () {
          if (!state.selected) return;
          runRtCommand('foreColor', $('rt-fore').value);
        };
      }
      if ($('rt-back')) {
        $('rt-back').oninput = function () {
          if (!state.selected) return;
          /* マーカー（背景色） */
          try {
            runRtCommand('hiliteColor', $('rt-back').value);
          } catch (e1) {
            runRtCommand('backColor', $('rt-back').value);
          }
        };
      }
      if ($('rt-done')) {
        $('rt-done').onclick = function () { clearSelection(); hideRtToolbar(); };
      }
    }
    if ($('btn-auto-layout')) {
      $('btn-auto-layout').onclick = function () { autoLayout(false); };
    }
    if ($('btn-auto-layout-all')) {
      $('btn-auto-layout-all').onclick = function () {
        if (confirm('ページ内の主な要素の余白・位置を自動で整えます。よろしいですか？')) autoLayout(true);
      };
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
          return id + ' | ' + u.name + ' | ' + (u.role || '') + ' | admin=' + !!u.isAdmin;
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
