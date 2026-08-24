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
| `contact.html` | お問い合わせ窓口（LINE公式アカウントへの導線） |
| `css/style.css` | 全ページ共通のスタイル |
| `docs/` | 依頼者への確認事項、Instagram 連携の設定手順 |
| `scripts/` | Instagram 連携のスクリプト（GitHub Actions から実行） |
| `images/ogp.jpg` | SNSで共有されたときのサムネイル画像 |
| `favicon.ico` | ブラウザのタブに出るアイコン |

## デザイン

ピンクを基調に、レース風の波線ボーダーとリボンの装飾で構成しています。
ページ内の画像はすべて WebP で、ファーストビュー以外は遅延読み込みです。

ナビゲーションはヘッダーのメニューボタン（全ページ共通）とフッターの2か所にあります。
ヘッダーメニューと FAQ の開閉はどちらも `<details>` の標準動作で、サイト全体で
JavaScript を使っていません。

## 共有時のサムネイル（OGP）

LINE や Instagram に URL を貼ったときに出る画像・タイトルの設定です。
各ページの `<head>` にタグが入っています。

公開先は <https://github-practice-rouge-nine.vercel.app/> で、
`og:image` と `og:url` はこのドメインの絶対URLになっています。

`<title>` や `description` を書き換えたあと、あるいは独自ドメインに
移したあとは、次を実行するとタグがそれに追従します。

```
ORIGIN=https://github-practice-rouge-nine.vercel.app python3 scripts/build_meta.py
```

`ORIGIN` を省くと画像とページのURLが相対パスに戻ります。SNS によっては
相対パスだとサムネイルを読めないので、公開先が分かっているうちは必ず付けてください。

## 動作確認

ビルド不要の静的サイトです。ローカルで確認する場合:

```
python3 -m http.server 8000
```

ブラウザで http://localhost:8000 を開いてください。
