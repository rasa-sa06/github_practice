# ぷてぃえーる — サイト再現

キッズヘアリボンブランド「ぷてぃえーる」のWebサイトをHTML/CSSで再現した静的サイトです。

## ページ構成

| ファイル | 内容 |
|---|---|
| `index.html` | TOP（ブランド紹介、ABOUT/Custom Madeへの導線） |
| `about.html` | ブランドの成り立ち |
| `custom.html` | オーダーメイドの案内 |
| `gallery.html` | 商品写真の一覧 |
| `contact.html` | お問い合わせフォーム |
| `faq.html` | よくあるご質問 |
| `css/style.css` | 全ページ共通のスタイル |
| `js/menu.js` | ヘッダーのメニュー開閉 |

## デザイン

ピンクを基調に、レース風の波線ボーダーとリボンの装飾で構成しています。
写真は `images/` に WebP で置いています。

## 動作確認

ビルド不要の静的サイトです。ローカルで確認する場合:

```
python3 -m http.server 8000
```

ブラウザで http://localhost:8000 を開いてください。
