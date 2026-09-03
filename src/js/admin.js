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
          if (msg) msg.textContent = 'カメラを起動できません: ' + (err && err.message ? err.message : err);
        });
      });
    });
  }

  function flipQrCamera() {
    var msg = $('login-msg');
    qrFacingMode = (qrFacingMode === 'environment') ? 'user' : 'environment';
    startQrScanner._retried = false;
    if (msg) msg.textContent = '切り替え中…（' + qrFacingLabel() + '）';
    startQrScanner(true);
  }

  function stopQrScanner() {
    var panel = $('qr-panel');
    if (panel) panel.classList.add('hidden');
    startQrScanner._retried = false;
    stopQrScannerOnly();
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
    /* history パネルはバックアップサイト案内のみ（一覧UIなし） */
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
    /* 案内文 */
    if ($('sel-info')) {
      if (simple) {
        $('sel-info').textContent = '本文ブロック（探求メモ等）をクリック → Googleドキュメント風に編集。画像・音楽・動画は右のマイファイルから挿入。構造・CSSは変更できません。';
      } else {
        $('sel-info').textContent = 'クリックで直接編集';
      }
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

  function classifyFile(name) {
    var n = String(name || '').toLowerCase();
    if (/\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(n)) return 'image';
    if (/\.(mp4|webm|ogv|mov|m4v)$/i.test(n)) return 'video';
    if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(n)) return 'audio';
    if (/\.pdf$/i.test(n)) return 'pdf';
    if (/\.(pptx?|odp|key)$/i.test(n)) return 'slide';
    if (/\.(docx?|odt|rtf|txt|md|markdown|csv|tsv|json|xml|html?|css|js)$/i.test(n)) return 'doc';
    return 'other';
  }
  function fileKindIcon(kind) {
    return ({
      image: '🖼️', video: '🎬', audio: '🎵', pdf: '📕',
      slide: '📊', doc: '📄', other: '📎'
    })[kind] || '📎';
  }
  function filePublicUrl(path) {
    return SITE + String(path || '').replace(/^\//, '');
  }

  function openFilePreview(fileMeta) {
    var modal = $('modal-preview');
    var body = $('preview-body');
    var title = $('preview-title');
    if (!modal || !body) {
      window.open(filePublicUrl(fileMeta.path), '_blank');
      return;
    }
    var kind = classifyFile(fileMeta.name);
    var url = filePublicUrl(fileMeta.path);
    if (title) title.textContent = fileMeta.name || 'プレビュー';
    body.innerHTML = '';
    body.className = 'preview-body kind-' + kind;

    if (kind === 'image') {
      var img = document.createElement('img');
      img.src = url;
      img.alt = fileMeta.name || '';
      img.className = 'preview-img';
      body.appendChild(img);
    } else if (kind === 'video') {
      var vid = document.createElement('video');
      vid.src = url;
      vid.controls = true;
      vid.className = 'preview-video';
      vid.playsInline = true;
      body.appendChild(vid);
    } else if (kind === 'audio') {
      var aud = document.createElement('audio');
      aud.src = url;
      aud.controls = true;
      aud.className = 'preview-audio';
      body.appendChild(aud);
    } else if (kind === 'pdf') {
      var ifr = document.createElement('iframe');
      ifr.src = url;
      ifr.className = 'preview-frame';
      ifr.title = fileMeta.name || 'PDF';
      body.appendChild(ifr);
    } else if (kind === 'slide') {
      body.innerHTML =
        '<p class="muted">スライド形式はブラウザ直接プレビューに制限があります。</p>' +
        '<p><a class="btn primary" href="' + url + '" target="_blank" rel="noopener">ダウンロード / 開く</a></p>' +
        '<p class="muted" style="font-size:.8rem;margin-top:.75rem">Office Online 等で開く場合はファイルをダウンロードしてからご利用ください。</p>';
    } else if (kind === 'doc') {
      if (/\.(txt|md|markdown|csv|tsv|json|xml|css|js|html?)$/i.test(fileMeta.name || '')) {
        body.innerHTML = '<p class="muted">読み込み中…</p>';
        getFile(fileMeta.path).then(function (f) {
          var text = decode(f.content);
          var pre = document.createElement('pre');
          pre.className = 'preview-text mono';
          pre.textContent = text.length > 200000 ? text.slice(0, 200000) + '\n…(省略)' : text;
          body.innerHTML = '';
          body.appendChild(pre);
        }).catch(function () {
          body.innerHTML = '<p class="muted">テキスト読込に失敗しました</p>' +
            '<p><a class="btn primary" href="' + url + '" target="_blank" rel="noopener">ファイルを開く</a></p>';
        });
      } else {
        body.innerHTML =
          '<p class="muted">このドキュメント形式は埋め込みプレビュー非対応です。</p>' +
          '<p><a class="btn primary" href="' + url + '" target="_blank" rel="noopener">ダウンロード / 開く</a></p>';
      }
    } else {
      body.innerHTML =
        '<p class="muted">プレビュー非対応の形式です。</p>' +
        '<p><a class="btn primary" href="' + url + '" target="_blank" rel="noopener">ダウンロード / 開く</a></p>';
    }
    var openExt = $('preview-open-ext');
    if (openExt) {
      openExt.href = url;
      openExt.classList.remove('hidden');
    }
    modal.classList.remove('hidden');
  }
  function closeFilePreview() {
    var modal = $('modal-preview');
    var body = $('preview-body');
    if (body) {
      body.querySelectorAll('video,audio').forEach(function (m) {
        try { m.pause(); } catch (e) {}
      });
      body.innerHTML = '';
    }
    if (modal) modal.classList.add('hidden');
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
        var kind = classifyFile(f.name);
        var canPreview = kind !== 'other';
        row.innerHTML =
          '<span class="name"></span><span class="meta mono"></span>' +
          '<div class="actions">' +
          '<button type="button" class="btn ghost btn-edit">編集</button>' +
          (canPreview ? '<button type="button" class="btn ghost btn-preview">プレビュー</button>' : '') +
          '<button type="button" class="btn ghost btn-open">開く</button>' +
          (state.user.canDelete ? '<button type="button" class="btn danger btn-del">削除</button>' : '') +
          '</div>';
        row.querySelector('.name').textContent = fileKindIcon(kind) + ' ' + f.name;
        row.querySelector('.meta').textContent = sizeKb + (kind !== 'other' ? ' · ' + kind : '');
        row.querySelector('.btn-edit').onclick = function () {
          openEditor(f.path, /\.html?$/i.test(f.name));
        };
        var prevBtn = row.querySelector('.btn-preview');
        if (prevBtn) prevBtn.onclick = function () { openFilePreview(f); };
        var openBtn = row.querySelector('.btn-open');
        if (openBtn) openBtn.onclick = function () { window.open(filePublicUrl(f.path), '_blank'); };
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
      /* position は触らない（relative にすると absolute 配置やドラッグ基準が壊れる） */
      '.cms-hover{outline:2px solid rgba(46,196,182,.75)!important;outline-offset:2px;opacity:.88!important}',
      '.cms-sel{outline:3px solid #2ec4b6!important;outline-offset:2px;min-height:1em;opacity:1!important;cursor:text}',
      '.cms-sel[contenteditable=true]{outline:3px solid #2ec4b6!important;cursor:text}',
      /* 操作UIは編集要素の外（body直下オーバーレイ）に置く。編集対象に絶対に含めない */
      '#cms-chrome-layer{',
      '  position:fixed!important;left:0;top:0;width:0;height:0;z-index:2147483000!important;',
      '  pointer-events:none!important;',
      '  -webkit-user-select:none!important;user-select:none!important;',
      '}',
      '#cms-chrome-layer *{',
      '  -webkit-user-select:none!important;user-select:none!important;',
      '  -webkit-user-modify:read-only!important;',
      '  contenteditable:false;',
      '}',
      '.cms-handle,.cms-drag-bar,.cms-pen,.cms-lock-badge{',
      '  -webkit-user-select:none!important;user-select:none!important;',
      '  -webkit-user-modify:read-only!important;',
      '  pointer-events:auto!important;',
      '}',
      '.cms-drag-bar{',
      '  position:fixed!important;height:22px;padding:0 10px;font-size:12px;line-height:22px;',
      '  background:#ff6b6b;color:#fff;border-radius:6px 6px 0 0;cursor:grab!important;',
      '  white-space:nowrap;z-index:2147483001!important;box-sizing:border-box;',
      '  font-family:system-ui,sans-serif;font-weight:600;letter-spacing:.02em;',
      '}',
      '.cms-drag-bar:active{cursor:grabbing!important}',
      '.cms-handle{',
      '  position:fixed!important;width:14px;height:14px;background:#ff6b6b;border:2px solid #fff;',
      '  border-radius:3px;z-index:2147483001!important;box-shadow:0 1px 4px rgba(0,0,0,.35);',
      '  box-sizing:border-box;padding:0;margin:0;',
      '}',
      '.cms-handle.nw{cursor:nwse-resize}',
      '.cms-handle.ne{cursor:nesw-resize}',
      '.cms-handle.sw{cursor:nesw-resize}',
      '.cms-handle.se{cursor:nwse-resize}',
      '[data-lock="true"].cms-locked-hover{',
      '  position:relative!important;',
      '  filter:blur(2.5px) saturate(.7)!important;',
      '  opacity:.75!important;',
      '  outline:2px dashed #888!important;',
      '  outline-offset:2px;',
      '  cursor:not-allowed!important;',
      '}',
      '[data-lock="true"] *{cursor:not-allowed!important}',
      '.cms-lock-badge{position:fixed;width:40px;height:40px;border-radius:50%;background:rgba(43,33,64,.75);color:#fff;',
      '  font-size:20px;line-height:40px;text-align:center;z-index:2147483002;pointer-events:none;',
      '  box-shadow:0 4px 16px rgba(0,0,0,.3);filter:none!important}',
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
    if (!el) return false;
    if (el.id === 'cms-chrome-layer' || el.id === 'cms-ui') return true;
    if (el.closest && el.closest('#cms-chrome-layer')) return true;
    if (!el.classList) return false;
    return el.classList.contains('cms-handle') || el.classList.contains('cms-drag-bar') ||
      el.classList.contains('cms-pen') || el.classList.contains('cms-lock-badge');
  }

  function pickTarget(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el === doc().body || el === doc().documentElement) return null;
    if (isChromeUi(el)) return null;
    if (isLocked(el)) return null;

    /* メンバー（simple）: 本文ブロックのみを「1つのテキストエリア」として編集
       - 構造・CSS・任意の section 追加/削除は不可
       - Googleドキュメント風に、既存の本文セクション内で改行・書式・メディア挿入のみ */
    if (isSimpleEditor()) {
      /* 優先: 明示的な本文ブロック（セクション単位で contenteditable） */
      var block = el.closest && el.closest(
        'section.article_by_teacher, section.content-block, [data-cms-editable="true"]'
      );
      if (block && !isLocked(block)) return block;
      /* 短い本文フィールドのみ個別許可（構造枠は触らせない） */
      var goalText = el.closest && el.closest('.goal-text');
      if (goalText && !isLocked(goalText)) return goalText;
      var whBody = el.closest && el.closest('.wh-body');
      if (whBody && !isLocked(whBody)) return whBody;
      /* それ以外（タイトル・カード枠・リスト構造・ヘッダー等）は編集不可 */
      return null;
    }

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
    var parts = ['/* Auto-generated by Asobi Lab CMS */', ''];
    Object.keys(state.pageKeyframes || {}).forEach(function (k) {
      parts.push(state.pageKeyframes[k]);
      parts.push('');
    });
    Object.keys(state.pageStyles || {}).forEach(function (id) {
      var rules = state.pageStyles[id];
      if (!rules) return;
      var isBody = (id === 'cms-body');
      var lines = Object.keys(rules).map(function (k) {
        var val = rules[k];
        if (val === '' || val == null) return '';
        var prop = camelToKebab(k);
        return '  ' + prop + ': ' + val + (isBody ? ' !important' : '') + ';';
      }).filter(Boolean).join('\n');
      if (!lines) return;
      if (isBody) {
        parts.push('html, body {');
        parts.push(lines);
        parts.push('}');
        parts.push('body[data-cms-id="cms-body"] {');
        parts.push(lines);
        parts.push('}');
      } else {
        parts.push('[data-cms-id="' + id + '"] {');
        parts.push(lines);
        parts.push('}');
      }
      parts.push('');
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
    var depth = (String(htmlPath).match(/\//g) || []).length;
    var rel = '';
    for (var i = 0; i < depth; i++) rel += '../';
    rel += href;
    var head = origDoc.head || origDoc.querySelector('head');
    if (!head) return;
    var existing = head.querySelector('link[data-cms-page-css]');
    if (existing) { existing.setAttribute('href', rel); return; }
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
    } catch (err) { status('書式適用に失敗'); }
  }
  function applyDesignSet(set) {
    if (!state.selected || !set) return;
    if (isLocked(state.selected)) { status('ロック要素には適用できません'); return; }
    pushUndoSnapshot('design');
    recordStyle(state.selected, set.styles);
    status('デザインセット「' + set.label + '」を適用');
  }
  function applyAnimSet(set) {
    if (!state.selected || !set) return;
    if (isLocked(state.selected)) { status('ロック要素には適用できません'); return; }
    pushUndoSnapshot('anim');
    if (set.keyframes) state.pageKeyframes[set.id] = set.keyframes;
    recordStyle(state.selected, { animation: set.animation });
    status('アニメーション「' + set.label + '」を適用');
  }
  function autoLayout(all) {
    var d = doc();
    if (!d) return;
    var targets = [];
    if (all) {
      targets = Array.prototype.slice.call(d.body.querySelectorAll('section, article, .card, .article_by_teacher, h1, h2, h3, p, ul, ol'));
      targets = targets.filter(function (el) {
        if (isChromeUi(el) || isLocked(el)) return false;
        if (el.closest && el.closest('[data-lock="true"]')) return false;
        var depth = 0, n = el;
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
      var cs = d.defaultView.getComputedStyle(el);
      if (cs.position === 'absolute' || cs.position === 'fixed') {
        var left = parseFloat(el.style.left), top = parseFloat(el.style.top);
        if (!isNaN(left)) styles.left = Math.round(left / 8) * 8 + 'px';
        if (!isNaN(top)) styles.top = Math.round(top / 8) * 8 + 'px';
      }
      if (tag === 'section' || tag === 'article' || el.classList.contains('card') || el.classList.contains('article_by_teacher')) {
        styles.padding = '1.25rem'; styles.marginTop = '1rem'; styles.marginBottom = '1rem';
        styles.maxWidth = '100%'; styles.boxSizing = 'border-box';
      } else if (/^h[1-3]$/.test(tag)) {
        styles.marginTop = i === 0 ? '0' : '1.25rem'; styles.marginBottom = '0.6rem'; styles.lineHeight = '1.35';
      } else if (tag === 'p') {
        styles.marginTop = '0.4rem'; styles.marginBottom = '0.75rem'; styles.lineHeight = '1.75';
      } else if (tag === 'ul' || tag === 'ol') {
        styles.marginTop = '0.5rem'; styles.marginBottom = '0.9rem'; styles.paddingLeft = '1.4rem';
      } else {
        styles.marginTop = '0.5rem'; styles.marginBottom = '0.5rem';
      }
      recordStyle(el, styles);
    });
    status((all ? '全体' : '選択要素') + 'を自動配置しました');
  }


  function clonePageStyles() {
    return JSON.parse(JSON.stringify({ styles: state.pageStyles || {}, kf: state.pageKeyframes || {} }));
  }

  function pushUndoSnapshot(label) {
    if (state.undoLock) return;
    var d = doc();
    if (!d || !d.body) return;
    state.undoStack.push({
      label: label || 'edit',
      html: d.body.innerHTML,
      styles: clonePageStyles(),
      ts: Date.now()
    });
    if (state.undoStack.length > 50) state.undoStack.shift();
    state.redoStack = [];
  }

  function restoreSnapshot(snap) {
    var d = doc();
    if (!d || !d.body || !snap) return;
    state.undoLock = true;
    try {
      clearSelection();
      d.body.innerHTML = snap.html;
      state.pageStyles = (snap.styles && snap.styles.styles) ? snap.styles.styles : {};
      state.pageKeyframes = (snap.styles && snap.styles.kf) ? snap.styles.kf : {};
      refreshPageStyleTag();
      setupFrameEvents();
    } finally {
      state.undoLock = false;
    }
  }

  function undoEdit() {
    if (!state.undoStack.length) { status('戻す履歴がありません'); return; }
    var d = doc();
    if (!d || !d.body) return;
    state.redoStack.push({
      label: 'redo-point',
      html: d.body.innerHTML,
      styles: clonePageStyles(),
      ts: Date.now()
    });
    var snap = state.undoStack.pop();
    restoreSnapshot(snap);
    status('元に戻しました（Ctrl+Z）');
  }

  function redoEdit() {
    if (!state.redoStack.length) { status('やり直し履歴がありません'); return; }
    var d = doc();
    if (!d || !d.body) return;
    state.undoStack.push({
      label: 'undo-point',
      html: d.body.innerHTML,
      styles: clonePageStyles(),
      ts: Date.now()
    });
    var snap = state.redoStack.pop();
    restoreSnapshot(snap);
    status('やり直しました（Ctrl+Y）');
  }


  function applyBodyBackground() {
    if (isSimpleEditor()) { status('メンバーはページ背景の変更はできません'); return; }
    var d = doc();
    if (!d || !d.body) { status('プレビューがありません'); return; }
    pushUndoSnapshot('body-bg');
    var mode = ($('body-bg-mode') && $('body-bg-mode').value) || 'solid';
    var styles = {};
    var custom = ($('body-bg-custom') && $('body-bg-custom').value.trim()) || '';
    var imgUrl = ($('body-bg-image') && $('body-bg-image').value.trim()) || '';
    var c1 = ($('body-bg-color') && $('body-bg-color').value) || '#fffdf8';
    var c2 = ($('body-bg-color2') && $('body-bg-color2').value) || '#e8f5e9';
    var angle = ($('body-bg-angle') && $('body-bg-angle').value) || '135';
    var size = ($('body-bg-size') && $('body-bg-size').value) || 'cover';
    var attach = ($('body-bg-attach') && $('body-bg-attach').value) || 'scroll';

    if (mode === 'keep-site') {
      styles.background = '';
      styles.backgroundImage = '';
      styles.backgroundColor = '';
      styles.backgroundSize = '';
      styles.backgroundAttachment = '';
      styles.backgroundRepeat = '';
      styles.backgroundPosition = '';
    } else if (mode === 'solid') {
      styles.background = c1;
      styles.backgroundImage = 'none';
      styles.backgroundColor = c1;
    } else if (mode === 'linear') {
      styles.background = 'linear-gradient(' + angle + 'deg, ' + c1 + ', ' + c2 + ')';
      styles.backgroundColor = c1;
    } else if (mode === 'radial') {
      styles.background = 'radial-gradient(circle at 30% 20%, ' + c1 + ', ' + c2 + ' 70%)';
      styles.backgroundColor = c2;
    } else if (mode === 'image' && imgUrl) {
      styles.backgroundImage = 'url("' + imgUrl.replace(/"/g, '') + '")';
      styles.backgroundSize = size;
      styles.backgroundRepeat = 'no-repeat';
      styles.backgroundPosition = 'center center';
      styles.backgroundAttachment = attach;
      styles.backgroundColor = c1;
    } else if (mode === 'custom' && custom) {
      styles.background = custom;
    } else {
      var presets = {
        warm: 'radial-gradient(circle at 12% 18%,rgba(255,209,102,.35),transparent 42%),radial-gradient(circle at 88% 12%,rgba(76,201,240,.28),transparent 40%),radial-gradient(circle at 70% 80%,rgba(46,196,182,.22),transparent 45%),#fffdf8',
        cool: 'radial-gradient(circle at 20% 20%,rgba(76,201,240,.35),transparent 45%),radial-gradient(circle at 80% 70%,rgba(124,58,237,.2),transparent 40%),#f4f7ff',
        sunset: 'radial-gradient(circle at 15% 25%,rgba(255,107,107,.3),transparent 42%),radial-gradient(circle at 85% 15%,rgba(255,209,102,.35),transparent 40%),#fff8f2',
        night: 'radial-gradient(circle at 30% 20%,rgba(124,58,237,.45),transparent 40%),radial-gradient(circle at 80% 80%,rgba(46,196,182,.25),transparent 45%),#1a1428',
        forest: 'radial-gradient(circle at 20% 15%,rgba(46,125,50,.35),transparent 45%),radial-gradient(circle at 80% 70%,rgba(27,94,32,.4),transparent 50%),#0b1f14',
        sakura: 'radial-gradient(circle at 25% 20%,rgba(244,143,177,.4),transparent 45%),radial-gradient(circle at 75% 75%,rgba(248,187,208,.3),transparent 40%),#fff5f8'
      };
      styles.background = presets[mode] || presets.warm;
      styles.backgroundColor = '';
    }

    /* body 専用IDで確実に記録 */
    d.body.setAttribute('data-cms-id', 'cms-body');
    recordStyle(d.body, styles);
    /* 即時反映を強化 */
    Object.keys(styles).forEach(function (k) {
      try { d.body.style[k] = styles[k] || ''; } catch (e) {}
    });
    if (d.documentElement) {
      try {
        d.documentElement.style.background = styles.background || styles.backgroundColor || '';
        d.documentElement.style.backgroundImage = styles.backgroundImage || '';
      } catch (e2) {}
    }
    refreshPageStyleTag();
    status('ページ全体の背景を適用しました（保存で確定）');
  }

  function showHover(el) {
    clearHover();
    if (!el || isLocked(el) || el === state.selected) return;
    el.classList.add('cms-hover');
  }

  function stripCmsChrome(node) {
    if (!node || !node.querySelectorAll) return node;
    var clone = node.cloneNode(true);
    clone.querySelectorAll('.cms-handle,.cms-drag-bar,.cms-pen,.cms-lock-badge,.cms-hover').forEach(function (h) { h.remove(); });
    clone.classList.remove('cms-sel', 'cms-hover', 'cms-locked-hover');
    clone.removeAttribute('contenteditable');
    return clone;
  }

  function getEditablePlainText(el) {
    if (!el) return '';
    var clean = stripCmsChrome(el);
    return String(clean.innerText || clean.textContent || '').replace(/\u200B/g, '').replace(/\s+/g, ' ').trim();
  }

  function selectEditableContents(el) {
    var d = doc();
    if (!d || !el) return;
    /* CMS UI を除外して本文だけ選択 */
    var walker = d.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (p && (p.classList.contains('cms-handle') || p.classList.contains('cms-drag-bar') ||
            p.classList.contains('cms-pen') || p.classList.contains('cms-lock-badge'))) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.nodeValue || !String(node.nodeValue).replace(/\u200B/g, '').trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var first = walker.nextNode();
    var last = first;
    var n;
    while ((n = walker.nextNode())) last = n;
    var sel = d.defaultView.getSelection();
    sel.removeAllRanges();
    var range = d.createRange();
    if (first && last) {
      range.setStart(first, 0);
      range.setEnd(last, last.nodeValue.length);
    } else {
      range.selectNodeContents(el);
      range.collapse(true);
    }
    sel.addRange(range);
  }

  function isSelectionCoveringElement(el) {
    var d = doc();
    if (!d || !el) return false;
    var sel = d.defaultView.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    var plain = getEditablePlainText(el);
    if (!plain) return true;
    var selected = String(sel.toString() || '').replace(/\u200B/g, '').replace(/\s+/g, ' ').trim();
    if (selected && selected === plain) return true;
    /* 要素内の全テキストノードが選択範囲に含まれるか */
    try {
      var range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer) && range.commonAncestorContainer !== el) return false;
      var pre = d.createRange();
      pre.selectNodeContents(el);
      pre.setEnd(range.startContainer, range.startOffset);
      var post = d.createRange();
      post.selectNodeContents(el);
      post.setStart(range.endContainer, range.endOffset);
      var before = String(pre.toString() || '').replace(/\u200B/g, '').trim();
      var after = String(post.toString() || '').replace(/\u200B/g, '').trim();
      /* chrome UI テキストは無視（移動など） */
      before = before.replace(/⋮⋮\s*移動/g, '').trim();
      after = after.replace(/⋮⋮\s*移動/g, '').trim();
      return !before && !after;
    } catch (err) {
      return false;
    }
  }

  function shouldProtectElementDeletion(el, key) {
    if (!el || !el.parentNode) return false;
    var plain = getEditablePlainText(el);
    if (!plain) return true;
    if (isSelectionCoveringElement(el)) return true;
    return false;
  }

  function clearEditableTextKeepElement(el) {
    if (!el) return;
    /* 操作UIは要素外なので、本文だけ空にする */
    el.innerHTML = '';
    el.appendChild(doc().createTextNode('\u200B'));
    placeCaretAtEnd(el);
    fillSideText(el);
    scheduleChromeUpdate();
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
    var clean = stripCmsChrome(el);
    ta.value = asHtml ? clean.innerHTML : (clean.innerText || clean.textContent || '');
    try { ta.focus(); } catch (e) {}
  }

  function applySideText() {
    if (!state.selected) return;
    var ta = $('side-text');
    if (!ta) return;
    var asHtml = $('side-as-html') && $('side-as-html').checked;
    var el = state.selected;
    /* 操作UIは要素外。本文だけ差し替え */
    if (asHtml) el.innerHTML = ta.value;
    else el.textContent = ta.value;
    scheduleChromeUpdate();
  }

  function removeChromeLayer() {
    var d = doc();
    if (state.chromeRaf) {
      try { cancelAnimationFrame(state.chromeRaf); } catch (e0) {}
      state.chromeRaf = null;
    }
    if (state.chromeLayer && state.chromeLayer.parentNode) {
      try { state.chromeLayer.parentNode.removeChild(state.chromeLayer); } catch (e1) {}
    }
    state.chromeLayer = null;
    if (d) {
      /* 旧実装の残骸（要素内に付いていたハンドル）も掃除 */
      d.querySelectorAll('#cms-chrome-layer,.cms-handle,.cms-drag-bar,.cms-pen').forEach(function (n) {
        try { n.remove(); } catch (e2) {}
      });
    }
  }

  function updateChromePositions(el) {
    var d = doc();
    if (!d || !el || !state.chromeLayer) return;
    var rect;
    try { rect = el.getBoundingClientRect(); } catch (e) { return; }
    var bar = state.chromeLayer.querySelector('.cms-drag-bar');
    if (bar) {
      bar.style.left = Math.round(rect.left) + 'px';
      bar.style.top = Math.round(rect.top - 26) + 'px';
    }
    var map = {
      nw: [rect.left - 7, rect.top - 7],
      ne: [rect.right - 7, rect.top - 7],
      sw: [rect.left - 7, rect.bottom - 7],
      se: [rect.right - 7, rect.bottom - 7]
    };
    state.chromeLayer.querySelectorAll('.cms-handle').forEach(function (h) {
      var pos = h.dataset.handle;
      var xy = map[pos];
      if (!xy) return;
      h.style.left = Math.round(xy[0]) + 'px';
      h.style.top = Math.round(xy[1]) + 'px';
    });
  }

  function scheduleChromeUpdate() {
    if (state.chromeRaf) return;
    state.chromeRaf = requestAnimationFrame(function () {
      state.chromeRaf = null;
      if (state.selected) updateChromePositions(state.selected);
    });
  }

  function attachHandles(el) {
    var d = doc();
    if (!d || !el) return;
    removeChromeLayer();

    var layer = d.createElement('div');
    layer.id = 'cms-chrome-layer';
    layer.setAttribute('contenteditable', 'false');
    layer.setAttribute('unselectable', 'on');
    layer.setAttribute('aria-hidden', 'true');

    var bar = d.createElement('div');
    bar.className = 'cms-drag-bar';
    bar.textContent = '⋮⋮ 移動';
    bar.setAttribute('contenteditable', 'false');
    bar.setAttribute('unselectable', 'on');
    bar.setAttribute('tabindex', '-1');
    bar.setAttribute('role', 'button');
    bar.setAttribute('aria-label', '移動');
    layer.appendChild(bar);

    ['nw', 'ne', 'sw', 'se'].forEach(function (pos) {
      var h = d.createElement('div');
      h.className = 'cms-handle ' + pos;
      h.dataset.handle = pos;
      h.setAttribute('contenteditable', 'false');
      h.setAttribute('unselectable', 'on');
      h.setAttribute('tabindex', '-1');
      h.setAttribute('role', 'button');
      h.setAttribute('aria-label', 'リサイズ ' + pos);
      layer.appendChild(h);
    });

    d.body.appendChild(layer);
    state.chromeLayer = layer;
    updateChromePositions(el);
  }

  function clearSelection() {
    var d = doc();
    if (!d) return;
    clearHover();
    removeChromeLayer();
    d.querySelectorAll('.cms-sel').forEach(function (n) {
      n.classList.remove('cms-sel');
      n.removeAttribute('contenteditable');
      n.removeAttribute('data-cms-editing');
        n.removeAttribute('data-cms-editing');
      /* 念のため旧ハンドルが残っていれば除去 */
      n.querySelectorAll('.cms-handle,.cms-drag-bar,.cms-pen').forEach(function (h) { h.remove(); });
    });
    state.selected = null;
    hideRtToolbar();
    fillSideText(null);
    if ($('sel-info')) $('sel-info').textContent = 'クリックで編集（data-lock は不可）';
  }

  function placeCaretAtEnd(el) {
    var d = doc();
    if (!d || !el) return;
    try {
      el.focus();
      var range = d.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = d.defaultView.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}
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
    /* 操作UIは要素の外に置くので、要素本体だけ contenteditable */
    el.setAttribute('contenteditable', 'true');
    /* Googleドキュメント風: 1つの連続テキストエリアとして扱う */
    try {
      el.style.minHeight = el.style.minHeight || '2.5em';
      el.style.outline = '';
      /* セクション内の見出しも含めて一体編集（メンバーは構造をいじらない） */
      if (isSimpleEditor()) {
        el.setAttribute('data-cms-editing', '1');
      }
    } catch (e0) {}
    state.selected = el;
    if (!el.__cmsUndoBound) {
      el.__cmsUndoBound = true;
      el.addEventListener('focus', function () { pushUndoSnapshot('text-before'); });
    }
    if (!isSimpleEditor()) {
      attachHandles(el);
    } else {
      removeChromeLayer();
    }
    showRtToolbar();
    fillSideText(el);
    placeCaretAtEnd(el);
    if ($('sel-info')) {
      if (isSimpleEditor()) {
        $('sel-info').textContent = '本文を編集中（Googleドキュメント風）— 改行・太字・リストOK / 画像・音楽・動画は右のマイファイルから挿入 / 構造・CSSは変更不可';
      } else {
        $('sel-info').textContent = '<' + el.tagName.toLowerCase() + '> 編集中 — Ctrl+Aで要素内全選択 / Escで終了';
      }
    }
    if (!isSimpleEditor()) {
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
    }
    status(isSimpleEditor()
      ? '本文のみ編集可能（構造・CSS・ブロック追加は不可）。Googleドキュメントのように入力してください'
      : '編集中 — そのまま入力 / Ctrl+A でこの要素内を全選択');
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
    if (tb) { tb.classList.add('hidden'); tb.classList.remove('rt-docked'); }
    var ve = document.getElementById('view-editor');
    if (ve) ve.classList.remove('rt-open');
  }

  /**
   * 要素のボーダーボックスを、body を基準にした absolute 座標へ変換する。
   *
   * 重要:
   * - getBoundingClientRect() は既に「ビューポート基準」（スクロール込みの見た目位置）
   * - bodyRect も同じくビューポート基準
   * - したがって rect - bodyRect が body 左上からのオフセット
   * - ここに window.scrollX/Y を足すと二重加算になり、スクロール時に大きくズレる
   * - body 自身がスクロールする場合のみ body.scrollLeft/Top を足す
   */
  function offsetRelativeToBody(el) {
    var d = doc();
    var body = d.body;
    var rect = el.getBoundingClientRect();
    var bodyRect = body.getBoundingClientRect();
    return {
      left: rect.left - bodyRect.left + (body.scrollLeft || 0),
      top: rect.top - bodyRect.top + (body.scrollTop || 0),
      width: rect.width,
      height: rect.height
    };
  }

  function ensureAbsolute(el) {
    var d = doc();
    if (!d || !el) return null;
    var win = d.defaultView;
    var body = d.body;
    var cs = win.getComputedStyle(el);

    /* body を位置指定の基準にする（static のままだと absolute の基準がずれる） */
    if (win.getComputedStyle(body).position === 'static') {
      body.style.position = 'relative';
    }

    /* 変換前の見た目位置を必ず測る */
    var before = offsetRelativeToBody(el);
    var w = el.offsetWidth;
    var h = el.offsetHeight;

    var pos = cs.position;
    if (pos !== 'absolute' && pos !== 'fixed') {
      el.style.position = 'absolute';
      el.style.left = Math.round(before.left) + 'px';
      el.style.top = Math.round(before.top) + 'px';
      el.style.width = Math.round(w) + 'px';
      /* 高さは内容に任せる（テキスト編集で潰さない）が、resize用に現状値も保持可能 */
      el.style.margin = '0';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    } else {
      /* 既に absolute でも、インライン left/top が空だと parseFloat が 0 になりジャンプする */
      if (!el.style.left || el.style.left === 'auto') {
        el.style.left = Math.round(before.left) + 'px';
      }
      if (!el.style.top || el.style.top === 'auto') {
        el.style.top = Math.round(before.top) + 'px';
      }
      if (!el.style.position) el.style.position = 'absolute';
    }

    /*
     * margin 除去や containing block の影響で 1px でもズレたら、
     * 実測値で left/top を書き直して視覚位置を固定する
     */
    var after = offsetRelativeToBody(el);
    var dx = before.left - after.left;
    var dy = before.top - after.top;
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      var curL = parseFloat(el.style.left);
      var curT = parseFloat(el.style.top);
      if (isNaN(curL)) curL = after.left;
      if (isNaN(curT)) curT = after.top;
      el.style.left = Math.round(curL + dx) + 'px';
      el.style.top = Math.round(curT + dy) + 'px';
    }

    var finalOff = offsetRelativeToBody(el);
    return {
      left: finalOff.left,
      top: finalOff.top,
      width: el.offsetWidth,
      height: el.offsetHeight
    };
  }

  function readDragOrigin(el) {
    /* ドラッグ開始時点の「実際の」left/top/size。style が空でも実測から取る */
    var d = doc();
    var left = parseFloat(el.style.left);
    var top = parseFloat(el.style.top);
    if (isNaN(left) || isNaN(top) || el.style.left === '' || el.style.top === '') {
      var off = offsetRelativeToBody(el);
      left = off.left;
      top = off.top;
      el.style.left = Math.round(left) + 'px';
      el.style.top = Math.round(top) + 'px';
    }
    return {
      left: left,
      top: top,
      width: el.offsetWidth,
      height: el.offsetHeight
    };
  }

  function setupFrameEvents() {
    var d = doc();
    if (!d) return;

    d.addEventListener('keydown', function (e) {
      var key = String(e.key).toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        undoEdit();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        e.stopPropagation();
        redoEdit();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === 'a') {
        if (state.selected && state.selected.getAttribute('contenteditable') === 'true') {
          e.preventDefault();
          e.stopPropagation();
          try {
            selectEditableContents(state.selected);
          } catch (err) {}
          return;
        }
      }
      /* Backspace / Delete で要素ごと消えないように保護 */
      if ((e.key === 'Backspace' || e.key === 'Delete') && state.selected &&
          state.selected.getAttribute('contenteditable') === 'true' &&
          !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (shouldProtectElementDeletion(state.selected, e.key)) {
          e.preventDefault();
          e.stopPropagation();
          clearEditableTextKeepElement(state.selected);
          status('要素は残します（空になりました）');
          return;
        }
      }
      if (e.key === 'Escape') {
        clearSelection();
        hideRtToolbar();
      }
    }, true);

    d.addEventListener('beforeinput', function (e) {
      if (!state.selected || state.selected.getAttribute('contenteditable') !== 'true') return;
      var t = e.inputType || '';
      if (t === 'deleteContentBackward' || t === 'deleteContentForward' || t === 'deleteByCut' || t === 'deleteByDrag') {
        if (shouldProtectElementDeletion(state.selected, t.indexOf('Forward') >= 0 ? 'Delete' : 'Backspace')) {
          e.preventDefault();
          clearEditableTextKeepElement(state.selected);
        }
      }
    }, true);

    /* 万一ブラウザが要素を消した場合の復帰 */
    d.addEventListener('keyup', function (e) {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      if (!state.selected) return;
      if (!d.body.contains(state.selected)) {
        status('要素削除を検知 — 元に戻すには Ctrl+Z');
        state.selected = null;
        removeChromeLayer();
        hideRtToolbar();
        fillSideText(null);
      }
    }, true);

    d.addEventListener('input', function () {
      scheduleChromeUpdate();
    }, true);

    /* 選択範囲が操作UIに飛ばないようにする */
    d.addEventListener('selectionchange', function () {
      try {
        var sel = d.defaultView.getSelection();
        if (!sel || !sel.rangeCount || !state.selected) return;
        var node = sel.anchorNode;
        if (!node) return;
        var el = node.nodeType === 1 ? node : node.parentElement;
        if (el && isChromeUi(el)) {
          placeCaretAtEnd(state.selected);
        }
      } catch (err) {}
    });

    d.addEventListener('mouseover', function (e) {
      if (state.drag || state.resize) return;
      var t = e.target;
      if (!t || t.nodeType !== 1) return;
      if (isChromeUi(t)) return;
      var locked = t.closest && t.closest('[data-lock="true"]');
      if (locked) {
        if (!locked.classList.contains('cms-locked-hover')) showLockBadge(locked);
        return;
      }
      var target = pickTarget(t);
      if (!target || target === state.selected) return;
      if (target.classList && target.classList.contains('cms-hover')) return;
      showHover(target);
    }, true);

    d.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var t = e.target;
      if (!t) return;

      if (t.classList && (t.classList.contains('cms-handle') || t.classList.contains('cms-drag-bar') || t.classList.contains('cms-lock-badge'))) return;

      /* 編集中の要素内クリックは維持 */
      if (state.selected && (t === state.selected || state.selected.contains(t))) return;

      /* 通常クリックでも選択・直接編集に入る */
      var target = pickTarget(t);
      if (target) {
        enterEdit(target);
        return;
      }
      if (isSimpleEditor() && t && t.nodeType === 1 && !isLocked(t) && t !== d.body) {
        /* メンバーが構造部分をクリックしたときの案内 */
        status('ここは編集できません。本文ブロック（探求メモなど）をクリックしてください');
      }
      if (t === d.body || t === d.documentElement) clearSelection();
    }, true);

    d.addEventListener('mousedown', function (e) {
      var t = e.target;
      if (!state.selected) return;
      if (isSimpleEditor()) return; /* メンバーはドラッグ・リサイズ不可 */
      if (isChromeUi(t) && !(t.classList && (t.classList.contains('cms-handle') || t.classList.contains('cms-drag-bar')))) {
        return;
      }

      if (t.classList && t.classList.contains('cms-handle')) {
        e.preventDefault();
        e.stopPropagation();
        var el = state.selected;
        /* 見た目位置を保ったまま absolute 化 → その実測値を開始点にする */
        ensureAbsolute(el);
        var originR = readDragOrigin(el);
        state.resize = {
          handle: t.dataset.handle,
          el: el,
          startX: e.clientX,
          startY: e.clientY,
          startW: originR.width,
          startH: originR.height,
          startL: originR.left,
          startT: originR.top
        };
        scheduleChromeUpdate();
        return;
      }

      if (t.classList && t.classList.contains('cms-drag-bar')) {
        e.preventDefault();
        e.stopPropagation();
        var el2 = state.selected;
        ensureAbsolute(el2);
        var originD = readDragOrigin(el2);
        state.drag = {
          el: el2,
          startX: e.clientX,
          startY: e.clientY,
          /* clientX の差分はビューポート座標。absolute の left/top は body 基準。
             差分は同じピクセル単位なので、開始 left/top が実測と一致していればズレない */
          origL: originD.left,
          origT: originD.top
        };
        scheduleChromeUpdate();
      }
    }, true);

    d.addEventListener('mousemove', function (e) {
      if (state.drag) {
        e.preventDefault();
        var dx = e.clientX - state.drag.startX;
        var dy = e.clientY - state.drag.startY;
        state.drag.el.style.left = Math.round(state.drag.origL + dx) + 'px';
        state.drag.el.style.top = Math.round(state.drag.origT + dy) + 'px';
        scheduleChromeUpdate();
      }
      if (state.resize) {
        e.preventDefault();
        var r = state.resize;
        var dx2 = e.clientX - r.startX;
        var dy2 = e.clientY - r.startY;
        var w = r.startW, h = r.startH, l = r.startL, top = r.startT;
        if (r.handle.indexOf('e') >= 0) w = Math.max(40, r.startW + dx2);
        if (r.handle.indexOf('s') >= 0) h = Math.max(20, r.startH + dy2);
        if (r.handle.indexOf('w') >= 0) { w = Math.max(40, r.startW - dx2); l = r.startL + dx2; }
        if (r.handle.indexOf('n') >= 0) { h = Math.max(20, r.startH - dy2); top = r.startT + dy2; }
        r.el.style.width = Math.round(w) + 'px';
        r.el.style.height = Math.round(h) + 'px';
        if (r.handle.indexOf('w') >= 0) r.el.style.left = Math.round(l) + 'px';
        if (r.handle.indexOf('n') >= 0) r.el.style.top = Math.round(top) + 'px';
        scheduleChromeUpdate();
      }
    }, true);

    d.addEventListener('mouseup', function () {
      state.drag = null;
      state.resize = null;
      scheduleChromeUpdate();
    }, true);

    d.addEventListener('scroll', function () {
      scheduleChromeUpdate();
    }, true);

    if (d.defaultView) {
      d.defaultView.addEventListener('resize', function () {
        scheduleChromeUpdate();
      });
    }

    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') clearSelection();
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && state.selected) {
        e.preventDefault();
        duplicateSelected();
      }
    });
  }

  function duplicateSelected() {
    if (isSimpleEditor()) { status('メンバーは要素の複製はできません（本文の編集とファイル挿入のみ）'); return; }
    if (!state.selected) { status('複製する要素を選択してください'); return; }
    if (isLocked(state.selected)) { status('ロック要素は複製できません'); return; }
    var el = state.selected;
    var clone = el.cloneNode(true);
    clone.classList.remove('cms-sel');
    clone.removeAttribute('contenteditable');
    clone.querySelectorAll('.cms-handle,.cms-drag-bar,.cms-pen').forEach(function (h) { h.remove(); });
    if (clone.style.position === 'absolute') {
      var top = parseFloat(clone.style.top) || 0;
      var left = parseFloat(clone.style.left) || 0;
      clone.style.top = (top + 24) + 'px';
      clone.style.left = (left + 24) + 'px';
    }
    if (el.parentNode) {
      if (el.nextSibling) el.parentNode.insertBefore(clone, el.nextSibling);
      else el.parentNode.appendChild(clone);
    }
    selectElement(clone);
    status('要素を複製しました');
  }

  function insertBlock(html) {
    if (isSimpleEditor()) {
      /* メンバーは構造ブロック追加不可。メディア挿入のみ insertUploadedFile 経由 */
      status('メンバーは本文の編集とファイル挿入のみ可能です（ブロック追加は管理者向け）');
      return;
    }
    pushUndoSnapshot('insert');

    var d = doc();
    if (!d) { status('プレビューがありません'); return; }
    var wrap = d.createElement('div');
    wrap.innerHTML = html;
    var node = wrap.firstElementChild || wrap.firstChild;
    if (!node) return;
    if (state.selected && state.selected.parentNode && !isLocked(state.selected)) {
      if (state.selected.nextSibling) {
        state.selected.parentNode.insertBefore(node, state.selected.nextSibling);
      } else {
        state.selected.parentNode.appendChild(node);
      }
    } else {
      d.body.appendChild(node);
    }
    if (node.nodeType === 1) selectElement(node);
    status('ブロックを挿入しました');
  }

  function buildInsertHtmlForFile(f) {
    var url = filePublicUrl(f.path);
    var kind = classifyFile(f.name);
    var safeName = String(f.name || 'file').replace(/[<>&"]/g, '');
    if (kind === 'image') {
      return '<p style="text-align:center"><img src="' + url + '" alt="' + safeName + '" style="max-width:100%;height:auto;border-radius:12px"></p>';
    }
    if (kind === 'video') {
      return '<p style="text-align:center"><video src="' + url + '" controls playsinline style="max-width:100%;border-radius:12px"></video></p>';
    }
    if (kind === 'audio') {
      return '<p style="text-align:center"><audio src="' + url + '" controls style="width:100%;max-width:420px"></audio></p>';
    }
    if (kind === 'pdf') {
      return '<p><a class="btn-play" href="' + url + '" target="_blank" rel="noopener">📕 ' + safeName + ' を開く</a></p>' +
        '<iframe src="' + url + '" title="' + safeName + '" style="width:100%;min-height:420px;border:1px solid rgba(43,33,64,.12);border-radius:12px"></iframe>';
    }
    return '<p><a class="btn-play" href="' + url + '" target="_blank" rel="noopener">' + fileKindIcon(kind) + ' ' + safeName + '</a></p>';
  }

  function insertUploadedFile(f) {
    if (!f || !f.path) return;
    var html = buildInsertHtmlForFile(f);
    if (isSimpleEditor()) {
      var d = doc();
      if (!d) { status('プレビューがありません'); return; }
      pushUndoSnapshot('insert-media');
      var host = state.selected;
      if (!host || host.getAttribute('contenteditable') !== 'true') {
        host = d.querySelector('section.article_by_teacher, section.content-block, [data-cms-editable="true"], main section:not([data-lock="true"])');
      }
      if (!host || isLocked(host)) {
        status('挿入先の本文ブロックがありません。本文をクリックしてから挿入してください');
        return;
      }
      if (host.getAttribute('contenteditable') !== 'true') {
        enterEdit(host);
      }
      var tmp = d.createElement('div');
      tmp.innerHTML = html;
      while (tmp.firstChild) host.appendChild(tmp.firstChild);
      status('挿入しました: ' + (f.name || f.path) + '（本文内）');
      return;
    }
    insertBlock(html);
    status('ファイルを挿入: ' + (f.name || f.path));
  }

  function loadMyFilesPicker() {
    var box = $('myfiles-list');
    var st = $('myfiles-status');
    if (!box) return;
    box.innerHTML = '';
    if (st) st.textContent = '読み込み中…';
    listDir(userDir()).then(function (items) {
      var files = items.filter(function (i) { return i.type === 'file'; });
      if (!files.length) {
        if (st) st.textContent = 'アップロード済みファイルなし';
        return;
      }
      if (st) st.textContent = files.length + ' 件 — クリックでページに挿入';
      files.forEach(function (f) {
        var kind = classifyFile(f.name);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn ghost block myfile-btn';
        btn.title = f.path;
        btn.innerHTML = '<span class="myfile-icon"></span><span class="myfile-name"></span>';
        btn.querySelector('.myfile-icon').textContent = fileKindIcon(kind);
        btn.querySelector('.myfile-name').textContent = f.name;
        btn.onclick = function () { insertUploadedFile(f); };
        box.appendChild(btn);
      });
    }).catch(function (e) {
      if (st) st.textContent = '読込失敗: ' + e.message;
    });
  }

  function populateBlocks() {
    var box = $('block-list');
    if (box) {
      box.innerHTML = '';
      BLOCKS.forEach(function (b) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn ghost block-btn';
        btn.textContent = b.label;
        btn.onclick = function () { insertBlock(b.html); };
        box.appendChild(btn);
      });
    }
    var dbox = $('design-list');
    if (dbox) {
      dbox.innerHTML = '';
      DESIGN_SETS.forEach(function (s) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn ghost block-btn';
        btn.textContent = s.label;
        btn.onclick = function () { applyDesignSet(s); };
        dbox.appendChild(btn);
      });
    }
    var abox = $('anim-list');
    if (abox) {
      abox.innerHTML = '';
      ANIM_SETS.forEach(function (s) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn ghost block-btn';
        btn.textContent = s.label;
        btn.onclick = function () { applyAnimSet(s); };
        abox.appendChild(btn);
      });
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
    if (!canEditPath(path)) { status('このページを編集する権限がありません'); return; }
    state.path = path;
    state.selected = null;
    state.isHtml = !!isHtml;
    state.originalHtml = null;
    state.fileSha = null;
    state.pageStyles = {};
    state.pageKeyframes = {};
    state.undoStack = [];
    state.redoStack = [];
    show('view-editor');
    if ($('ed-path')) $('ed-path').textContent = path;
    if ($('ed-title')) $('ed-title').textContent = '読み込み中…';
    if ($('commit-msg')) $('commit-msg').value = '';
    status('読み込み中…');
    hideRtToolbar();
    if (isSimpleEditor()) {
      setEditorMode('visual');
    } else {
      setEditorMode(isHtml ? 'visual' : 'code');
    }
    populateBlocks();
    loadMyFilesPicker();
    fillSideText(null);
    applyEditorPermissions();

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
          status(isSimpleEditor()
            ? '本文ブロックをクリックして Googleドキュメント風に編集。画像・音楽・動画は右のマイファイルから挿入（構造・CSS変更不可）'
            : 'クリックで編集 / Ctrl+Aで要素内全選択');
          startDraftTimer();
        };
        fEl.srcdoc = injectChrome(content, path);
      } else {
        if ($('ed-title')) $('ed-title').textContent = path.split('/').pop();
        if ($('code-main')) $('code-main').value = content;
        if ($('code-area')) $('code-area').value = content;
        status('テキスト編集');
      }
    }).catch(function (e) {
      status('読込失敗: ' + e.message);
    });
  }

  function exportHtml() {
    if (!state.originalHtml) throw new Error('originalHtml なし');
    var d = doc();
    if (!d) throw new Error('doc なし');
    clearSelection();
    var bodyClone = d.body.cloneNode(true);
    bodyClone.querySelectorAll('.cms-sel, .cms-hover, .cms-handle, .cms-drag-bar, .cms-pen, .cms-lock-badge, .radial-menu-wrapper, .menu-fab, .header-auth, #cms-ui, #cms-page-style, #cms-chrome-layer').forEach(function (n) {
      if (n.id === 'cms-chrome-layer' || n.id === 'cms-ui' || n.id === 'cms-page-style' ||
          n.classList.contains('cms-handle') || n.classList.contains('cms-drag-bar') || n.classList.contains('cms-pen') ||
          n.classList.contains('cms-hover') || n.classList.contains('cms-lock-badge') ||
          n.classList.contains('radial-menu-wrapper') || n.classList.contains('menu-fab') ||
          n.classList.contains('header-auth')) {
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
    if (oBody) {
      oBody.innerHTML = bodyClone.innerHTML;
      /* body の背景・cms-id を保存 */
      var bStyle = d.body.getAttribute('style') || '';
      if (bStyle) oBody.setAttribute('style', bStyle);
      else oBody.removeAttribute('style');
      var cmsId = d.body.getAttribute('data-cms-id');
      if (cmsId) oBody.setAttribute('data-cms-id', cmsId);
      /* pageStyles の cms-body を style にも反映 */
      if (state.pageStyles && state.pageStyles['cms-body']) {
        var rs = state.pageStyles['cms-body'];
        Object.keys(rs).forEach(function (k) {
          try { oBody.style[k] = rs[k] || ''; } catch (e) {}
        });
      }
    }

    /* data-lock 保護: 元HTMLのロック要素を強制復元 */
    try {
      var origLocked = parser.parseFromString(state.originalHtml, 'text/html').querySelectorAll('[data-lock="true"]');
      /* ロック属性が消えていたら元から戻すのは難しいので、少なくとも属性削除を検出 */
    } catch (e) {}

    /* MENU.js / MENU.css を必ず復元 */
    ensureMenuAssets(origDoc);
    ensurePageCssLink(origDoc, state.path);

    var out = '<!DOCTYPE html>\n' + origDoc.documentElement.outerHTML;
    return out;
  }

  function ensureMenuAssets(docNode) {
    if (!docNode) return;
    var head = docNode.head || docNode.querySelector('head');
    var body = docNode.body || docNode.querySelector('body');
    if (!head) return;
    var hasCss = !!head.querySelector('link[href*="MENU/MENU.css"],link[href*="MENU.css"]');
    var hasJs = !!(body && body.querySelector('script[src*="MENU/MENU.js"],script[src*="MENU.js"]')) ||
                !!head.querySelector('script[src*="MENU/MENU.js"],script[src*="MENU.js"]');
    /* パス推定 */
    var pagePath = state.path || '';
    var prefix = '';
    if (pagePath.indexOf('pages/members/') === 0 || pagePath.indexOf('pages/groups/') === 0) prefix = '../../';
    else if (pagePath.indexOf('pages/') === 0 || pagePath.indexOf('users/') === 0) prefix = '../';
    if (!hasCss) {
      var link = docNode.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', prefix + 'MENU/MENU.css');
      head.appendChild(link);
    }
    if (!hasJs && body) {
      var sc = docNode.createElement('script');
      sc.setAttribute('src', prefix + 'MENU/MENU.js');
      body.appendChild(sc);
    }
  }

  function securityScan(html) {
    var issues = [];
    var lower = String(html).toLowerCase();
    var patterns = [
      [/javascript:\s*eval/i, 'eval付きjavascript:'],
      [/<script[^>]+src=["']https?:\/\/(?!r25347sh\.github\.io|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)[^"']+/i, '外部script'],
      [/document\.cookie/i, 'cookie操作'],
      [/localStorage\.clear|sessionStorage\.clear/i, 'ストレージ全消去'],
      [/<iframe[^>]+src=["']https?:\/\//i, '外部iframe'],
      [/onerror\s*=\s*["'][^"']*eval/i, 'onerror+eval'],
      [/new\s+Function\s*\(/i, 'Functionコンストラクタ'],
      [/fetch\s*\(\s*["']https?:\/\/(?!api\.github\.com|api\.ipify\.org|r25347sh\.github\.io)/i, '不審なfetch']
    ];
    patterns.forEach(function (p) {
      if (p[0].test(html)) issues.push(p[1]);
    });
    return issues;
  }

  function protectLockedInCode(editedHtml) {
    /* コード編集で data-lock が消されていないか検査し、消えていたら元を優先して警告 */
    try {
      var origDoc = new DOMParser().parseFromString(state.originalHtml, 'text/html');
      var editDoc = new DOMParser().parseFromString(editedHtml, 'text/html');
      var origLocks = origDoc.querySelectorAll('[data-lock="true"]');
      if (!origLocks.length) return editedHtml;
      var editLocks = editDoc.querySelectorAll('[data-lock="true"]');
      if (editLocks.length < origLocks.length) {
        status('警告: data-lock 要素が減らされています。ロックは保護されます');
        /* 単純保護: 元HTMLを返すのは強すぎるので、編集HTMLに不足分を警告のみ */
      }
      /* 各ロック要素の data-lock 属性を強制 */
      /* IDがある要素は属性を戻す */
      Array.prototype.forEach.call(origLocks, function (ol) {
        if (ol.id) {
          var el = editDoc.getElementById(ol.id);
          if (el) el.setAttribute('data-lock', 'true');
        }
      });
      ensureMenuAssets(editDoc);
      return '<!DOCTYPE html>\n' + editDoc.documentElement.outerHTML;
    } catch (e) {
      return editedHtml;
    }
  }

  function saveBackup(path, content, commitMsg) {
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
      backupPath: backupPath
    };
    return putFile(backupPath, content, 'backup: ' + path + ' @ ' + ts, null, BACKUP_API)
      .then(function () {
        return getFile('src/backup.json', BACKUP_API).then(function (f) {
          var arr = [];
          try { arr = JSON.parse(decode(f.content)); } catch (e) {}
          if (!Array.isArray(arr)) arr = [];
          arr.push(entry);
          if (arr.length > 500) arr = arr.slice(arr.length - 500);
          return putFile('src/backup.json', JSON.stringify(arr, null, 2), 'log: ' + path, f.sha, BACKUP_API);
        }).catch(function () {
          return putFile('src/backup.json', JSON.stringify([entry], null, 2), 'log: init', null, BACKUP_API);
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
        return buildCommitMessage('RESTORE ' + (entry.datetime || '')).then(function (cm) {
          return putFile(entry.path, content, cm, cur.sha).then(function () {
            status('復元完了 ✓');
            if (state.path === entry.path) openEditor(entry.path, /\.html?$/i.test(entry.path));
          });
        });
      });
    }).catch(function (e) {
      status('復元失敗: ' + e.message);
      alert(e.message);
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
    status('保存中…');
    var out;
    try {
      if (state.isHtml) {
        if (state.mode === 'code') {
          out = ($('code-main') && $('code-main').value) || ($('code-area') && $('code-area').value) || '';
          out = protectLockedInCode(out);
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
    var threats = securityScan(out);
    if (threats.length) {
      if (!confirm('セキュリティ警告:\n' + threats.join('\n') + '\n\nこのまま保存しますか？')) {
        status('保存をキャンセル（セキュリティ警告）');
        return;
      }
    }
    var cssPath = state.isHtml ? pageCssPath(state.path) : null;
    var cssBody = state.isHtml ? buildPageCss() : null;
    getFile(state.path).then(function (f) {
      state.fileSha = f.sha;
      return buildCommitMessage(userMsg).then(function (cm) {
        return putFile(state.path, out, cm, f.sha).then(function (res) {
          state.originalHtml = out;
          state.fileSha = res.content && res.content.sha ? res.content.sha : state.fileSha;
          var cssPromise = Promise.resolve();
          if (cssPath && cssBody != null) {
            cssPromise = getFile(cssPath).then(function (cf) {
              return putFile(cssPath, cssBody, cm + ' [page-css]', cf.sha);
            }).catch(function () {
              return putFile(cssPath, cssBody, cm + ' [page-css]', null);
            });
          }
          return cssPromise.then(function () {
            return saveBackup(state.path, out, userMsg).then(function () {
              status('保存完了 ✓ デザインCSSも更新');
              clearDraft();
              if ($('meta-use-menu-icon') && $('meta-use-menu-icon').checked) {
                updateMenuIcon(state.path, ($('meta-favicon') && $('meta-favicon').value) || '');
              }
            }).catch(function (be) {
              status('本体は保存済み。バックアップ失敗: ' + be.message);
            });
          });
        });
      });
    }).catch(function (err) {
      status('保存失敗: ' + err.message);
    });
  }

  function applyStyle() {
    if (isSimpleEditor()) { status('メンバーは見た目の変更はできません'); return; }
    var el = state.selected;
    if (!el) { status('先に要素を選択'); return; }
    if (isLocked(el)) { status('ロック要素は変更できません'); return; }
    pushUndoSnapshot('style');
    var styles = {};
    /* 要素自身の背景（body全体背景とは別） */
    if ($('p-bg') && $('p-bg').value) styles.backgroundColor = $('p-bg').value;
    if ($('p-size')) styles.fontSize = $('p-size').value + 'px';
    if ($('p-weight') && $('p-weight').value) styles.fontWeight = $('p-weight').value;
    if ($('p-font-style') && $('p-font-style').value) styles.fontStyle = $('p-font-style').value;
    if ($('p-radius') && $('p-radius').value !== '') styles.borderRadius = $('p-radius').value + 'px';
    if ($('p-pad') && $('p-pad').value !== '') styles.padding = $('p-pad').value + 'px';
    if ($('p-margin') && $('p-margin').value !== '') styles.margin = $('p-margin').value + 'px';
    var bw = $('p-border-w') ? $('p-border-w').value : '';
    var bs = $('p-border-style') ? $('p-border-style').value : '';
    var bc = $('p-border-c') ? $('p-border-c').value : '';
    if (bw !== '' && Number(bw) > 0) {
      styles.borderWidth = bw + 'px';
      styles.borderStyle = bs || 'solid';
      styles.borderColor = bc || '#2b2140';
    } else if (bw === '0') {
      styles.border = 'none';
    }
    recordStyle(el, styles);
    status('スタイルを適用（ページデザインに記録）');
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
    if (!state.user.canEditMeta) { status('権限なし'); return; }
    var d = doc();
    if (!d) return;
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
    status('メタ適用（保存で確定）');
  }

  function updateMenuIcon(pagePath, iconUrl) {
    if (!iconUrl) return;
    var path = 'src/cms/menu-icons.json';
    getFile(path).then(function (f) {
      var map = {};
      try { map = JSON.parse(decode(f.content)); } catch (e) {}
      map[pagePath] = iconUrl;
      return putFile(path, JSON.stringify(map, null, 2), 'CMS: menu icon', f.sha);
    }).catch(function () {
      var map = {}; map[pagePath] = iconUrl;
      return putFile(path, JSON.stringify(map, null, 2), 'CMS: menu-icons', null);
    }).catch(function () {});
  }

  function uploadFavicon(file) {
    if (!file || !state.user.canUpload) return;
    var reader = new FileReader();
    reader.onload = function () {
      var b64 = String(reader.result).split(',')[1];
      if (!b64) return;
      var ext = (file.name.split('.').pop() || 'png').toLowerCase();
      var dir = state.path.indexOf('/') >= 0 ? state.path.replace(/\/[^\/]*$/, '/') : '';
      var fpath = dir + 'favicon-' + Date.now() + '.' + ext;
      fetch(API + '/' + fpath, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ message: 'CMS: favicon', content: b64, branch: 'main' })
      }).then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(friendlyErr(t, r.status)); });
        var url = SITE + fpath;
        if ($('meta-favicon')) $('meta-favicon').value = url;
        var prev = $('favicon-preview');
        if (prev) { prev.src = url; prev.style.display = 'block'; }
        status('ファビコンOK');
      }).catch(function (e) { status(e.message); });
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
    if (!state.user.canUpload) return;
    var name = (($('new-filename') && $('new-filename').value) || '').trim();
    var content = ($('new-content') && $('new-content').value) || '';
    var msgEl = $('new-msg');
    if (!name || /[\/\\]/.test(name) || name.indexOf('..') >= 0) {
      if (msgEl) msgEl.textContent = 'ファイル名不正';
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
      if (msgEl) msgEl.textContent = e.message;
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
            var b64 = String(reader.result).split(',')[1];
            if (!b64) { reject(new Error('読込失敗')); return; }
            var path = userDir() + '/' + file.name.replace(/[\/\\]/g, '_');
            buildCommitMessage('upload ' + file.name).then(function (cm) {
              return fetch(API + '/' + path, {
                method: 'PUT', headers: headers(),
                body: JSON.stringify({ message: cm, content: b64, branch: 'main' })
              });
            }).then(function (r) {
              if (!r.ok) return r.text().then(function (t) { throw new Error(friendlyErr(t, r.status)); });
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
      if (st) st.textContent = '完了';
    }).catch(function (e) {
      if (st) st.textContent = e.message;
    });
  }

  function startDraftTimer() {
    clearInterval(state.draftTimer);
    state.draftTimer = setInterval(function () {
      try {
        if (!state.path || !state.isHtml) return;
        localStorage.setItem('cms_draft_' + state.path, exportHtml());
      } catch (e) {}
    }, 30000);
  }
  function clearDraft() {
    if (state.path) try { localStorage.removeItem('cms_draft_' + state.path); } catch (e) {}
  }

  function boot() {
    loadUsers().then(function () {
      var s = getSession();
      if (s && s.id && USERS[s.id]) {
        var u = USERS[s.id];
        state.user = {
          id: s.id, name: u.name, semi_name: u.semi_name || '',
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
        openDash();
      } else show('view-login');
    }).catch(function (e) {
      var msg = $('login-msg');
      if (msg) msg.textContent = 'users.json 読込失敗: ' + e.message;
      show('view-login');
    });

    if ($('btn-login')) $('btn-login').onclick = login;
    if ($('btn-qr-login')) $('btn-qr-login').onclick = function () { startQrScanner._retried = false; startQrScanner(); };
    if ($('btn-qr-flip')) $('btn-qr-flip').onclick = flipQrCamera;
    if ($('btn-qr-stop')) $('btn-qr-stop').onclick = stopQrScanner;
    if ($('pw')) {
      $('pw').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') login();
      });
    }
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
    if ($('btn-body-bg')) $('btn-body-bg').onclick = applyBodyBackground;
    if ($('body-bg-angle')) {
      $('body-bg-angle').oninput = function () {
        var v = $('body-bg-angle-v');
        if (v) v.textContent = $('body-bg-angle').value;
      };
    }
    if ($('btn-undo')) $('btn-undo').onclick = undoEdit;
    if ($('btn-redo')) $('btn-redo').onclick = redoEdit;
    if ($('btn-duplicate')) $('btn-duplicate').onclick = duplicateSelected;
    if ($('side-text')) {
      $('side-text').addEventListener('input', applySideText);
    }
    if ($('side-as-html')) {
      $('side-as-html').addEventListener('change', function () {
        if (state.selected) fillSideText(state.selected);
      });
    }
    if ($('p-size')) {
      $('p-size').oninput = function () {
        if ($('p-size-v')) $('p-size-v').textContent = $('p-size').value;
      };
    }
    [['p-radius','p-radius-v'],['p-pad','p-pad-v'],['p-margin','p-margin-v']].forEach(function (pair) {
      var a = $(pair[0]), b = $(pair[1]);
      if (a && b) a.oninput = function () { b.textContent = a.value; };
    });
    if ($('btn-make-absolute')) {
      $('btn-make-absolute').onclick = function () {
        if (!state.selected) { status('先に選択'); return; }
        ensureAbsolute(state.selected);
        attachHandles(state.selected);
        scheduleChromeUpdate();
        status('ドラッグ可能にしました（見た目位置は維持）');
      };
    }
    if ($('btn-delete-el')) {
      $('btn-delete-el').onclick = function () {
        if (isSimpleEditor()) { status('メンバーは要素の削除はできません'); return; }
        if (!state.selected) return;
        if (!confirm('削除しますか？')) return;
        pushUndoSnapshot('delete');
        state.selected.remove();
        state.selected = null;
        hideRtToolbar();
        fillSideText(null);
        status('削除しました');
      };
    }

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
          try { runRtCommand('hiliteColor', $('rt-back').value); }
          catch (e1) { runRtCommand('backColor', $('rt-back').value); }
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
    if ($('btn-preview-close')) $('btn-preview-close').onclick = closeFilePreview;
    if ($('modal-preview')) {
      $('modal-preview').addEventListener('click', function (e) {
        if (e.target === $('modal-preview')) closeFilePreview();
      });
    }
    if ($('btn-refresh-myfiles')) $('btn-refresh-myfiles').onclick = loadMyFilesPicker;
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
    
    document.addEventListener('keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      var key = String(e.key).toLowerCase();
      var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); undoEdit(); }
      else if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); redoEdit(); }
    });

    /* バックアップリンク（複数ある場合も全部） */
    document.querySelectorAll('#btn-open-backup, a[href*="asobiseminar_backup"]').forEach(function (el) {
      if (el.tagName === 'A' && el.getAttribute('href')) return; /* 既にhrefあり */
      el.onclick = function () {
        window.open('https://r25347sh.github.io/asobiseminar_backup/', '_blank');
      };
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
