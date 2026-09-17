/*! CMS attachments — upload / library / preview */
(function (g) {
  var API = null;
  var ALLOWED = {
    pdf:1, jpeg:1, jpg:1, png:1, gif:1, mp3:1, mp4:1, bmp:1, doc:1, ico:1,
    mov:1, mpg:1, mpeg:1, txt:1, wav:1, wri:1, xls:1, zip:1, Z:1, webp:1, svg:1
  };
  var FORCE_LINK = { doc:1, xls:1, zip:1, Z:1, wri:1 };
  var MAX = 25000000;

  function ensureApi() {
    if (!API) API = g.ASOBI_API || g.REITAN_API;
    return API;
  }
  function extOf(name) {
    var m = String(name || '').match(/\.([A-Za-z0-9]+)$/);
    return m ? m[1].toLowerCase() : '';
  }
  function safeName(name) {
    return String(name || 'file')
      .replace(/[^\w.\-()\u3040-\u30ff\u3400-\u9fff]+/g, '_')
      .slice(0, 120);
  }
  function uid() {
    return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function canInline(ext) {
    ext = (ext || '').toLowerCase();
    if (FORCE_LINK[ext]) return false;
    return /^(jpe?g|png|gif|bmp|ico|webp|svg|mp3|wav|mp4|mov|mpeg|mpg)$/.test(ext);
  }
  function siteHref(path, depth) {
    // depth: relative from page to repo root segments
    var prefix = depth === 2 ? '../../' : (depth === 1 ? '../' : '');
    return prefix + String(path || '').replace(/^\//, '');
  }
  function previewHtml(item, depth) {
    var href = siteHref(item.path, depth == null ? 2 : depth);
    var name = item.name || item.path || 'file';
    var ext = (item.ext || extOf(name)).toLowerCase();
    if (/^(jpe?g|png|gif|bmp|ico|webp|svg)$/.test(ext)) {
      return '<div class="file-preview img"><img src="' + href + '" alt="' + name.replace(/"/g,'') + '"></div>';
    }
    if (/^(mp3|wav)$/.test(ext)) {
      return '<div class="file-preview audio"><audio controls src="' + href + '"></audio></div>';
    }
    if (/^(mp4|mov|mpeg|mpg)$/.test(ext)) {
      return '<div class="file-preview video"><video controls src="' + href + '"></video></div>';
    }
    if (ext === 'pdf') {
      return '<div class="file-preview pdf"><iframe src="' + href + '" title="' + name.replace(/"/g,'') + '"></iframe></div>';
    }
    return '<div class="file-preview other"><p class="muted">プレビュー非対応</p><a href="' + href + '" target="_blank" rel="noopener">開く / ダウンロード</a></div>';
  }
  function publicRender(attachments, depth) {
    var list = attachments || [];
    if (!list.length) return '';
    var parts = ['<ul class="cms-file-list">'];
    list.forEach(function (a) {
      var href = siteHref(a.path, depth == null ? 2 : depth);
      var mode = a.mode || 'link';
      var name = String(a.name || a.path || 'file');
      var ext = (a.ext || extOf(name)).toLowerCase();
      var safe = name.replace(/</g,'&lt;');
      if (mode === 'inline' && canInline(ext)) {
        if (/^(jpe?g|png|gif|bmp|ico|webp|svg)$/.test(ext)) {
          parts.push('<li class="cms-file-inline"><img src="' + href + '" alt="' + safe + '"><div class="cms-file-cap">' + safe + '</div></li>');
          return;
        }
        if (/^(mp3|wav)$/.test(ext)) {
          parts.push('<li class="cms-file-inline"><audio controls src="' + href + '"></audio><div class="cms-file-cap">' + safe + '</div></li>');
          return;
        }
        if (/^(mp4|mov|mpeg|mpg)$/.test(ext)) {
          parts.push('<li class="cms-file-inline"><video controls src="' + href + '"></video><div class="cms-file-cap">' + safe + '</div></li>');
          return;
        }
      }
      parts.push('<li class="cms-file-link"><a href="' + href + '" download target="_blank" rel="noopener">📎 ' + safe + '</a></li>');
    });
    parts.push('</ul>');
    return parts.join('');
  }

  function uploadFiles(folderPath, fileList, mode) {
    var api = ensureApi();
    if (!api || !api.saveBinary) return Promise.reject(new Error('API未読込'));
    var files = Array.prototype.slice.call(fileList || []);
    var chain = Promise.resolve([]);
    files.forEach(function (file) {
      chain = chain.then(function (acc) {
        var ext = extOf(file.name);
        if (!ALLOWED[ext]) throw new Error('許可されていない拡張子です: ' + ext);
        if (file.size > MAX) throw new Error('ファイルが大きすぎます（25MBまで）: ' + file.name);
        var useMode = FORCE_LINK[ext] ? 'link' : (mode || 'link');
        var name = safeName(file.name);
        var path = folderPath.replace(/\/$/, '') + '/' + name;
        return file.arrayBuffer().then(function (buf) {
          return api.saveBinary(path, buf, 'CMS: upload ' + name).then(function () {
            acc.push({
              id: uid(),
              name: file.name,
              path: path,
              ext: ext,
              mode: useMode,
              size: file.size
            });
            return acc;
          });
        });
      });
    });
    return chain;
  }

  function uploadUserFiles(userId, fileList, mode) {
    return uploadFiles('users/' + userId, fileList, mode);
  }
  function uploadGroupFiles(groupKey, fileList, mode) {
    return uploadFiles('users/_groups/' + groupKey, fileList, mode);
  }
  function listUserFiles(userId) {
    var api = ensureApi();
    if (!api || !api.listDir) return Promise.resolve([]);
    return api.listDir('users/' + userId).then(function (items) {
      return (items || []).filter(function (it) {
        return it.type === 'file' && !String(it.name).startsWith('.');
      }).map(function (it) {
        return {
          id: it.sha || it.path,
          name: it.name,
          path: it.path,
          ext: extOf(it.name),
          size: it.size || 0,
          mode: 'link'
        };
      });
    }).catch(function () { return []; });
  }

  g.ASOBI_ATTACH = {
    uploadGroupFiles: uploadGroupFiles,
    uploadUserFiles: uploadUserFiles,
    uploadFiles: uploadFiles,
    listUserFiles: listUserFiles,
    publicRender: publicRender,
    previewHtml: previewHtml,
    canInline: canInline,
    extOf: extOf,
    ALLOWED: ALLOWED
  };
})(typeof window !== 'undefined' ? window : this);
