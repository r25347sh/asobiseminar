# Asobi Lab.

麗澤高等学校・遊びの探究ゼミ 公式サイト。

- サイト名: **Asobi Lab.**
- グループ: すけぼぉ / ファッション / 建築
- CMS: `admin.html`（メンバー各自のページを編集可能）

## AI Chat Editor (`AI_CHAT/`)

WebLLM を用いた音声／チャットUI操作AIです。

- 右下の 💬 ボタン（ハンバーガーの少し上）からチャットを開く
- 自然言語でデザイン変更を依頼（例: 「デザインを和風にして」「文字を大きくして」）
- ローカルLLM（WebGPU）が DOM / CSS を操作して即時適用
- 変更内容は IndexedDB（localForage）に永続化され、リロード後も復元
- 音声入力対応（🎤）・ショートカット `Ctrl/Cmd + Shift + A`

使い方: 各ページで `AI_CHAT/AI_CHAT.js` を読み込むだけで動作します（MENU と同様）。
