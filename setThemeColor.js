// js/setThemeColor.js
(function() {
  const savedThemeName = localStorage.getItem('selectedTheme') || 'HalloweenNight';

  // 100%バグらせないための初期カラー（もしJSON読み込みが遅れても画面をガードする）
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
    .then(themes => {
      const targetTheme = themes.find(t => t.name === savedThemeName) || fallbackTheme;
      applyTheme(targetTheme);
    })
    .catch(err => {
      console.warn('JSON読み込み未完了のため、初期値で起動します:', err);
      applyTheme(fallbackTheme);
    });

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--main-color', theme.maincolor);
    root.style.setProperty('--balance-color', theme.balancecolor);
    root.style.setProperty('--variation-color', theme.variationcolor);
    root.style.setProperty('--accent-color', theme.accentcolor);
  }
})();
