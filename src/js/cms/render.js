/*! Asobi CMS render — JSON → 公開HTMLスロット反映 */
(function (g) {
  var C = g.ASOBI_CMS;
  var San = g.ASOBI_SANITIZE;

  function setSlot(doc, name, htmlOrText, asText) {
    var els = doc.querySelectorAll('[data-cms-slot="' + name + '"]');
    els.forEach(function (el) {
      if (asText) el.textContent = htmlOrText == null ? '' : String(htmlOrText);
      else el.innerHTML = htmlOrText || '';
    });
  }

  function serialize(doc) {
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML + '\n';
  }

  function groupLabel(key) {
    var g = C.groupByKey(key);
    return g ? g.label : (key || '');
  }

  function renderAttachments(attachments) {
    var list = attachments || [];
    if (!list.length) return '';
    var parts = ['<ul class="cms-file-list">'];
    list.forEach(function (a) {
      var href = '../../' + String(a.path || '').replace(/^\//, '');
      var mode = a.mode || 'link';
      var name = San.text(a.name || a.path || 'file');
      var ext = String(a.ext || '').toLowerCase();
      if (mode === 'inline') {
        if (/^(jpe?g|png|gif|bmp|ico|webp)$/.test(ext)) {
          parts.push('<li class="cms-file-inline"><img src="' + href + '" alt="' + name + '"></li>');
          return;
        }
        if (/^(mp3|wav)$/.test(ext)) {
          parts.push('<li class="cms-file-inline"><audio controls src="' + href + '"></audio><div>' + name + '</div></li>');
          return;
        }
        if (/^(mp4|mov|mpeg|mpg)$/.test(ext)) {
          parts.push('<li class="cms-file-inline"><video controls src="' + href + '"></video><div>' + name + '</div></li>');
          return;
        }
        if (ext === 'pdf') {
          parts.push('<li class="cms-file-inline"><object data="' + href + '" type="application/pdf"></object><div><a href="' + href + '" target="_blank" rel="noopener">' + name + '</a></div></li>');
          return;
        }
      }
      parts.push('<li><a href="' + href + '" target="_blank" rel="noopener">' + name + '</a></li>');
    });
    parts.push('</ul>');
    return parts.join('');
  }

  function renderMemberHtml(baseHtml, data) {
    var doc = new DOMParser().parseFromString(baseHtml, 'text/html');
    var label = groupLabel(data.groupKey);
    setSlot(doc, 'class', data.class || '', true);
    setSlot(doc, 'groupLabel', label, true);
    setSlot(doc, 'favoriteColor', data.favoriteColor || '—', true);
    setSlot(doc, 'hobbies', data.hobbies || '—', true);
    setSlot(doc, 'hobbyTrigger', San.html(data.hobbyTriggerHtml));
    setSlot(doc, 'growth', San.html(data.growthHtml));
    setSlot(doc, 'message', San.html(data.messageHtml));
    var g = C.groupByKey(data.groupKey);
    if (g) {
      var cta = doc.querySelector('.cta-wrap a.btn-play');
      if (cta) {
        if (data.groupKey === 'site') {
          cta.setAttribute('href', '../about_This_Site.html');
          cta.textContent = 'このサイトについて →';
        } else {
          cta.setAttribute('href', '../groups/' + data.groupKey + '.html');
          cta.textContent = 'グループページへ →';
        }
      }
    }
    return serialize(doc);
  }

  function renderGroupHtml(baseHtml, data, htmlPath) {
    var doc = new DOMParser().parseFromString(baseHtml, 'text/html');
    setSlot(doc, 'goal', San.html(data.goalHtml));
    setSlot(doc, 'what', San.html(data.whatHtml));
    setSlot(doc, 'why', San.html(data.whyHtml));
    setSlot(doc, 'how', San.html(data.howHtml));
    setSlot(doc, 'result', San.html(data.resultHtml));
    var filesHtml = renderAttachments(data.attachments || []);
    if (htmlPath === 'pages/about_This_Site.html') {
      filesHtml = filesHtml.split('../../').join('../');
    }
    setSlot(doc, 'files', filesHtml);
    return serialize(doc);
  }

  g.ASOBI_RENDER = {
    member: renderMemberHtml,
    group: renderGroupHtml,
    attachments: renderAttachments,
    groupLabel: groupLabel
  };
})(typeof window !== 'undefined' ? window : this);
