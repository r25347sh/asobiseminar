/*! Asobi CMS rich-text toolbar */
(function (g) {
  function $(id) { return document.getElementById(id); }
  function cmykToHex(c, m, y, k) {
    c = Math.min(100, Math.max(0, Number(c) || 0)) / 100;
    m = Math.min(100, Math.max(0, Number(m) || 0)) / 100;
    y = Math.min(100, Math.max(0, Number(y) || 0)) / 100;
    k = Math.min(100, Math.max(0, Number(k) || 0)) / 100;
    var r = Math.round(255 * (1 - c) * (1 - k));
    var gch = Math.round(255 * (1 - m) * (1 - k));
    var b = Math.round(255 * (1 - y) * (1 - k));
    function h(n) { var s = n.toString(16); return s.length < 2 ? '0' + s : s; }
    return '#' + h(r) + h(gch) + h(b);
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
      '\u8d64': '#e11d48', '\u3042\u304b': '#e11d48', 'red': '#e11d48',
      '\u9752': '#2563eb', '\u3042\u304a': '#2563eb', 'blue': '#2563eb',
      '\u7dd1': '#16a34a', '\u307f\u3069\u308a': '#16a34a', 'green': '#16a34a',
      '\u9ec4': '#eab308', '\u304d': '#eab308', 'yellow': '#eab308',
      '\u6a59': '#f97316', '\u30aa\u30ec\u30f3\u30b8': '#f97316', 'orange': '#f97316',
      '\u7d2b': '#7c3aed', '\u3080\u3089\u3055\u304d': '#7c3aed', 'purple': '#7c3aed',
      '\u6843': '#ec4899', '\u30d4\u30f3\u30af': '#ec4899', 'pink': '#ec4899',
      '\u8336': '#92400e', '\u8336\u8272': '#92400e', 'brown': '#92400e',
      '\u7070': '#6b7280', '\u30b0\u30ec\u30fc': '#6b7280', 'gray': '#6b7280', 'grey': '#6b7280',
      '\u9ed2': '#111827', '\u304f\u308d': '#111827', 'black': '#111827',
      '\u767d': '#ffffff', '\u3057\u308d': '#ffffff', 'white': '#ffffff',
      '\u6c34\u8272': '#22d3ee', '\u7a7a': '#38bdf8', 'sky': '#38bdf8',
      '\u91d1': '#d4a017', '\u9280': '#9ca3af'
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
  function applyToSelection(cmd, val) {
    try { document.execCommand(cmd, false, val); } catch (err) {}
  }
  function buildRtToolbar(tb) {
    var targetId = tb.getAttribute('data-for');
    if (!targetId) return;
    tb.innerHTML = '';
    tb.classList.add('rt-toolbar-rich');

    function addBtn(label, title, onClick, className) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = className || 'rt-btn';
      b.title = title || label;
      b.innerHTML = label;
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () {
        var area = $(targetId);
        if (area) area.focus();
        onClick();
      });
      tb.appendChild(b);
      return b;
    }
    function addSep() {
      var s = document.createElement('span');
      s.className = 'rt-sep';
      s.setAttribute('aria-hidden', 'true');
      tb.appendChild(s);
    }
    function addSelect(options, title, onChange) {
      var sel = document.createElement('select');
      sel.className = 'rt-select';
      sel.title = title;
      options.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o.v;
        opt.textContent = o.t;
        sel.appendChild(opt);
      });
      sel.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      sel.addEventListener('change', function () {
        var area = $(targetId);
        if (area) area.focus();
        onChange(sel.value);
        sel.selectedIndex = 0;
      });
      tb.appendChild(sel);
      return sel;
    }

    addBtn('<b>B</b>', '\u592a\u5b57', function () { applyToSelection('bold'); });
    addBtn('<i>I</i>', '\u659c\u4f53', function () { applyToSelection('italic'); });
    addBtn('<u>U</u>', '\u4e0b\u7dda', function () { applyToSelection('underline'); });
    addBtn('<s>S</s>', '\u6253\u3061\u6d88\u3057\u7dda', function () { applyToSelection('strikeThrough'); });
    addSep();
    addSelect([
      { v: '', t: '\u30b5\u30a4\u30ba' },
      { v: '1', t: '\u6975\u5c0f' },
      { v: '2', t: '\u5c0f' },
      { v: '3', t: '\u6a19\u6e96' },
      { v: '4', t: '\u3084\u3084\u5927' },
      { v: '5', t: '\u5927' },
      { v: '6', t: '\u7279\u5927' },
      { v: '7', t: '\u6700\u5927' }
    ], '\u6587\u5b57\u30b5\u30a4\u30ba', function (v) { if (v) applyToSelection('fontSize', v); });
    addSep();
    [
      ['#e11d48', '\u8d64'], ['#2563eb', '\u9752'], ['#16a34a', '\u7dd1'], ['#eab308', '\u9ec4'],
      ['#f97316', '\u6a59'], ['#7c3aed', '\u7d2b'], ['#ec4899', '\u6843'], ['#111827', '\u9ed2']
    ].forEach(function (c) {
      addBtn('<span class="rt-swatch" style="background:' + c[0] + '"></span>', '\u6587\u5b57\u8272 ' + c[1], function () {
        applyToSelection('foreColor', c[0]);
      }, 'rt-btn rt-swatch-btn');
    });
    var fgPick = document.createElement('input');
    fgPick.type = 'color';
    fgPick.value = '#111827';
    fgPick.title = '\u6587\u5b57\u8272\uff08\u30ab\u30e9\u30fc\u30d4\u30c3\u30ab\u30fc\uff09';
    fgPick.className = 'rt-color';
    fgPick.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    fgPick.addEventListener('input', function () {
      var area = $(targetId); if (area) area.focus();
      applyToSelection('foreColor', fgPick.value);
    });
    tb.appendChild(fgPick);
    addSep();
    [
      ['#fef08a', '\u9ec4\u30de\u30fc\u30ab\u30fc'], ['#bbf7d0', '\u7dd1\u30de\u30fc\u30ab\u30fc'], ['#bfdbfe', '\u9752\u30de\u30fc\u30ab\u30fc'],
      ['#fecaca', '\u8d64\u30de\u30fc\u30ab\u30fc'], ['#e9d5ff', '\u7d2b\u30de\u30fc\u30ab\u30fc'], ['transparent', '\u30de\u30fc\u30ab\u30fc\u89e3\u9664']
    ].forEach(function (c) {
      if (c[0] === 'transparent') {
        addBtn('\ud83d\udd8d\u00d7', c[1], function () {
          applyToSelection('hiliteColor', 'transparent');
          applyToSelection('backColor', 'transparent');
        });
      } else {
        addBtn('<span class="rt-swatch rt-mark" style="background:' + c[0] + '"></span>', c[1], function () {
          try { applyToSelection('hiliteColor', c[0]); } catch (e1) {}
          try { applyToSelection('backColor', c[0]); } catch (e2) {}
        }, 'rt-btn rt-swatch-btn');
      }
    });
    var bgPick = document.createElement('input');
    bgPick.type = 'color';
    bgPick.value = '#fef08a';
    bgPick.title = '\u30de\u30fc\u30ab\u30fc\u8272\uff08\u30d4\u30c3\u30ab\u30fc\uff09';
    bgPick.className = 'rt-color';
    bgPick.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    bgPick.addEventListener('input', function () {
      var area = $(targetId); if (area) area.focus();
      try { applyToSelection('hiliteColor', bgPick.value); } catch (e1) {}
      try { applyToSelection('backColor', bgPick.value); } catch (e2) {}
    });
    tb.appendChild(bgPick);
    addSep();
    addBtn('\u2022 \u30ea\u30b9\u30c8', '\u7b87\u6761\u66f8\u304d', function () { applyToSelection('insertUnorderedList'); });
    addBtn('1. \u30ea\u30b9\u30c8', '\u756a\u53f7\u30ea\u30b9\u30c8', function () { applyToSelection('insertOrderedList'); });
    addBtn('\u00ab', '\u30a4\u30f3\u30c7\u30f3\u30c8\u89e3\u9664', function () { applyToSelection('outdent'); });
    addBtn('\u00bb', '\u30a4\u30f3\u30c7\u30f3\u30c8', function () { applyToSelection('indent'); });
    addSep();
    var colorInput = document.createElement('input');
    colorInput.type = 'text';
    colorInput.className = 'rt-color-text';
    colorInput.placeholder = '\u8d64 / #e11d48 / rgb(0,0,0) / cmyk(0,100,100,0)';
    colorInput.title = '\u6587\u5b57\u8272\uff08\u540d\u524d\u30fbHEX\u30fbRGB\u30fbCMYK\uff09';
    colorInput.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    function applyTypedColor() {
      var area = $(targetId); if (area) area.focus();
      var hex = normalizeColor(colorInput.value);
      if (hex) applyToSelection('foreColor', hex);
    }
    colorInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); applyTypedColor(); }
    });
    tb.appendChild(colorInput);
    addBtn('\u9069\u7528', '\u5165\u529b\u3057\u305f\u8272\u3092\u6587\u5b57\u8272\u306b\u9069\u7528', applyTypedColor, 'rt-btn rt-apply');
    addSep();
    var rgbWrap = document.createElement('span');
    rgbWrap.className = 'rt-rgb-wrap';
    rgbWrap.innerHTML = 'RGB <input class="rt-num" data-ch="r" type="number" min="0" max="255" value="0" title="R">' +
      '<input class="rt-num" data-ch="g" type="number" min="0" max="255" value="0" title="G">' +
      '<input class="rt-num" data-ch="b" type="number" min="0" max="255" value="0" title="B">';
    tb.appendChild(rgbWrap);
    addBtn('RGB\u2192', 'RGB\u3092\u6587\u5b57\u8272\u306b', function () {
      var r = rgbWrap.querySelector('[data-ch=r]').value;
      var gch = rgbWrap.querySelector('[data-ch=g]').value;
      var b = rgbWrap.querySelector('[data-ch=b]').value;
      applyToSelection('foreColor', rgbToHex(r, gch, b));
    }, 'rt-btn rt-apply');
    addSep();
    var cmykWrap = document.createElement('span');
    cmykWrap.className = 'rt-cmyk-wrap';
    cmykWrap.innerHTML = 'CMYK <input class="rt-num" data-ch="c" type="number" min="0" max="100" value="0" title="C%">' +
      '<input class="rt-num" data-ch="m" type="number" min="0" max="100" value="0" title="M%">' +
      '<input class="rt-num" data-ch="y" type="number" min="0" max="100" value="0" title="Y%">' +
      '<input class="rt-num" data-ch="k" type="number" min="0" max="100" value="0" title="K%">';
    tb.appendChild(cmykWrap);
    addBtn('CMYK\u2192', 'CMYK\u3092\u6587\u5b57\u8272\u306b', function () {
      var c = cmykWrap.querySelector('[data-ch=c]').value;
      var m = cmykWrap.querySelector('[data-ch=m]').value;
      var y = cmykWrap.querySelector('[data-ch=y]').value;
      var k = cmykWrap.querySelector('[data-ch=k]').value;
      applyToSelection('foreColor', cmykToHex(c, m, y, k));
    }, 'rt-btn rt-apply');
    addSep();
    addBtn('\u30af\u30ea\u30a2', '\u66f8\u5f0f\u3092\u30af\u30ea\u30a2', function () { applyToSelection('removeFormat'); });
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
