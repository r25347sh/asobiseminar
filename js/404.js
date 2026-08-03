// js/404.js - Asobi Lab. 遊び心404
(function () {
  'use strict';

  const messages = [
    'このページは『遊び』に夢中になって帰ってこないようです。',
    '404。実験が暴走したか、ページがサボっている可能性大。',
    '迷子のページを発見しました。中身は空っぽでした。',
    'ここは存在しない座標です。Asobi Lab. の地図に載っていません。',
    'ページが「もっと遊ぼう」と言って行方不明になりました。',
    '多次元の遊び空間で座標がズレました。戻るボタンを押してください。',
    'このURLはまだ生まれていません。もしくは既に遊び終わっています。',
    '探索失敗。次の遊び場はメニューから選んでください。',
    'ページが見つかりません。代わりに想像で埋めてみては？',
    'エラーコード: PLAY_TOO_HARD。遊びすぎ注意報です。'
  ];

  const searchingPhrases = [
    '座標を走査中…',
    '遊び空間をスキャン中…',
    '多次元マップを照合中…',
    'ページの気配を探しています…',
    '実験ログを解析中…'
  ];

  const msgEl   = document.getElementById('errorMessage');
  const codeEl  = document.getElementById('errorCode');
  const hintEl  = document.getElementById('errorHint');
  const reroll  = document.getElementById('rerollBtn');

  if (!msgEl || !reroll) return;

  let currentIndex = 0;
  let isBusy = false;

  // 初期メッセージをランダムに
  currentIndex = Math.floor(Math.random() * messages.length);
  msgEl.textContent = messages[currentIndex];

  function pickNextMessage() {
    let next;
    do {
      next = Math.floor(Math.random() * messages.length);
    } while (next === currentIndex && messages.length > 1);
    currentIndex = next;
    return messages[currentIndex];
  }

  function fakeSearch() {
    if (isBusy) return;
    isBusy = true;

    const phrase = searchingPhrases[Math.floor(Math.random() * searchingPhrases.length)];
    hintEl.textContent = phrase;
    hintEl.classList.add('is-searching');
    codeEl.classList.add('is-searching');
    msgEl.classList.add('is-fading');

    // 少し待ってから結果
    setTimeout(() => {
      msgEl.textContent = pickNextMessage();
      msgEl.classList.remove('is-fading');

      setTimeout(() => {
        codeEl.classList.remove('is-searching');
        hintEl.classList.remove('is-searching');
        hintEl.textContent = 'ヒント: メニューから好きな場所へ飛んでみてください';
        isBusy = false;
      }, 420);
    }, 680);
  }

  reroll.addEventListener('click', fakeSearch);

  // 404をクリックしても少し遊べる
  if (codeEl) {
    codeEl.addEventListener('click', () => {
      if (isBusy) return;
      codeEl.style.transform = 'scale(1.12) rotate(' + (Math.random() > 0.5 ? 3 : -3) + 'deg)';
      setTimeout(() => {
        codeEl.style.transform = '';
      }, 280);
    });
  }
})();
