# Kindle Highlights アプリ 要件定義書

## 1. プロジェクト概要

Kindleで読んだ本のハイライト（マーカー）を集約・管理し、AIによる要約とスケジュール通知で知識の復習を支援するWebアプリケーション。

---

## 2. システム構成

```
┌─────────────────────────────────────────────────────────────┐
│                        フロントエンド                          │
│              React + TypeScript + Tailwind CSS               │
│  ・本棚ビュー（表紙グリッド）                                    │
│  ・ハイライト詳細ビュー                                         │
│  ・通知設定パネル                                              │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API / WebSocket
┌───────────────────────▼─────────────────────────────────────┐
│                        バックエンド                            │
│                    Python (FastAPI)                          │
│  ・ハイライトインポート処理                                       │
│  ・AI要約エンジン（Claude API）                                 │
│  ・通知スケジューラー（APScheduler）                             │
│  ・書籍メタデータ取得（Open Library API / Amazon PA API）        │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                      データストア                              │
│               SQLite（開発）/ PostgreSQL（本番）               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 機能要件

### 3.1 ハイライトインポート機能

#### インポート方法（優先順位順）

| 方法 | 説明 | メリット | デメリット |
|------|------|---------|---------|
| **My Clippings.txt** | KindleデバイスをUSB接続し `documents/My Clippings.txt` を読み込む | 最も確実・オフライン対応 | デバイス接続が必要 |
| **CSVアップロード** | Amazon公式サイトのハイライトエクスポートCSVを手動アップロード | 簡単 | 手動操作が必要 |
| **Kindle Web Scraping** | `read.amazon.co.jp/notebook` をスクレイピング | 自動化可能 | 規約リスクあり・要セッション維持 |

#### My Clippings.txt パース仕様

```
入力例:
==========
ゼロ・トゥ・ワン (ピーター・ティール)
- あなたのハイライト -位置No. 123-125 | 追加日: 2024年1月15日月曜日 8:30:00

競合のない市場を作ることが真のイノベーションだ。
==========

抽出フィールド:
・書籍タイトル
・著者名
・位置（ページ番号相当）
・追加日時
・ハイライトテキスト
・種別（ハイライト / メモ / ブックマーク）
```

#### インポート処理フロー

```
ファイルアップロード
    ↓
パース（文字コード: UTF-8 / Shift-JIS 自動検出）
    ↓
重複チェック（同一書籍・同一位置・同一テキスト）
    ↓
書籍メタデータ取得（表紙画像・ジャンル・ISBN）
    ↓
AI要約生成（Claude API）
    ↓
DBへ保存
    ↓
インポート完了通知
```

---

### 3.2 本棚表示機能

#### 3.2.1 本棚ビュー（メイン画面）

- **グリッド表示**: 書籍表紙を棚のように並べて表示
- **ジャンルフィルタ**: 左サイドバーでジャンル別に絞り込み
- **ソート機能**: 最終ハイライト日・タイトル・著者・ハイライト数で並び替え
- **検索機能**: タイトル・著者・ハイライト内容でテキスト検索
- **表示モード切替**: グリッド表示 ↔ リスト表示

#### 3.2.2 書籍詳細ビュー

書籍カードをクリックすると表示：

- 書籍メタデータ（タイトル・著者・出版日・ジャンル）
- ハイライト一覧（位置順）
- 各ハイライトのAI要約
- 自分メモ追記フィールド
- 「今日の復習に追加」ボタン

#### 3.2.3 ジャンル管理

| ジャンル（デフォルト） |
|---------------------|
| ビジネス・経済 |
| 自己啓発 |
| テクノロジー・IT |
| 科学・教養 |
| 小説・文学 |
| 歴史・社会 |
| 未分類 |

- ユーザーがカスタムジャンルを追加・編集・削除可能
- インポート時にAIがジャンルを自動分類（手動変更可）

---

### 3.3 AI要約機能

#### 要約対象

1. **個別ハイライト要約**: ハイライト1件を1〜2文に要約
2. **書籍全体要約**: 全ハイライトを統合して書籍の学びを3〜5文に要約

#### 要約生成仕様

```
使用モデル: claude-haiku-4-5（コスト最適）/ claude-sonnet-4-6（高品質）
言語: ハイライトと同言語（日本語入力→日本語出力）
最大トークン: 個別200 / 書籍全体500
バッチ処理: インポート時に非同期で一括生成
再生成: ユーザーが手動で再生成可能
```

#### プロンプト設計

```
個別ハイライト:
「以下の文章を、核心的な学びが伝わるよう1〜2文で要約してください。
元の文章の重要なキーワードを保持してください。
[ハイライトテキスト]」

書籍全体:
「以下は『[書名]』のハイライト一覧です。
この本から得られる最も重要な学びを3〜5文で要約してください。
[ハイライト一覧]」
```

---

### 3.4 通知機能

#### 3.4.1 対応通知サービス

| サービス | 方式 | 設定の容易さ | 推奨度 |
|---------|------|-----------|-------|
| **Discord** | Webhook URL | ★★★ 最も簡単 | **第1推奨** |
| **Slack** | Incoming Webhook | ★★★ 簡単 | **第2推奨** |
| **LINE** | Messaging API | ★★ やや複雑（LINE Notify は2025年3月終了） | 対応 |

> **注**: LINE Notify は2025年3月31日にサービス終了。LINE通知はLINE Messaging APIを使用します（チャンネル登録・友達追加が必要）。

#### 3.4.2 通知内容

```
【今日の復習 📚】
『ゼロ・トゥ・ワン』より

💡 競合のない市場を作ることが真のイノベーションだ。

📝 要約: 独自の価値を持つ市場を0から1で創造することが、
真のビジネス価値を生む。

---
今日のハイライト: 3件 | 未復習: 12件
```

#### 3.4.3 通知スケジュール設定

- **送信時刻**: 時・分を指定（例: 毎朝8:00）
- **頻度**: 毎日 / 平日のみ / 曜日指定
- **件数**: 1回あたりのハイライト通知数（1〜5件）
- **選択方式**: ランダム / 未復習優先 / 指定書籍から
- **タイムゾーン**: Asia/Tokyo（デフォルト）

#### 3.4.4 通知設定画面

```
┌─────────────────────────────────────┐
│  通知設定                            │
├─────────────────────────────────────┤
│  通知サービス: [Discord ▼]           │
│  Webhook URL: [___________________] │
│  テスト送信: [送信する]               │
├─────────────────────────────────────┤
│  スケジュール                         │
│  時刻: [08] : [00]                  │
│  頻度: ● 毎日 ○ 平日 ○ 曜日指定     │
│  件数: [3 ▼] 件/回                  │
│  選択: ● ランダム ○ 未復習優先        │
├─────────────────────────────────────┤
│  [保存する]                          │
└─────────────────────────────────────┘
```

---

## 4. 非機能要件

### 4.1 パフォーマンス

| 項目 | 目標値 |
|------|-------|
| 本棚画面初期表示 | 2秒以内 |
| ハイライトインポート（1000件） | 30秒以内 |
| AI要約生成（1件） | 3秒以内 |
| 通知送信遅延 | 設定時刻±1分以内 |

### 4.2 対応環境

- **ブラウザ**: Chrome / Safari / Firefox / Edge（最新2バージョン）
- **デプロイ**: ローカル（Docker Compose）/ クラウド（Railway / Render）
- **データ上限**: 書籍1000冊・ハイライト50,000件

### 4.3 セキュリティ

- APIキー（Claude / Webhook URL）は環境変数で管理
- SQLインジェクション対策（ORM使用）
- ファイルアップロードはテキスト系のみ許可（.txt, .csv）

---

## 5. データモデル

```sql
-- 書籍
CREATE TABLE books (
    id           INTEGER PRIMARY KEY,
    title        TEXT NOT NULL,
    author       TEXT,
    isbn         TEXT,
    cover_url    TEXT,
    genre        TEXT DEFAULT '未分類',
    total_highlights INTEGER DEFAULT 0,
    last_highlight_at DATETIME,
    summary      TEXT,           -- AI生成の書籍全体要約
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ハイライト
CREATE TABLE highlights (
    id           INTEGER PRIMARY KEY,
    book_id      INTEGER REFERENCES books(id),
    content      TEXT NOT NULL,
    location     TEXT,           -- 位置No.
    highlighted_at DATETIME,
    summary      TEXT,           -- AI生成の個別要約
    user_note    TEXT,           -- ユーザーメモ
    is_reviewed  BOOLEAN DEFAULT FALSE,
    reviewed_at  DATETIME,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 通知設定
CREATE TABLE notification_configs (
    id           INTEGER PRIMARY KEY,
    service      TEXT NOT NULL,  -- 'discord' | 'slack' | 'line'
    webhook_url  TEXT NOT NULL,
    schedule_time TIME NOT NULL, -- HH:MM
    frequency    TEXT DEFAULT 'daily', -- 'daily' | 'weekday' | 'custom'
    weekdays     TEXT,           -- JSON: [0,1,2,3,4] (月〜金)
    count_per_send INTEGER DEFAULT 3,
    select_mode  TEXT DEFAULT 'random', -- 'random' | 'unreviewed'
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 通知履歴
CREATE TABLE notification_logs (
    id           INTEGER PRIMARY KEY,
    config_id    INTEGER REFERENCES notification_configs(id),
    sent_at      DATETIME,
    highlight_ids TEXT,          -- JSON: [1, 5, 12]
    status       TEXT,           -- 'success' | 'failed'
    error_msg    TEXT
);
```

---

## 6. 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|---------|------|
| React | 18 | UIフレームワーク |
| TypeScript | 5 | 型安全性 |
| Tailwind CSS | 3 | スタイリング |
| Zustand | 4 | 状態管理 |
| React Query | 5 | APIデータフェッチ |
| Vite | 5 | ビルドツール |

### バックエンド

| 技術 | バージョン | 用途 |
|------|---------|------|
| Python | 3.11 | メイン言語 |
| FastAPI | 0.110 | APIフレームワーク |
| SQLAlchemy | 2.0 | ORM |
| APScheduler | 3.10 | 通知スケジューラー |
| anthropic SDK | 最新 | Claude API |
| httpx | 0.27 | HTTPクライアント |
| Alembic | 1.13 | DBマイグレーション |

### インフラ

| 技術 | 用途 |
|------|------|
| Docker Compose | ローカル開発環境 |
| SQLite | 開発DB |
| PostgreSQL | 本番DB |
| Railway / Render | クラウドデプロイ（オプション） |

---

## 7. 外部API

| API | 用途 | 料金 |
|-----|------|------|
| Claude API (Anthropic) | AI要約生成 | 従量課金（Haiku: 約$0.0002/1Kトークン） |
| Open Library API | 書籍メタデータ・表紙画像 | **無料** |
| Google Books API | 書籍メタデータ補完 | 無料枠1000req/日 |
| Discord Webhook | 通知送信 | **無料** |
| Slack Incoming Webhook | 通知送信 | **無料** |
| LINE Messaging API | 通知送信 | 無料枠あり |

---

## 8. 画面一覧

| 画面 | URL | 説明 |
|------|-----|------|
| 本棚（メイン） | `/` | 書籍一覧グリッド表示 |
| 書籍詳細 | `/books/:id` | ハイライト一覧・要約表示 |
| インポート | `/import` | My Clippings.txt アップロード |
| 通知設定 | `/settings/notifications` | 通知スケジュール設定 |
| 設定 | `/settings` | ジャンル管理・AI設定 |

---

## 9. 開発フェーズ

### Phase 1 — MVP（最小構成）

- [ ] My Clippings.txt インポート
- [ ] 書籍一覧・ハイライト表示
- [ ] 書籍表紙取得（Open Library API）
- [ ] Discord Webhook通知（手動送信）

### Phase 2 — コア機能

- [ ] AI要約生成（Claude API）
- [ ] ジャンル自動分類
- [ ] 通知スケジューラー
- [ ] Slack通知対応

### Phase 3 — 拡張機能

- [ ] LINE通知対応
- [ ] 復習管理（未復習ハイライト優先）
- [ ] 書籍全体要約
- [ ] ユーザーメモ機能
- [ ] Docker Composeでのセルフホスト対応

---

## 10. 環境変数

```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Google Books API（オプション）
GOOGLE_BOOKS_API_KEY=xxxxx

# データベース
DATABASE_URL=sqlite:///./kindle_highlights.db

# アプリケーション
APP_SECRET_KEY=your-secret-key
APP_TIMEZONE=Asia/Tokyo

# 通知（設定画面から入力するため任意）
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxxxx
```

---

## 11. ディレクトリ構成（予定）

```
kindle-highlights-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BookShelf/       # 本棚グリッド
│   │   │   ├── BookCard/        # 書籍カード
│   │   │   ├── HighlightList/   # ハイライト一覧
│   │   │   └── NotificationPanel/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── api/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── books.py
│   │   │   ├── highlights.py
│   │   │   ├── import_.py
│   │   │   └── notifications.py
│   │   ├── services/
│   │   │   ├── clippings_parser.py  # My Clippings.txt パーサー
│   │   │   ├── ai_summary.py        # Claude API連携
│   │   │   ├── book_metadata.py     # 表紙・メタデータ取得
│   │   │   └── notifier.py          # Discord/Slack/LINE送信
│   │   ├── scheduler/
│   │   │   └── notification_job.py  # APSchedulerジョブ
│   │   ├── models/
│   │   └── database.py
│   ├── requirements.txt
│   └── main.py
│
├── docker-compose.yml
└── README.md
```
