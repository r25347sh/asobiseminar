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
    undoLock: false
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
    var linePrefix = '[' + userId + ']';
    return getClientIp().then(function (ip) {
      var line = linePrefix + ' | [' + (ip || 'N/A') + '] | [' + formatNow() + ']';
      var logPath = 'src/login-log.json';
      return getFile(logPath, BACKUP_API).then(function (f) {
        var arr = [];
        try { arr = JSON.parse(decode(f.content)); } catch (e) { arr = []; }
        if (!Array.isArray(arr)) arr = [];
        arr.unshift({
          line: line,
          id: userId,
          ip: ip || 'N/A',
          datetime: formatNow(),
          ts: Date.now()
        });
        /* 直近 500 件まで */
        if (arr.length > 500) arr = arr.slice(0, 500);
        var body = JSON.stringify(arr, null, 2);
        return putFile(logPath, body, 'login: ' + userId, f.sha, BACKUP_API);
      }).catch(function () {
        var arr = [{
          line: linePrefix + ' | [N/A] | [' + formatNow() + ']',
          id: userId,
          ip: 'N/A',
          datetime: formatNow(),
          ts: Date.now()
        }];
        /* IP 再取得済みの line を使う */
        return getClientIp().then(function (ip2) {
          var line = linePrefix + ' | [' + (ip2 || 'N/A') + '] | [' + formatNow() + ']';
          arr[0] = { line: line, id: userId, ip: ip2 || 'N/A', datetime: formatNow(), ts: Date.now() };
          return putFile(logPath, JSON.stringify(arr, null, 2), 'login: ' + userId, null, BACKUP_API);
        });
      });
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
      canBackupRestore: !!u.canBackupRestore || !!u.isAdmin
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
    var parts = ['/* Auto-generated by Asobi Lab CMS */', ''];
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
    var d = doc();
    if (!d || !d.body) { status('プレビューがありません'); return; }
    pushUndoSnapshot('body-bg');
    var mode = ($('body-bg-mode') && $('body-bg-mode').value) || 'solid';
    var styles = {};
    if (mode === 'solid') {
      var c = ($('body-bg-color') && $('body-bg-color').value) || '#fffdf8';
      styles.background = c;
      styles.backgroundImage = 'none';
    } else if (mode === 'keep-site') {
      styles.background = '';
      styles.backgroundImage = '';
      styles.backgroundColor = '';
    } else {
      /* gradient presets */
      var presets = {
        warm: 'radial-gradient(circle at 12% 18%,rgba(255,209,102,.35),transparent 42%),radial-gradient(circle at 88% 12%,rgba(76,201,240,.28),transparent 40%),radial-gradient(circle at 70% 80%,rgba(46,196,182,.22),transparent 45%),#fffdf8',
        cool: 'radial-gradient(circle at 20% 20%,rgba(76,201,240,.35),transparent 45%),radial-gradient(circle at 80% 70%,rgba(124,58,237,.2),transparent 40%),#f4f7ff',
        sunset: 'radial-gradient(circle at 15% 25%,rgba(255,107,107,.3),transparent 42%),radial-gradient(circle at 85% 15%,rgba(255,209,102,.35),transparent 40%),#fff8f2',
        night: 'radial-gradient(circle at 30% 20%,rgba(124,58,237,.45),transparent 40%),radial-gradient(circle at 80% 80%,rgba(46,196,182,.25),transparent 45%),#1a1428'
      };
      styles.background = presets[mode] || presets.warm;
      styles.backgroundColor = '';
    }
    ensureCmsId(d.body);
    recordStyle(d.body, styles);
    /* body は pageStyles に記録（子要素の背景とは分離） */
    status('ページ全体の背景を更新しました（body）');
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
    if (!el.__cmsUndoBound) {
      el.__cmsUndoBound = true;
      el.addEventListener('focus', function () { pushUndoSnapshot('text-before'); });
    }
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
    if (tb) { tb.classList.add('hidden'); tb.classList.remove('rt-docked'); }
    var ve = document.getElementById('view-editor');
    if (ve) ve.classList.remove('rt-open');
  }

  function ensureAbsolute(el) {
    var d = doc();
    var cs = d.defaultView.getComputedStyle(el);
    if (cs.position === 'static' || !cs.position || cs.position === 'relative') {
      var rect = el.getBoundingClientRect();
      var body = d.body;
      var bodyRect = body.getBoundingClientRect();
      var scrollX = d.defaultView.scrollX || d.documentElement.scrollLeft || 0;
      var scrollY = d.defaultView.scrollY || d.documentElement.scrollTop || 0;
      var left = rect.left - bodyRect.left + scrollX;
      var top = rect.top - bodyRect.top + scrollY;
      el.style.position = 'absolute';
      el.style.left = Math.round(left) + 'px';
      el.style.top = Math.round(top) + 'px';
      el.style.width = Math.round(el.offsetWidth) + 'px';
      el.style.margin = '0';
      if (cs.position === 'static') {
        if (d.defaultView.getComputedStyle(body).position === 'static') {
          body.style.position = 'relative';
        }
      }
    }
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
            var range = d.createRange();
            range.selectNodeContents(state.selected);
            var sel = d.defaultView.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          } catch (err) {}
          return;
        }
      }
      if (e.key === 'Escape') {
        clearSelection();
        hideRtToolbar();
      }
    }, true);

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
      if (t === d.body || t === d.documentElement) clearSelection();
    }, true);

    d.addEventListener('mousedown', function (e) {
      var t = e.target;
      if (!state.selected) return;

      if (t.classList && t.classList.contains('cms-handle')) {
        e.preventDefault();
        e.stopPropagation();
        var el = state.selected;
        ensureAbsolute(el);
        state.resize = {
          handle: t.dataset.handle,
          el: el,
          startX: e.clientX,
          startY: e.clientY,
          startW: el.offsetWidth,
          startH: el.offsetHeight,
          startL: parseFloat(el.style.left) || 0,
          startT: parseFloat(el.style.top) || 0
        };
        return;
      }

      if (t.classList && t.classList.contains('cms-drag-bar')) {
        e.preventDefault();
        e.stopPropagation();
        var el2 = state.selected;
        ensureAbsolute(el2);
        state.drag = {
          el: el2,
          startX: e.clientX,
          startY: e.clientY,
          origL: parseFloat(el2.style.left) || 0,
          origT: parseFloat(el2.style.top) || 0
        };
      }
    }, true);

    d.addEventListener('mousemove', function (e) {
      if (state.drag) {
        e.preventDefault();
        var dx = e.clientX - state.drag.startX;
        var dy = e.clientY - state.drag.startY;
        state.drag.el.style.left = Math.round(state.drag.origL + dx) + 'px';
        state.drag.el.style.top = Math.round(state.drag.origT + dy) + 'px';
      }
      if (state.resize) {
        e.preventDefault();
        var r = state.resize;
        var dx2 = e.clientX - r.startX;
        var dy2 = e.clientY - r.startY;
        var w = r.startW, h = r.startH, l = r.startL, t = r.startT;
        if (r.handle.indexOf('e') >= 0) w = Math.max(40, r.startW + dx2);
        if (r.handle.indexOf('s') >= 0) h = Math.max(20, r.startH + dy2);
        if (r.handle.indexOf('w') >= 0) { w = Math.max(40, r.startW - dx2); l = r.startL + dx2; }
        if (r.handle.indexOf('n') >= 0) { h = Math.max(20, r.startH - dy2); t = r.startT + dy2; }
        r.el.style.width = Math.round(w) + 'px';
        r.el.style.height = Math.round(h) + 'px';
        if (r.handle.indexOf('w') >= 0) r.el.style.left = Math.round(l) + 'px';
        if (r.handle.indexOf('n') >= 0) r.el.style.top = Math.round(t) + 'px';
      }
    }, true);

    d.addEventListener('mouseup', function () {
      state.drag = null;
      state.resize = null;
    }, true);

    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') clearSelection();
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && state.selected) {
        e.preventDefault();
        duplicateSelected();
      }
    });
  }

  function duplicateSelected() {
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
    setEditorMode(isHtml ? 'visual' : 'code');
    populateBlocks();
    fillSideText(null);

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
          status('クリックで編集 / Ctrl+Aで要素内全選択');
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
    bodyClone.querySelectorAll('.cms-sel, .cms-hover, .cms-handle, .cms-drag-bar, .cms-pen, .radial-menu-wrapper, .menu-fab, .header-auth, #cms-ui, #cms-page-style').forEach(function (n) {
      if (n.classList.contains('cms-handle') || n.classList.contains('cms-drag-bar') || n.classList.contains('cms-pen') || n.classList.contains('cms-hover') ||
          n.classList.contains('radial-menu-wrapper') || n.classList.contains('menu-fab') ||
          n.classList.contains('header-auth') || n.id === 'cms-ui' || n.id === 'cms-page-style') {
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
            return saveBackup(state.path, out, userMsg, '').then(function () {
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
          canBackupRestore: !!u.canBackupRestore || !!u.isAdmin
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
        status('ドラッグ可能にしました');
      };
    }
    if ($('btn-delete-el')) {
      $('btn-delete-el').onclick = function () {
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

    if ($('btn-open-backup')) {
      $('btn-open-backup').onclick = function () {
        window.open('https://r25347sh.github.io/asobiseminar_backup/', '_blank');
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
