# Kindle Highlights アプリ - デプロイ手順

スマホからURLにアクセスするだけで使えるようにするための手順です。

## 必要なもの（すべて無料）

1. **GitHubアカウント** - コードを保管するため
2. **Vercelアカウント** - アプリを公開するため（GitHubでログイン可能）
3. **Neonアカウント** - データベース（無料枠あり）
4. **OpenAI APIキー** - AI要約機能に使用（従量課金・少額）
5. **Discord Webhook URL** - 通知機能に使用（無料）

---

## 手順1: データベース作成（Neon）

1. https://neon.tech にアクセスしてアカウント作成
2. 「New Project」をクリック
3. プロジェクト名: `kindle-highlights`
4. リージョン: `Asia Pacific (Singapore)` を選択
5. 作成後、**Connection Details** から以下をコピー:
   - `DATABASE_URL`（Pooled connection）
   - `DIRECT_URL`（Direct connection）

---

## 手順2: Vercelにデプロイ

1. このリポジトリをGitHubにプッシュ済みであることを確認
2. https://vercel.com にGitHubでログイン
3. 「Import Project」→ GitHubリポジトリを選択
4. **Root Directory** を `kindle-highlights` に設定
5. **Environment Variables** に以下を追加:

| 変数名 | 値 |
|--------|-----|
| `DATABASE_URL` | Neonからコピーした Pooled URL |
| `DIRECT_URL` | Neonからコピーした Direct URL |
| `OPENAI_API_KEY` | OpenAIのAPIキー |

6. 「Deploy」をクリック

デプロイ完了後、`https://your-app.vercel.app` のようなURLが発行されます。

---

## 手順3: データベースのテーブル作成

Vercelのデプロイ後、ローカルで一度だけ以下を実行:

```bash
cd kindle-highlights
DATABASE_URL="neonのURL" npx prisma db push
```

または、Vercelのダッシュボードで「Functions」タブからアプリにアクセスすれば、Prismaが自動でテーブルを作成します。

---

## 手順4: Discord Webhook設定（通知を使う場合）

1. Discordでサーバーを作成（または既存のサーバーを使用）
2. サーバー設定 → 連携サービス → ウェブフック
3. 「新しいウェブフック」をクリック
4. 名前: `Kindle Highlights`
5. チャンネルを選択して「ウェブフックURLをコピー」
6. アプリの「設定」画面でこのURLを貼り付け

---

## 使い方（利用者向け）

1. 共有されたURL（`https://your-app.vercel.app`）をスマホでタップ
2. 「インポート」ボタンから My Clippings.txt をアップロード
3. 本棚に本が表示される → タップでハイライト確認
4. 「設定」でDiscord通知を設定すれば、毎朝ハイライトが届く

### スマホのホーム画面に追加（PWA）

- **iPhone**: Safari でURLを開く → 共有ボタン → 「ホーム画面に追加」
- **Android**: Chrome でURLを開く → メニュー → 「ホーム画面に追加」

これでアプリアイコンからワンタップで起動できます。
