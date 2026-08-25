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
| `scripts/` | Instagram 連携と、メタ情報生成のスクリプト |
| `images/ogp.jpg` | SNSで共有されたときのサムネイル画像 |
| `favicon.ico` | ブラウザのタブに出るアイコン |
| `sitemap.xml` / `robots.txt` | 検索エンジン向け（`scripts/build_meta.py` が生成） |

## デザイン

ピンクを基調に、レース風の波線ボーダーとリボンの装飾で構成しています。
ページ内の画像はすべて WebP で、ファーストビュー以外は遅延読み込みです。

ナビゲーションはヘッダーのメニューボタン（全ページ共通）とフッターの2か所にあります。
ヘッダーメニューと FAQ の開閉はどちらも `<details>` の標準動作で、サイト全体で
JavaScript を使っていません。

## 公開URLに依存するファイル（OGP・sitemap・robots）

公開先は <https://github-practice-rouge-nine.vercel.app/> です。
このURLを使うものが3種類あり、すべて1つのスクリプトで生成しています。

| 生成物 | 役割 |
|---|---|
| 各ページ `<head>` のOGPタグ | LINE等にURLを貼ったときの画像・タイトル・説明 |
| `sitemap.xml` | 検索エンジンに全6ページの場所を伝える |
| `robots.txt` | クロールの可否と、sitemap の場所を伝える |

次のどれかをしたら、実行してください。

- ページの `<title>` や `description` を書き換えた
- ページを追加・削除した
- 独自ドメインに移した（`scripts/build_meta.py` の `DEFAULT_ORIGIN` を書き換えてから）

```
python3 scripts/build_meta.py
```

一時的に別のドメインで試したいときは `ORIGIN=https://... python3 scripts/build_meta.py`
のように環境変数で上書きできます。

## 検索エンジンへの登録（任意）

`sitemap.xml` を置いただけでも見つけてもらえますが、
[Google Search Console](https://search.google.com/search-console) に
サイトを登録して sitemap の URL を送信すると、より早く反映されます。

## 動作確認

ビルド不要の静的サイトです。ローカルで確認する場合:

```
python3 -m http.server 8000
```

ブラウザで http://localhost:8000 を開いてください。
