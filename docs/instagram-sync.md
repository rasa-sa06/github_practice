# Instagram 自動連携の設定手順

`gallery-row` の3枚を、Instagram の最新投稿から毎日自動で更新する仕組みです。
設定が済むまでワークフローは何もせず正常終了するので、いつ設定しても構いません。

## 仕組み

毎朝6時(JST)に GitHub Actions が動き、

1. 最新の画像投稿を3件取得（動画は自動的に除外）
2. 幅800pxにリサイズし、WebP 品質92で変換（サイト全体と同じ設定）
3. `images/ig-image1〜3.webp` を上書き
4. `alt` 属性を各投稿のキャプションから書き換え
5. 変更があれば `main` にコミット → Vercel が自動デプロイ

サイトは静的なままなので、表示速度は今と変わりません。外部スクリプトも読み込みません。

## 設定手順

### 1. Meta for Developers でアプリを作成

<https://developers.facebook.com/apps> で新規アプリを作成します。
**あなた自身のアカウントで構いません。** ユースケースは「Instagram」を選びます。

> **補足:** プロアカウントであれば「Instagram API with Instagram Login」を使えるため、
> Facebook ページとの連携は不要になっている可能性があります。設定画面の案内に従ってください。

### 2. 依頼者をテスターとして招待

アプリの「アプリの役割」→「テスター」から、依頼者の Instagram アカウントを招待します。
依頼者側で招待を承認してもらいます。

**アプリ審査（App Review）は不要です。** 開発モードのままでも、アプリに役割を持つ
アカウントのデータには アクセスできます。

### 3. アクセストークンを取得

アプリの Instagram 設定画面でトークンを生成します。
このとき依頼者が OAuth の許可画面で承認する必要があります。
**依頼者の操作はここまでです。**

短期トークンが発行された場合は、長期トークン（60日）に交換してください。

### 4. GitHub にトークンを登録

リポジトリの **Settings → Secrets and variables → Actions → New repository secret**

| Secret 名 | 中身 | 必須 |
|---|---|---|
| `INSTAGRAM_TOKEN` | 手順3で取得した長期アクセストークン | 必須 |
| `SECRETS_PAT` | `secrets: write` 権限を持つ Personal Access Token | 任意（下記参照） |

### 5. 動作確認

**Actions → Sync gallery from Instagram → Run workflow** で手動実行できます。
ログに取得した画像とキャプションが出れば成功です。

## トークンの有効期限について

Instagram の長期トークンは **60日** で失効します。
ワークフローは毎回トークンを更新しますが、新しい値を保存するには
`secrets: write` 権限のある PAT が必要です。

- `SECRETS_PAT` を設定した場合 → 毎日自動更新され、**失効しません**
- 設定しない場合 → 60日ごとに手順3〜4を手動でやり直す必要があります

長く運用するなら `SECRETS_PAT` の設定を推奨します。

## うまくいかないとき

| ログに出るもの | 原因と対処 |
|---|---|
| `INSTAGRAM_TOKEN is not set` | Secret が未登録。手順4へ |
| `Instagram API returned 400` | トークンが失効している。手順3をやり直す |
| `Need 3 image posts, the account returned N` | 画像投稿が3件未満。投稿を増やすか `scripts/sync_instagram.py` の `COUNT` を変更 |
| `Token refreshed but SECRETS_PAT is not set` | 警告のみ。動作はする（上記「有効期限」参照） |

## 手動更新に戻したい場合

`.github/workflows/instagram-sync.yml` を削除するか、Actions 画面でワークフローを
無効化してください。画像は通常のファイルなので、直接差し替えても構いません。
