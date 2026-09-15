/*! Asobi CMS attachments */
(function (g) {
  var API = null;
  var ALLOWED = {
    pdf:1, jpeg:1, jpg:1, png:1, gif:1, mp3:1, mp4:1, bmp:1, doc:1, ico:1,
    mov:1, mpg:1, mpeg:1, txt:1, wav:1, wri:1, xls:1, zip:1, Z:1
  };
  var FORCE_LINK = { doc:1, xls:1, zip:1, Z:1, wri:1 };
  var MAX = 25000000;

  function extOf(name) {
    var m = String(name || '').match(/\.([A-Za-z0-9]+)$/);
    return m ? m[1] : '';
  }

  function safeName(name) {
    return String(name || 'file')
      .replace(/[^\w.\-()\u3040-\u30ff\u3400-\u9fff]+/g, '_')
      .slice(0, 120);
  }

  function uid() {
    return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function ensureApi() {
    if (!API) API = g.ASOBI_API;
    return API;
  }

  function uploadGroupFiles(groupKey, fileList, mode) {
    var api = ensureApi();
    var files = Array.prototype.slice.call(fileList || []);
    var chain = Promise.resolve([]);
    files.forEach(function (file) {
      chain = chain.then(function (acc) {
        var ext = extOf(file.name);
        if (!ALLOWED[ext] && !ALLOWED[ext.toLowerCase()]) {
          throw new Error('許可されていない拡張子です: ' + ext);
        }
        if (file.size > MAX) throw new Error('ファイルが大きすぎます（25MBまで）: ' + file.name);
        var useMode = FORCE_LINK[ext] || FORCE_LINK[ext.toLowerCase()] ? 'link' : (mode || 'link');
        var name = safeName(file.name);
        var path = 'users/_groups/' + groupKey + '/' + name;
        return file.arrayBuffer().then(function (buf) {
          return api.saveBinary(path, buf, 'CMS: upload ' + name).then(function () {
            acc.push({
              id: uid(),
              name: file.name,
              path: path,
              ext: ext.toLowerCase(),
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

  g.ASOBI_ATTACH = {
    uploadGroupFiles: uploadGroupFiles,
    extOf: extOf
  };
})(typeof window !== 'undefined' ? window : this);
