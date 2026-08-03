// js/setThemeColor.js
(function() {
  // 存在するテーマ名をデフォルトに（themecolor.json の最初のテーマ）
  const savedThemeName = localStorage.getItem('selectedTheme') || 'CyberNeon (電脳ネオン都市)';
  const savedFontName = localStorage.getItem('selectedFont') || 'Noto Sans JP - モダン標準';

  // 100%バグらせないための初期カラー
  const fallbackTheme = {
    "maincolor": "#00ff88",
    "balancecolor": "#ff00aa",
    "variationcolor": "#ffffff",
    "accentcolor": "#0a0a14"
  };

  fetch('/asobiseminar/themecolor.json')
    .then(response => {
      if (!response.ok) throw new Error('JSONの読み込みに失敗しました');
      return response.json();
    })
    .then(data => {
      const themes = data.themes || data;
      const targetTheme = themes.find(t => t.name === savedThemeName) || themes[0] || fallbackTheme;
      applyTheme(targetTheme);
      
      // ★ フォント適用
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

  // ★ フォント適用
  function applyFont(fonts) {
    const savedFont = fonts.find(f => f.name === savedFontName);
    const fontFamily = savedFont ? savedFont.fontFamily : "'Noto Sans JP', sans-serif";
    document.documentElement.style.setProperty('--font-family', fontFamily);
  }
})();
