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
          parts.push('<li class="cms-file-inline"><object data="' + href + '" type="application/pdf">' + name + '</object></li>');
          return;
        }
      }
      parts.push('<li><a href="' + href + '" download>' + name + '</a></li>');
    });
    parts.push('</ul>');
    return parts.join('');
  }

  function applyMemberTheme(doc, data) {
    var Color = g.ASOBI_COLOR;
    var hexes = [];
    if (Color && Color.resolveAllFromMember) hexes = Color.resolveAllFromMember(data);
    else if (Color && Color.resolveFromMember) {
      var one = Color.resolveFromMember(data);
      if (one) hexes = [one];
    } else if (data && data.favoriteColorHexes) hexes = data.favoriteColorHexes;
    else if (data && data.favoriteColorHex) hexes = [data.favoriteColorHex];
    var body = doc.body;
    if (!body) return;
    var tv = (Color && Color.themeVars) ? Color.themeVars(hexes) : null;
    var hex = tv ? tv.accent : (hexes[0] || null);
    if (hex && tv) {
      body.setAttribute('data-theme-color', hex);
      if (hexes[1]) body.setAttribute('data-theme-secondary', hexes[1]);
      if (hexes[2]) body.setAttribute('data-theme-tertiary', hexes[2]);
      body.classList.add('has-member-theme');
      body.style.setProperty('--member-accent', tv.accent);
      body.style.setProperty('--member-secondary', tv.secondary);
      body.style.setProperty('--member-tertiary', tv.tertiary);
      body.style.setProperty('--member-accent-soft', tv.soft);
      body.style.setProperty('--member-accent-softer', tv.softer);
      body.style.setProperty('--member-accent-medium', tv.medium);
      body.style.setProperty('--member-accent-strong', tv.strong);
      body.style.setProperty('--member-accent-rgb', tv.rgb);
      body.style.setProperty('--member-accent-light', tv.light);
      body.style.setProperty('--member-accent-dark', tv.dark);
      body.style.setProperty('--member-on-accent', tv.on);
      body.style.setProperty('--member-secondary-soft', tv.secondarySoft);
      body.style.setProperty('--member-tertiary-soft', tv.tertiarySoft);
      body.style.setProperty('--member-title-gradient', tv.gradient);
      var slot = doc.querySelector('[data-cms-slot="favoriteColor"]');
      if (slot) {
        slot.setAttribute('data-color', hex);
        slot.style.setProperty('--swatch', hex);
        if (hexes[1]) slot.style.setProperty('--swatch-2', hexes[1]);
        if (hexes[2]) slot.style.setProperty('--swatch-3', hexes[2]);
        slot.classList.add('color-swatch');
        if (hexes.length > 1) slot.classList.add('color-swatch-multi');
      }
    } else {
      body.removeAttribute('data-theme-color');
      body.removeAttribute('data-theme-secondary');
      body.removeAttribute('data-theme-tertiary');
      body.classList.remove('has-member-theme');
      ['--member-accent','--member-secondary','--member-tertiary','--member-accent-soft','--member-accent-softer',
       '--member-accent-medium','--member-accent-strong','--member-accent-rgb','--member-accent-light',
       '--member-accent-dark','--member-on-accent','--member-secondary-soft','--member-tertiary-soft',
       '--member-title-gradient'].forEach(function (p) { body.style.removeProperty(p); });
    }
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
    applyMemberTheme(doc, data);
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
    var filesHost = doc.querySelector('[data-cms-slot="files"]') || doc.querySelector('.cms-files');
    if (filesHost) {
      filesHost.innerHTML = renderAttachments(data.attachments);
    }
    return serialize(doc);
  }


  function renderHobbiesList(hobbies) {
    var list = hobbies || [];
    if (!list.length) return '<li class="muted">—</li>';
    return list.map(function (h) {
      return '<li>' + San.text(h) + '</li>';
    }).join('');
  }
  function renderCareerTable(rows) {
    var list = rows || [];
    if (!list.length) return '<tr><td colspan="2">—</td></tr>';
    return list.map(function (row) {
      return '<tr><th scope="row">' + San.text(row.title || '') + '</th><td>' + San.text(row.detail || '') + '</td></tr>';
    }).join('');
  }
  function renderTeacherHtml(baseHtml, data) {
    var doc = new DOMParser().parseFromString(baseHtml, 'text/html');
    var name = data.displayName || '松丸先生';
    setSlot(doc, 'displayName', name, true);
    var title = doc.querySelector('h1.page-title');
    if (title) title.textContent = name;
    setSlot(doc, 'favoriteColor', data.favoriteColor || '—', true);
    var hob = doc.querySelector('[data-cms-slot="hobbiesList"]');
    if (hob) hob.innerHTML = renderHobbiesList(data.hobbies);
    var car = doc.querySelector('[data-cms-slot="careerTable"]');
    if (car) car.innerHTML = renderCareerTable(data.career);
    setSlot(doc, 'playMeaning', San.html(data.playMeaningHtml));
    setSlot(doc, 'message', San.html(data.messageHtml));
    applyMemberTheme(doc, data);
    return serialize(doc);
  }

  g.ASOBI_RENDER = {
    member: renderMemberHtml,
    group: renderGroupHtml,
    teacher: renderTeacherHtml,
    attachments: renderAttachments
  };
})(typeof window !== 'undefined' ? window : this);
