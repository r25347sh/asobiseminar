/**
 * Asobi Lab. AI Chat Editor
 * WebLLM-powered voice/chat UI for live DOM & CSS editing.
 * Self-contained: load via <script src="AI_CHAT/AI_CHAT.js"></script>
 * Persists edits with localForage (IndexedDB).
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------
  var STORAGE_KEY = 'asobilab_ai_edits';
  var MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
  // Fallback smaller / alternative if needed
  var MODEL_FALLBACK = 'Phi-3.5-mini-instruct-q4f16_1-MLC';
  var LOCALFORAGE_CDN = 'https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js';
  var WEBLLM_CDN = 'https://esm.run/@mlc-ai/web-llm';

  var SYSTEM_PROMPT = [
    'あなたは「Asobi Lab.」公式サイトのDOM/CSS編集専用AIです。',
    'ユーザーの自然言語リクエストを解釈し、ページの見た目・構造を変更します。',
    '',
    '【絶対ルール】',
    '1. 返答は必ず以下のJSON形式のみ。前後に説明文やマークダウンを付けない。',
    '2. 危険な操作（script実行、外部通信、localStorage破壊など）は禁止。',
    '3. selectorはCSSセレクタ。存在する要素を優先して狙う。',
    '4. 変更は最小限・具体的に。',
    '',
    '【出力フォーマット】',
    '{',
    '  "reply": "ユーザーへの短い日本語返答（何をしたか）",',
    '  "actions": [',
    '    {"op":"setStyle","selector":"...","styles":{"property":"value",...}},',
    '    {"op":"addClass","selector":"...","className":"..."},',
    '    {"op":"removeClass","selector":"...","className":"..."},',
    '    {"op":"setText","selector":"...","text":"..."},',
    '    {"op":"setHTML","selector":"...","html":"..."},',
    '    {"op":"setAttr","selector":"...","name":"...","value":"..."},',
    '    {"op":"move","selector":"...","position":"before|after|prepend|append","target":"..."},',
    '    {"op":"remove","selector":"..."},',
    '    {"op":"insertHTML","selector":"...","position":"beforebegin|afterbegin|beforeend|afterend","html":"..."},',
    '    {"op":"injectCSS","css":"..."}',
    '  ]',
    '}',
    '',
    '【例】',
    'ユーザー: デザインを和風にして',
    '→ {"reply":"和風のトーンに調整しました。","actions":[{"op":"injectCSS","css":"body{font-family:\"Noto Serif JP\",serif!important;background:#faf6f0!important}h1,h2{color:#8b4513!important}"},{"op":"addClass","selector":"body","className":"ai-wa-style"}]}',
    '',
    'ユーザー: 文字を大きくして',
    '→ {"reply":"全体の文字サイズを大きくしました。","actions":[{"op":"injectCSS","css":"html{font-size:112%!important}"}]}',
    '',
    'ユーザー: 重要な部分をハイライトして',
    '→ {"reply":"見出しとリード文を強調しました。","actions":[{"op":"setStyle","selector":"h1,h2,.section-title","styles":{"color":"#e11d48","textShadow":"0 0 8px rgba(225,29,72,.35)"}},{"op":"setStyle","selector":".lead","styles":{"background":"linear-gradient(90deg,#fef3c7,#fde68a)","padding":"0.4em 0.6em","borderRadius":"6px"}}]}',
    '',
    '変更不要・質問のみの場合は actions を空配列に。',
    '現在のページの主要な構造を意識して操作してください。'
  ].join('\n');

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var engine = null;
  var engineReady = false;
  var engineLoading = false;
  var messages = [];
  var appliedActions = [];
  var isOpen = false;
  var isBusy = false;
  var recognition = null;
  var isListening = false;
  var localforageReady = false;

  var fab, overlay, panel, messagesEl, inputEl, sendBtn, micBtn, statusEl, statusBar, statusText, typingEl;

  function getRoot() {
    var path = location.pathname;
    if (path.indexOf('/pages/members/') >= 0 || path.indexOf('/pages/groups/') >= 0) return '../../';
    if (path.indexOf('/pages/') >= 0 || path.indexOf('/users/') >= 0) return '../';
    return '';
  }

  function injectCSS() {
    if (document.getElementById('ai-chat-stylesheet')) return;
    var link = document.createElement('link');
    link.id = 'ai-chat-stylesheet';
    link.rel = 'stylesheet';
    link.href = getRoot() + 'AI_CHAT/AI_CHAT.css';
    document.head.appendChild(link);
  }

  function loadLocalForage() {
    return new Promise(function (resolve) {
      if (window.localforage) { localforageReady = true; resolve(); return; }
      var s = document.createElement('script');
      s.src = LOCALFORAGE_CDN;
      s.onload = function () { localforageReady = true; resolve(); };
      s.onerror = function () { console.warn('[AI_CHAT] localforage load failed'); resolve(); };
      document.head.appendChild(s);
    });
  }

  async function saveEdits() {
    try {
      if (localforageReady && window.localforage) await window.localforage.setItem(STORAGE_KEY, appliedActions);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(appliedActions));
    } catch (e) { console.warn('[AI_CHAT] save failed', e); }
  }

  async function loadEdits() {
    try {
      var data = null;
      if (localforageReady && window.localforage) data = await window.localforage.getItem(STORAGE_KEY);
      else { var raw = localStorage.getItem(STORAGE_KEY); data = raw ? JSON.parse(raw) : null; }
      if (Array.isArray(data)) {
        appliedActions = data;
        appliedActions.forEach(function (a) { try { applyAction(a, true); } catch (e) {} });
      }
    } catch (e) { console.warn('[AI_CHAT] load edits failed', e); }
  }

  async function clearEdits() {
    appliedActions = [];
    document.querySelectorAll('style[data-ai-chat]').forEach(function (el) { el.remove(); });
    await saveEdits();
    location.reload();
  }

  function applyAction(action, silent) {
    if (!action || !action.op) return;
    var op = action.op;
    if (op === 'injectCSS') {
      var style = document.createElement('style');
      style.setAttribute('data-ai-chat', '1');
      style.textContent = action.css || '';
      document.head.appendChild(style);
      return;
    }
    var els = [];
    try { if (action.selector) els = Array.prototype.slice.call(document.querySelectorAll(action.selector)); }
    catch (e) { if (!silent) console.warn('[AI_CHAT] bad selector', action.selector); return; }
    els.forEach(function (el) {
      if (op === 'setStyle' && action.styles) {
        Object.keys(action.styles).forEach(function (prop) {
          el.style.setProperty(prop.replace(/([A-Z])/g, '-$1').toLowerCase(), action.styles[prop], 'important');
        });
      } else if (op === 'addClass' && action.className) el.classList.add(action.className);
      else if (op === 'removeClass' && action.className) el.classList.remove(action.className);
      else if (op === 'setText') el.textContent = action.text != null ? String(action.text) : '';
      else if (op === 'setHTML') el.innerHTML = String(action.html || '').replace(/<script[\s\S]*?<\/script>/gi, '');
      else if (op === 'setAttr' && action.name) {
        if (/^on/i.test(action.name)) return;
        el.setAttribute(action.name, action.value != null ? String(action.value) : '');
      } else if (op === 'remove') el.remove();
      else if (op === 'move' && action.target && action.position) {
        var targets = [];
        try { targets = document.querySelectorAll(action.target); } catch (e) { return; }
        if (!targets.length) return;
        var t = targets[0];
        if (action.position === 'before') t.parentNode.insertBefore(el, t);
        else if (action.position === 'after') t.parentNode.insertBefore(el, t.nextSibling);
        else if (action.position === 'prepend') t.insertBefore(el, t.firstChild);
        else if (action.position === 'append') t.appendChild(el);
      } else if (op === 'insertHTML' && action.html && action.position) {
        el.insertAdjacentHTML(action.position, String(action.html).replace(/<script[\s\S]*?<\/script>/gi, ''));
      }
    });
  }

  function applyActions(actions, persist) {
    if (!Array.isArray(actions)) return;
    actions.forEach(function (a) {
      applyAction(a, false);
      if (persist) appliedActions.push(a);
    });
    if (persist) saveEdits();
  }

  function createUI() {
    fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'ai-chat-fab';
    fab.setAttribute('aria-label', 'AIチャットを開く');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = '💬';
    fab.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(); });
    document.body.appendChild(fab);

    overlay = document.createElement('div');
    overlay.className = 'ai-chat-overlay';
    overlay.addEventListener('click', closePanel);
    document.body.appendChild(overlay);

    panel = document.createElement('div');
    panel.className = 'ai-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'AIサイト編集チャット');
    panel.innerHTML = [
      '<div class="ai-chat-header">',
      '  <div class="ai-chat-header-icon">🤖</div>',
      '  <div class="ai-chat-header-text">',
      '    <h2>Asobi AI Editor</h2>',
      '    <p id="ai-status-label">WebLLM 準備中…</p>',
      '  </div>',
      '  <div class="ai-chat-header-actions">',
      '    <button type="button" id="ai-btn-reset" title="変更をリセット">↺</button>',
      '    <button type="button" id="ai-btn-close" title="閉じる">✕</button>',
      '  </div>',
      '</div>',
      '<div class="ai-chat-status" id="ai-status">',
      '  <span id="ai-status-text">モデル読込中</span>',
      '  <div class="bar"><i id="ai-status-bar"></i></div>',
      '</div>',
      '<div class="ai-chat-messages" id="ai-messages"></div>',
      '<div class="ai-typing" id="ai-typing"><span></span><span></span><span></span></div>',
      '<div class="ai-chat-input-area">',
      '  <div class="ai-chat-input-row">',
      '    <button type="button" class="ai-btn ai-btn-mic" id="ai-btn-mic" title="音声入力">🎤</button>',
      '    <textarea class="ai-chat-input" id="ai-input" rows="1" placeholder="例: デザインを和風にして / 文字を大きくして"></textarea>',
      '    <button type="button" class="ai-btn ai-btn-send" id="ai-btn-send" title="送信">➤</button>',
      '  </div>',
      '  <div class="ai-chat-hints">',
      '    <button type="button" data-hint="デザインを和風にして">和風に</button>',
      '    <button type="button" data-hint="文字サイズを大きくして">文字大きく</button>',
      '    <button type="button" data-hint="重要な見出しをハイライトして強調して">ハイライト</button>',
      '    <button type="button" data-hint="背景をダークモードにして">ダーク</button>',
      '    <button type="button" data-hint="変更を元に戻してリセット">リセット</button>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(panel);

    messagesEl = panel.querySelector('#ai-messages');
    inputEl = panel.querySelector('#ai-input');
    sendBtn = panel.querySelector('#ai-btn-send');
    micBtn = panel.querySelector('#ai-btn-mic');
    statusEl = panel.querySelector('#ai-status');
    statusBar = panel.querySelector('#ai-status-bar');
    statusText = panel.querySelector('#ai-status-text');
    typingEl = panel.querySelector('#ai-typing');

    panel.querySelector('#ai-btn-close').addEventListener('click', closePanel);
    panel.querySelector('#ai-btn-reset').addEventListener('click', function () {
      if (confirm('AIによる変更をすべて破棄してページをリロードしますか？')) clearEdits();
    });
    sendBtn.addEventListener('click', onSend);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
    });
    inputEl.addEventListener('input', autoResize);
    micBtn.addEventListener('click', toggleVoice);
    panel.querySelectorAll('[data-hint]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        inputEl.value = btn.getAttribute('data-hint');
        autoResize();
        onSend();
      });
    });
    appendMessage('system', 'こんにちは。サイトの見た目を自然言語で変更できます。例:「デザインを和風にして」「文字を大きくして」');
  }

  function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  }

  function togglePanel() { if (isOpen) closePanel(); else openPanel(); }

  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    overlay.classList.add('open');
    fab.setAttribute('aria-expanded', 'true');
    fab.innerHTML = '✕';
    setTimeout(function () { inputEl.focus(); }, 280);
    if (!engineReady && !engineLoading) initEngine();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    overlay.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = '💬';
    stopVoice();
  }

  function appendMessage(role, content, extra) {
    var div = document.createElement('div');
    div.className = 'ai-msg ' + role;
    div.textContent = content;
    if (extra && extra.actionsCount) {
      var badge = document.createElement('div');
      badge.className = 'actions-badge';
      badge.textContent = '✓ ' + extra.actionsCount + ' 件の変更を適用';
      div.appendChild(badge);
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function setStatus(visible, text, progress) {
    if (visible) {
      statusEl.classList.add('visible');
      var short = (text || '').replace(/WebLLM\s*/i, '').replace(/モデルを読み込み中…?/, '読込中').slice(0, 28);
      statusText.textContent = short || '読込中…';
      if (typeof progress === 'number') statusBar.style.width = Math.round(progress * 100) + '%';
      if (fab) fab.classList.add('loading');
    } else {
      statusEl.classList.remove('visible');
      if (fab) fab.classList.remove('loading');
    }
  }

  function setTyping(on) {
    typingEl.classList.toggle('visible', !!on);
    if (on) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function initEngine() {
    if (engineLoading || engineReady) return;
    engineLoading = true;
    setStatus(true, 'WebLLM モデルを読み込み中…', 0);
    document.getElementById('ai-status-label').textContent = 'モデル読込中…';
    try {
      var webllm = await import(WEBLLM_CDN);
      var CreateMLCEngine = webllm.CreateMLCEngine;
      engine = await CreateMLCEngine(MODEL_ID, {
        initProgressCallback: function (report) {
          var p = report.progress || 0;
          setStatus(true, report.text || '読込中…', p);
        }
      });
      engineReady = true;
      engineLoading = false;
      setStatus(false);
      document.getElementById('ai-status-label').textContent = '準備完了 · ローカルLLM';
      appendMessage('system', 'モデルの準備ができました。指示をどうぞ。');
    } catch (err) {
      console.error('[AI_CHAT] WebLLM init error', err);
      engineLoading = false;
      setStatus(true, 'モデル読込失敗。再試行するか、別モデルを検討してください。', 0);
      document.getElementById('ai-status-label').textContent = '読込失敗';
      appendMessage('system', 'WebLLMの初期化に失敗しました。ブラウザがWebGPUに対応しているか確認してください。\n' + (err.message || err));
    }
  }

  function extractJSON(text) {
    try { return JSON.parse(text.trim()); } catch (e) {}
    var start = text.indexOf('{');
    var end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(text.slice(start, end + 1)); } catch (e2) {}
    }
    return null;
  }

  async function runChat(userText) {
    if (!engineReady || !engine) {
      appendMessage('assistant', 'まだモデルが準備できていません。少々お待ちください。');
      if (!engineLoading) initEngine();
      return;
    }
    if (/リセット|元に戻|クリア|初期化/i.test(userText) && /変更|全部|すべて|全て|編集/i.test(userText) || userText.trim() === 'リセット') {
      appendMessage('assistant', '変更をリセットしてページをリロードします。');
      await clearEdits();
      return;
    }
    isBusy = true;
    sendBtn.disabled = true;
    setTyping(true);
    messages.push({ role: 'user', content: userText });
    var chatMessages = [{ role: 'system', content: SYSTEM_PROMPT }];
    var recent = messages.slice(-6);
    for (var i = 0; i < recent.length; i++) chatMessages.push(recent[i]);
    try {
      var chunks = await engine.chat.completions.create({
        messages: chatMessages,
        temperature: 0.3,
        max_tokens: 1024,
        stream: true
      });
      var full = '';
      var msgEl = appendMessage('assistant', '');
      for await (var chunk of chunks) {
        var delta = (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) || '';
        full += delta;
        msgEl.textContent = full;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      messages.push({ role: 'assistant', content: full });
      var parsed = extractJSON(full);
      if (parsed) {
        var reply = parsed.reply || '変更を適用しました。';
        var actions = parsed.actions || [];
        msgEl.textContent = reply;
        if (actions.length) {
          applyActions(actions, true);
          var badge = document.createElement('div');
          badge.className = 'actions-badge';
          badge.textContent = '✓ ' + actions.length + ' 件の変更を適用・保存';
          msgEl.appendChild(badge);
        }
      } else {
        msgEl.textContent = full || '（応答を解析できませんでした）';
      }
    } catch (err) {
      console.error('[AI_CHAT] chat error', err);
      appendMessage('assistant', 'エラーが発生しました: ' + (err.message || err));
    } finally {
      setTyping(false);
      isBusy = false;
      sendBtn.disabled = false;
    }
  }

  function onSend() {
    var text = (inputEl.value || '').trim();
    if (!text || isBusy) return;
    inputEl.value = '';
    autoResize();
    appendMessage('user', text);
    runChat(text);
  }

  function initSpeech() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { micBtn.style.display = 'none'; return; }
    recognition = new SR();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = function (ev) {
      var transcript = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) transcript += ev.results[i][0].transcript;
      }
      if (transcript) {
        inputEl.value = (inputEl.value ? inputEl.value + ' ' : '') + transcript;
        autoResize();
      }
    };
    recognition.onerror = function () { stopVoice(); };
    recognition.onend = function () { stopVoice(); };
  }

  function toggleVoice() {
    if (!recognition) return;
    if (isListening) stopVoice(); else startVoice();
  }

  function startVoice() {
    if (!recognition || isListening) return;
    try {
      recognition.start();
      isListening = true;
      micBtn.classList.add('listening');
      micBtn.title = '録音中…クリックで停止';
    } catch (e) { console.warn(e); }
  }

  function stopVoice() {
    if (!recognition) return;
    try { recognition.stop(); } catch (e) {}
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.title = '音声入力';
  }

  async function boot() {
    injectCSS();
    await loadLocalForage();
    createUI();
    initSpeech();
    await loadEdits();
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        togglePanel();
      }
      if (e.key === 'Escape' && isOpen) closePanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
