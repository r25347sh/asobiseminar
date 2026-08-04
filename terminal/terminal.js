/**
 * Asobi Lab. Terminal (compact restore) — button always visible
 */
(function () {
  'use strict';
  if (window.__ASOBI_TERMINAL_BOOTED__) return;
  window.__ASOBI_TERMINAL_BOOTED__ = true;

  var BASE = '/asobiseminar';
  var SU_PASSWORD = 'kanrishakengen';
  var THEME_KEY = 'asobi-term-theme';
  var APT_KEY = 'asobi-apt-packages';
  var THEMES = ['default','matrix','ubuntu','macos','powershell','cyber','cmd','dracula','nord','solarized','monokai','light'];
  var isRoot = false, sudoOnce = false, history = [], histIdx = -1, awaitingPassword = false;
  var panel, bodyEl, inputEl, promptEl, badgeEl, toggleBtn, currentTheme = 'default';
  var installedPkgs = {};

  function loadApt() {
    try { installedPkgs = JSON.parse(localStorage.getItem(APT_KEY) || '{}') || {}; } catch (e) { installedPkgs = {}; }
  }
  function saveApt() { try { localStorage.setItem(APT_KEY, JSON.stringify(installedPkgs)); } catch (e) {} }
  function hasElevated() { return isRoot || sudoOnce; }
  function consumeSudo() { if (sudoOnce && !isRoot) { sudoOnce = false; updatePromptUI(); } }
  function promptText() { return hasElevated() ? 'root@asobi#' : 'guest@asobi$'; }
  function updatePromptUI() {
    if (!promptEl || !badgeEl) return;
    var elev = hasElevated();
    promptEl.textContent = promptText();
    promptEl.classList.toggle('is-root', elev);
    badgeEl.textContent = elev ? (isRoot ? 'ROOT' : 'SUDO') : 'guest';
    badgeEl.classList.toggle('is-root', elev);
  }
  function focusInput() {
    if (!inputEl || !panel || !panel.classList.contains('is-open')) return;
    try { inputEl.disabled = false; inputEl.focus({ preventScroll: true }); } catch (e) { try { inputEl.focus(); } catch (e2) {} }
  }
  function appendLine(text, cls) {
    if (!bodyEl) return;
    var p = document.createElement('div');
    p.className = 'asobi-term-line ' + (cls || 'out');
    p.textContent = text;
    bodyEl.appendChild(p);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }
  function clearTerm() { if (bodyEl) bodyEl.innerHTML = ''; }
  function applyTheme(name) {
    currentTheme = THEMES.indexOf(name) >= 0 ? name : 'default';
    try { localStorage.setItem(THEME_KEY, currentTheme); } catch (e) {}
    if (panel) {
      if (currentTheme === 'default') panel.removeAttribute('data-theme');
      else panel.setAttribute('data-theme', currentTheme);
    }
  }
  function loadSavedTheme() {
    try { var s = localStorage.getItem(THEME_KEY); if (s && THEMES.indexOf(s) >= 0) currentTheme = s; } catch (e) {}
  }

  function cmdHelp() {
    appendLine('Asobi Terminal — コマンド', 'info');
    appendLine('  help clear ls pwd whoami echo date history open', 'out');
    appendLine('  su  sudo <cmd>  exit  logout  reload', 'out');
    appendLine('  term.theme [name]  apt list|search|install|remove', 'out');
    appendLine('  chaos.on|off|status  (要 sudo)', 'out');
    appendLine('テーマ: ' + THEMES.join(', '), 'sys');
  }
  function cmdLs() {
    appendLine('index.html  settings.html  sitemap.html  MENU/  css/  js/  subpages/  terminal/', 'out');
  }
  function cmdApt(args) {
    var sub = (args[0] || '').toLowerCase();
    if (sub === 'list') {
      var keys = Object.keys(installedPkgs);
      if (!keys.length) appendLine('(no packages)', 'sys');
      else keys.forEach(function (k) { appendLine('  ' + k, 'out'); });
      return;
    }
    if (sub === 'search') { appendLine('  cmatrix sl hollywood cowsay fortune figlet neofetch htop', 'out'); return; }
    if (sub === 'install') {
      var name = args[1];
      if (!name) { appendLine('用法: apt install <pkg>', 'warn'); return; }
      if (!hasElevated()) { appendLine('permission denied: sudo apt install ' + name, 'err'); return; }
      installedPkgs[name] = 1; saveApt(); appendLine('installed: ' + name, 'ok'); return;
    }
    if (sub === 'remove') {
      if (!hasElevated()) { appendLine('permission denied', 'err'); return; }
      delete installedPkgs[args[1]]; saveApt(); appendLine('removed: ' + args[1], 'ok'); return;
    }
    appendLine('用法: apt list|search|install|remove', 'warn');
  }
  function cmdChaos(action) {
    var ap = window.AsobiPlay;
    if (!ap || typeof ap.toggleChaos !== 'function') { appendLine('AsobiPlay 未読込', 'err'); return; }
    if (action === 'status') { appendLine('chaos: ' + (document.body.classList.contains('asobi-chaos') ? 'ON' : 'OFF'), 'info'); return; }
    if (!hasElevated()) { appendLine('permission denied: sudo chaos.on', 'err'); return; }
    if (action === 'on') { ap.toggleChaos(true); appendLine('混沌モード ON', 'ok'); }
    else if (action === 'off') { ap.toggleChaos(false); appendLine('混沌モード OFF', 'ok'); }
    else appendLine('用法: chaos.on | chaos.off | chaos.status', 'warn');
  }

  function executeSingle(raw) {
    var line = String(raw || '').trim();
    if (!line) return;
    if (awaitingPassword) {
      awaitingPassword = false;
      if (line === SU_PASSWORD) { isRoot = true; updatePromptUI(); appendLine('認証成功。root 権限を取得', 'ok'); }
      else appendLine('認証失敗', 'err');
      return;
    }
    if (/^sudo(\s|$)/i.test(line)) {
      var rest = line.replace(/^sudo\s*/i, '').trim();
      if (!rest) { appendLine('用法: sudo <command>', 'warn'); return; }
      sudoOnce = true; updatePromptUI();
      appendLine('[sudo] このコマンドにのみ権限を付与', 'sys');
      try { executeSingle(rest); } finally { consumeSudo(); }
      return;
    }
    var m = line.match(/^term\.theme(?:\s+(\S+))?$/i);
    if (m) {
      if (!m[1]) { appendLine('現在: ' + currentTheme, 'info'); THEMES.forEach(function (t) { appendLine('  - ' + t + (t === currentTheme ? ' ←' : ''), 'out'); }); }
      else { applyTheme(m[1]); appendLine('テーマ: ' + currentTheme, 'ok'); }
      return;
    }
    var tokens = [], re = /"([^"]*)"|(\S+)/g, mm;
    while ((mm = re.exec(line)) !== null) tokens.push(mm[1] !== undefined ? mm[1] : mm[2]);
    var cmd = (tokens[0] || '').toLowerCase(), args = tokens.slice(1);
    switch (cmd) {
      case 'help': case '?': case 'man': cmdHelp(); break;
      case 'clear': case 'cls': clearTerm(); break;
      case 'ls': case 'dir': cmdLs(); break;
      case 'pwd': appendLine(location.pathname, 'out'); break;
      case 'whoami': appendLine(hasElevated() ? (isRoot ? 'root' : 'guest (sudo)') : 'guest', 'out'); break;
      case 'echo': appendLine(args.join(' '), 'out'); break;
      case 'date': appendLine(new Date().toString(), 'out'); break;
      case 'history': history.forEach(function (h, i) { appendLine(String(i + 1).padStart(3) + '  ' + h, 'out'); }); break;
      case 'open':
        if (!args[0]) { appendLine('用法: open <page>', 'warn'); break; }
        var url = args[0];
        if (!/^https?:/i.test(url)) url = BASE + '/' + url.replace(/^\//, '');
        appendLine('→ ' + url, 'sys'); location.href = url; break;
      case 'su': awaitingPassword = true; appendLine('Password:', 'sys'); break;
      case 'exit':
        if (isRoot) { isRoot = false; updatePromptUI(); appendLine('権限を破棄', 'sys'); }
        else closePanel(); break;
      case 'logout': isRoot = false; sudoOnce = false; updatePromptUI(); appendLine('logout', 'sys'); break;
      case 'reload': appendLine('reloading…', 'sys'); setTimeout(function () { location.reload(); }, 200); break;
      case 'apt': case 'apt-get': cmdApt(args); break;
      case 'chaos.on': cmdChaos('on'); break;
      case 'chaos.off': cmdChaos('off'); break;
      case 'chaos.status': case 'chaos': cmdChaos(args[0] || 'status'); break;
      default:
        appendLine('command not found: ' + cmd, 'err');
        appendLine('help で一覧', 'sys');
    }
  }
  function executeLine(raw) {
    String(raw || '').split(/\s*&&\s*/).forEach(function (p) {
      try { executeSingle(p); } catch (err) { appendLine('実行エラー: ' + (err && err.message ? err.message : String(err)), 'err'); }
    });
    setTimeout(focusInput, 0);
  }

  function openPanel() {
    if (!panel) return;
    panel.classList.add('is-open');
    if (toggleBtn) toggleBtn.classList.add('is-active');
    setTimeout(focusInput, 30);
  }
  function closePanel() {
    if (!panel) return;
    panel.classList.remove('is-open');
    if (toggleBtn) toggleBtn.classList.remove('is-active');
  }
  function togglePanel() {
    if (panel && panel.classList.contains('is-open')) closePanel(); else openPanel();
  }

  function buildUI() {
    if (document.querySelector('.asobi-term-toggle')) return;
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'asobi-term-toggle';
    toggleBtn.title = 'Asobi Terminal';
    toggleBtn.setAttribute('aria-label', 'Open terminal');
    toggleBtn.textContent = '>_';
    toggleBtn.style.cssText = 'position:fixed;bottom:18px;left:18px;z-index:2147483000;width:52px;height:52px;border-radius:14px;border:2px solid #00ff88;background:#0b0f0c;color:#00ff88;cursor:pointer;display:flex;align-items:center;justify-content:center;font:700 1.25rem ui-monospace,monospace;opacity:1;visibility:visible;pointer-events:auto;box-shadow:0 4px 24px rgba(0,255,136,.35)';
    toggleBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(); });
    document.body.appendChild(toggleBtn);

    panel = document.createElement('div');
    panel.className = 'asobi-term-panel';
    panel.innerHTML =
      '<div class="asobi-term-header"><span class="asobi-term-title">Asobi Terminal</span>' +
      '<span class="asobi-term-badge">guest</span><div class="asobi-term-header-actions">' +
      '<button type="button" data-act="clear" title="clear">⌫</button>' +
      '<button type="button" data-act="close" title="close">✕</button></div></div>' +
      '<div class="asobi-term-body"></div><div class="asobi-term-input-row">' +
      '<span class="asobi-term-prompt">guest@asobi$</span>' +
      '<input class="asobi-term-input" spellcheck="false" autocomplete="off" autocapitalize="off" /></div>';
    document.body.appendChild(panel);
    bodyEl = panel.querySelector('.asobi-term-body');
    inputEl = panel.querySelector('.asobi-term-input');
    promptEl = panel.querySelector('.asobi-term-prompt');
    badgeEl = panel.querySelector('.asobi-term-badge');
    applyTheme(currentTheme);

    panel.querySelector('[data-act="close"]').addEventListener('click', function (e) { e.stopPropagation(); closePanel(); });
    panel.querySelector('[data-act="clear"]').addEventListener('click', function (e) { e.stopPropagation(); clearTerm(); focusInput(); });

    inputEl.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        var val = inputEl.value;
        try {
          var shown = awaitingPassword ? '********' : val;
          appendLine(promptText() + ' ' + shown, 'cmd');
          if (!awaitingPassword && val.trim()) {
            history.push(val);
            if (history.length > 100) history.shift();
          }
          histIdx = history.length;
          inputEl.value = '';
          executeLine(val);
          updatePromptUI();
        } catch (err) {
          appendLine('内部エラー: ' + (err && err.message ? err.message : String(err)), 'err');
        } finally {
          setTimeout(focusInput, 0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!history.length) return;
        histIdx = Math.max(0, histIdx - 1);
        inputEl.value = history[histIdx] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        histIdx = Math.min(history.length, histIdx + 1);
        inputEl.value = histIdx >= history.length ? '' : (history[histIdx] || '');
      } else if (e.key === 'Escape') closePanel();
      else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); clearTerm(); }
    });

    panel.addEventListener('mousedown', function (e) {
      if (e.target === inputEl) return;
      if (e.target.closest && e.target.closest('button,a,input,textarea,select')) return;
      e.preventDefault(); focusInput();
    });

    appendLine('Asobi Lab. Terminal', 'sys');
    appendLine('sudo は1コマンドのみ。help / term.theme / apt', 'sys');
  }

  function boot() {
    loadApt(); loadSavedTheme();
    try { buildUI(); } catch (e) { console.error('AsobiTerminal buildUI', e); }
    try { updatePromptUI(); } catch (e) {}
    window.AsobiTerminal = {
      open: openPanel, close: closePanel, toggle: togglePanel, exec: executeLine,
      setTheme: applyTheme, getTheme: function () { return currentTheme; }, themes: THEMES.slice()
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
