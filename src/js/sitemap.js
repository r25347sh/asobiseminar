/*! Asobi Lab. Sitemap — MENU 構造から描画 */
(function () {
  'use strict';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function isCurrent(url) {
    if (!url) return false;
    try {
      var a = document.createElement('a');
      a.href = url;
      var here = location.pathname.replace(/\/$/, '');
      var there = a.pathname.replace(/\/$/, '');
      return here === there || here.endsWith(there) || there.endsWith(here.split('/').pop());
    } catch (e) { return false; }
  }

  function renderItem(item, depth) {
    var li = el('li', 'sm-node' + (item.items && item.items.length ? ' has-children' : ''));
    li.style.setProperty('--depth', String(depth || 0));

    if (item.items && item.items.length) {
      var details = el('details', 'sm-branch');
      if (depth < 1) details.open = true;
      var summary = el('summary', 'sm-summary');
      var icon = el('span', 'sm-icon', item.icon || '📁');
      var label = el('span', 'sm-label', item.label || '');
      summary.appendChild(icon);
      summary.appendChild(label);
      var count = el('span', 'sm-count', String(item.items.length));
      summary.appendChild(count);
      details.appendChild(summary);
      var ul = el('ul', 'sm-children');
      item.items.forEach(function (child) {
        ul.appendChild(renderItem(child, (depth || 0) + 1));
      });
      details.appendChild(ul);
      li.appendChild(details);
    } else {
      var a = el('a', 'sm-link' + (isCurrent(item.url) ? ' is-current' : ''));
      a.href = item.url || '#';
      var icon2 = el('span', 'sm-icon', item.icon || '📄');
      var label2 = el('span', 'sm-label', item.label || item.url || '');
      a.appendChild(icon2);
      a.appendChild(label2);
      if (item.url) {
        var path = el('span', 'sm-path', String(item.url).replace(/^\.\.\//, '').replace(/^\.\//, ''));
        a.appendChild(path);
      }
      li.appendChild(a);
    }
    return li;
  }

  function renderTree(data) {
    var host = document.getElementById('sitemap-tree');
    var status = document.getElementById('sm-status');
    if (!host) return;
    host.innerHTML = '';
    var ul = el('ul', 'sm-root');
    (data || []).forEach(function (item) {
      ul.appendChild(renderItem(item, 0));
    });
    host.appendChild(ul);
    if (status) status.textContent = (data || []).length + ' カテゴリ · MENU と同期';
  }

  function setAll(open) {
    document.querySelectorAll('#sitemap-tree details').forEach(function (d) {
      d.open = open;
    });
  }

  function boot() {
    var data = null;
    if (window.ASOBI_MENU && typeof window.ASOBI_MENU.buildMenuData === 'function') {
      data = window.ASOBI_MENU.buildMenuData();
    }
    if (!data || !data.length) {
      var st = document.getElementById('sm-status');
      if (st) st.textContent = 'MENU データを取得できませんでした';
      return;
    }
    // サイトマップ自身へのリンクはツリーから省く（循環防止・見やすさ）
    data = data.filter(function (it) {
      return !(it.url && /sitemap\.html$/i.test(it.url));
    });
    renderTree(data);
    var ex = document.getElementById('sm-expand');
    var col = document.getElementById('sm-collapse');
    if (ex) ex.onclick = function () { setAll(true); };
    if (col) col.onclick = function () { setAll(false); };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
