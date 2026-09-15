/*! Asobi CMS HTML sanitize */
(function (g) {
  var FORBIDDEN_TAGS = /^(script|iframe|object|embed|link|meta|style|form|input|button|textarea|select)$/i;
  var SAFE_STYLE = /^(color|background-color|background|font-size|font-weight|font-style|text-decoration|text-align)$/i;

  function sanitizeStyle(value) {
    if (!value) return '';
    var parts = String(value).split(';');
    var out = [];
    parts.forEach(function (part) {
      var i = part.indexOf(':');
      if (i < 0) return;
      var prop = part.slice(0, i).trim();
      var val = part.slice(i + 1).trim();
      if (!SAFE_STYLE.test(prop)) return;
      if (/expression|javascript:|url\s*\(/i.test(val)) return;
      out.push(prop + ':' + val);
    });
    return out.join(';');
  }

  function sanitizeHtml(html) {
    if (html == null || html === '') return '<p></p>';
    var doc = new DOMParser().parseFromString('<div id="__root">' + html + '</div>', 'text/html');
    var root = doc.getElementById('__root');
    if (!root) return '<p></p>';

    function walk(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(function (ch) {
        if (ch.nodeType === 1) {
          var tag = ch.tagName;
          if (FORBIDDEN_TAGS.test(tag)) {
            ch.parentNode.removeChild(ch);
            return;
          }
          var attrs = Array.prototype.slice.call(ch.attributes || []);
          attrs.forEach(function (a) {
            var n = a.name.toLowerCase();
            var v = a.value || '';
            if (n.indexOf('on') === 0) ch.removeAttribute(a.name);
            else if ((n === 'href' || n === 'src') && /^\s*javascript:/i.test(v)) ch.removeAttribute(a.name);
            else if (n === 'srcdoc') ch.removeAttribute(a.name);
            else if (n === 'style') {
              var cleaned = sanitizeStyle(v);
              if (cleaned) ch.setAttribute('style', cleaned);
              else ch.removeAttribute('style');
            }
          });
          walk(ch);
        }
      });
    }
    walk(root);
    var out = root.innerHTML.trim();
    return out || '<p></p>';
  }

  function sanitizeText(s) {
    return String(s == null ? '' : s)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  g.ASOBI_SANITIZE = {
    html: sanitizeHtml,
    text: sanitizeText
  };
})(typeof window !== 'undefined' ? window : this);
