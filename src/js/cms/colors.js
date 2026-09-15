/*! Asobi CMS color resolve — named / hex / rgb / hsl / cmyk */
(function (g) {
  var NAMED = {
    '赤':'#e11d48','あか':'#e11d48','red':'#e11d48','crimson':'#dc143c','scarlet':'#ff2400',
    '青':'#2563eb','あお':'#2563eb','blue':'#2563eb','navy':'#1e3a8a','紺':'#1e3a8a','藍色':'#1d4ed8',
    '水色':'#22d3ee','みずいろ':'#22d3ee','cyan':'#06b6d4','スカイブルー':'#38bdf8','空':'#38bdf8','sky':'#38bdf8','skyblue':'#87ceeb',
    '緑':'#16a34a','みどり':'#16a34a','green':'#16a34a','lime':'#84cc16','emerald':'#10b981','若葉':'#4ade80',
    '黄':'#eab308','き':'#eab308','yellow':'#eab308','gold':'#d4a017','金':'#d4a017','amber':'#f59e0b',
    '橙':'#f97316','オレンジ':'#f97316','orange':'#f97316','coral':'#ff7f50',
    '紫':'#7c3aed','むらさき':'#7c3aed','purple':'#7c3aed','violet':'#8b5cf6','lavender':'#a78bfa',
    '桃':'#ec4899','ピンク':'#ec4899','pink':'#ec4899','rose':'#f43f5e','magenta':'#d946ef',
    '茶':'#92400e','茶色':'#92400e','brown':'#92400e','chocolate':'#7c2d12',
    '灰':'#6b7280','グレー':'#6b7280','gray':'#6b7280','grey':'#6b7280','silver':'#9ca3af','銀':'#9ca3af',
    '黒':'#111827','くろ':'#111827','black':'#111827',
    '白':'#ffffff','しろ':'#ffffff','white':'#ffffff','ivory':'#fffff0',
    'ターコイズ':'#14b8a6','teal':'#0d9488','indigo':'#4f46e5','藍':'#312e81',
    'ベージュ':'#e7d3b0','beige':'#f5f5dc','クリーム':'#fff7ed','cream':'#fffdd0',
    'サイトカラー':'#2ec4b6','メインカラー':'#2ec4b6','アクセント':'#ff6b6b'
  };

  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function h2(n) { var s = Math.round(n).toString(16); return s.length < 2 ? '0' + s : s; }
  function rgbToHex(r, g, b) {
    return '#' + h2(clamp(Number(r)||0,0,255)) + h2(clamp(Number(g)||0,0,255)) + h2(clamp(Number(b)||0,0,255));
  }
  function cmykToHex(c, m, y, k) {
    c = clamp(Number(c)||0,0,100)/100; m = clamp(Number(m)||0,0,100)/100;
    y = clamp(Number(y)||0,0,100)/100; k = clamp(Number(k)||0,0,100)/100;
    return rgbToHex(255*(1-c)*(1-k), 255*(1-m)*(1-k), 255*(1-y)*(1-k));
  }
  function hslToHex(h, s, l) {
    h = ((Number(h)||0) % 360 + 360) % 360; s = clamp(Number(s)||0,0,100)/100; l = clamp(Number(l)||0,0,100)/100;
    var c = (1 - Math.abs(2*l - 1)) * s;
    var x = c * (1 - Math.abs((h/60) % 2 - 1));
    var m = l - c/2, r=0,g=0,b=0;
    if (h < 60) { r=c; g=x; }
    else if (h < 120) { r=x; g=c; }
    else if (h < 180) { g=c; b=x; }
    else if (h < 240) { g=x; b=c; }
    else if (h < 300) { r=x; b=c; }
    else { r=c; b=x; }
    return rgbToHex((r+m)*255, (g+m)*255, (b+m)*255);
  }

  function resolve(input) {
    if (input == null || input === '') return null;
    var s = String(input).trim();
    if (!s || s === '—' || s === '-') return null;
    var low = s.toLowerCase();
    if (NAMED[s] || NAMED[low]) return NAMED[s] || NAMED[low];
    if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) {
      if (s.length === 4) return '#' + s[1]+s[1]+s[2]+s[2]+s[3]+s[3];
      if (s.length === 7) return s.toLowerCase();
      if (s.length === 9) return s.slice(0, 7).toLowerCase();
      return s.toLowerCase();
    }
    var rgb = s.match(/^rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (rgb) return rgbToHex(rgb[1], rgb[2], rgb[3]);
    var hsl = s.match(/^hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
    if (hsl) return hslToHex(hsl[1], hsl[2], hsl[3]);
    var cmyk = s.match(/^cmyk\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (cmyk) return cmykToHex(cmyk[1], cmyk[2], cmyk[3], cmyk[4]);
    try {
      if (typeof document !== 'undefined') {
        var el = document.createElement('div');
        el.style.color = '';
        el.style.color = s;
        if (el.style.color) {
          var probe = document.createElement('canvas').getContext('2d');
          if (probe) {
            probe.fillStyle = '#000';
            probe.fillStyle = s;
            var v = probe.fillStyle;
            if (v && v.indexOf('rgb') === 0) {
              var m = v.match(/(\d+)/g);
              if (m && m.length >= 3) return rgbToHex(m[0], m[1], m[2]);
            }
            if (v && v[0] === '#') return resolve(v);
          }
        }
      }
    } catch (e) {}
    return null;
  }

  function resolveFromMember(data) {
    if (!data) return null;
    if (data.favoriteColorHex) {
      var h = resolve(data.favoriteColorHex);
      if (h) return h;
    }
    return resolve(data.favoriteColor);
  }


  function hexToRgb(hex) {
    hex = resolve(hex) || hex;
    if (!hex || hex[0] !== '#') return null;
    var h = hex.slice(1);
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6) return null;
    return {
      r: parseInt(h.slice(0,2), 16),
      g: parseInt(h.slice(2,4), 16),
      b: parseInt(h.slice(4,6), 16)
    };
  }
  function mixHex(hex, toward, t) {
    var a = hexToRgb(hex), b = hexToRgb(toward);
    if (!a || !b) return hex;
    return rgbToHex(
      a.r + (b.r - a.r) * t,
      a.g + (b.g - a.g) * t,
      a.b + (b.b - a.b) * t
    );
  }
  function themeVars(hex) {
    hex = resolve(hex);
    if (!hex) return null;
    var rgb = hexToRgb(hex);
    if (!rgb) return { accent: hex };
    return {
      accent: hex,
      soft: 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.14)',
      softer: 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.07)',
      medium: 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.28)',
      strong: 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.55)',
      rgb: rgb.r + ', ' + rgb.g + ', ' + rgb.b,
      light: mixHex(hex, '#ffffff', 0.35),
      dark: mixHex(hex, '#111827', 0.35)
    };
  }

  g.ASOBI_COLOR = {
    resolve: resolve,
    resolveFromMember: resolveFromMember,
    named: NAMED,
    rgbToHex: rgbToHex,
    cmykToHex: cmykToHex,
    hslToHex: hslToHex,
    hexToRgb: hexToRgb,
    mixHex: mixHex,
    themeVars: themeVars
  };
})(typeof window !== 'undefined' ? window : this);
