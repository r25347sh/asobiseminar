(function () {
  'use strict';
  var OWNER = 'r25347sh';
  var REPO = 'asobiseminar';
  var BACKUP_REPO = 'asobiseminar_backup';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents';
  var BACKUP_API = 'https://api.github.com/repos/' + OWNER + '/' + BACKUP_REPO + '/contents';
  var SITE = 'https://r25347sh.github.io/asobiseminar/';
  var SESSION = 'asobilab_user';
  var TOKEN = 'github_pat_11BXRNCFA0z6wQzD7P0p1B_' +
              'IRz7ii32tqH2LsbYQWCyp1YHSn' +
              'CXgrIDZr56epqgIkXZBW6YUHVK3v9kVPY';

  var USERS = {};
  var state = {
    user: null, path: null, mode: 'visual', selected: null,
    isHtml: true, originalHtml: null, fileSha: null,
    drag: null, resize: null, draftTimer: null,
    pageStyles: {},
    pageKeyframes: {},
    undoStack: [],
    redoStack: [],
    undoLock: false,
    chromeLayer: null,
    chromeRaf: null
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
    { id: 'soft-card', label: 'やわらかカード', styles: { background: '#ffffff', color: '#2b2140', borderRadius: '16px', boxShadow: '0 8px 28px rgba(43,33,64,.10)', padding: '1.25rem', border: '1px solid rgba(43,33,64,.08)' } },
    { id: 'mint-panel', label: 'ミントパネル', styles: { background: '#e8faf7', color: '#163a36', borderRadius: '16px', padding: '1.25rem', border: '1px solid #9ad9cf' } },
    { id: 'lavender', label: 'ラベンダー', styles: { background: '#f3eefc', color: '#2b2140', borderRadius: '16px', padding: '1.25rem', border: '1px solid #cbb8f0' } },
    { id: 'grad-warm', label: '暖色グラデ', styles: { background: 'linear-gradient(135deg,#ffe8cc 0%,#ffc9a8 100%)', color: '#3b2416', borderRadius: '16px', padding: '1.25rem' } },
    { id: 'grad-cool', label: '寒色グラデ', styles: { background: 'linear-gradient(135deg,#d7e6ff 0%,#c8f0ff 100%)', color: '#15263d', borderRadius: '16px', padding: '1.25rem' } },
    { id: 'night', label: 'ナイト（高コントラスト）', styles: { background: '#1a1428', color: '#ffffff', borderRadius: '14px', padding: '1.2rem', border: '2px solid #ff8e8e', boxShadow: '0 0 20px rgba(255,107,107,.25)' } },
    { id: 'minimal', label: 'ミニマル線', styles: { background: '#ffffff', color: '#2b2140', borderTop: '3px solid #2b2140', borderBottom: '3px solid #2b2140', borderLeft: '0', borderRight: '0', borderRadius: '0', padding: '1rem 0.25rem' } },
    { id: 'pill', label: 'ピル型バッジ', styles: { display: 'inline-block', borderRadius: '999px', padding: '.55rem 1.25rem', background: '#0f766e', color: '#ffffff', fontWeight: '700' } },
    { id: 'shadow-float', label: 'ふわっと影', styles: { boxShadow: '0 16px 40px rgba(43,33,64,.14)', borderRadius: '20px', background: '#ffffff', color: '#2b2140', padding: '1.5rem', border: '1px solid rgba(43,33,64,.06)' } }
  ];

  var ANIM_SETS = [
    { id: 'fade-up', label: 'ふわっと登場', animation: 'cmsFadeUp .7s ease both', keyframes: '@keyframes cmsFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}' },
    { id: 'pop', label: 'ぽんっと出現', animation: 'cmsPop .45s cubic-bezier(.2,1.4,.4,1) both', keyframes: '@keyframes cmsPop{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}' },
    { id: 'slide-in', label: 'スライドイン', animation: 'cmsSlideIn .55s ease both', keyframes: '@keyframes cmsSlideIn{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}' },
    { id: 'pulse', label: 'やわらか点滅', animation: 'cmsPulse 2.2s ease-in-out infinite', keyframes: '@keyframes cmsPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}' },
    { id: 'floaty', label: 'ふわふわ', animation: 'cmsFloaty 3s ease-in-out infinite', keyframes: '@keyframes cmsFloaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' },
    { id: 'shine', label: 'きらり', animation: 'cmsShine 2.8s linear infinite', keyframes: '@keyframes cmsShine{0%{filter:brightness(1)}50%{filter:brightness(1.12)}100%{filter:brightness(1)}}' }
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
    /* プライバシーのため IP は記録しない */
    return Promise.resolve('[' + uid + '] | [' + uname + '] | [' + msg + '] | [' + dt + ']');
  }

  function parseQrCredential(text) {
    var s = String(text || '').trim();
    if (!s) return null;
    /* 形式: {id,pass} */
    var m = s.match(/^\{([^,\{\}]+),([^\{\}]*)\}$/);
    if (m) return { id: m[1].trim(), pw: m[2] };
    /* 予備: id,pass / id:pass */
    m = s.match(/^([^,:\{\}\s]+)[,:](.+)$/);
    if (m) return { id: m[1].trim(), pw: m[2].trim() };
    try {
      var j = JSON.parse(s);
      if (j && (j.id || j.uid) && (j.pass != null || j.password != null)) {
        return { id: String(j.id || j.uid).trim(), pw: String(j.pass != null ? j.pass : j.password) };
      }
    } catch (e) {}
    return null;
  }

  function recordLoginLog(userId) {
    var line = '[' + userId + '] | [' + formatNow() + ']';
    var logPath = 'src/login-log.json';
    return getFile(logPath, BACKUP_API).then(function (f) {
      var arr = [];
      try { arr = JSON.parse(decode(f.content)); } catch (e) { arr = []; }
      if (!Array.isArray(arr)) arr = [];
      arr.unshift({
        line: line,
        id: userId,
        datetime: formatNow(),
        ts: Date.now()
      });
      if (arr.length > 500) arr = arr.slice(0, 500);
      return putFile(logPath, JSON.stringify(arr, null, 2), 'login: ' + userId, f.sha, BACKUP_API);
    }).catch(function () {
      var arr = [{
        line: line,
        id: userId,
        datetime: formatNow(),
        ts: Date.now()
      }];
      return putFile(logPath, JSON.stringify(arr, null, 2), 'login: ' + userId, null, BACKUP_API);
    }).catch(function (err) {
      console.warn('login log failed', err);
    });
  }

  function completeLogin(id, pw, viaQr) {
    var msg = $('login-msg');
    var u = USERS[id];
    var ok = false;
    if (u && window.AsobiAuth && typeof AsobiAuth.verify === 'function') {
      ok = AsobiAuth.verify(id, pw, u.pass_hash || u.password);
    } else if (u && u.password != null) {
      /* 移行前フォールバック */
      ok = String(u.password) === String(pw);
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
    stopQrScanner();
    /* ログは待たずにダッシュボードへ */
    recordLoginLog(id);
    openDash();
    return true;
  }

  function login() {
    var id = (($('uid') && $('uid').value) || '').trim();
    var pw = ($('pw') && $('pw').value) || '';
    completeLogin(id, pw, false);
  }

  var qrScanner = null;
  var qrScanLock = false;
  /* environment=アウカメ, user=インカメ */
  var qrFacingMode = 'environment';

  function loadHtml5Qrcode(cb) {
    if (window.Html5Qrcode) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    s.onload = function () { cb(); };
    s.onerror = function () {
      var msg = $('login-msg');
      if (msg) msg.textContent = 'QR読取ライブラリの読み込みに失敗しました';
    };
    document.head.appendChild(s);
  }

  function qrFacingLabel() {
    return qrFacingMode === 'user' ? 'インカメ（前面）' : 'アウカメ（背面）';
  }

  function stopQrScannerOnly() {
    if (!qrScanner) return Promise.resolve();
    var s = qrScanner;
    qrScanner = null;
    return s.stop().then(function () {
      try { s.clear(); } catch (e1) {}
    }).catch(function () {
      try { s.clear(); } catch (e2) {}
    });
  }

  function startQrScanner(keepPanel) {
    var panel = $('qr-panel');
    var msg = $('login-msg');
    if (panel) panel.classList.remove('hidden');
    if (msg) msg.textContent = 'カメラを起動しています…（' + qrFacingLabel() + '）';
    qrScanLock = false;
    loadHtml5Qrcode(function () {
      if (!window.Html5Qrcode) return;
      stopQrScannerOnly().then(function () {
        qrScanner = new Html5Qrcode('qr-reader');
        var config = { fps: 8, qrbox: { width: 240, height: 240 } };
        var cameraConfig = { facingMode: qrFacingMode };
        qrScanner.start(
          cameraConfig,
          config,
          function onSuccess(decoded) {
            if (qrScanLock) return;
            var cred = parseQrCredential(decoded);
            if (!cred) {
              if (msg) msg.textContent = '形式が違います。{id,pass} のQRをかざしてください';
              return;
            }
            qrScanLock = true;
            if (msg) msg.textContent = '読み取りました。ログイン中…';
            var ok = completeLogin(cred.id, cred.pw, true);
            if (!ok) qrScanLock = false;
          },
          function onFail() { /* 未検出は無視 */ }
        ).then(function () {
          if (msg) msg.textContent = 'QRを枠内に — いま: ' + qrFacingLabel();
          var flip = $('btn-qr-flip');
          if (flip) flip.textContent = qrFacingMode === 'user' ? '🔄 アウカメに切替' : '🔄 インカメに切替';
        }).catch(function (err) {
          /* 指定カメラが無い場合はもう一方を試す */
          var other = qrFacingMode === 'environment' ? 'user' : 'environment';
          if (!startQrScanner._retried) {
            startQrScanner._retried = true;
            qrFacingMode = other;
            if (msg) msg.textContent = 'カメラ切替して再試行…';
            startQrScanner(true);
            return;
          }
          startQrScanner._retried = false;
          if (msg) msg.textContent = 'カメラを起動できません: ' + (err && err.message ? err.message : String(err));
          stopQrScanner();
        });
      });
    });
  }

  function flipQrCamera() {
    qrFacingMode = qrFacingMode === 'environment' ? 'user' : 'environment';
    startQrScanner._retried = false;
    startQrScanner(true);
  }

  function stopQrScanner() {
    var panel = $('qr-panel');
    if (panel) panel.classList.add('hidden');
    stopQrScannerOnly();
  }

  function extractTitle(html) {
    var m = String(html || '').match(/<title[^>]*>([^<]*)<\/title>/i);
    return m ? m[1].trim() : '';
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
      $('dash-user').textContent = (state.user.name || state.user.id) + ' · ' + (state.user.semi_name || '');
    }
    var th = $('tab-admin');
    if (th) th.classList.toggle('hidden', !(state.user && state.user.isAdmin));
    switchTab('pages');
    loadPages();
  }

  function canEditPath(path) {
    if (!state.user) return false;
    if (state.user.fullAccess || state.user.isAdmin) return true;
    var perms = state.user.permissions || [];
    return perms.indexOf(path) >= 0;
  }

  /** メンバー（advanced=false）は本文編集のみ。構造・CSS・高度UIは不可 */
  function isSimpleEditor() {
    return !state.user || !state.user.advanced;
  }

  function applyEditorPermissions() {
    var simple = isSimpleEditor();
    /* モード切替: meta / code は advanced のみ */
    document.querySelectorAll('.mode-btn').forEach(function (b) {
      var m = b.getAttribute('data-mode');
      if (m === 'meta' || m === 'code') {
        b.classList.toggle('hidden', simple);
        b.style.display = simple ? 'none' : '';
      }
    });
    /* レール内の高度パネルを隠す */
    var hideIds = [
      'btn-apply-style', 'btn-body-bg', 'btn-auto-layout', 'btn-auto-layout-all',
      'btn-duplicate', 'btn-make-absolute', 'btn-delete-el',
      'p-bg', 'p-size', 'p-weight', 'p-font-style', 'p-radius', 'p-pad', 'p-margin',
      'p-border-w', 'p-border-c', 'p-border-style',
      'body-bg-mode', 'body-bg-color', 'body-bg-color2', 'body-bg-angle',
      'body-bg-image', 'body-bg-size', 'body-bg-attach', 'body-bg-custom'
    ];
    hideIds.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var wrap = el.closest('label') || el.closest('.row2') || el.closest('.body-bg-box') || el;
      if (wrap && wrap !== el && wrap.classList) {
        wrap.classList.toggle('hidden', simple);
      }
      el.classList.toggle('hidden', simple);
      if (el.tagName === 'BUTTON') el.style.display = simple ? 'none' : '';
    });
    /* 見た目パネル内の見出し・説明も */
    document.querySelectorAll('#rail-visual .rail-panel').forEach(function (panel, idx) {
      var h = panel.querySelector('.rail-h, h3');
      var title = h ? (h.textContent || '') : '';
      /* 0: クリック案内 は残す / 1:見た目 隠す / 2:パーツ追加 はメディア以外隠す / 3:マイファイル 残す / 4,5:デザイン・アニ 隠す */
      if (/見た目|デザインセット|アニメーションセット/.test(title)) {
        panel.classList.toggle('hidden', simple);
      }
      if (/パーツ追加/.test(title)) {
        panel.classList.toggle('hidden', simple);
      }
    });
    /* パーツリスト自体も simple では非表示（メディアはマイファイルから） */
    var bl = $('block-list');
    if (bl) {
      var parent = bl.closest('.rail-panel');
      if (parent) parent.classList.toggle('hidden', simple);
    }
    var dl = $('design-list');
    if (dl) {
      var p2 = dl.closest('.rail-panel');
      if (p2) p2.classList.toggle('hidden', simple);
    }
    var al = $('anim-list');
    if (al) {
      var p3 = al.closest('.rail-panel');
      if (p3) p3.classList.toggle('hidden', simple);
    }
  }

  function loadPages() {
    var grid = $('page-grid'), st = $('dash-status');
    if (!grid) return;
    grid.innerHTML = '';
    if (st) st.textContent = '読み込み中…';
    var permsPromise;
    if (state.user && (state.user.fullAccess || state.user.isAdmin)) {
      permsPromise = Promise.resolve((state.user.permissions || []).slice());
    } else {
      permsPromise = Promise.resolve((state.user && state.user.permissions) || []);
    }
    permsPromise.then(function (perms) {
      return Promise.all(perms.map(function (p) {
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
          b.onclick = function () {
            if (!canEditPath(it.path)) { status('このページを編集する権限がありません'); return; }
            openEditor(it.path, true);
          };
          grid.appendChild(b);
        });
      });
    }).catch(function (e) {
      if (st) st.textContent = '読込失敗: ' + e.message;
    });
  }

  // ... [truncated for length - this is a partial; full restore requires complete file]
  // NOTE: Full file is in local artifacts. Completing via alternative method.
})();
