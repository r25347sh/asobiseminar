/**
 * Asobi Lab. Terminal + Local Console
 * 単独読み込み: terminal.css + terminal.js
 * load-css.js からも自動注入される
 */
(function () {
  'use strict';

  if (window.__ASOBI_TERMINAL_BOOTED__) return;
  window.__ASOBI_TERMINAL_BOOTED__ = true;

  const BASE = '/asobiseminar';
  const SU_PASSWORD = 'kanrishakengen';
  const SUDO_MS = 5 * 60 * 1000;

  // リポジトリ階層（静的サイト用スナップショット）
  const FS_TREE = {
    '404.html': 'file',
    'favicon.svg': 'file',
    'index.html': 'file',
    'index2.html': 'file',
    'memo.md': 'file',
    'samplecss.css': 'file',
    'settings.html': 'file',
    'sitemap.html': 'file',
    'themecolor.json': 'file',
    'variable.css': 'file',
    'テーマのメモ.txt': 'file',
    MENU: {
      'MENU.css': 'file',
      'MENU.js': 'file'
    },
    css: {
      '404.css': 'file',
      'aboutsite.css': 'file',
      'asobi-play.css': 'file',
      'groupsIndex.css': 'file',
      'index-main.css': 'file',
      'members.css': 'file',
      'one.css': 'file',
      'playground.css': 'file',
      'programmer.css': 'file',
      'settings.css': 'file',
      'style.css': 'file',
      'three.css': 'file',
      'title.css': 'file',
      'two.css': 'file'
    },
    gaibu: {
      'unpkg.css': 'file'
    },
    js: {
      '404.js': 'file',
      'asobi-play.js': 'file',
      'autovalue.js': 'file',
      'load-css.js': 'file',
      'playground.js': 'file',
      'setThemeColor.js': 'file'
    },
    json: {
      'autovalue.json': 'file'
    },
    subpages: {
      'aboutsite.html': 'file',
      'gallery.html': 'file',
      'members.html': 'file',
      'playground.html': 'file',
      groups: {
        'englishgame.html': 'file',
        'index.html': 'file',
        'one.html': 'file',
        'programmer.html': 'file',
        'three.html': 'file',
        'two.html': 'file'
      }
    },
    terminal: {
      'terminal.css': 'file',
      'terminal.js': 'file'
    }
  };

  const PAGE_MAP = {
    home: BASE + '/index.html',
    index: BASE + '/index.html',
    playground: BASE + '/subpages/playground.html',
    members: BASE + '/subpages/members.html',
    groups: BASE + '/subpages/groups/index.html',
    about: BASE + '/subpages/aboutsite.html',
    aboutsite: BASE + '/subpages/aboutsite.html',
    settings: BASE + '/settings.html',
    gallery: BASE + '/subpages/gallery.html',
    one: BASE + '/subpages/groups/one.html',
    two: BASE + '/subpages/groups/two.html',
    three: BASE + '/subpages/groups/three.html',
    programmer: BASE + '/subpages/groups/programmer.html',
    englishgame: BASE + '/subpages/groups/englishgame.html',
    sitemap: BASE + '/sitemap.html'
  };

  let isRoot = false;
  let sudoUntil = 0;
  let history = [];
  let histIdx = -1;
  let awaitingPassword = false;
  let panel, bodyEl, inputEl, promptEl, badgeEl, toggleBtn;
  let consolePanel, consoleBody, consoleInput;
  let consoleHooked = false;
  const origConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };

  function hasElevated() {
    return isRoot || Date.now() < sudoUntil;
  }

  function promptText() {
    return hasElevated() ? 'root@asobi#' : 'guest@asobi$';
  }

  function updatePromptUI() {
    if (!promptEl || !badgeEl) return;
    const elev = hasElevated();
    promptEl.textContent = promptText();
    promptEl.classList.toggle('is-root', elev);
    badgeEl.textContent = elev ? (isRoot ? 'ROOT' : 'SUDO') : 'guest';
    badgeEl.classList.toggle('is-root', elev);
  }

  function appendLine(text, cls) {
    if (!bodyEl) return;
    const p = document.createElement('div');
    p.className = 'asobi-term-line ' + (cls || 'out');
    p.textContent = text;
    bodyEl.appendChild(p);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function appendHTML(html, cls) {
    if (!bodyEl) return;
    const p = document.createElement('div');
    p.className = 'asobi-term-line ' + (cls || 'out');
    p.innerHTML = html;
    bodyEl.appendChild(p);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function clearTerm() {
    if (bodyEl) bodyEl.innerHTML = '';
  }

  function formatTree(node, prefix, name) {
    const lines = [];
    if (name) {
      lines.push(prefix + name + (typeof node === 'object' ? '/' : ''));
    }
    if (typeof node !== 'object' || node === null) return lines;
    const keys = Object.keys(node).sort((a, b) => {
      const aDir = typeof node[a] === 'object';
      const bDir = typeof node[b] === 'object';
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.localeCompare(b, 'ja');
    });
    keys.forEach((k, i) => {
      const last = i === keys.length - 1;
      const branch = last ? '└── ' : '├── ';
      const nextPrefix = prefix + (last ? '    ' : '│   ');
      const child = node[k];
      if (typeof child === 'object') {
        lines.push(prefix + branch + k + '/');
        lines.push(...formatTree(child, nextPrefix, null).map(l => l));
        // formatTree with name null only returns children with prefix
      } else {
        lines.push(prefix + branch + k);
      }
    });
    return lines;
  }

  function buildTreeLines(node, prefix) {
    const lines = [];
    const keys = Object.keys(node).sort((a, b) => {
      const aDir = typeof node[a] === 'object';
      const bDir = typeof node[b] === 'object';
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.localeCompare(b, 'ja');
    });
    keys.forEach((k, i) => {
      const last = i === keys.length - 1;
      const branch = last ? '└── ' : '├── ';
      const next = prefix + (last ? '    ' : '│   ');
      if (typeof node[k] === 'object') {
        lines.push(prefix + branch + k + '/');
        lines.push(...buildTreeLines(node[k], next));
      } else {
        lines.push(prefix + branch + k);
      }
    });
    return lines;
  }

  function cmdHelp() {
    appendLine('Asobi Lab. Terminal — コマンド一覧', 'info');
    appendLine('  help                 このヘルプ', 'out');
    appendLine('  clear                画面クリア', 'out');
    appendLine('  ls                   リポジトリ階層を表示', 'out');
    appendLine('  pwd                  現在パス', 'out');
    appendLine('  whoami               現在のユーザー', 'out');
    appendLine('  history              入力履歴', 'out');
    appendLine('  echo <text>          テキスト表示', 'out');
    appendLine('  open <page|url>      ページを開く', 'out');
    appendLine('  su                   root に切替（パスワード要求）', 'out');
    appendLine('  sudo <cmd>           一時的に権限付与して実行', 'out');
    appendLine('  exit / logout        権限を捨てる / 端末を閉じる', 'out');
    appendLine('  chaos.off|on|status  混沌モード操作', 'out');
    appendLine('  score                遊びスコア表示', 'out');
    appendLine('  theme.list|set       テーマ操作', 'out');
    appendLine('  console.open|close   ローカルコンソール', 'out');
    appendLine('  〇〇.△△              オブジェクトに属性を付与して実行', 'out');
    appendLine('  cmd1 && cmd2         複数コマンド連続実行', 'out');
    appendLine('', 'out');
    appendLine('例: sudo console.open', 'sys');
    appendLine('例: open playground && ls', 'sys');
    appendLine('例: su  →  パスワード: kanrishakengen', 'sys');
  }

  function cmdLs() {
    appendLine(BASE + '/', 'info');
    buildTreeLines(FS_TREE, '').forEach(l => appendLine(l, 'out'));
  }

  function cmdOpen(target) {
    if (!target) {
      appendLine('用法: open <page|url>', 'warn');
      appendLine('page: ' + Object.keys(PAGE_MAP).join(', '), 'sys');
      return;
    }
    const key = target.toLowerCase().replace(/^\/+/, '');
    let url = PAGE_MAP[key];
    if (!url) {
      if (/^https?:\/\//i.test(target)) {
        url = target;
      } else if (target.startsWith('/')) {
        url = target;
      } else if (target.includes('.html') || target.includes('/')) {
        url = BASE + '/' + target.replace(/^\/+/, '');
      }
    }
    if (!url) {
      appendLine('見つかりません: ' + target, 'err');
      return;
    }
    appendLine('open → ' + url, 'ok');
    setTimeout(() => { location.href = url; }, 280);
  }

  function cmdChaos(action) {
    const ap = window.AsobiPlay;
    if (!ap || typeof ap.toggleChaos !== 'function') {
      appendLine('AsobiPlay が未読込です', 'err');
      return;
    }
    if (action === 'on') {
      ap.toggleChaos(true);
      appendLine('混沌モード ON', 'ok');
    } else if (action === 'off') {
      ap.toggleChaos(false);
      appendLine('混沌モード OFF', 'ok');
    } else if (action === 'status' || !action) {
      const on = document.body.classList.contains('asobi-chaos');
      appendLine('chaos: ' + (on ? 'ON' : 'OFF'), 'info');
    } else {
      appendLine('用法: chaos.on | chaos.off | chaos.status', 'warn');
    }
  }

  function cmdScore() {
    const ap = window.AsobiPlay;
    if (ap && typeof ap.getScore === 'function') {
      appendLine('遊びスコア: ' + ap.getScore() + ' pt', 'ok');
    } else {
      const s = localStorage.getItem('asobi-play-score') || '0';
      appendLine('遊びスコア: ' + s + ' pt', 'ok');
    }
  }

  async function cmdTheme(action, name) {
    if (action === 'list' || !action) {
      try {
        const res = await fetch(BASE + '/themecolor.json');
        const data = await res.json();
        const themes = data.themes || data;
        appendLine('利用可能なテーマ:', 'info');
        (Array.isArray(themes) ? themes : []).forEach(t => {
          appendLine('  - ' + (t.name || t), 'out');
        });
      } catch (e) {
        appendLine('テーマ一覧の取得に失敗: ' + e.message, 'err');
      }
      return;
    }
    if (action === 'set') {
      if (!name) {
        appendLine('用法: theme.set <name>', 'warn');
        return;
      }
      localStorage.setItem('selectedTheme', name);
      appendLine('テーマを設定: ' + name + '（再読込します）', 'ok');
      setTimeout(() => location.reload(), 400);
      return;
    }
    appendLine('用法: theme.list | theme.set <name>', 'warn');
  }

  function openLocalConsole() {
    ensureConsoleUI();
    consolePanel.classList.add('is-open');
    hookConsole();
    appendLine('ローカルコンソールを開きました', 'ok');
    if (consoleInput) setTimeout(() => consoleInput.focus(), 50);
  }

  function closeLocalConsole() {
    if (consolePanel) consolePanel.classList.remove('is-open');
    appendLine('ローカルコンソールを閉じました', 'sys');
  }

  function stringifyArg(a) {
    if (typeof a === 'string') return a;
    try {
      return JSON.stringify(a, null, 0);
    } catch (e) {
      return String(a);
    }
  }

  function pushConsoleEntry(level, args) {
    if (!consoleBody) return;
    const el = document.createElement('div');
    el.className = 'asobi-console-entry ' + level;
    const time = document.createElement('span');
    time.className = 'asobi-console-time';
    const d = new Date();
    time.textContent = d.toLocaleTimeString('ja-JP', { hour12: false }) +
      '.' + String(d.getMilliseconds()).padStart(3, '0');
    el.appendChild(time);
    el.appendChild(document.createTextNode(args.map(stringifyArg).join(' ')));
    consoleBody.appendChild(el);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  function hookConsole() {
    if (consoleHooked) return;
    consoleHooked = true;
    ['log', 'info', 'warn', 'error'].forEach(level => {
      console[level] = function (...args) {
        origConsole[level](...args);
        try { pushConsoleEntry(level, args); } catch (e) { /* ignore */ }
      };
    });
    window.addEventListener('error', (ev) => {
      pushConsoleEntry('error', [
        (ev.message || 'Error') +
        (ev.filename ? ' @ ' + ev.filename + ':' + ev.lineno : '')
      ]);
    });
    window.addEventListener('unhandledrejection', (ev) => {
      const r = ev.reason;
      pushConsoleEntry('error', ['UnhandledRejection: ' + (r && r.message ? r.message : String(r))]);
    });
    pushConsoleEntry('info', ['Local console attached. Errors / warn / log を捕捉します。']);
  }

  function runConsoleEval(code) {
    if (!code.trim()) return;
    pushConsoleEntry('log', ['› ' + code]);
    try {
      // eslint-disable-next-line no-eval
      const result = (0, eval)(code);
      if (result !== undefined) pushConsoleEntry('info', [stringifyArg(result)]);
    } catch (e) {
      pushConsoleEntry('error', [e && e.stack ? e.stack : String(e)]);
    }
  }

  function ensureConsoleUI() {
    if (consolePanel) return;
    consolePanel = document.createElement('div');
    consolePanel.className = 'asobi-console-panel';
    consolePanel.innerHTML =
      '<div class="asobi-console-header">' +
      '<span>Local Console</span>' +
      '<div style="display:flex;gap:6px">' +
      '<button type="button" data-act="clear">clear</button>' +
      '<button type="button" data-act="close">✕</button>' +
      '</div></div>' +
      '<div class="asobi-console-body"></div>' +
      '<div class="asobi-console-input-row">' +
      '<input class="asobi-console-input" placeholder="eval / 式を入力" spellcheck="false" autocomplete="off" />' +
      '<button type="button" class="asobi-console-run">Run</button>' +
      '</div>';
    document.body.appendChild(consolePanel);
    consoleBody = consolePanel.querySelector('.asobi-console-body');
    consoleInput = consolePanel.querySelector('.asobi-console-input');
    consolePanel.querySelector('[data-act="close"]').addEventListener('click', closeLocalConsole);
    consolePanel.querySelector('[data-act="clear"]').addEventListener('click', () => {
      if (consoleBody) consoleBody.innerHTML = '';
    });
    const runBtn = consolePanel.querySelector('.asobi-console-run');
    runBtn.addEventListener('click', () => {
      runConsoleEval(consoleInput.value);
      consoleInput.value = '';
    });
    consoleInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        runConsoleEval(consoleInput.value);
        consoleInput.value = '';
      }
      if (e.key === 'Escape') closeLocalConsole();
    });
  }

  // 属性記法: object.method / object.method arg
  function resolveDotted(parts, args) {
    const obj = parts[0];
    const method = parts[1];
    const rest = parts.slice(2).concat(args);

    if (obj === 'console') {
      if (method === 'open') {
        if (!hasElevated()) {
          appendLine('permission denied: console.open には sudo または root が必要です', 'err');
          appendLine('例: sudo console.open', 'sys');
          return true;
        }
        openLocalConsole();
        return true;
      }
      if (method === 'close') {
        closeLocalConsole();
        return true;
      }
      if (method === 'clear') {
        if (consoleBody) consoleBody.innerHTML = '';
        appendLine('console cleared', 'ok');
        return true;
      }
      appendLine('不明な属性: console.' + method, 'err');
      return true;
    }

    if (obj === 'chaos') {
      cmdChaos(method);
      return true;
    }

    if (obj === 'theme') {
      cmdTheme(method, rest[0]);
      return true;
    }

    if (obj === 'score') {
      if (method === 'get' || method === 'show') cmdScore();
      else appendLine('用法: score  または score.get', 'warn');
      return true;
    }

    if (obj === 'term' || obj === 'terminal') {
      if (method === 'clear') clearTerm();
      else if (method === 'close') closePanel();
      else if (method === 'open') openPanel();
      else appendLine('不明: terminal.' + method, 'err');
      return true;
    }

    return false;
  }

  function executeSingle(raw) {
    const line = raw.trim();
    if (!line) return;

    // password mode for su
    if (awaitingPassword) {
      awaitingPassword = false;
      if (line === SU_PASSWORD) {
        isRoot = true;
        updatePromptUI();
        appendLine('認証成功。root 権限を取得しました。', 'ok');
      } else {
        appendLine('認証失敗', 'err');
      }
      return;
    }

    // sudo <cmd>
    if (/^sudo(\s|$)/i.test(line)) {
      const rest = line.replace(/^sudo\s*/i, '').trim();
      sudoUntil = Date.now() + SUDO_MS;
      updatePromptUI();
      appendLine('[sudo] 一時権限を付与（5分）', 'sys');
      if (!rest) return;
      executeSingle(rest);
      return;
    }

    // dotted attribute: foo.bar baz
    const dottedMatch = line.match(/^([a-zA-Z_][\w]*)\.([a-zA-Z_][\w.]*)(?:\s+(.*))?$/);
    if (dottedMatch) {
      const obj = dottedMatch[1];
      const methodPath = dottedMatch[2].split('.');
      const argStr = (dottedMatch[3] || '').trim();
      const args = argStr ? argStr.split(/\s+/) : [];
      const parts = [obj].concat(methodPath);
      if (resolveDotted(parts, args)) return;
      appendLine('不明な属性: ' + obj + '.' + methodPath.join('.'), 'err');
      return;
    }

    const tokens = line.match(/(?:[^"]\S*|"[^"]*")+/g) || [];
    const cmd = (tokens[0] || '').toLowerCase();
    const args = tokens.slice(1).map(t => t.replace(/^"|"$/g, ''));

    switch (cmd) {
      case 'help':
      case '?':
        cmdHelp();
        break;
      case 'clear':
      case 'cls':
        clearTerm();
        break;
      case 'ls':
      case 'tree':
        cmdLs();
        break;
      case 'pwd':
        appendLine(location.pathname, 'out');
        break;
      case 'whoami':
        appendLine(hasElevated() ? (isRoot ? 'root' : 'guest (sudo)') : 'guest', 'out');
        break;
      case 'history':
        if (!history.length) appendLine('(empty)', 'sys');
        else history.forEach((h, i) => appendLine(String(i + 1).padStart(3) + '  ' + h, 'out'));
        break;
      case 'echo':
        appendLine(args.join(' '), 'out');
        break;
      case 'open':
        cmdOpen(args[0]);
        break;
      case 'su':
        appendLine('Password:', 'info');
        awaitingPassword = true;
        break;
      case 'exit':
        if (isRoot || Date.now() < sudoUntil) {
          isRoot = false;
          sudoUntil = 0;
          updatePromptUI();
          appendLine('権限を破棄しました', 'sys');
        } else {
          closePanel();
        }
        break;
      case 'logout':
        isRoot = false;
        sudoUntil = 0;
        updatePromptUI();
        appendLine('logout', 'sys');
        break;
      case 'chaos':
        cmdChaos(args[0]);
        break;
      case 'score':
        cmdScore();
        break;
      case 'theme':
        cmdTheme(args[0], args[1]);
        break;
      case 'console':
        if (args[0] === 'open') {
          if (!hasElevated()) {
            appendLine('permission denied: sudo console.open を使用してください', 'err');
          } else openLocalConsole();
        } else if (args[0] === 'close') closeLocalConsole();
        else appendLine('用法: console.open | console.close （権限必要）', 'warn');
        break;
      case 'date':
        appendLine(new Date().toString(), 'out');
        break;
      case 'uname':
        appendLine('AsobiLab Terminal · ' + navigator.userAgent.split(' ').slice(-2).join(' '), 'out');
        break;
      case 'reload':
        appendLine('reloading…', 'sys');
        setTimeout(() => location.reload(), 200);
        break;
      default:
        appendLine('command not found: ' + cmd, 'err');
        appendLine('help で一覧を表示', 'sys');
    }
  }

  function executeLine(raw) {
    const parts = raw.split(/\s*&&\s*/);
    parts.forEach(p => executeSingle(p));
  }

  function openPanel() {
    if (!panel) return;
    panel.classList.add('is-open');
    if (toggleBtn) toggleBtn.classList.add('is-active');
    setTimeout(() => inputEl && inputEl.focus(), 30);
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove('is-open');
    if (toggleBtn) toggleBtn.classList.remove('is-active');
  }

  function togglePanel() {
    if (panel && panel.classList.contains('is-open')) closePanel();
    else openPanel();
  }

  function buildUI() {
    if (document.querySelector('.asobi-term-toggle')) return;

    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'asobi-term-toggle';
    toggleBtn.title = 'Asobi Terminal';
    toggleBtn.setAttribute('aria-label', 'Open terminal');
    toggleBtn.innerHTML = '&gt;_';
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });
    document.body.appendChild(toggleBtn);

    panel = document.createElement('div');
    panel.className = 'asobi-term-panel';
    panel.innerHTML =
      '<div class="asobi-term-header">' +
      '<span class="asobi-term-title">Asobi Terminal</span>' +
      '<span class="asobi-term-badge">guest</span>' +
      '<div class="asobi-term-header-actions">' +
      '<button type="button" data-act="clear" title="clear">⌫</button>' +
      '<button type="button" data-act="close" title="close">✕</button>' +
      '</div></div>' +
      '<div class="asobi-term-body"></div>' +
      '<div class="asobi-term-input-row">' +
      '<span class="asobi-term-prompt">guest@asobi$</span>' +
      '<input class="asobi-term-input" spellcheck="false" autocomplete="off" autocapitalize="off" />' +
      '</div>';
    document.body.appendChild(panel);

    bodyEl = panel.querySelector('.asobi-term-body');
    inputEl = panel.querySelector('.asobi-term-input');
    promptEl = panel.querySelector('.asobi-term-prompt');
    badgeEl = panel.querySelector('.asobi-term-badge');

    panel.querySelector('[data-act="close"]').addEventListener('click', closePanel);
    panel.querySelector('[data-act="clear"]').addEventListener('click', clearTerm);

    inputEl.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        const val = inputEl.value;
        const shown = awaitingPassword ? '*'.repeat(Math.min(val.length, 12)) : val;
        appendLine(promptText() + ' ' + shown, 'cmd');
        if (!awaitingPassword && val.trim()) {
          history.push(val);
          if (history.length > 100) history.shift();
        }
        histIdx = history.length;
        inputEl.value = '';
        executeLine(val);
        updatePromptUI();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!history.length) return;
        histIdx = Math.max(0, histIdx - 1);
        inputEl.value = history[histIdx] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        histIdx = Math.min(history.length, histIdx + 1);
        inputEl.value = histIdx >= history.length ? '' : (history[histIdx] || '');
      } else if (e.key === 'Escape') {
        closePanel();
      } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        clearTerm();
      }
    });

    // ターミナル内クリックでフォーカス維持
    panel.addEventListener('mousedown', (e) => {
      if (e.target !== inputEl) {
        e.preventDefault();
        inputEl.focus();
      }
    });

    appendLine('Asobi Lab. Terminal v1.0', 'sys');
    appendLine('help でコマンド一覧。sudo console.open でローカルコンソール。', 'sys');
  }

  function boot() {
    buildUI();
    updatePromptUI();
    window.AsobiTerminal = {
      open: openPanel,
      close: closePanel,
      toggle: togglePanel,
      exec: executeLine,
      openConsole: openLocalConsole,
      closeConsole: closeLocalConsole
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
