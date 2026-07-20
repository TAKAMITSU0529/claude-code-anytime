# 🍙 売上報告ダッシュボード（お結び屋 日本の心）

キッチンカー出店の「売上報告シート」をデジタル化したWebアプリです。
スマホ・PCのブラウザから使えます。

## できること

- 紙の売上報告シートと同じ流れで入力: 基本情報 → 元金 → 仕込み量 → レシート撮影 → 売上 → 振り返り
- **レシート写真のAI読み取り**: 精算レシート（日計明細・商品別PLU・時間帯別）を撮影すると、Claude APIが数字を自動で入力欄に反映
- 金種×枚数の入力から **現金売上・本日の売上・手残りを自動計算**（レジ純売との差額チェック付き）
- 日付順の一覧・月間サマリー・イベント詳細（時間帯別グラフ、商品別内訳、仕込みvs販売数）
- 分析ダッシュボード: 月別推移、商品ランキング、時間帯別平均、天気別平均
- **確定ボタンでGoogleドライブの「売上台帳」スプレッドシートへ自動追記**
- 共通パスワードによるアクセス制限

## 技術構成

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + Neon Postgres
- Anthropic API（レシートOCR）/ Google Sheets API（台帳連携）/ Vercel Blob（画像保存）

## 開発

```bash
cp .env.example .env  # 値を設定
npm install
npm run build         # prisma generate + db push + next build
npm run seed          # サンプルデータ投入（任意）
npm run dev
```

デプロイ手順は [DEPLOY.md](./DEPLOY.md) を参照してください。
