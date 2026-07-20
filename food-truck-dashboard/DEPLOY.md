# 売上報告ダッシュボード - デプロイ手順

スマホ・PCのブラウザからURLにアクセスするだけで使えるようにするための手順です。
kindle-highlights と同じ構成（Vercel + Neon）なので、既にアカウントがあれば流用できます。

## 必要なもの

1. **GitHubアカウント** - コードの保管（既にあります）
2. **Vercelアカウント** - アプリの公開（無料）
3. **Neonアカウント** - データベース（無料枠あり）
4. **Anthropic APIキー** - レシート写真のAI読み取りに使用（従量課金・月数百円程度）
5. **Googleサービスアカウント** - 売上台帳スプレッドシートへの自動反映に使用（無料）
6. **Vercel Blob** - レシート画像の保存（無料枠あり）

---

## 手順1: データベース作成（Neon）

1. https://neon.tech でログイン（kindle-highlights で作成済みならそのアカウント）
2. 「New Project」→ プロジェクト名: `food-truck-dashboard`
3. リージョン: `Asia Pacific (Singapore)`
4. 作成後、**Connection Details** から以下をコピー:
   - `DATABASE_URL`（Pooled connection）
   - `DIRECT_URL`（Direct connection）

## 手順2: Anthropic APIキー取得

1. https://console.anthropic.com にアクセスしてアカウント作成
2. 「API Keys」→「Create Key」でキーを作成（`sk-ant-...`で始まる文字列）
3. 「Billing」でクレジットを購入（$5あれば当面十分です。レシート1枚の読み取りは1円前後）

## 手順3: Googleサービスアカウント作成（売上台帳の自動反映用）

1. https://console.cloud.google.com にアクセス（takamitsu0529@gmail.com でログイン）
2. 上部のプロジェクト選択 →「新しいプロジェクト」→ 名前: `uriage-daicho` で作成
3. 「APIとサービス」→「ライブラリ」→「**Google Sheets API**」を検索して「有効にする」
4. 「APIとサービス」→「認証情報」→「認証情報を作成」→「**サービスアカウント**」
   - 名前: `uriage-bot` → 作成して完了（ロールは不要）
5. 作成したサービスアカウントをクリック →「キー」タブ →「鍵を追加」→「新しい鍵を作成」→ **JSON** → ダウンロード
6. ダウンロードしたJSONを開いて2つの値をメモ:
   - `client_email`（例: `uriage-bot@uriage-daicho.iam.gserviceaccount.com`）
   - `private_key`（`-----BEGIN PRIVATE KEY-----` から始まる長い文字列）
7. **Googleドライブで「2026年売上台帳」を開き、「共有」→ 上の `client_email` を追加して「編集者」権限で共有**
   （これを忘れると自動反映が失敗します）

## 手順4: Vercelにデプロイ

1. https://vercel.com にGitHubでログイン
2. 「Add New...」→「Project」→ このリポジトリ（claude-code-anytime）を選択
3. **Root Directory** に `food-truck-dashboard` を指定（重要）
4. 「Environment Variables」に以下を設定:

| 変数名 | 値 |
|---|---|
| `DATABASE_URL` | 手順1の Pooled connection |
| `DIRECT_URL` | 手順1の Direct connection |
| `ANTHROPIC_API_KEY` | 手順2のAPIキー |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 手順3の client_email |
| `GOOGLE_PRIVATE_KEY` | 手順3の private_key（JSON内の値をそのまま貼り付け。`\n` を含んでいてOK） |
| `SPREADSHEET_ID` | `1KLZYM6U92Ebg_Tp-DndHTU-j21zhXf0JWmP4iteOogA`（2026年売上台帳のID） |
| `APP_PASSWORD` | スタッフ全員で共有するログインパスワード（好きな文字列） |
| `AUTH_SECRET` | ランダムな長い文字列（https://generate-secret.vercel.app/32 などで生成） |

5. 「Deploy」をクリック → 数分でURLが発行されます

## 手順5: レシート画像の保存先（Vercel Blob）

1. Vercelのプロジェクト画面 →「Storage」タブ →「Create Database」→「**Blob**」
2. 作成すると `BLOB_READ_WRITE_TOKEN` が自動で環境変数に追加されます
3. 「Deployments」から最新デプロイを「Redeploy」して反映

※ Blob未設定でも動きます（画像がデータベースに直接保存されるため、枚数が増えると重くなります）

## 手順6: スマホのホーム画面に追加

発行されたURLをスマホで開き、

- **iPhone**: 共有ボタン →「ホーム画面に追加」
- **Android**: メニュー →「ホーム画面に追加」

アプリのように1タップで開けるようになります。

---

## 年が変わったら

翌年の売上台帳スプレッドシートを作ったら、Vercelの環境変数 `SPREADSHEET_ID` を新しいシートのIDに変更して Redeploy してください。
（IDはスプレッドシートURLの `/d/` と `/edit` の間の文字列です）

## 困ったときは

- **台帳への反映が失敗する** → 手順3-7の共有（編集者権限）ができているか確認
- **AI読み取りがエラーになる** → Anthropicのクレジット残高を確認
- **ログインできない** → Vercelの環境変数 `APP_PASSWORD` を確認
