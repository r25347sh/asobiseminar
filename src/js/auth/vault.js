/*! Asobi Auth vault — public API */
(function (g) {
  function digest(id, pass) {
    id = String(id || '');
    pass = String(pass || '');
    if (!g.__ASOBI_MIX__ || !g.__ASOBI_MIX__.laneMix) {
      throw new Error('auth mix not loaded');
    }
    /* さらに vault 側で1往復 */
    var core = g.__ASOBI_MIX__.laneMix(id, pass);
    var wrap = g.__ASOBI_MIX__.sha256('vault:v1:' + id + ':' + core);
    return g.__ASOBI_MIX__.sha256(wrap + ':' + core.slice(0, 16) + ':' + id.length);
  }

  function verify(id, pass, stored) {
    if (!stored) return false;
    try {
      return digest(id, pass) === String(stored);
    } catch (e) {
      return false;
    }
  }

  g.AsobiAuth = { digest: digest, verify: verify, version: 1 };
})(typeof globalThis !== 'undefined' ? globalThis : window);
