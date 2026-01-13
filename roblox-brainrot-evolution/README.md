# ブレインロット進化ゲーム (BrainRot Evolution Game)

Robloxで動作する「ブレインロット進化」スタイルのゲームです。

## 機能

### 1. 敵を倒す
- 様々な種類の敵が自動スポーン
- ミニスキビディからタイタンスキビディまで5種類
- マウスクリックまたはスペースキーで攻撃
- Qキーで自動攻撃ON/OFF

### 2. レベルアップシステム
- 敵を倒して経験値を獲得
- レベルが上がると新しい進化形態がアンロック
- 最大レベル: 100

### 3. 進化形態
| レベル | 形態 | レアリティ |
|--------|------|-----------|
| 1 | スキビディトイレ | Common |
| 5 | カメラマン | Uncommon |
| 15 | スピーカーマン | Rare |
| 30 | タイタンカメラマン | Epic |
| 50 | タイタンスピーカーマン | Legendary |
| 75 | Gマン | Mythic |
| 100 | アストロトイレ | Secret |

### 4. シークレット交換
- 敵を倒すとシークレットアイテムがドロップ
- 他のプレイヤーとシークレットを交換可能
- 5種類のレアリティ: Rare, Epic, Legendary, Mythic, Secret

### 5. 1時間イベント
毎時間ランダムでイベントが発生！

- **ダブルEXPタイム**: 経験値2倍
- **ゴールドラッシュ**: コイン3倍
- **ボスインベージョン**: ボスが大量出現
- **シークレットドロップ**: ドロップ率10倍
- **メガイベント**: 全ボーナス発動

## Roblox Studioでのセットアップ

### ステップ1: フォルダ構造を作成

```
game
├── ReplicatedStorage
│   ├── Shared (Folder)
│   │   ├── GameConfig (ModuleScript)
│   │   └── PlayerDataTemplate (ModuleScript)
│   └── Events (Folder) - 自動生成されます
├── ServerScriptService
│   ├── MainServer (Script)
│   ├── DataManager (ModuleScript)
│   ├── EnemySystem (ModuleScript)
│   ├── EventSystem (ModuleScript)
│   └── TradeSystem (ModuleScript)
├── StarterGui
│   └── MainUI (LocalScript)
└── StarterPlayer
    └── StarterPlayerScripts
        └── CombatController (LocalScript)
```

### ステップ2: スクリプトを配置

1. `src/shared/` のファイルを `ReplicatedStorage/Shared` に配置
2. `src/server/` のファイルを `ServerScriptService` に配置
3. `src/client/MainUI.lua` を `StarterGui` 内のLocalScriptとして配置
4. `src/client/CombatController.lua` を `StarterPlayer/StarterPlayerScripts` 内のLocalScriptとして配置

### ステップ3: DataStoreを有効化

1. Roblox Studioで「Game Settings」を開く
2. 「Security」タブで「Enable Studio Access to API Services」をON

## 操作方法

| キー | アクション |
|------|-----------|
| WASD | 移動 |
| マウス左クリック / スペース | 攻撃 |
| Q | 自動攻撃切り替え |

## UIボタン

- **進**: 進化形態選択
- **秘**: 所持シークレット確認
- **交**: プレイヤー間交換
- **統**: 統計情報

## 技術仕様

- **データ保存**: Roblox DataStoreService使用
- **自動保存**: 5分ごと
- **最大敵数**: 20体
- **敵スポーン間隔**: 3秒

## ファイル一覧

```
roblox-brainrot-evolution/
├── src/
│   ├── server/
│   │   ├── MainServer.lua      # メインサーバースクリプト
│   │   ├── DataManager.lua     # データ保存/読み込み
│   │   ├── EnemySystem.lua     # 敵AI・スポーン
│   │   ├── EventSystem.lua     # イベント管理
│   │   └── TradeSystem.lua     # 交換システム
│   ├── client/
│   │   ├── MainUI.lua          # UI管理
│   │   └── CombatController.lua # 戦闘操作
│   └── shared/
│       ├── GameConfig.lua      # ゲーム設定
│       └── PlayerDataTemplate.lua # プレイヤーデータ構造
└── README.md
```

## ライセンス

MIT License

---

作成: Claude AI
