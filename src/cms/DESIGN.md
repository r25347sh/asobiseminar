# Asobi Lab. CMS プロセスA — 設計確定・データ契約

**ステータス**: 確定（2026-09-15）  
**対象リポジトリ**: `r25347sh/asobiseminar`  
**前提判断（確定）**:
- solo系2テーマ: 英語学習はグループHTML新規作成
- **サイト作成**は `pages/about_This_Site.html` に集約（グループHTML新設なし）
- 個人の「目標」欄は**廃止**
- 保存は **JSON と HTML の両方**（すべての保存）

機械可読の正本:
- `src/cms/config/groups.json`
- `src/cms/config/attachments.json`
- `src/cms/config/session.json`
- `src/cms/schema/member.schema.json`
- `src/cms/schema/group.schema.json`

---

## 1. グループ対応表

| groupKey | 表示名 | 公開 HTML | 備考 |
|----------|--------|-----------|------|
| `english` | オンラインゲームを通じた英語学習の可能性 | `pages/groups/english.html` | **新規作成** |
| `fashion` | ファッションについて | `pages/groups/fashion.html` | 既存移行 |
| `skate` | スケボーの技術向上とそのための思考 | `pages/groups/skate.html` | 既存移行 |
| `arch` | 脆い割り箸ビルを探求で強くする | `pages/groups/arch.html` | 既存移行 |
| `site` | サイト作成 | `pages/about_This_Site.html` | 集約・新設しない |

クラス: `5A`–`5H`

---

## 2. 保存契約（すべての保存）

1. フォーム検証（スキーマ）
2. リッチテキスト・サニタイズ
3. **JSON put** … `src/cms/pages/member/{id}.json` または `src/cms/pages/group/{key}.json`
4. **HTML put** … JSON の `htmlPath` をテンプレ生成して上書き
5. 添付は `users/_groups/{groupKey}/` 等へ put し JSON `attachments[]` に記録

JSONのみ・HTMLのみの保存は禁止。

個人スキーマに **goal / 目標は存在しない**。

---

## 3. HTML スロット規約

- `data-lock="true"` … 編集禁止
- `data-cms-slot="{name}"` … 挿入先
- `data-cms-page="member|group"` / `data-cms-id="{id}"`

### member スロット
`class` / `groupLabel` / `favoriteColor` / `hobbies` / `hobbyTrigger` / `growth` / `message`

ブロック: 自己概要 / 私の遊び / 探求を通して（`.cms-grad-frame`）

### group スロット（site も同一）
`goal` / `what` / `why` / `how` / `result` / `files`

ブロック: グループ目標 / 2W1H（deco-2 / deco-1） / 探求結果（`.cms-grad-frame` + 添付）

---

## 4. 画面・セッション

| ファイル | 役割 |
|----------|------|
| `login.html` | 認証 |
| `select.html` | ページ選択 |
| `editor.html` | フォーム専用（インライン編集なし） |

セッションキー: `asobilab_cms_user`  
遷移: login → select → `editor.html?type=member|group&id=`  
詳細: `src/cms/config/session.json`

---

## 5. 添付

許可拡張子・inline/link ルール: `src/cms/config/attachments.json`  
グループ添付の主対象は探求結果ブロック。

---

## 6. プロセスBへの引き継ぎ

1. 全 member HTML をスロット付き3ブロックへ
2. arch/fashion/skate をスロット付きへ
3. **`pages/groups/english.html` 新規**
4. **`about_This_Site.html` に group スロット付与**
5. グラデ枠・2W1HデコのCSS
6. サンプルJSONは `src/cms/pages/**` に配置済み

**プロセスA完了**: 本契約を B 以降の唯一の参照とする。
