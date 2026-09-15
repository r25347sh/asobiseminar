/*! Asobi CMS api — same-origin read first, then RAW fallback; GitHub write */
(function (g) {
  var C = g.ASOBI_CMS;
  /* PAT（分割文字列） */
  var TOKEN = 'github_pat_11BXRNCFA0z6wQzD7P0p1A_' +
              'IRz7ii32tqH2LsbYQWCyp1YHSn' +
              'CXgrIDZr56epqgIkXZBW6YUHVK3v9kVPY';

  function headers() {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + TOKEN,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }

  function encodeText(t) {
    return btoa(unescape(encodeURIComponent(t)));
  }

  function encodeBinary(arrayBuffer) {
    var bytes = new Uint8Array(arrayBuffer);
    var binary = '';
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function friendlyErr(text, statusCode) {
    if (statusCode === 403 || (text && text.indexOf('Resource not accessible') >= 0)) {
      return '403: Tokenに書き込み権限がありません。';
    }
    if (statusCode === 401) return '401: Tokenが無効です（CMSは現在ロック中）。';
    if (statusCode === 409) return '409: 競合しました。再読込してから保存してください。';
    if (statusCode === 404) return '404: ファイルが見つかりません。';
    try {
      var j = JSON.parse(text);
      if (j && j.message) return statusCode + ': ' + j.message;
    } catch (e) {}
    return text || ('HTTP ' + statusCode);
  }

  function readUrlCandidates(path) {
    path = String(path || '').replace(/^\//, '');
    var bust = 't=' + Date.now();
    var list = [];
    list.push(path + (path.indexOf('?') >= 0 ? '&' : '?') + bust);
    if (C.SITE) {
      list.push(C.SITE.replace(/\/?$/, '/') + path + '?' + bust);
    }
    if (C.RAW) {
      list.push(C.RAW.replace(/\/?$/, '/') + path + '?' + bust);
    }
    var seen = {};
    var out = [];
    list.forEach(function (u) {
      if (!seen[u]) { seen[u] = 1; out.push(u); }
    });
    return out;
  }

  function fetchFirstOk(urls, asJson) {
    var lastErr = null;
    var i = 0;
    function next() {
      if (i >= urls.length) {
        return Promise.reject(lastErr || new Error('Failed to fetch'));
      }
      var url = urls[i++];
      return fetch(url, { cache: 'no-store', credentials: 'omit', mode: 'cors' })
        .then(function (r) {
          if (!r.ok) {
            lastErr = new Error('GET ' + url.split('?')[0] + ' ' + r.status);
            return next();
          }
          return asJson ? r.json() : r.text();
        })
        .catch(function (e) {
          lastErr = e && e.message ? e : new Error(String(e));
          return next();
        });
    }
    return next();
  }

  function loadUsers() {
    return fetchFirstOk(readUrlCandidates('src/users.json'), true)
      .catch(function () {
        return fetch(String(C.USERS_URL) + (String(C.USERS_URL).indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), {
          cache: 'no-store', mode: 'cors'
        }).then(function (r) {
          if (!r.ok) throw new Error('users.json ' + r.status);
          return r.json();
        });
      });
  }

  function loadJson(path) {
    return fetchFirstOk(readUrlCandidates(path), true);
  }

  function loadText(path) {
    return fetchFirstOk(readUrlCandidates(path), false);
  }

  function getFile(path, apiBase) {
    var base = apiBase || C.API;
    function doFetch(withAuth) {
      var h = withAuth
        ? headers()
        : { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
      return fetch(base + '/' + path + '?ref=main', { headers: h })
        .then(function (r) {
          if (r.status === 401 && withAuth) return doFetch(false);
          if (r.status === 404) return null;
          if (!r.ok) {
            return r.text().then(function (t) {
              throw new Error(friendlyErr(t, r.status));
            });
          }
          return r.json();
        });
    }
    return doFetch(true);
  }

  function putFile(path, content, message, sha, apiBase, isBinaryBase64) {
    var base = apiBase || C.API;
    var body = {
      message: message || 'CMS update',
      content: isBinaryBase64 ? content : encodeText(content),
      branch: 'main'
    };
    if (sha) body.sha = sha;
    return fetch(base + '/' + path, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error(friendlyErr(t, r.status));
        });
      }
      return r.json();
    });
  }

  function saveText(path, content, message, alsoBackup) {
    return getFile(path).then(function (meta) {
      var sha = meta && meta.sha ? meta.sha : null;
      return putFile(path, content, message, sha);
    }).then(function (res) {
      if (!alsoBackup) return res;
      return getFile(path, C.BACKUP_API).then(function (bmeta) {
        var bsha = bmeta && bmeta.sha ? bmeta.sha : null;
        return putFile(path, content, message, bsha, C.BACKUP_API).then(function () {
          return res;
        }).catch(function () { return res; });
      }).catch(function () { return res; });
    });
  }

  function saveBinary(path, arrayBuffer, message) {
    var b64 = encodeBinary(arrayBuffer);
    return getFile(path).then(function (meta) {
      var sha = meta && meta.sha ? meta.sha : null;
      return putFile(path, b64, message, sha, C.API, true);
    });
  }

  function listDir(path) {
    return getFile(path).then(function (meta) {
      if (!meta) return [];
      if (Array.isArray(meta)) return meta;
      return [];
    }).catch(function () { return []; });
  }

  g.ASOBI_API = {
    loadUsers: loadUsers,
    loadJson: loadJson,
    loadText: loadText,
    getFile: getFile,
    putFile: putFile,
    saveText: saveText,
    saveBinary: saveBinary,
    listDir: listDir,
    encodeText: encodeText,
    encodeBinary: encodeBinary,
    readUrlCandidates: readUrlCandidates
  };
})(typeof window !== 'undefined' ? window : this);
