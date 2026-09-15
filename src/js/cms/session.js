/*! Asobi CMS session */
(function (g) {
  var C = g.ASOBI_CMS;
  if (!C) throw new Error('config missing');

  function readRaw() {
    try {
      var r = localStorage.getItem(C.SESSION_KEY) || sessionStorage.getItem(C.SESSION_KEY);
      if (!r) {
        r = localStorage.getItem(C.LEGACY_SESSION_KEY) || sessionStorage.getItem(C.LEGACY_SESSION_KEY);
      }
      return r ? JSON.parse(r) : null;
    } catch (e) { return null; }
  }

  function write(user) {
    var s = JSON.stringify(user);
    try { localStorage.setItem(C.SESSION_KEY, s); } catch (e1) {}
    try { sessionStorage.setItem(C.SESSION_KEY, s); } catch (e2) {}
  }

  function clear() {
    try { localStorage.removeItem(C.SESSION_KEY); } catch (e1) {}
    try { sessionStorage.removeItem(C.SESSION_KEY); } catch (e2) {}
    try { localStorage.removeItem(C.LEGACY_SESSION_KEY); } catch (e3) {}
    try { sessionStorage.removeItem(C.LEGACY_SESSION_KEY); } catch (e4) {}
  }

  function requireUser(redirectIfMissing) {
    var u = readRaw();
    if (!u || !u.id) {
      if (redirectIfMissing !== false) {
        var next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
        location.replace(C.PAGES.login + '?next=' + next);
      }
      return null;
    }
    return u;
  }

  function canEditPath(user, path) {
    if (!user) return false;
    if (user.isAdmin || user.fullAccess) return true;
    var perms = user.permissions || [];
    return perms.indexOf(path) >= 0 || perms.indexOf('*') >= 0;
  }

  g.ASOBI_SESSION = {
    get: readRaw,
    set: write,
    clear: clear,
    require: requireUser,
    canEditPath: canEditPath
  };
})(typeof window !== 'undefined' ? window : this);
