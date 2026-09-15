/*! Asobi CMS api (read + hooks) */
(function (g) {
  var C = g.ASOBI_CMS;

  function loadUsers() {
    return fetch(C.USERS_URL, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('users.json ' + r.status);
        return r.json();
      });
  }

  function loadJson(path) {
    var url = C.RAW + path + '?t=' + Date.now();
    return fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('GET ' + path + ' ' + r.status);
        return r.json();
      });
  }

  function loadText(path) {
    var url = C.RAW + path + '?t=' + Date.now();
    return fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('GET ' + path + ' ' + r.status);
        return r.text();
      });
  }

  g.ASOBI_API = {
    loadUsers: loadUsers,
    loadJson: loadJson,
    loadText: loadText
  };
})(typeof window !== 'undefined' ? window : this);
