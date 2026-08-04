/**
 * Asobi Lab. 限定公開ゲート
 * username: gentei / password: hiroike2026
 *
 * - 「次回から自動でログインする」ON → localStorage に保存し次回以降スキップ
 * - OFF → このタブ／セッション中のみ有効（sessionStorage）
 */
(function () {
  'use strict';

  if (window.__ASOBI_PR_BOOTED__) return;
  window.__ASOBI_PR_BOOTED__ = true;

  const USER = 'gentei';
  const PASS = 'hiroike2026';

  const KEY_AUTH = 'asobi-pr-auth';
  const KEY_REMEMBER = 'asobi-pr-remember';
  const KEY_SESSION = 'asobi-pr-session';

  function isAuthenticated() {
    try {
      if (sessionStorage.getItem(KEY_SESSION) === '1') return true;
      if (localStorage.getItem(KEY_REMEMBER) === '1' && localStorage.getItem(KEY_AUTH) === '1') {
        return true;
      }
    } catch (e) { /* private mode 等 */ }
    return false;
  }

  function markAuthenticated(remember) {
    try {
      sessionStorage.setItem(KEY_SESSION, '1');
      if (remember) {
        localStorage.setItem(KEY_AUTH, '1');
        localStorage.setItem(KEY_REMEMBER, '1');
      } else {
        // 自動ログインしない場合は永続フラグを残さない
        localStorage.removeItem(KEY_AUTH);
        localStorage.removeItem(KEY_REMEMBER);
      }
    } catch (e) { /* ignore */ }
  }

  function unlock() {
    document.documentElement.classList.remove('asobi-pr-locked');
    const overlay = document.querySelector('.asobi-pr-overlay');
    if (overlay) overlay.remove();
  }

  function lockBodyEarly() {
    document.documentElement.classList.add('asobi-pr-locked');
  }

  function showGate() {
    lockBodyEarly();

    if (document.querySelector('.asobi-pr-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'asobi-pr-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '限定公開認証');

    overlay.innerHTML =
      '<div class="asobi-pr-card">' +
      '  <div class="asobi-pr-brand">Asobi Lab.</div>' +
      '  <h1 class="asobi-pr-title">限定公開</h1>' +
      '  <p class="asobi-pr-sub">このサイトは関係者向けに限定公開しています。<br>ユーザー名とパスワードを入力してください。</p>' +
      '  <form class="asobi-pr-form" novalidate>' +
      '    <div class="asobi-pr-field">' +
      '      <label for="asobi-pr-user">ユーザー名</label>' +
      '      <input id="asobi-pr-user" name="username" type="text" autocomplete="username" required />' +
      '    </div>' +
      '    <div class="asobi-pr-field">' +
      '      <label for="asobi-pr-pass">パスワード</label>' +
      '      <input id="asobi-pr-pass" name="password" type="password" autocomplete="current-password" required />' +
      '    </div>' +
      '    <label class="asobi-pr-remember">' +
      '      <input type="checkbox" id="asobi-pr-remember" />' +
      '      <span>次回から自動でログインする</span>' +
      '    </label>' +
      '    <p class="asobi-pr-error" id="asobi-pr-error" aria-live="polite"></p>' +
      '    <button type="submit" class="asobi-pr-submit">ログイン</button>' +
      '  </form>' +
      '  <p class="asobi-pr-foot">Unauthorized access is prohibited.</p>' +
      '</div>';

    const mount = function () {
      if (!document.body) {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
        return;
      }
      document.body.appendChild(overlay);

      const form = overlay.querySelector('.asobi-pr-form');
      const userInput = overlay.querySelector('#asobi-pr-user');
      const passInput = overlay.querySelector('#asobi-pr-pass');
      const rememberInput = overlay.querySelector('#asobi-pr-remember');
      const errorEl = overlay.querySelector('#asobi-pr-error');
      const submitBtn = overlay.querySelector('.asobi-pr-submit');

      setTimeout(function () { userInput && userInput.focus(); }, 50);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const u = (userInput.value || '').trim();
        const p = passInput.value || '';
        const remember = !!(rememberInput && rememberInput.checked);

        if (u === USER && p === PASS) {
          errorEl.textContent = '';
          submitBtn.disabled = true;
          submitBtn.textContent = 'ログイン中…';
          markAuthenticated(remember);
          unlock();
        } else {
          errorEl.textContent = 'ユーザー名またはパスワードが正しくありません';
          passInput.value = '';
          passInput.focus();
        }
      });

      overlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') e.preventDefault();
      });
    };

    mount();
  }

  window.AsobiPR = {
    logout: function () {
      try {
        localStorage.removeItem(KEY_AUTH);
        localStorage.removeItem(KEY_REMEMBER);
        sessionStorage.removeItem(KEY_SESSION);
      } catch (e) { /* ignore */ }
      location.reload();
    },
    isAuthenticated: isAuthenticated
  };

  if (isAuthenticated()) {
    document.documentElement.classList.remove('asobi-pr-locked');
    return;
  }

  lockBodyEarly();
  showGate();
})();
