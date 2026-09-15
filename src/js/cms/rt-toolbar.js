/*! Asobi CMS rich-text toolbar — compact (Docs-like) */
(function (g) {
  function $(id) { return document.getElementById(id); }

  function cmykToHex(c, m, y, k) {
    c = Math.min(100, Math.max(0, Number(c) || 0)) / 100;
    m = Math.min(100, Math.max(0, Number(m) || 0)) / 100;
    y = Math.min(100, Math.max(0, Number(y) || 0)) / 100;
    k = Math.min(100, Math.max(0, Number(k) || 0)) / 100;
    var r = Math.round(255 * (1 - c) * (1 - k));
    var gg = Math.round(255 * (1 - m) * (1 - k));
    var b = Math.round(255 * (1 - y) * (1 - k));
    function h(n) { var s = n.toString(16); return s.length < 2 ? '0' + s : s; }
    return '#' + h(r) + h(gg) + h(b);
  }
  function rgbToHex(r, g, b) {
    r = Math.min(255, Math.max(0, Number(r) || 0));
    g = Math.min(255, Math.max(0, Number(g) || 0));
    b = Math.min(255, Math.max(0, Number(b) || 0));
    function h(n) { var s = Math.round(n).toString(16); return s.length < 2 ? '0' + s : s; }
    return '#' + h(r) + h(g) + h(b);
  }
  function normalizeColor(input) {
    if (!input) return null;
    var s = String(input).trim();
    var named = {
      '赤': '#e11d48', 'あか': '#e11d48', 'red': '#e11d48',
      '青': '#2563eb', 'あお': '#2563eb', 'blue': '#2563eb',
      '緑': '#16a34a', 'みどり': '#16a34a', 'green': '#16a34a',
      '黄': '#eab308', 'き': '#eab308', 'yellow': '#eab308',
      '橙': '#f97316', 'オレンジ': '#f97316', 'orange': '#f97316',
      '紫': '#7c3aed', 'むらさき': '#7c3aed', 'purple': '#7c3aed',
      '桃': '#ec4899', 'ピンク': '#ec4899', 'pink': '#ec4899',
      '茶': '#92400e', '茶色': '#92400e', 'brown': '#92400e',
      '灰': '#6b7280', 'グレー': '#6b7280', 'gray': '#6b7280', 'grey': '#6b7280',
      '黒': '#111827', 'くろ': '#111827', 'black': '#111827',
      '白': '#ffffff', 'しろ': '#ffffff', 'white': '#ffffff',
      '水色': '#22d3ee', '空': '#38bdf8', 'sky': '#38bdf8',
      '金': '#d4a017', '銀': '#9ca3af'
    };
    var low = s.toLowerCase();
    if (named[s] || named[low]) return named[s] || named[low];
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
    var rgb = s.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgb) return rgbToHex(rgb[1], rgb[2], rgb[3]);
    var cmyk = s.match(/^cmyk\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (cmyk) return cmykToHex(cmyk[1], cmyk[2], cmyk[3], cmyk[4]);
    return s;
  }

  function applyCmd(cmd, val) {
    try { document.execCommand(cmd, false, val); } catch (e) {}
  }

  var openPanel = null;
  function closePanels() {
    if (openPanel) {
      openPanel.classList.add('rt-hidden');
      openPanel = null;
    }
  }
  document.addEventListener('mousedown', function (e) {
    if (openPanel && !openPanel.contains(e.target) && !(e.target.closest && e.target.closest('.rt-btn-wrap'))) {
      closePanels();
    }
  });

  var FG_PRESETS = [
    '#111827', '#e11d48', '#2563eb', '#16a34a', '#eab308',
    '#f97316', '#7c3aed', '#ec4899', '#92400e', '#6b7280',
    '#ffffff', '#22d3ee', '#d4a017', '#0f766e', '#7f1d1d'
  ];
  var BG_PRESETS = [
    'transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca',
    '#e9d5ff', '#fed7aa', '#e5e7eb', '#fce7f3', '#d1fae5'
  ];

  function buildColorPanel(mode, onPick) {
    var panel = document.createElement('div');
    panel.className = 'rt-panel rt-hidden';
    panel.setAttribute('role', 'dialog');

    var title = document.createElement('div');
    title.className = 'rt-panel-title';
    title.textContent = mode === 'fg' ? '文字色' : 'マーカー';
    panel.appendChild(title);

    var grid = document.createElement('div');
    grid.className = 'rt-swatch-grid';
    var list = mode === 'fg' ? FG_PRESETS : BG_PRESETS;
    list.forEach(function (c) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rt-swatch-cell' + (c === 'transparent' ? ' rt-swatch-none' : '');
      btn.title = c === 'transparent' ? 'なし' : c;
      if (c !== 'transparent') btn.style.background = c;
      btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      btn.addEventListener('click', function () {
        onPick(c === 'transparent' ? 'transparent' : c);
        closePanels();
      });
      grid.appendChild(btn);
    });
    panel.appendChild(grid);

    var custom = document.createElement('div');
    custom.className = 'rt-panel-custom';

    var pick = document.createElement('input');
    pick.type = 'color';
    pick.value = mode === 'fg' ? '#111827' : '#fef08a';
    pick.title = 'カラーピッカー';
    pick.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    pick.addEventListener('input', function () { onPick(pick.value); });
    custom.appendChild(pick);

    var code = document.createElement('input');
    code.type = 'text';
    code.className = 'rt-panel-code';
    code.placeholder = '赤 / #hex / rgb() / cmyk()';
    code.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    function applyCode() {
      var hex = normalizeColor(code.value);
      if (hex) onPick(hex);
      closePanels();
    }
    code.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); applyCode(); }
    });
    custom.appendChild(code);

    var applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'rt-panel-apply';
    applyBtn.textContent = '適用';
    applyBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
    applyBtn.addEventListener('click', applyCode);
    custom.appendChild(applyBtn);

    panel.appendChild(custom);

    var details = document.createElement('details');
    details.className = 'rt-panel-more';
    var sum = document.createElement('summary');
    sum.textContent = 'RGB / CMYK';
    details.appendChild(sum);

    var moreBody = document.createElement('div');
    moreBody.className = 'rt-panel-more-body';

    var rgbRow = document.createElement('div');
    rgbRow.className = 'rt-panel-row';
    rgbRow.innerHTML = '<span>RGB</span>' +
      '<input type="number" min="0" max="255" value="0" data-ch="r" title="R">' +
      '<input type="number" min="0" max="255" value="0" data-ch="g" title="G">' +
      '<input type="number" min="0" max="255" value="0" data-ch="b" title="B">' +
      '<button type="button" data-act="rgb">→</button>';
    moreBody.appendChild(rgbRow);

    var cmykRow = document.createElement('div');
    cmykRow.className = 'rt-panel-row';
    cmykRow.innerHTML = '<span>CMYK</span>' +
      '<input type="number" min="0" max="100" value="0" data-ch="c" title="C%">' +
      '<input type="number" min="0" max="100" value="0" data-ch="m" title="M%">' +
      '<input type="number" min="0" max="100" value="0" data-ch="y" title="Y%">' +
      '<input type="number" min="0" max="100" value="0" data-ch="k" title="K%">' +
      '<button type="button" data-act="cmyk">→</button>';
    moreBody.appendChild(cmykRow);

    details.appendChild(moreBody);
    panel.appendChild(details);

    moreBody.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    moreBody.querySelector('[data-act=rgb]').addEventListener('click', function (e) {
      e.preventDefault();
      var r = rgbRow.querySelector('[data-ch=r]').value;
      var g = rgbRow.querySelector('[data-ch=g]').value;
      var b = rgbRow.querySelector('[data-ch=b]').value;
      onPick(rgbToHex(r, g, b));
      closePanels();
    });
    moreBody.querySelector('[data-act=cmyk]').addEventListener('click', function (e) {
      e.preventDefault();
      var c = cmykRow.querySelector('[data-ch=c]').value;
      var m = cmykRow.querySelector('[data-ch=m]').value;
      var y = cmykRow.querySelector('[data-ch=y]').value;
      var k = cmykRow.querySelector('[data-ch=k]').value;
      onPick(cmykToHex(c, m, y, k));
      closePanels();
    });

    return panel;
  }

  function buildRtToolbar(tb) {
    var targetId = tb.getAttribute('data-for');
    if (!targetId) return;
    tb.innerHTML = '';
    tb.className = 'rt-toolbar rt-toolbar-compact';

    function focusArea() {
      var area = $(targetId);
      if (area) area.focus();
    }
    function btn(label, title, onClick, extraClass) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rt-icon' + (extraClass ? ' ' + extraClass : '');
      b.title = title;
      b.innerHTML = label;
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () {
        focusArea();
        onClick();
      });
      tb.appendChild(b);
      return b;
    }
    function sep() {
      var s = document.createElement('span');
      s.className = 'rt-sep';
      s.setAttribute('aria-hidden', 'true');
      tb.appendChild(s);
    }
    function wrapBtn(inner, title) {
      var w = document.createElement('span');
      w.className = 'rt-btn-wrap';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rt-icon';
      b.title = title;
      b.innerHTML = inner;
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      w.appendChild(b);
      tb.appendChild(w);
      return { wrap: w, btn: b };
    }

    btn('<b>B</b>', '太字 (Ctrl+B)', function () { applyCmd('bold'); });
    btn('<i>I</i>', '斜体 (Ctrl+I)', function () { applyCmd('italic'); });
    btn('<u>U</u>', '下線 (Ctrl+U)', function () { applyCmd('underline'); });
    btn('<s>S</s>', '打ち消し線', function () { applyCmd('strikeThrough'); });
    sep();

    var sizeSel = document.createElement('select');
    sizeSel.className = 'rt-size';
    sizeSel.title = '文字サイズ';
    [
      { v: '', t: 'サイズ' },
      { v: '1', t: '極小' },
      { v: '2', t: '小' },
      { v: '3', t: '標準' },
      { v: '4', t: 'やや大' },
      { v: '5', t: '大' },
      { v: '6', t: '特大' },
      { v: '7', t: '最大' }
    ].forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.t;
      sizeSel.appendChild(opt);
    });
    sizeSel.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    sizeSel.addEventListener('change', function () {
      focusArea();
      if (sizeSel.value) applyCmd('fontSize', sizeSel.value);
      sizeSel.selectedIndex = 0;
    });
    tb.appendChild(sizeSel);
    sep();

    var fgState = { color: '#111827' };
    var fg = wrapBtn(
      '<span class="rt-a">A</span><span class="rt-bar" style="background:#111827"></span>',
      '文字色'
    );
    var fgPanel = buildColorPanel('fg', function (c) {
      focusArea();
      if (c && c !== 'transparent') {
        fgState.color = c;
        fg.btn.querySelector('.rt-bar').style.background = c;
        applyCmd('foreColor', c);
      }
    });
    fg.wrap.appendChild(fgPanel);
    fg.btn.addEventListener('click', function () {
      focusArea();
      if (openPanel === fgPanel) { closePanels(); return; }
      closePanels();
      fgPanel.classList.remove('rt-hidden');
      openPanel = fgPanel;
    });

    var bgState = { color: '#fef08a' };
    var bg = wrapBtn(
      '<span class="rt-hl">🖍</span><span class="rt-bar" style="background:#fef08a"></span>',
      'マーカー'
    );
    var bgPanel = buildColorPanel('bg', function (c) {
      focusArea();
      bgState.color = c;
      bg.btn.querySelector('.rt-bar').style.background = c === 'transparent' ? '#e5e7eb' : c;
      try { applyCmd('hiliteColor', c); } catch (e1) {}
      try { applyCmd('backColor', c); } catch (e2) {}
    });
    bg.wrap.appendChild(bgPanel);
    bg.btn.addEventListener('click', function () {
      focusArea();
      if (openPanel === bgPanel) { closePanels(); return; }
      closePanels();
      bgPanel.classList.remove('rt-hidden');
      openPanel = bgPanel;
    });
    sep();

    btn('•', '箇条書き', function () { applyCmd('insertUnorderedList'); });
    btn('1.', '番号リスト', function () { applyCmd('insertOrderedList'); });
    btn('«', 'インデント解除', function () { applyCmd('outdent'); });
    btn('»', 'インデント', function () { applyCmd('indent'); });
    sep();

    btn('Tx', '書式をクリア', function () { applyCmd('removeFormat'); }, 'rt-clear');
  }

  function bindRtToolbars() {
    document.querySelectorAll('.rt-toolbar').forEach(buildRtToolbar);
  }

  g.ASOBI_RT = {
    bindRtToolbars: bindRtToolbars,
    buildRtToolbar: buildRtToolbar,
    cmykToHex: cmykToHex,
    rgbToHex: rgbToHex,
    normalizeColor: normalizeColor
  };
})(typeof window !== 'undefined' ? window : this);
