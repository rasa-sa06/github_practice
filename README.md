# ぷてぃえーる — サイト再現

キッズヘアリボンブランド「ぷてぃえーる」のWebサイトをHTML/CSSで再現した静的サイトです。

## ページ構成

| ファイル | 内容 |
|---|---|
| `index.html` | TOP（ブランド紹介、ABOUT/Custom Madeへの導線） |
| `about.html` | ブランドの成り立ち |
| `custom.html` | オーダーメイドの案内（依頼例・オーダーの流れ・料金の考え方） |
| `gallery.html` | 商品写真の一覧（Instagram の最新投稿から自動更新） |
| `faq.html` | よくあるご質問 |
| `contact.html` | お問い合わせフォーム |
| `css/style.css` | 全ページ共通のスタイル |
| `docs/` | 依頼者への確認事項、Instagram 連携の設定手順 |
| `scripts/` | Instagram 連携のスクリプト（GitHub Actions から実行） |

## デザイン

ピンクを基調に、レース風の波線ボーダーとリボンの装飾で構成しています。
画像はすべて WebP で、ファーストビュー以外は遅延読み込みです。

ナビゲーションはヘッダーのメニューボタン（全ページ共通）とフッターの2か所にあります。
開閉は `<details>`、FAQ の開閉も `<details>` で、JavaScript は使っていません。

## 動作確認

ビルド不要の静的サイトです。ローカルで確認する場合:

```
python3 -m http.server 8000
```

ブラウザで http://localhost:8000 を開いてください。
