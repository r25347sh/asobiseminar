/**
 * Asobi Lab. AI Chat Editor
 * Natural-language → CSS applied live to the page (WebLLM + robust extract)
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'asobilab_ai_edits';
  var MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
  var MODEL_FALLBACK = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
  var LOCALFORAGE_CDN = 'https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js';
  var WEBLLM_CDN = 'https://esm.run/@mlc-ai/web-llm';

  var SYSTEM_PROMPT = [
    'You are a CSS designer for the Asobi Lab website.',
    'User speaks Japanese. Change the LOOK of the page with CSS.',
    'Reply with ONLY this JSON (no markdown, no extra text):',
    '{"reply":"短い日本語で完了報告","actions":[{"op":"injectCSS","css":"CSSルール全部"}]}',
    'css には body,h1,h2,.card,.hero,.btn-play,.site-header などを !important 付きで書く。',
    '例1 ユーザー: ヨーロッパ風にして',
    '{"reply":"ヨーロッパ風にしました","actions":[{"op":"injectCSS","css":"body{font-family:Georgia,serif!important;background:#f5f0e8!important;color:#2c2c2c!important}h1,h2{color:#1a365d!important}.card{background:#fff!important;border:1px solid #c9b896!important}"}]}',
    '例2 ユーザー: アジア風にして',
    '{"reply":"アジア風にしました","actions":[{"op":"injectCSS","css":"body{background:#1a0a0a!important;color:#f5e6c8!important}h1,h2{color:#ffd700!important}.card{background:#2a1212!important;border:1px solid #c41e3a!important}"}]}',
    'Never refuse. Never output HTML tags. Only the JSON object.'
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
      var css = action.css || '';
      if (!css.trim()) return;
      var style = document.createElement('style');
      style.setAttribute('data-ai-chat', '1');
      style.textContent = css;
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

  /** 自然言語からテーマCSSを動的生成（LLM失敗時のフォールバック） */
  function generateThemeCSS(userText) {
    var t = userText.trim();
    var bg = '#f8fafc', color = '#0f172a', accent = '#2563eb', cardBg = '#ffffff', border = '#e2e8f0', font = 'system-ui,sans-serif', hero = 'linear-gradient(135deg,#eff6ff,#e0e7ff)', titleColor = accent;

    if (/中華|中国|チャイナ|チャイニーズ/.test(t)) {
      bg = '#1a0a0a'; color = '#f5e6c8'; accent = '#c41e3a'; cardBg = '#2a1212'; border = '#c41e3a'; font = '"Noto Serif JP",serif'; hero = 'linear-gradient(135deg,#1a0a0a,#3d1515)'; titleColor = '#ffd700';
    } else if (/アジア|東洋|オリエンタル/.test(t)) {
      bg = '#1c1917'; color = '#fef3c7'; accent = '#b91c1c'; cardBg = '#292524'; border = '#a16207'; font = '"Noto Serif JP",serif'; hero = 'linear-gradient(135deg,#1c1917,#44403c)'; titleColor = '#fbbf24';
    } else if (/和風|日本|和|わふう/.test(t)) {
      bg = '#faf6f0'; color = '#3d2914'; accent = '#8b4513'; cardBg = '#fff8f0'; border = '#e8d5b7'; font = '"Noto Serif JP",serif'; hero = 'linear-gradient(135deg,#faf6f0,#f0e6d8)'; titleColor = '#8b4513';
    } else if (/ヨーロッパ|欧州|欧風|洋風|クラシック|西洋/.test(t)) {
      bg = '#f5f0e8'; color = '#2c2c2c'; accent = '#1a365d'; cardBg = '#ffffff'; border = '#c9b896'; font = 'Georgia,"Times New Roman",serif'; hero = 'linear-gradient(135deg,#f8f4ec,#ebe3d5)'; titleColor = '#1a365d';
    } else if (/北欧|スカンジ|ミニマル/.test(t)) {
      bg = '#fafafa'; color = '#171717'; accent = '#404040'; cardBg = '#ffffff'; border = '#e5e5e5'; font = 'system-ui,sans-serif'; hero = 'linear-gradient(135deg,#fafafa,#f5f5f5)'; titleColor = '#171717';
    } else if (/トロピカル|南国|ハワイ/.test(t)) {
      bg = '#ecfdf5'; color = '#064e3b'; accent = '#059669'; cardBg = '#ffffff'; border = '#6ee7b7'; font = 'system-ui,sans-serif'; hero = 'linear-gradient(135deg,#ecfdf5,#cffafe)'; titleColor = '#0d9488';
    } else if (/ネオン|サイバー|未来|フューチャー|テクノ/.test(t)) {
      bg = '#0a0a12'; color = '#e0f7ff'; accent = '#00f0ff'; cardBg = '#12121f'; border = '#7c3aed'; font = 'system-ui,sans-serif'; hero = 'linear-gradient(135deg,#0a0a12,#1a1030)'; titleColor = '#00f0ff';
    } else if (/パステル|可愛|かわいい|ソフト|乙女/.test(t)) {
      bg = '#fdf2f8'; color = '#4a1942'; accent = '#db2777'; cardBg = '#ffffff'; border = '#f9a8d4'; font = 'system-ui,sans-serif'; hero = 'linear-gradient(135deg,#fce7f3,#e0e7ff)'; titleColor = '#db2777';
    } else if (/ダーク|暗い|夜|ナイト/.test(t)) {
      bg = '#0f172a'; color = '#e2e8f0'; accent = '#38bdf8'; cardBg = '#1e293b'; border = '#334155'; font = 'system-ui,sans-serif'; hero = 'linear-gradient(135deg,#0f172a,#1e293b)'; titleColor = '#f8fafc';
    } else if (/明るい|ライト|白基調/.test(t)) {
      bg = '#ffffff'; color = '#1e293b'; accent = '#3b82f6'; cardBg = '#f8fafc'; border = '#e2e8f0'; font = 'system-ui,sans-serif'; hero = 'linear-gradient(135deg,#ffffff,#f1f5f9)'; titleColor = '#0f172a';
    } else if (/レトロ|ビンテージ|昭和/.test(t)) {
      bg = '#fef3c7'; color = '#78350f'; accent = '#b45309'; cardBg = '#fffbeb'; border = '#d97706'; font = 'Georgia,serif'; hero = 'linear-gradient(135deg,#fef3c7,#fde68a)'; titleColor = '#92400e';
    }

    var fontSize = '';
    if (/文字.*(大きく|大きい)|フォント.*(大きく|大きい)|読みやすく/.test(t)) fontSize = 'html{font-size:118%!important}';
    if (/文字.*(小さく|小さい)|コンパクト/.test(t)) fontSize = 'html{font-size:90%!important}';

    var highlight = '';
    if (/ハイライト|強調|目立/.test(t)) highlight = 'h1,h2,.section-title{color:#e11d48!important;text-shadow:0 0 8px rgba(225,29,72,.35)!important}';

    if (/赤|レッド/.test(t) && !/中華|アジア/.test(t)) { accent = '#dc2626'; titleColor = '#dc2626'; }
    if (/青|ブルー/.test(t)) { accent = '#2563eb'; titleColor = '#1d4ed8'; }
    if (/緑|グリーン/.test(t)) { accent = '#16a34a'; titleColor = '#15803d'; }
    if (/紫|パープル/.test(t)) { accent = '#7c3aed'; titleColor = '#6d28d9'; }

    var css = [
      'body{font-family:' + font + '!important;background:' + bg + '!important;color:' + color + '!important}',
      'h1,h2,.section-title{color:' + titleColor + '!important;font-family:' + font + '!important}',
      '.card,.card-group{background:' + cardBg + '!important;border:1px solid ' + border + '!important;color:' + color + '!important}',
      '.hero,.hero-v2{background:' + hero + '!important}',
      '.btn-play,.btn-play:hover{background:' + accent + '!important;color:#fff!important}',
      'a{color:' + accent + '!important}',
      '.site-header,.site-footer{background:' + bg + '!important;color:' + color + '!important;border-color:' + border + '!important}',
      fontSize,
      highlight
    ].filter(Boolean).join('');

    return css;
  }

  /** LLM応答からCSS / actions を強引に抽出 */
  function extractStylesFromResponse(text) {
    if (!text || typeof text !== 'string') return null;
    var t = text.trim();

    try {
      var j = JSON.parse(t);
      if (j && j.actions) return j;
    } catch (e) {}

    var s = t.indexOf('{');
    var e = t.lastIndexOf('}');
    if (s >= 0 && e > s) {
      try {
        var j2 = JSON.parse(t.slice(s, e + 1));
        if (j2 && (j2.actions || j2.css || j2.reply)) return j2;
      } catch (e2) {}
    }

    var mCss = t.match(/```(?:css)?\s*([\s\S]*?)```/i);
    if (mCss && mCss[1] && /\{/.test(mCss[1])) {
      return { reply: 'スタイルを適用しました', actions: [{ op: 'injectCSS', css: mCss[1].trim() }] };
    }

    var mStyle = t.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (mStyle && mStyle[1] && /\{/.test(mStyle[1])) {
      return { reply: 'スタイルを適用しました', actions: [{ op: 'injectCSS', css: mStyle[1].trim() }] };
    }

    var mRaw = t.match(/((?:body|html|h1|h2|\.card|\.hero)[^{]*\{[\s\S]{10,})/);
    if (mRaw) {
      var cssRaw = mRaw[1];
      var lastBrace = cssRaw.lastIndexOf('}');
      if (lastBrace > 0) cssRaw = cssRaw.slice(0, lastBrace + 1);
      return { reply: 'スタイルを適用しました', actions: [{ op: 'injectCSS', css: cssRaw }] };
    }

    var mCssProp = t.match(/"css"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (mCssProp && mCssProp[1]) {
      var cssUnesc = mCssProp[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      if (/\{/.test(cssUnesc)) {
        return { reply: 'スタイルを適用しました', actions: [{ op: 'injectCSS', css: cssUnesc }] };
      }
    }

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
      '    <textarea class="ai-chat-input" id="ai-input" rows="1" placeholder="例: アジア風にして / 文字大きく"></textarea>',
      '    <button type="button" class="ai-btn ai-btn-send" id="ai-btn-send">➤</button>',
      '  </div>',
      '  <div class="ai-chat-hints">',
      '    <button type="button" data-hint="アジア風にして">アジア風</button>',
      '    <button type="button" data-hint="ヨーロッパ風にして">ヨーロッパ</button>',
      '    <button type="button" data-hint="和風にして">和風</button>',
      '    <button type="button" data-hint="ダークモードにして">ダーク</button>',
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
    appendMessage('system', '自然言語でデザイン変更できます。「アジア風にして」「文字を大きく」など。');
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

  function setTyping(on) { typingEl.classList.toggle('visible', !!on); }

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
      appendMessage('system', 'LLM準備完了。自由に依頼してください。');
    } catch (err) {
      engineLoading = false;
      setStatus(true, '読込失敗', 0);
      document.getElementById('ai-status-label').textContent = '読込失敗（ルール生成は可）';
      appendMessage('system', 'LLM読込失敗。キーワードからテーマ生成は可能です。');
    }
  }

  function markApplied(msgEl, label) {
    var b = document.createElement('div');
    b.className = 'actions-badge';
    b.textContent = label || '✓ ページに適用・保存';
    msgEl.appendChild(b);
  }

  async function runChat(userText) {
    if (userText.trim() === 'リセット' || (/リセット|元に戻/.test(userText) && /変更|全部|すべて|デザイン/.test(userText))) {
      appendMessage('assistant', 'リセットしてリロードします。');
      await clearEdits();
      return;
    }

    var themeCss = generateThemeCSS(userText);
    var hasThemeHint = /風|モード|テーマ|デザイン|色|背景|文字|フォント|大きく|小さく|ダーク|明るい|強調|ハイライト|アジア|ヨーロッパ|和|洋|中華|ネオン|パステル|レトロ|北欧|トロピカル/.test(userText);

    if (hasThemeHint && (!engineReady || !engine)) {
      applyActions([{ op: 'injectCSS', css: themeCss }], true);
      var el0 = appendMessage('assistant', 'デザインを反映しました。');
      markApplied(el0);
      if (!engineLoading) initEngine();
      return;
    }

    if (!engineReady || !engine) {
      appendMessage('assistant', 'モデル準備中です。少々お待ちください（テーマ語は今すぐ反映できます）。');
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
          { role: 'user', content: userText + '\n\n上記のJSON形式のみで返答。cssに実際のCSSを入れること。' }
        ],
        temperature: 0.1,
        max_tokens: 600,
        stream: true
      });
      var full = '';
      var msgEl = appendMessage('assistant', '');
      for await (var chunk of chunks) {
        var delta = (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) || '';
        full += delta;
        msgEl.textContent = full.slice(0, 280) + (full.length > 280 ? '…' : '');
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      messages.push({ role: 'assistant', content: full });

      var parsed = extractStylesFromResponse(full);
      if (parsed && Array.isArray(parsed.actions) && parsed.actions.length) {
        var hasRealCss = parsed.actions.some(function (a) {
          return a.op === 'injectCSS' && a.css && /\{/.test(a.css);
        });
        if (hasRealCss) {
          applyActions(parsed.actions, true);
          msgEl.textContent = parsed.reply || 'デザインを反映しました。';
          markApplied(msgEl, '✓ ' + parsed.actions.length + ' 件をページに適用');
          return;
        }
      }

      if (hasThemeHint || themeCss) {
        applyActions([{ op: 'injectCSS', css: themeCss }], true);
        msgEl.textContent = 'デザインを反映しました。';
        markApplied(msgEl);
        return;
      }

      msgEl.textContent = '反映できる変更が見つかりませんでした。「アジア風にして」「文字を大きくして」のように試してください。';
    } catch (err) {
      if (hasThemeHint) {
        applyActions([{ op: 'injectCSS', css: themeCss }], true);
        appendMessage('assistant', 'デザインを反映しました。');
      } else {
        appendMessage('assistant', 'エラー: ' + (err.message || err));
      }
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
    try { recognition.start(); isListening = true; micBtn.classList.add('listening'); } catch (e) {}
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
