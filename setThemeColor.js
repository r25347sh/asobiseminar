// js/setThemeColor.js
(function() {
  const savedThemeName = localStorage.getItem('selectedTheme') || 'HalloweenNight';

  fetch('/asobiseminar/themecolor.json')
    .then(response => {
      if (!response.ok) throw new Error('JSONの読み込みエラー');
      return response.json();
    })
    .then(themes => {
      const targetTheme = themes.find(t => t.name === savedThemeName) || themes[0];
      
      const root = document.documentElement;
      root.style.setProperty('--main-color', targetTheme.maincolor);
      root.style.setProperty('--balance-color', targetTheme.balancecolor);
      root.style.setProperty('--variation-color', targetTheme.variationcolor);
      root.style.setProperty('--accent-color', targetTheme.accentcolor);
    })
    .catch(err => console.error('テーマ適用に失敗:', err));
})();
