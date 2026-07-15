// js/setThemeColor.js
(function() {
  const savedThemeName = localStorage.getItem('selectedTheme') || 'HalloweenNight';
  const savedFontName = localStorage.getItem('selectedFont') || 'Noto Sans JP - モダン標準';

  // 100%バグらせないための初期カラー
  const fallbackTheme = {
    "maincolor": "#d65f01",
    "balancecolor": "#b1c586",
    "variationcolor": "#fff7d4",
    "accentcolor": "#090000"
  };

  fetch('/asobiseminar/themecolor.json')
    .then(response => {
      if (!response.ok) throw new Error('JSONの読み込みに失敗しました');
      return response.json();
    })
    .then(data => {
      const themes = data.themes || data;
      const targetTheme = themes.find(t => t.name === savedThemeName) || fallbackTheme;
      applyTheme(targetTheme);
      
      // ★ 新規追加：フォント適用
      const fonts = data.fonts || [];
      applyFont(fonts);
    })
    .catch(err => {
      console.warn('JSON読み込み未完了のため、初期値で起動します:', err);
      applyTheme(fallbackTheme);
      // フォントはデフォルト適用
      document.documentElement.style.setProperty('--font-family', "'Noto Sans JP', sans-serif");
    });

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--main-color', theme.maincolor);
    root.style.setProperty('--balance-color', theme.balancecolor);
    root.style.setProperty('--variation-color', theme.variationcolor);
    root.style.setProperty('--accent-color', theme.accentcolor);
  }

  // ★ 新規関数：フォント適用
  function applyFont(fonts) {
    const savedFont = fonts.find(f => f.name === savedFontName);
    const fontFamily = savedFont ? savedFont.fontFamily : "'Noto Sans JP', sans-serif";
    document.documentElement.style.setProperty('--font-family', fontFamily);
  }
})();
