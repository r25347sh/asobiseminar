/*! Asobi CMS login */
(function () {
  var C = window.ASOBI_CMS;
  var S = window.ASOBI_SESSION;
  var API = window.ASOBI_API;
  var $ = function (id) { return document.getElementById(id); };

  function msg(t, isErr) {
    var el = $('login-msg');
    if (!el) return;
    el.textContent = t || '';
    el.className = 'msg' + (isErr ? ' err' : (t ? ' ok' : ''));
  }

  function nextUrl() {
    try {
      var q = new URLSearchParams(location.search).get('next');
      if (q && /^[a-zA-Z0-9._\-/?=&]+$/.test(q) && q.indexOf('login') < 0) return q;
    } catch (e) {}
    return C.PAGES.select;
  }

  function goApp(user) {
    S.set(user);
    location.href = nextUrl();
  }

  function verify(id, pw, users) {
    id = String(id || '').trim();
    pw = String(pw || '');
    if (!id || !pw) return Promise.reject(new Error('IDとパスワードを入力してください'));
    var u = users[id];
    if (!u) return Promise.reject(new Error('ユーザーが見つかりません'));
    if (!window.AsobiAuth || !window.AsobiAuth.verify) {
      return Promise.reject(new Error('認証モジュールの読込に失敗しました'));
    }
    var ok = window.AsobiAuth.verify(id, pw, u.pass_hash);
    if (!ok) return Promise.reject(new Error('パスワードが違います'));
    return Promise.resolve({
      id: id,
      name: u.name || id,
      class: u.class || '',
      group: u.group || '',
      semi_name: u.semi_name || '',
      role: u.role || 'member',
      isAdmin: !!u.isAdmin,
      fullAccess: !!u.fullAccess,
      permissions: (u.permissions || []).slice(),
      canUpload: u.canUpload !== false,
      canDelete: !!u.canDelete
    });
  }

  function doLogin(id, pw) {
    msg('確認中…');
    return API.loadUsers()
      .then(function (users) { return verify(id, pw, users); })
      .then(function (user) {
        msg('ようこそ、' + user.name + ' さん');
        setTimeout(function () { goApp(user); }, 350);
      })
      .catch(function (e) {
        msg(e.message || String(e), true);
      });
  }

  function stopQr() {
    var panel = $('qr-panel');
    if (panel) panel.classList.add('hidden');
  }

  function startQr() {
    var panel = $('qr-panel');
    if (panel) panel.classList.remove('hidden');
    msg('QRカメラはブラウザ権限が必要です。未対応環境ではID/パスワードでログインしてください。');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var existing = S.get();
    if (existing && existing.id) {
      location.replace(nextUrl());
      return;
    }
    var form = $('login-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        doLogin($('uid').value, $('pw').value);
      });
    }
    if ($('btn-qr-login')) $('btn-qr-login').onclick = startQr;
    if ($('btn-qr-stop')) $('btn-qr-stop').onclick = stopQr;
    if ($('btn-qr-flip')) $('btn-qr-flip').onclick = function () { msg('カメラ切替はこの環境では手動でブラウザ設定から行ってください'); };
  });
})();
