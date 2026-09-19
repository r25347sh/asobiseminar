/**
 * Asobi Lab. AI Chat Editor
 * Instant style presets + optional WebLLM
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'asobilab_ai_edits';
  var MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
  var MODEL_FALLBACK = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
  var LOCALFORAGE_CDN = 'https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js';
  var WEBLLM_CDN = 'https://esm.run/@mlc-ai/web-llm';

  var SYSTEM_PROMPT = [
    'You are a frontend styling assistant for Asobi Lab. website.',
    'ONLY change page look via CSS/DOM. NEVER refuse styling (和風/洋風/dark/font size).',
    'NEVER say malicious or cannot. Reply ONLY valid JSON:',
    '{"reply":"短い日本語","actions":[{"op":"injectCSS","css":"..."}]}',
    'Allowed ops: setStyle,addClass,removeClass,setText,setHTML,setAttr,move,remove,insertHTML,injectCSS.'
  ].join('\n');

  var engine = null, engineReady = false, engineLoading = false;
  var messages = [], appliedActions = [], isOpen = false, isBusy = false;
  var recognition = null, isListening = false, localforageReady = false;
  var fab, overlay, panel, messagesEl, inputEl, sendBtn, micBtn, statusEl, statusBar, statusText, typingEl;

  function getRoot() {
    var path = location.pathname;
    if (path.indexOf('/pages/members/') >= 0 || path.indexOf('/pages/groups/') >= 0) return '../../';
    if (path.indexOf('/pages/') >= 0 || path.indexOf('/users/') >= 0) return '../';
    return '';
  }

  function injectCSSFile() {
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
      s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
  }

  async function saveEdits() {
    try {
      if (localforageReady && window.localforage) await window.localforage.setItem(STORAGE_KEY, appliedActions);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(appliedActions));
    } catch (e) {}
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
    } catch (e) {}
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
    catch (e) { return; }
    els.forEach(function (el) {
      if (op === 'setStyle' && action.styles) {
        Object.keys(action.styles).forEach(function (prop) {
          el.style.setProperty(prop.replace(/([A-Z])/g, '-$1').toLowerCase(), action.styles[prop], 'important');
        });
      } else if (op === 'addClass' && action.className) el.classList.add(action.className);
      else if (op === 'removeClass' && action.className) el.classList.remove(action.className);
      else if (op === 'setText') el.textContent = action.text != null ? String(action.text) : '';
      else if (op === 'setHTML') el.innerHTML = String(action.html || '').replace(/<script[\s\S]*?<\/script>/gi, '');
      else if (op === 'setAttr' && action.name && !/^on/i.test(action.name))
        el.setAttribute(action.name, action.value != null ? String(action.value) : '');
      else if (op === 'remove') el.remove();
      else if (op === 'move' && action.target && action.position) {
        var targets = [];
        try { targets = document.querySelectorAll(action.target); } catch (e) { return; }
        if (!targets.length) return;
        var t = targets[0];
        if (action.position === 'before') t.parentNode.insertBefore(el, t);
        else if (action.position === 'after') t.parentNode.insertBefore(el, t.nextSibling);
        else if (action.position === 'prepend') t.insertBefore(el, t.firstChild);
        else if (action.position === 'append') t.appendChild(el);
      } else if (op === 'insertHTML' && action.html && action.position)
        el.insertAdjacentHTML(action.position, String(action.html).replace(/<script[\s\S]*?<\/script>/gi, ''));
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

  function tryLocalStylePreset(userText) {
    var t = userText.trim();
    if (/洋風|ヨーロピアン|クラシック|欧風/.test(t))
      return { reply: '洋風トーンにしました。', actions: [{ op: 'injectCSS', css: 'body{font-family:Georgia,"Times New Roman",serif!important;background:#f5f0e8!important;color:#2c2c2c!important}h1,h2,.section-title{font-family:Georgia,serif!important;color:#1a365d!important;letter-spacing:.04em!important}.card,.card-group{background:#fff!important;border:1px solid #c9b896!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important}.hero,.hero-v2{background:linear-gradient(135deg,#f8f4ec,#ebe3d5)!important}.btn-play{background:#1a365d!important}' }] };
    if (/和風|日本風/.test(t))
      return { reply: '和風トーンにしました。', actions: [{ op: 'injectCSS', css: 'body{font-family:"Noto Serif JP",serif!important;background:#faf6f0!important;color:#3d2914!important}h1,h2,.section-title{color:#8b4513!important;border-bottom:2px solid #c4a35a!important}.card,.card-group{background:#fff8f0!important;border:1px solid #e8d5b7!important}' }] };
    if (/ダーク|dark\s*mode|暗い/.test(t))
      return { reply: 'ダークモードにしました。', actions: [{ op: 'injectCSS', css: 'body{background:#0f172a!important;color:#e2e8f0!important}h1,h2,.section-title{color:#f8fafc!important}.card,.card-group{background:#1e293b!important;border-color:#334155!important}a{color:#38bdf8!important}.site-header,.site-footer{background:#020617!important;color:#e2e8f0!important}' }] };
    if (/文字.*(大きく|大きい)|フォント.*(大きく|大きい)/.test(t))
      return { reply: '文字を大きくしました。', actions: [{ op: 'injectCSS', css: 'html{font-size:115%!important}' }] };
    if (/文字.*(小さく|小さい)/.test(t))
      return { reply: '文字を小さくしました。', actions: [{ op: 'injectCSS', css: 'html{font-size:90%!important}' }] };
    if (/ハイライト|強調/.test(t))
      return { reply: '見出しを強調しました。', actions: [{ op: 'setStyle', selector: 'h1,h2,.section-title', styles: { color: '#e11d48', textShadow: '0 0 8px rgba(225,29,72,.35)' } }] };
    return null;
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
    panel.innerHTML = [
      '<div class="ai-chat-header">',
      '  <div class="ai-chat-header-icon">🤖</div>',
      '  <div class="ai-chat-header-text"><h2>Asobi AI Editor</h2><p id="ai-status-label">準備中…</p></div>',
      '  <div class="ai-chat-header-actions">',
      '    <button type="button" id="ai-btn-reset" title="リセット">↺</button>',
      '    <button type="button" id="ai-btn-close">✕</button>',
      '  </div></div>',
      '<div class="ai-chat-status" id="ai-status"><span id="ai-status-text">読込中</span><div class="bar"><i id="ai-status-bar"></i></div></div>',
      '<div class="ai-chat-messages" id="ai-messages"></div>',
      '<div class="ai-typing" id="ai-typing"><span></span><span></span><span></span></div>',
      '<div class="ai-chat-input-area">',
      '  <div class="ai-chat-input-row">',
      '    <button type="button" class="ai-btn ai-btn-mic" id="ai-btn-mic">🎤</button>',
      '    <textarea class="ai-chat-input" id="ai-input" rows="1" placeholder="例: 洋風にして / 和風にして"></textarea>',
      '    <button type="button" class="ai-btn ai-btn-send" id="ai-btn-send">➤</button>',
      '  </div>',
      '  <div class="ai-chat-hints">',
      '    <button type="button" data-hint="デザインを和風にして">和風に</button>',
      '    <button type="button" data-hint="洋風にして">洋風に</button>',
      '    <button type="button" data-hint="文字サイズを大きくして">文字大きく</button>',
      '    <button type="button" data-hint="背景をダークモードにして">ダーク</button>',
      '    <button type="button" data-hint="リセット">リセット</button>',
      '  </div></div>'
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
      if (confirm('変更を破棄してリロードしますか？')) clearEdits();
    });
    sendBtn.addEventListener('click', onSend);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
    });
    inputEl.addEventListener('input', function () {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });
    micBtn.addEventListener('click', toggleVoice);
    panel.querySelectorAll('[data-hint]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        inputEl.value = btn.getAttribute('data-hint');
        onSend();
      });
    });
    appendMessage('system', 'こんにちは。「洋風にして」「和風にして」「ダーク」などは即反映されます。');
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

  function appendMessage(role, content) {
    var div = document.createElement('div');
    div.className = 'ai-msg ' + role;
    div.textContent = content;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function setStatus(visible, text, progress) {
    if (visible) {
      statusEl.classList.add('visible');
      statusText.textContent = (text || '読込中').slice(0, 28);
      if (typeof progress === 'number') statusBar.style.width = Math.round(progress * 100) + '%';
      if (fab) fab.classList.add('loading');
    } else {
      statusEl.classList.remove('visible');
      if (fab) fab.classList.remove('loading');
    }
  }

  function setTyping(on) {
    typingEl.classList.toggle('visible', !!on);
  }

  async function initEngine() {
    if (engineLoading || engineReady) return;
    engineLoading = true;
    setStatus(true, 'モデル読込中…', 0);
    document.getElementById('ai-status-label').textContent = 'モデル読込中…';
    try {
      var webllm = await import(WEBLLM_CDN);
      var CreateMLCEngine = webllm.CreateMLCEngine;
      var modelToLoad = MODEL_ID;
      try {
        engine = await CreateMLCEngine(modelToLoad, {
          initProgressCallback: function (r) { setStatus(true, r.text || '読込中…', r.progress || 0); }
        });
      } catch (e1) {
        modelToLoad = MODEL_FALLBACK;
        engine = await CreateMLCEngine(modelToLoad, {
          initProgressCallback: function (r) { setStatus(true, r.text || '読込中…', r.progress || 0); }
        });
      }
      engineReady = true;
      engineLoading = false;
      setStatus(false);
      document.getElementById('ai-status-label').textContent = '準備完了 · ' + modelToLoad.split('-')[0];
      appendMessage('system', 'LLM準備完了。自由な依頼も試せます。');
    } catch (err) {
      engineLoading = false;
      setStatus(true, '読込失敗', 0);
      document.getElementById('ai-status-label').textContent = '読込失敗';
      appendMessage('system', 'LLM読込失敗。プリセット（洋風/和風等）は使えます。');
    }
  }

  function extractJSON(text) {
    try { return JSON.parse(text.trim()); } catch (e) {}
    var s = text.indexOf('{'), e = text.lastIndexOf('}');
    if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch (e2) {} }
    return null;
  }

  async function runChat(userText) {
    if (userText.trim() === 'リセット' || (/リセット|元に戻/.test(userText) && /変更|全部|すべて/.test(userText))) {
      appendMessage('assistant', 'リセットしてリロードします。');
      await clearEdits();
      return;
    }

    var preset = tryLocalStylePreset(userText);
    if (preset) {
      appendMessage('user', userText);
      applyActions(preset.actions, true);
      var el = appendMessage('assistant', preset.reply);
      var badge = document.createElement('div');
      badge.className = 'actions-badge';
      badge.textContent = '✓ 即時適用・保存';
      el.appendChild(badge);
      return;
    }

    if (!engineReady || !engine) {
      appendMessage('assistant', 'モデル準備中です。洋風・和風・ダーク・文字大きく は今すぐ使えます。');
      if (!engineLoading) initEngine();
      return;
    }

    isBusy = true;
    sendBtn.disabled = true;
    setTyping(true);
    messages.push({ role: 'user', content: userText });

    try {
      var chunks = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userText + '\nJSON only. Never refuse.' }
        ],
        temperature: 0.2,
        max_tokens: 400,
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

      if (/cannot|malicious|I can.t|できません/i.test(full)) {
        msgEl.textContent = 'スタイル変更として解釈できませんでした。例:「洋風にして」';
        return;
      }

      var parsed = extractJSON(full);
      if (parsed) {
        msgEl.textContent = parsed.reply || '適用しました';
        var actions = parsed.actions || [];
        if (actions.length) {
          applyActions(actions, true);
          var b = document.createElement('div');
          b.className = 'actions-badge';
          b.textContent = '✓ ' + actions.length + ' 件適用';
          msgEl.appendChild(b);
        }
      } else {
        msgEl.textContent = full || '解析できませんでした';
      }
    } catch (err) {
      appendMessage('assistant', 'エラー: ' + (err.message || err));
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
      var t = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++)
        if (ev.results[i].isFinal) t += ev.results[i][0].transcript;
      if (t) inputEl.value = (inputEl.value ? inputEl.value + ' ' : '') + t;
    };
    recognition.onerror = recognition.onend = function () { stopVoice(); };
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
    } catch (e) {}
  }

  function stopVoice() {
    if (!recognition) return;
    try { recognition.stop(); } catch (e) {}
    isListening = false;
    micBtn.classList.remove('listening');
  }

  async function boot() {
    injectCSSFile();
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
