// js/setThemeColor.js
(function() {
  // 保存されたテーマ名を取得（未設定なら HalloweenNight をデフォルトに）
  const savedThemeName = localStorage.getItem('selectedTheme') || 'HalloweenNight';

  fetch('/asobiseminar/themecolor.json')
    .then(response => response.json())
    .then(themes => {
      // JSONの中から、選ばれているテーマを探す
      const targetTheme = themes.find(t => t.name === savedThemeName) || themes[0];
      
      // HTMLの根本（:root）にCSS変数をセットするタスクを実行
      const root = document.documentElement;
      root.style.setProperty('--main-color', targetTheme.maincolor);
      root.style.setProperty('--balance-color', targetTheme.balancecolor);
      root.style.setProperty('--variation-color', targetTheme.variationcolor);
      root.style.setProperty('--accent-color', targetTheme.accentcolor);
    })
    .catch(err => console.error('テーマカラーの適用に失敗しました:', err));
})();
