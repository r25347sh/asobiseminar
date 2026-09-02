/*! Asobi Auth mix — SHA-256 + lane exchange */
(function (g) {
  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  function sha256(ascii) {
    var K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    var H0 = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var bytes = [];
    for (var i = 0; i < ascii.length; i++) {
      var c = ascii.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63)); }
      else if (c < 0xd800 || c >= 0xe000) {
        bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      } else {
        i++;
        c = 0x10000 + (((c & 0x3ff) << 10) | (ascii.charCodeAt(i) & 0x3ff));
        bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      }
    }
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (var j = 7; j >= 0; j--) bytes.push((bitLen / Math.pow(2, j * 8)) & 0xff);
    for (var off = 0; off < bytes.length; off += 64) {
      var w = new Array(64);
      for (var t = 0; t < 16; t++) {
        w[t] = (bytes[off + t * 4] << 24) | (bytes[off + t * 4 + 1] << 16) |
               (bytes[off + t * 4 + 2] << 8) | (bytes[off + t * 4 + 3]);
      }
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = H0[0], b = H0[1], c = H0[2], d = H0[3], e = H0[4], f = H0[5], gg = H0[6], h = H0[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & gg);
        var t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = gg; gg = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H0[0] = (H0[0] + a) | 0; H0[1] = (H0[1] + b) | 0; H0[2] = (H0[2] + c) | 0;
      H0[3] = (H0[3] + d) | 0; H0[4] = (H0[4] + e) | 0; H0[5] = (H0[5] + f) | 0;
      H0[6] = (H0[6] + gg) | 0; H0[7] = (H0[7] + h) | 0;
    }
    var out = '';
    for (i = 0; i < 8; i++) {
      for (j = 7; j >= 0; j--) out += ((H0[i] >>> (j * 4)) & 0xf).toString(16);
    }
    return out;
  }

  function bytesToStr(arr) {
    var s = '';
    for (var i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i] & 0xff);
    return s;
  }

  function laneMix(id, pass) {
    var a = g.__ASOBI_SEED_A__ || [];
    var b = g.__ASOBI_SEED_B__ || [];
    var ta = g.__ASOBI_TAG_A__ || 'A';
    var tb = g.__ASOBI_TAG_B__ || 'B';
    var left = ta + '|' + id + '|' + bytesToStr(a);
    var right = bytesToStr(b) + '|' + pass + '|' + tb;
    var h1 = sha256(left + '#' + right);
    var h2 = sha256(right + '#' + left + '#' + h1);
    var acc = h2;
    for (var i = 0; i < 128; i++) {
      var piece = String.fromCharCode(a[i % a.length] ^ b[i % b.length]) + pass.charAt(i % Math.max(pass.length, 1)) + id.charAt(i % Math.max(id.length, 1));
      acc = sha256(acc + piece + (i % 2 === 0 ? h1 : h2));
    }
    return sha256(acc + ta + tb + id);
  }

  g.__ASOBI_MIX__ = { sha256: sha256, laneMix: laneMix };
})(typeof globalThis !== 'undefined' ? globalThis : window);
